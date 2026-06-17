// Firestore-backed session + data store.
//
// Replaces the previous localStorage prototype. Keeps the same external API
// (`useStore`, `useAuthSession`, `store.*`) so existing routes continue to
// work, but every read/write now goes through Firebase Auth + Firestore.
//
// Realtime updates flow via onSnapshot: the in-memory `state` mirrors the
// currently-signed-in user's view (applicant = own apps; officer/admin = all
// apps + all users), and components re-render via useSyncExternalStore.

import { useSyncExternalStore } from "react";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Unsubscribe,
} from "firebase/firestore";
import { onAuthStateChanged, signOut as fbSignOut } from "firebase/auth";

import { getFirebaseAuth, getFirestoreDB } from "@/lib/firebase";

export type Role = "applicant" | "officer" | "admin";

export type User = {
  id: string; // Firebase UID
  email: string;
  fullName: string;
  idNumber: string;
  phone: string;
  role: Role;
  staffCreated?: boolean;
};

export type LicenceType = "learner" | "driver";
export type AppStatus =
  | "draft"
  | "submitted"
  | "booked"
  | "checked_in"
  | "in_test"
  | "passed"
  | "failed"
  | "producing"
  | "ready"
  | "collected";

export type ApplicationDocuments = {
  idScan?: boolean;
  idScanUrl?: string;
  idScanBackUrl?: string;
  photo?: boolean;
  photoUrls?: string[];
  selfieUrl?: string;
  signature?: string; // legacy data-url
  signatureUrl?: string;
  certifiedId?: boolean;
  certifiedIdUrl?: string;
  proofResidence?: boolean;
  proofResidenceUrl?: string;
  eyeCert?: boolean;
  eyeCertUrl?: string;
  learnerCert?: boolean;
  learnerCertUrl?: string;
  supportingDocs?: Array<{ name: string; type: string; url: string; uploadedAt: number }>;
};

export type ApplicationLocation = {
  latitude: number;
  longitude: number;
  accuracy?: number;
  address?: string;
  selectedStation?: {
    id: string;
    name: string;
    address: string;
    distance: number;
  };
};

export type ApplicationAddress = {
  street: string;
  suburb: string;
  city: string;
  province: string;
  postal: string;
};

export type ApplicationPayment = {
  status: "pending" | "paid" | "failed";
  transactionId?: string;
  amount?: number;
  paidAt?: number;
  sessionId?: string;
};

export type ApplicationBooking = {
  centre: string;
  date: string;
  time: string;
  status: "pending" | "confirmed" | "cancelled";
  createdAt: number;
};

export type Application = {
  id: string;
  userId: string;
  type: LicenceType;
  status: AppStatus;
  createdAt: number;
  testDate?: string;
  testTime?: string;
  centre?: string;
  fee: number;
  paid: boolean;
  documents: ApplicationDocuments;
  location?: ApplicationLocation;
  address?: ApplicationAddress;
  payment?: ApplicationPayment;
  booking?: ApplicationBooking;
  queueNumber?: string;
  queuePosition?: number;
  productionStage?: number;
};

type DB = {
  users: User[];
  currentUserId: string | null;
  applications: Application[];
  isHydrated: boolean;
  lastLoggedInUserId?: string | null; // Track for login/logout logging
};

const initialState = (): DB => ({
  users: [],
  currentUserId: null,
  applications: [],
  isHydrated: false,
  lastLoggedInUserId: undefined,
});

let state: DB = initialState();
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
function getSnapshot() {
  return state;
}
function setState(patch: Partial<DB>) {
  state = { ...state, ...patch };
  emit();
}

export function useStore<T>(selector: (s: DB) => T): T {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return selector(snap);
}

export function useAuthSession() {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return {
    isHydrated: snap.isHydrated,
    currentUser: snap.users.find((u) => u.id === snap.currentUserId) ?? null,
  };
}

export function getSessionRedirectPath(user: User | null) {
  if (!user) return "/";
  if (user.role === "applicant") return "/dashboard";
  if (user.role === "officer") return "/officer";
  if (user.role === "admin") return "/admin";
  return "/";
}

/* ----- Subscriptions ----- */

let unsubProfile: Unsubscribe | null = null;
let unsubApps: Unsubscribe | null = null;
let unsubUsers: Unsubscribe | null = null;

function clearSubscriptions() {
  unsubProfile?.(); unsubProfile = null;
  unsubApps?.(); unsubApps = null;
  unsubUsers?.(); unsubUsers = null;
}

function watchProfile(uid: string) {
  const db = getFirestoreDB();
  if (!db) return;
  unsubProfile?.();
  unsubProfile = onSnapshot(
    doc(db, "users", uid),
    (snap) => {
      if (!snap.exists()) {
        // Auth user without a profile yet (e.g. just registered).
        setState({ users: state.users.filter((u) => u.id !== uid), currentUserId: uid });
        return;
      }
      const data = snap.data() as Omit<User, "id">;
      const user: User = { id: uid, ...data };
      const others = state.users.filter((u) => u.id !== uid);
      setState({ users: [...others, user], currentUserId: uid });
      
      // Log user login on first profile load
      if (state.lastLoggedInUserId !== uid && typeof window !== "undefined") {
        setState({ lastLoggedInUserId: uid });
        // Import and call logAuditAction asynchronously to avoid circular dependencies
        import("./audit-trail").then(({ logAuditAction }) => {
          logAuditAction({
            userId: uid,
            userName: user.fullName,
            userRole: user.role,
            action: "user_login",
          }).catch((err) => console.warn("[Audit] Failed to log login:", err));
        });
      }
      
      // Once we know the role, wire role-scoped collection subscriptions.
      watchApplicationsForRole(uid, user.role);
      if (user.role === "admin") watchAllUsers();
    },
    (err) => {
      // Permission errors here mean the user isn't allowed to read own profile
      // (e.g. email not verified). Surface via console for debugging.
      console.warn("[edlts] profile snapshot error:", err.message);
    },
  );
}

function watchApplicationsForRole(uid: string, role: Role) {
  const db = getFirestoreDB();
  if (!db) return;
  unsubApps?.();
  const col = collection(db, "applications");
  const q = role === "applicant" ? query(col, where("userId", "==", uid)) : query(col);
  unsubApps = onSnapshot(
    q,
    (snap) => {
      const apps: Application[] = snap.docs.map((d) => {
        const data = d.data() as Omit<Application, "id">;
        return { id: d.id, ...data, documents: data.documents ?? {} };
      });
      setState({ applications: apps });
    },
    (err) => console.warn("[edlts] applications snapshot error:", err.message),
  );
}

function watchAllUsers() {
  const db = getFirestoreDB();
  if (!db) return;
  unsubUsers?.();
  unsubUsers = onSnapshot(
    collection(db, "users"),
    (snap) => {
      const users: User[] = snap.docs.map((d) => {
        const data = d.data() as Omit<User, "id">;
        return { id: d.id, ...data };
      });
      // Preserve current user object identity if already loaded.
      const merged = users;
      setState({ users: merged });
    },
    (err) => console.warn("[edlts] users snapshot error:", err.message),
  );
}

/* ----- Public store API ----- */

export const store = {
  get: () => state,

  hydrate() {
    if (typeof window === "undefined" || state.isHydrated) return;
    setState({ isHydrated: true });
    const auth = getFirebaseAuth();
    if (!auth) return;
    onAuthStateChanged(auth, (fbUser) => {
      if (!fbUser) {
        clearSubscriptions();
        setState({ currentUserId: null, applications: [], users: [] });
        return;
      }
      watchProfile(fbUser.uid);
    });
  },

  async signOut() {
    const auth = getFirebaseAuth();
    if (auth) await fbSignOut(auth);
    clearSubscriptions();
    setState({ currentUserId: null, applications: [], users: [] });
  },

  currentUser(): User | null {
    return state.users.find((u) => u.id === state.currentUserId) ?? null;
  },

  async createApplication(userId: string, type: LicenceType): Promise<Application> {
    const db = getFirestoreDB();
    if (!db) throw new Error("Firestore unavailable");
    const ref = doc(collection(db, "applications"));
    const app: Application = {
      id: ref.id,
      userId,
      type,
      status: "draft",
      createdAt: Date.now(),
      fee: type === "learner" ? 150 : 300,
      paid: false,
      documents: {},
    };
    await setDoc(ref, {
      userId: app.userId,
      type: app.type,
      status: app.status,
      createdAt: app.createdAt,
      fee: app.fee,
      paid: app.paid,
      documents: app.documents,
      _createdServer: serverTimestamp(),
    });
    return app;
  },

  async updateApplication(id: string, patch: Partial<Application>) {
    const db = getFirestoreDB();
    if (!db) throw new Error("Firestore unavailable");
    const existing = state.applications.find((a) => a.id === id);
    const mergedDocs = patch.documents
      ? { ...(existing?.documents ?? {}), ...patch.documents }
      : undefined;
    const update: Record<string, unknown> = { ...patch };
    if (mergedDocs) update.documents = mergedDocs;
    // Firestore rejects `undefined` — strip it recursively.
    const clean = (v: unknown): unknown => {
      if (Array.isArray(v)) return v.map(clean);
      if (v && typeof v === "object") {
        const out: Record<string, unknown> = {};
        for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
          if (val === undefined) continue;
          out[k] = clean(val);
        }
        return out;
      }
      return v;
    };
    await updateDoc(doc(db, "applications", id), clean(update) as Record<string, unknown>);
  },

  getApplication(id: string) {
    return state.applications.find((a) => a.id === id);
  },

  async updateUser(uid: string, patch: Partial<Omit<User, "id">>) {
    const db = getFirestoreDB();
    if (!db) throw new Error("Firestore unavailable");
    await updateDoc(doc(db, "users", uid), patch);
  },

  async deleteUser(uid: string) {
    const db = getFirestoreDB();
    if (!db) throw new Error("Firestore unavailable");
    await deleteDoc(doc(db, "users", uid));
    // Note: Firebase Auth record removal requires the Admin SDK on the server.
    // That happens in a later slice (server-side admin endpoints).
  },
};

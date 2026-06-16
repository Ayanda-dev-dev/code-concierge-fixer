import { initializeApp, getApps, getApp, deleteApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  type Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import { getFirestore, type Firestore, setDoc, doc, getDoc } from "firebase/firestore";
import { uploadToCatbox } from "./catbox";

export const firebaseConfig = {
  apiKey: "AIzaSyBxr24kgXazfDk_uNkB0xzafgaR5qUjiCw",
  authDomain: "edlts-5b41a.firebaseapp.com",
  projectId: "edlts-5b41a",
  storageBucket: "edlts-5b41a.firebasestorage.app",
  messagingSenderId: "844117727245",
  appId: "1:844117727245:web:a8e5d447b2bb9a08db1d44",
  measurementId: "G-P80SJWC273",
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

export function getFirebase() {
  if (typeof window === "undefined") return null;
  if (!app) {
    app = getApps().find((a) => a.name === "[DEFAULT]") ?? initializeApp(firebaseConfig);
  }
  return app;
}

export function getFirebaseAuth() {
  if (typeof window === "undefined") return null;
  if (!auth) {
    const firebaseApp = getFirebase();
    if (!firebaseApp) return null;
    auth = getAuth(firebaseApp);
  }
  return auth;
}

export function getFirestoreDB() {
  if (typeof window === "undefined") return null;
  if (!db) {
    const firebaseApp = getFirebase();
    if (!firebaseApp) return null;
    db = getFirestore(firebaseApp);
  }
  return db;
}

export type FirebaseUserProfile = {
  fullName: string;
  email: string;
  idNumber: string;
  phone: string;
  role: "applicant" | "officer" | "admin";
  createdAt: number;
  staffCreated?: boolean;
};

export async function createUserProfile(uid: string, profile: FirebaseUserProfile) {
  const firestore = getFirestoreDB();
  if (!firestore) throw new Error("Firestore is unavailable");
  await setDoc(doc(firestore, "users", uid), profile);
}

export async function registerWithEmailPassword(
  email: string,
  password: string,
  profile: Omit<FirebaseUserProfile, "email" | "createdAt">
) {
  const authClient = getFirebaseAuth();
  if (!authClient) throw new Error("Firebase auth is unavailable");

  const credential = await createUserWithEmailAndPassword(authClient, email, password);
  await sendEmailVerification(credential.user);
  await createUserProfile(credential.user.uid, {
    email,
    createdAt: Date.now(),
    ...profile,
  });

  return credential;
}

export async function loginWithEmailPassword(email: string, password: string) {
  const authClient = getFirebaseAuth();
  if (!authClient) throw new Error("Firebase auth is unavailable");
  return await signInWithEmailAndPassword(authClient, email, password);
}

/**
 * Admin-side staff creation.
 *
 * Uses a *secondary* Firebase app instance so the admin's current session
 * is not replaced when the new account is created. The new staff record is:
 *   1. Created in Firebase Authentication (email + password)
 *   2. Immediately written to Firestore under /users/{uid} with role + staffCreated:true
 *   3. The secondary app is signed out & deleted, so the admin's session persists.
 *
 * This guarantees the new user can sign in straight away (no
 * `auth/invalid-credential` race) and — because staffCreated=true — bypasses
 * the email-verification gate at login.
 */
export async function adminCreateStaffUser(
  email: string,
  password: string,
  profile: Omit<FirebaseUserProfile, "email" | "createdAt" | "staffCreated">
) {
  if (typeof window === "undefined") throw new Error("Must run in browser");

  const secondaryName = `admin-create-${Date.now()}`;
  const secondaryApp = initializeApp(firebaseConfig, secondaryName);
  const secondaryAuth = getAuth(secondaryApp);

  try {
    const credential = await createUserWithEmailAndPassword(secondaryAuth, email, password);

    // Write profile via PRIMARY firestore — primary is signed in as admin
    // so rules that allow admin writes will pass. Firestore doc is created
    // immediately so DB and Auth never get out of sync.
    const firestore = getFirestoreDB();
    if (!firestore) throw new Error("Firestore is unavailable");
    await setDoc(doc(firestore, "users", credential.user.uid), {
      email,
      createdAt: Date.now(),
      staffCreated: true,
      ...profile,
    } satisfies FirebaseUserProfile);

    return credential.user.uid;
  } finally {
    try {
      await secondaryAuth.signOut();
    } catch {
      /* ignore */
    }
    try {
      await deleteApp(getApp(secondaryName));
    } catch {
      /* ignore */
    }
  }
}

/* ------------------------------------------------------------------ */
/* Demo staff bootstrap                                                */
/* ------------------------------------------------------------------ */

export const DEMO_ACCOUNTS = {
  officer: {
    email: "officer@edlts.gov",
    password: "officer123",
    profile: {
      fullName: "Thabo Officer",
      idNumber: "8001015009087",
      phone: "+27600000001",
      role: "officer" as const,
    },
  },
  admin: {
    email: "admin@edlts.gov",
    password: "admin123",
    profile: {
      fullName: "Naledi Admin",
      idNumber: "8501015009087",
      phone: "+27600000002",
      role: "admin" as const,
    },
  },
} as const;

/**
 * Sign in the named demo account. If it doesn't exist yet in Firebase Auth,
 * create it on the fly (one-time bootstrap) and write the matching Firestore
 * profile so it works against real Firestore data immediately.
 */
export async function bootstrapAndSignInDemo(role: "officer" | "admin") {
  if (typeof window === "undefined") throw new Error("Must run in browser");
  const cfg = DEMO_ACCOUNTS[role];
  const authClient = getFirebaseAuth();
  const firestore = getFirestoreDB();
  if (!authClient || !firestore) throw new Error("Firebase unavailable");

  try {
    const cred = await signInWithEmailAndPassword(authClient, cfg.email, cfg.password);
    // Make sure the profile doc exists (in case it was deleted but auth survived).
    const profileSnap = await getDoc(doc(firestore, "users", cred.user.uid));
    if (!profileSnap.exists()) {
      await setDoc(doc(firestore, "users", cred.user.uid), {
        email: cfg.email,
        createdAt: Date.now(),
        staffCreated: true,
        ...cfg.profile,
      } satisfies FirebaseUserProfile);
    }
    return cred;
  } catch (err) {
    const code = (err as { code?: string })?.code;
    if (code !== "auth/user-not-found" && code !== "auth/invalid-credential") {
      throw err;
    }
    // First-time bootstrap — create the account.
    const cred = await createUserWithEmailAndPassword(authClient, cfg.email, cfg.password);
    await setDoc(doc(firestore, "users", cred.user.uid), {
      email: cfg.email,
      createdAt: Date.now(),
      staffCreated: true,
      ...cfg.profile,
    } satisfies FirebaseUserProfile);
    return cred;
  }
}

/* ------------------------------------------------------------------ */
/* Document Upload                                                     */
/* ------------------------------------------------------------------ */

export type DocumentUploadResult = {
  downloadUrl: string;
  uploadedAt: number;
  fileName: string;
};

/**
 * Upload a document file for an application.
 * Validates file type and size, then uploads to Catbox via server proxy.
 * Stores metadata in Firestore for tracking.
 *
 * @param file - The file to upload
 * @param appId - Application ID for organizing uploads
 * @param documentType - Type of document (idScan, photo, signature, etc.)
 * @returns Download URL and upload timestamp
 */
export async function uploadDocument(
  file: File,
  appId: string,
  documentType: string,
): Promise<DocumentUploadResult> {
  if (typeof window === "undefined") {
    throw new Error("Document upload must run in browser");
  }

  // Validate file
  if (!file || file.size === 0) {
    throw new Error("File is empty");
  }

  const maxSizeMB = 50;
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    throw new Error(
      `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max ${maxSizeMB} MB.`
    );
  }

  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "application/pdf",
  ];
  if (!allowedTypes.includes(file.type)) {
    throw new Error(
      `File type "${file.type}" not allowed. Use JPG, PNG, WEBP or PDF.`
    );
  }

  try {
    // Generate filename with timestamp to ensure uniqueness
    const timestamp = Date.now();
    const ext = file.name.split(".").pop() || "bin";
    const filename = `${documentType}_${timestamp}.${ext}`;

    // Upload to Catbox via server proxy
    const downloadUrl = await uploadToCatbox(file, filename);

    // Store metadata in Firestore for tracking
    const firestore = getFirestoreDB();
    if (firestore) {
      try {
        const docRef = doc(firestore, "applications", appId, "documents", `${timestamp}`);
        await setDoc(docRef, {
          documentType,
          fileName: file.name,
          fileSize: file.size,
          downloadUrl,
          uploadedAt: timestamp,
          mimeType: file.type,
        });
      } catch (dbError) {
        console.warn("Could not store document metadata in Firestore:", dbError);
        // Don't fail the upload if metadata storage fails — file was uploaded successfully
      }
    }

    return {
      downloadUrl,
      uploadedAt: timestamp,
      fileName: file.name,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Upload failed";
    throw new Error(errorMsg);
  }
}

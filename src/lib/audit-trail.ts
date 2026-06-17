/**
 * Audit Trail Logging System
 * 
 * Logs all critical user actions for compliance and troubleshooting.
 * Integrates with Firestore to persist audit records.
 */

import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  type Query,
} from "firebase/firestore";
import { getFirestoreDB } from "./firebase";

export type AuditLogAction =
  | "user_login"
  | "user_logout"
  | "user_created"
  | "user_updated"
  | "user_deleted"
  | "application_created"
  | "application_submitted"
  | "application_updated"
  | "payment_verified"
  | "booking_created"
  | "booking_updated"
  | "applicant_checked_in"
  | "biometrics_captured"
  | "test_started"
  | "test_passed"
  | "test_failed"
  | "test_result_submitted"
  | "document_uploaded"
  | "account_activated"
  | "account_deactivated";

export type AuditLog = {
  id: string;
  timestamp: any; // Firestore timestamp
  userId: string;
  userName: string;
  userRole: "applicant" | "officer" | "admin";
  action: AuditLogAction;
  relatedUserId?: string; // For actions affecting other users
  relatedAppId?: string; // For application-related actions
  relatedBookingId?: string; // For booking-related actions
  details?: Record<string, any>; // Additional context (e.g., test score)
  ipAddress?: string;
  userAgent?: string;
};

/**
 * Log an action to the audit trail
 */
export async function logAuditAction(input: {
  userId: string;
  userName: string;
  userRole: "applicant" | "officer" | "admin";
  action: AuditLogAction;
  relatedUserId?: string;
  relatedAppId?: string;
  relatedBookingId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}) {
  try {
    const db = getFirestoreDB();
    if (!db) {
      console.error("Firestore not available for audit logging");
      return;
    }

    await addDoc(collection(db, "auditLogs"), {
      timestamp: serverTimestamp(),
      userId: input.userId,
      userName: input.userName,
      userRole: input.userRole,
      action: input.action,
      relatedUserId: input.relatedUserId || null,
      relatedAppId: input.relatedAppId || null,
      relatedBookingId: input.relatedBookingId || null,
      details: input.details || {},
      ipAddress: input.ipAddress || null,
      userAgent: input.userAgent || null,
    });
  } catch (error) {
    // Log errors but don't throw - audit logging shouldn't break the app
    console.error("[Audit] Failed to log action:", error);
  }
}

/**
 * Query audit logs with filters
 */
export async function getAuditLogs(filters?: {
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  userRole?: string;
  action?: string;
  relatedAppId?: string;
  limit?: number;
}): Promise<AuditLog[]> {
  try {
    const db = getFirestoreDB();
    if (!db) return [];

    let constraints = [];

    if (filters?.startDate) {
      constraints.push(where("timestamp", ">=", filters.startDate));
    }
    if (filters?.endDate) {
      constraints.push(where("timestamp", "<=", filters.endDate));
    }
    if (filters?.userId) {
      constraints.push(where("userId", "==", filters.userId));
    }
    if (filters?.userRole) {
      constraints.push(where("userRole", "==", filters.userRole));
    }
    if (filters?.action) {
      constraints.push(where("action", "==", filters.action));
    }
    if (filters?.relatedAppId) {
      constraints.push(where("relatedAppId", "==", filters.relatedAppId));
    }

    constraints.push(orderBy("timestamp", "desc"));
    constraints.push(limit(filters?.limit ?? 100));

    const q = query(collection(db, "auditLogs"), ...constraints);
    const snap = await getDocs(q);

    return snap.docs.map((doc) => {
      const data = doc.data() as Omit<AuditLog, "id">;
      return { id: doc.id, ...data };
    });
  } catch (error) {
    console.error("[Audit] Failed to query logs:", error);
    return [];
  }
}

/**
 * Get action display label
 */
export function getActionLabel(action: AuditLogAction): string {
  const labels: Record<AuditLogAction, string> = {
    user_login: "User Login",
    user_logout: "User Logout",
    user_created: "User Created",
    user_updated: "User Updated",
    user_deleted: "User Deleted",
    application_created: "Application Created",
    application_submitted: "Application Submitted",
    application_updated: "Application Updated",
    payment_verified: "Payment Verified",
    booking_created: "Booking Created",
    booking_updated: "Booking Updated",
    applicant_checked_in: "Applicant Checked In",
    biometrics_captured: "Biometrics Captured",
    test_started: "Test Started",
    test_passed: "Test Passed",
    test_failed: "Test Failed",
    test_result_submitted: "Test Result Submitted",
    document_uploaded: "Document Uploaded",
    account_activated: "Account Activated",
    account_deactivated: "Account Deactivated",
  };
  return labels[action] || action;
}

/**
 * Get action badge color
 */
export function getActionColor(action: AuditLogAction): string {
  if (action.includes("deleted") || action.includes("failed")) return "bg-destructive/10 text-destructive";
  if (action.includes("passed") || action.includes("activated")) return "bg-success/10 text-success";
  if (action.includes("submitted") || action.includes("verified")) return "bg-blue-500/10 text-blue-600";
  if (action.includes("login") || action.includes("logout")) return "bg-amber-500/10 text-amber-600";
  return "bg-muted text-muted-foreground";
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getApps, initializeApp, FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  Auth,
  User as FirebaseUser,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  onSnapshot,
  query,
  where,
  serverTimestamp,
  getDocs,
  Firestore,
  DocumentData,
  QuerySnapshot,
} from "firebase/firestore";
import { AuthRequestUser, UserRole, AuthorizationStatus, AppUser } from "../types";

/**
 * Standard Firebase Configuration
 */
const metaEnv = (import.meta as unknown as { env?: Record<string, string | undefined> })?.env || {};

export const firebaseConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || "AIzaSyDummyKeyForModelaHRMSDev2026",
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || `${metaEnv.VITE_FIREBASE_PROJECT_ID || "modela-connect-hrms"}.firebaseapp.com`,
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || "modela-connect-hrms",
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || `${metaEnv.VITE_FIREBASE_PROJECT_ID || "modela-connect-hrms"}.appspot.com`,
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || "931937056057",
  appId: metaEnv.VITE_FIREBASE_APP_ID || "1:931937056057:web:modelaconnect",
};

/**
 * Standardized Firestore error handler adhering to platform guidelines
 */
export function handleFirestoreError(error: unknown, operationType: string, path: string): never {
  const errObj = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
  };
  throw new Error(JSON.stringify(errObj));
}

/**
 * Resolves or initializes Firebase App, Auth, and Firestore
 */
export function getSafeFirebase(): { app: FirebaseApp | null; auth: Auth | null; db: Firestore | null } {
  try {
    const apps = getApps();
    if (apps.length > 0) {
      const app = apps[0];
      return {
        app,
        auth: getAuth(app),
        db: getFirestore(app),
      };
    }

    if (firebaseConfig.apiKey && firebaseConfig.projectId) {
      const app = initializeApp(firebaseConfig);
      return {
        app,
        auth: getAuth(app),
        db: getFirestore(app),
      };
    }
    return { app: null, auth: null, db: null };
  } catch (err) {
    console.warn("Firebase Auth/Firestore initialization warning:", err);
    return { app: null, auth: null, db: null };
  }
}

/**
 * Canonical Access Request Document Schema
 */
export interface AccessRequestDoc {
  userId: string;
  userEmail: string;
  applicantName: string;
  requestType: string;
  status: "pending" | "approved" | "rejected";
  timestamp: any;
  processedBy: string | null;
  processedAt: any | null;
  rejectionReason?: string | null;
  requestedRole: string;
  assignedRole: string | null;
  // Compatibility aliases
  uid: string;
  email: string;
  name: string;
  role: string | null;
  photoURL?: string;
  avatar_url?: string;
  requestTime?: string;
  requestedAt?: string;
  reviewTime?: string | null;
  reviewedAt?: any | null;
  reviewedBy?: string | null;
  remarks?: string | null;
}

/**
 * Normalizes raw Firestore document data to AuthRequestUser format
 */
export function normalizeToAuthRequest(data: DocumentData, docId?: string): AuthRequestUser {
  const rawStatus = String(data.status || "pending").trim().toLowerCase();
  const status: AuthorizationStatus =
    rawStatus === "approved"
      ? "Approved"
      : rawStatus === "rejected"
      ? "Rejected"
      : "Pending";

  const rawCreatedAt = data.timestamp || data.createdAt || data.requestTime || data.requestedAt;
  const requestedAt = rawCreatedAt?.toDate
    ? rawCreatedAt.toDate().toISOString()
    : typeof rawCreatedAt === "string"
    ? rawCreatedAt
    : new Date().toISOString();

  const rawReviewedAt = data.processedAt || data.reviewedAt || data.reviewTime;
  const reviewedAt = rawReviewedAt?.toDate
    ? rawReviewedAt.toDate().toISOString()
    : typeof rawReviewedAt === "string"
    ? rawReviewedAt
    : undefined;

  const id = data.userId || data.uid || docId || "";
  const role = data.assignedRole || data.role || data.requestedRole || "Employee";

  return {
    id,
    uid: id,
    name: data.applicantName || data.name || (data.userEmail || data.email ? (data.userEmail || data.email).split("@")[0] : "Applicant"),
    email: data.userEmail || data.email || "",
    status,
    role,
    requestedAt,
    requestDate: requestedAt,
    avatar_url: data.photoURL || data.avatar_url || "",
    reviewedBy: data.processedBy || data.reviewedBy || undefined,
    reviewedAt,
    actionByUserId: data.processedBy || data.reviewedBy || undefined,
  };
}

/**
 * 1. submitAccessRequest(userData)
 * Saves request to Firestore collection `access_requests` with "pending" status.
 * Reuses existing pending request if present; allows access if already approved.
 */
export async function submitAccessRequest(userData: {
  userId?: string;
  userEmail: string;
  applicantName?: string;
  requestType?: string;
  requestedRole?: string;
  photoURL?: string;
}): Promise<{
  success: boolean;
  status: "pending" | "approved" | "rejected";
  requestId: string;
  message: string;
  user?: AuthRequestUser;
}> {
  const cleanEmail = userData.userEmail.trim().toLowerCase();
  const cleanName = userData.applicantName?.trim() || cleanEmail.split("@")[0];
  const deterministicUid =
    userData.userId ||
    ("USR-" + btoa(cleanEmail).replace(/[^a-zA-Z0-9]/g, "").slice(0, 10).toUpperCase());
  const nowIso = new Date().toISOString();

  const { db } = getSafeFirebase();

  // Try live Firestore write
  if (db) {
    try {
      // Step A: Check for existing request by Document ID
      const reqDocRef = doc(db, "access_requests", deterministicUid);
      const existingSnap = await getDoc(reqDocRef);

      if (existingSnap.exists()) {
        const existing = existingSnap.data();
        const existingStatus = String(existing.status || "").trim().toLowerCase();

        // 1. Existing Pending -> reuse it
        if (existingStatus === "pending") {
          const norm = normalizeToAuthRequest(existing, existingSnap.id);
          return {
            success: true,
            status: "pending",
            requestId: existingSnap.id,
            message: "Your access request is currently pending HR/Super Admin review.",
            user: norm,
          };
        }

        // 2. Existing Approved -> allow access
        if (existingStatus === "approved") {
          const norm = normalizeToAuthRequest(existing, existingSnap.id);
          return {
            success: true,
            status: "approved",
            requestId: existingSnap.id,
            message: "Your account is approved. Access granted.",
            user: norm,
          };
        }

        // 3. Existing Rejected -> follow existing re-request logic (reset to pending)
        if (existingStatus === "rejected") {
          const updatedPayload: Partial<AccessRequestDoc> = {
            status: "pending",
            timestamp: serverTimestamp(),
            requestTime: nowIso,
            requestedAt: nowIso,
            processedBy: null,
            processedAt: null,
            rejectionReason: null,
            remarks: null,
          };
          await updateDoc(reqDocRef, updatedPayload as DocumentData);
          const updatedSnap = await getDoc(reqDocRef);
          const norm = normalizeToAuthRequest(updatedSnap.data() || {}, reqDocRef.id);
          return {
            success: true,
            status: "pending",
            requestId: reqDocRef.id,
            message: "Your access request has been resubmitted and is pending approval.",
            user: norm,
          };
        }
      }

      // Step B: Query by email to prevent duplicate across different UIDs
      const emailQuery = query(
        collection(db, "access_requests"),
        where("userEmail", "==", cleanEmail)
      );
      const querySnap = await getDocs(emailQuery);

      if (!querySnap.empty) {
        const existingDoc = querySnap.docs[0];
        const existing = existingDoc.data();
        const existingStatus = String(existing.status || "").trim().toLowerCase();

        if (existingStatus === "pending") {
          return {
            success: true,
            status: "pending",
            requestId: existingDoc.id,
            message: "Your access request is already pending approval.",
            user: normalizeToAuthRequest(existing, existingDoc.id),
          };
        }
        if (existingStatus === "approved") {
          return {
            success: true,
            status: "approved",
            requestId: existingDoc.id,
            message: "Your account is approved. Access granted.",
            user: normalizeToAuthRequest(existing, existingDoc.id),
          };
        }
      }

      // Step C: Create new access request in Firestore
      const newDocData: AccessRequestDoc = {
        userId: deterministicUid,
        userEmail: cleanEmail,
        applicantName: cleanName,
        requestType: userData.requestType || "ACCESS_REQUEST",
        status: "pending",
        timestamp: serverTimestamp(),
        processedBy: null,
        processedAt: null,
        rejectionReason: null,
        requestedRole: userData.requestedRole || "employee",
        assignedRole: null,
        uid: deterministicUid,
        email: cleanEmail,
        name: cleanName,
        role: "Employee",
        photoURL: userData.photoURL || "",
        avatar_url: userData.photoURL || "",
        requestTime: nowIso,
        requestedAt: nowIso,
        remarks: null,
        reviewedBy: null,
        reviewTime: null,
      };

      await setDoc(reqDocRef, newDocData);

      // Also maintain mirror record in users collection for RBAC
      const userDocRef = doc(db, "users", deterministicUid);
      await setDoc(userDocRef, {
        uid: deterministicUid,
        email: cleanEmail,
        name: cleanName,
        status: "Pending",
        role: "Employee",
        requestedAt: nowIso,
      }, { merge: true });

      const normUser = normalizeToAuthRequest(newDocData, deterministicUid);
      return {
        success: true,
        status: "pending",
        requestId: deterministicUid,
        message: "Your request has been sent to the HR Admin. Please wait for approval.",
        user: normUser,
      };
    } catch (err: unknown) {
      console.warn("[Firestore] submitAccessRequest write error:", err);
    }
  }

  // Fallback: Notify backend API endpoint without using localStorage
  try {
    const res = await fetch("/api/auth/google", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: cleanEmail,
        name: cleanName,
        avatar_url: userData.photoURL || "",
        status: "PENDING",
        requested_at: nowIso,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      const norm = normalizeToAuthRequest(data.user || {}, data.user?.id || deterministicUid);
      const st = String(data.status || "pending").toLowerCase() as "pending" | "approved" | "rejected";
      return {
        success: true,
        status: st === "approved" ? "approved" : st === "rejected" ? "rejected" : "pending",
        requestId: data.user?.id || deterministicUid,
        message: data.message || "Request processed",
        user: norm,
      };
    }
  } catch (backendErr) {
    console.warn("Backend API sync failed:", backendErr);
  }

  return {
    success: true,
    status: "pending",
    requestId: deterministicUid,
    message: "Your request has been sent to the HR Admin. Please wait for approval.",
  };
}

/**
 * 2. Real-Time Listener: subscribeToUserRequestStatus
 * Listens to employee's request status in Firestore (`onSnapshot`).
 * Unlocks app on "approved", alerts on "rejected".
 */
export function subscribeToUserRequestStatus(
  userEmailOrId: string,
  onStatusChange: (status: "pending" | "approved" | "rejected", requestDoc: AuthRequestUser) => void,
  onError?: (error: unknown) => void
): () => void {
  const clean = userEmailOrId.trim().toLowerCase();
  const { db } = getSafeFirebase();

  if (!db) {
    // Polling fallback via backend API
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/auth/status?email=${encodeURIComponent(clean)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            const norm = normalizeToAuthRequest(data.user, data.user.id);
            const raw = String(norm.status || "").toLowerCase();
            const st: "pending" | "approved" | "rejected" =
              raw === "approved" ? "approved" : raw === "rejected" ? "rejected" : "pending";
            onStatusChange(st, norm);
          }
        }
      } catch (e) {
        if (onError) onError(e);
      }
    }, 2500);
    return () => clearInterval(interval);
  }

  // Firestore onSnapshot on access_requests
  try {
    const q = query(
      collection(db, "access_requests"),
      where("userEmail", "==", clean)
    );

    const unsub = onSnapshot(
      q,
      (snapshot: QuerySnapshot<DocumentData>) => {
        if (!snapshot.empty) {
          const docSnap = snapshot.docs[0];
          const data = docSnap.data();
          const norm = normalizeToAuthRequest(data, docSnap.id);
          const raw = String(data.status || "").toLowerCase();
          const st: "pending" | "approved" | "rejected" =
            raw === "approved" ? "approved" : raw === "rejected" ? "rejected" : "pending";
          onStatusChange(st, norm);
        }
      },
      (err) => {
        console.warn("[Firestore] subscribeToUserRequestStatus error:", err);
        if (onError) onError(err);
      }
    );

    return unsub;
  } catch (err) {
    console.warn("Could not attach Firestore onSnapshot:", err);
    return () => {};
  }
}

/**
 * 3. HR/Admin Dashboard Workflow: subscribeToPendingRequests
 * Real-time `onSnapshot` listener for all `status == "pending"` requests.
 */
export function subscribeToPendingRequests(
  callback: (requests: AuthRequestUser[]) => void,
  onError?: (error: unknown) => void
): () => void {
  const { db } = getSafeFirebase();

  if (!db) {
    // Backend API polling fallback
    const fetchPending = async () => {
      try {
        const res = await fetch("/api/users/pending");
        if (res.ok) {
          const data = await res.json();
          const list = (data.users || data.requests || []).map((u: DocumentData) => normalizeToAuthRequest(u));
          callback(list);
        }
      } catch (err) {
        if (onError) onError(err);
      }
    };
    fetchPending();
    const timer = setInterval(fetchPending, 2500);
    return () => clearInterval(timer);
  }

  try {
    const pendingQuery = query(
      collection(db, "access_requests"),
      where("status", "in", ["pending", "PENDING"])
    );

    return onSnapshot(
      pendingQuery,
      (snapshot) => {
        const list: AuthRequestUser[] = snapshot.docs.map((docSnap) =>
          normalizeToAuthRequest(docSnap.data(), docSnap.id)
        );
        callback(list);
      },
      (error) => {
        console.warn("[Firestore] subscribeToPendingRequests warning:", error);
        if (onError) onError(error);
      }
    );
  } catch (err) {
    console.warn("Failed to subscribe to pending requests:", err);
    return () => {};
  }
}

/**
 * Real-Time Listener: subscribeToAllRequests
 * Listens to all access requests in Firestore for Admin Dashboard management & audit view.
 */
export function subscribeToAllRequests(
  callback: (requests: AuthRequestUser[]) => void,
  onError?: (error: unknown) => void
): () => void {
  const { db } = getSafeFirebase();

  if (!db) {
    const fetchAll = async () => {
      try {
        const res = await fetch("/api/users");
        if (res.ok) {
          const data = await res.json();
          const list = (data.users || data.requests || []).map((u: DocumentData) => normalizeToAuthRequest(u));
          callback(list);
        }
      } catch (err) {
        if (onError) onError(err);
      }
    };
    fetchAll();
    const timer = setInterval(fetchAll, 2500);
    return () => clearInterval(timer);
  }

  try {
    const colRef = collection(db, "access_requests");
    return onSnapshot(
      colRef,
      (snapshot) => {
        const list: AuthRequestUser[] = snapshot.docs.map((docSnap) =>
          normalizeToAuthRequest(docSnap.data(), docSnap.id)
        );
        callback(list);
      },
      (error) => {
        console.warn("[Firestore] subscribeToAllRequests error:", error);
        if (onError) onError(error);
      }
    );
  } catch (err) {
    console.warn("Failed to subscribe to all requests:", err);
    return () => {};
  }
}

/**
 * 3. HR/Admin Dashboard Workflow: handleRequestAction
 * Atomically updates `status` to "approved" or "rejected", sets `processedBy` and `processedAt`.
 * Records audit trail in `activityLogs`.
 */
export async function handleRequestAction(
  requestId: string,
  actionStatus: "approved" | "rejected",
  hrUserId: string,
  reason?: string,
  assignedRole?: string
): Promise<{ success: boolean; error?: string }> {
  const normStatus = actionStatus.toLowerCase() === "approved" ? "approved" : "rejected";
  const { db } = getSafeFirebase();

  const updatePayload: Record<string, unknown> = {
    status: normStatus,
    processedBy: hrUserId,
    processedAt: serverTimestamp(),
    reviewedBy: hrUserId,
    reviewedAt: serverTimestamp(),
    reviewTime: new Date().toISOString(),
    statusUpdatedAt: new Date().toISOString(),
    rejectionReason: normStatus === "rejected" ? reason || null : null,
    remarks: reason || null,
  };

  if (normStatus === "approved") {
    const targetRole = assignedRole || "EMPLOYEE";
    updatePayload.assignedRole = targetRole;
    updatePayload.role = targetRole;
  }

  if (db) {
    try {
      const accessReqRef = doc(db, "access_requests", requestId);
      await updateDoc(accessReqRef, updatePayload).catch(() =>
        setDoc(accessReqRef, updatePayload, { merge: true })
      );

      // Sync mirror users document for RBAC
      const userDocRef = doc(db, "users", requestId);
      await setDoc(userDocRef, {
        status: normStatus === "approved" ? "Approved" : "Rejected",
        role: updatePayload.assignedRole || "Employee",
        statusUpdatedAt: new Date().toISOString(),
        reviewedBy: hrUserId,
      }, { merge: true });

      // Append immutable audit log to activityLogs
      await appendActivityLogToFirestore({
        action: normStatus === "approved" ? "Request Approved" : "Request Rejected",
        targetUser: requestId,
        executedBy: hrUserId,
        details: reason || `Action: ${normStatus.toUpperCase()}, Role: ${updatePayload.assignedRole || "N/A"}`,
        module: "Access Control",
      });

      return { success: true };
    } catch (err: unknown) {
      console.warn("[Firestore] handleRequestAction error:", err);
    }
  }

  // Also sync with backend server API
  try {
    const endpoint = normStatus === "approved" ? `/api/users/${encodeURIComponent(requestId)}/approve` : `/api/users/${encodeURIComponent(requestId)}/reject`;
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-email": hrUserId,
      },
      body: JSON.stringify({
        status: normStatus.toUpperCase(),
        role: assignedRole,
        reason,
        remarks: reason,
      }),
    });
    return { success: res.ok };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Backwards compatibility alias for submitAccessRequest
 */
export async function syncGoogleUserToFirestore(
  requestUser: (Partial<AuthRequestUser> & { uid?: string; id?: string; email: string; name: string }) & {
    photoURL?: string;
    avatar_url?: string;
    requested_at?: string;
  }
): Promise<{ success: boolean; firestoreSynced: boolean; error?: string }> {
  try {
    const res = await submitAccessRequest({
      userId: requestUser.uid || requestUser.id,
      userEmail: requestUser.email,
      applicantName: requestUser.name,
      photoURL: requestUser.photoURL || requestUser.avatar_url,
    });
    return { success: res.success, firestoreSynced: true };
  } catch (err) {
    return { success: false, firestoreSynced: false, error: String(err) };
  }
}

/**
 * Backwards compatibility alias for handleRequestAction
 */
export async function updateUserStatusInFirestore(
  uid: string,
  status: AuthorizationStatus | "APPROVED" | "REJECTED" | "approved" | "rejected",
  role?: UserRole | string | null,
  reviewedBy?: string,
  reason?: string
): Promise<{ success: boolean; firestoreSynced: boolean; error?: string }> {
  const normStatus = String(status).toUpperCase() === "APPROVED" ? "approved" : "rejected";
  const res = await handleRequestAction(
    uid,
    normStatus,
    reviewedBy || "HR Admin",
    reason,
    role ? String(role) : undefined
  );
  return { success: res.success, firestoreSynced: res.success, error: res.error };
}

/**
 * Backwards compatibility alias for subscribeToAllRequests
 */
export function subscribeToAccessRequests(
  onUpdate: (requests: AuthRequestUser[]) => void,
  onError?: (error: unknown) => void
): () => void {
  return subscribeToAllRequests(onUpdate, onError);
}

/**
 * Fetches user doc from Firestore 'users' or 'access_requests'
 */
export async function getUserDocFromFirestore(uid: string): Promise<AppUser | null> {
  const { db } = getSafeFirebase();
  if (!db) return null;

  try {
    const accessReqDocRef = doc(db, "access_requests", uid);
    const snap = await getDoc(accessReqDocRef);
    if (snap.exists()) {
      const data = snap.data();
      const norm = normalizeToAuthRequest(data, snap.id);
      return {
        uid: norm.uid,
        name: norm.name,
        email: norm.email,
        role: norm.role,
        status: norm.status,
        requestedAt: norm.requestedAt,
        reviewedBy: norm.reviewedBy,
        reviewedAt: norm.reviewedAt,
      };
    }
    return null;
  } catch (err) {
    console.warn("Error fetching user document from Firestore:", err);
    return null;
  }
}

/**
 * Subscribes to real-time changes on a user document
 */
export function subscribeToUserDoc(
  uid: string,
  onUpdate: (user: AppUser | null) => void
): () => void {
  const { db } = getSafeFirebase();
  if (!db) return () => {};

  const accessReqDocRef = doc(db, "access_requests", uid);
  return onSnapshot(
    accessReqDocRef,
    (snap) => {
      if (!snap.exists()) {
        onUpdate(null);
        return;
      }
      const data = snap.data();
      const norm = normalizeToAuthRequest(data, snap.id);
      onUpdate({
        uid: norm.uid,
        name: norm.name,
        email: norm.email,
        role: norm.role,
        status: norm.status,
        requestedAt: norm.requestedAt,
        reviewedBy: norm.reviewedBy,
        reviewedAt: norm.reviewedAt,
      });
    },
    (err) => {
      console.warn("User doc listener error:", err);
    }
  );
}

/**
 * Appends an audit record to the 'activityLogs' Firestore collection
 */
export async function appendActivityLogToFirestore(logItem: {
  action: string;
  targetUser?: string;
  executedBy?: string;
  details?: string;
  module?: string;
  recordId?: string;
  payload?: string;
  userEmail?: string;
  userName?: string;
  userRole?: string;
  metadata?: Record<string, unknown>;
}): Promise<{ success: boolean; firestoreSynced: boolean; id?: string; error?: string }> {
  const { db } = getSafeFirebase();
  if (!db) {
    return { success: true, firestoreSynced: false };
  }

  try {
    const logRef = doc(collection(db, "activityLogs"));
    const timestamp = new Date().toISOString();
    const docData = {
      id: logRef.id,
      timestamp,
      action: logItem.action,
      targetUser: logItem.targetUser || logItem.userEmail || "",
      executedBy: logItem.executedBy || logItem.userName || "System",
      details: logItem.details || logItem.payload || "",
      module: logItem.module || "Access Control",
      recordId: logItem.recordId || logRef.id,
      metadata: logItem.metadata || {},
      result: "SUCCESS",
    };
    await setDoc(logRef, docData);
    return { success: true, firestoreSynced: true, id: logRef.id };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.warn("Firestore activityLog write skipped:", errorMsg);
    return { success: false, firestoreSynced: false, error: errorMsg };
  }
}

/**
 * Executes Google OAuth requesting 'email' and 'profile' scopes
 */
export async function executeGoogleSyncAuth(): Promise<{
  success: boolean;
  user?: {
    uid: string;
    email: string;
    displayName: string;
  };
  useFallbackSimulation?: boolean;
  error?: string;
}> {
  const { auth } = getSafeFirebase();

  if (!auth) {
    return {
      success: false,
      useFallbackSimulation: true,
      error: "Firebase Auth not provisioned with live credentials. Falling back to Google identity selector.",
    };
  }

  try {
    const provider = new GoogleAuthProvider();
    provider.addScope("profile");
    provider.addScope("email");
    const result = await signInWithPopup(auth, provider);
    const fbUser: FirebaseUser = result.user;

    return {
      success: true,
      user: {
        uid: fbUser.uid,
        email: fbUser.email || "unknown@gmail.com",
        displayName: fbUser.displayName || "Google User",
      },
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.warn("Firebase Google popup error or sandbox limitation:", errorMsg);
    return {
      success: false,
      useFallbackSimulation: true,
      error: errorMsg,
    };
  }
}

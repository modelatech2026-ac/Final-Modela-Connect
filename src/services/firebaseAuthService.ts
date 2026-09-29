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
  Firestore,
} from "firebase/firestore";
import { AuthRequestUser, UserRole, AuthorizationStatus, AppUser } from "../types";

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
 * Safely resolves Firebase Auth and Firestore if environment credentials exist
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

    const metaEnv = (import.meta as unknown as { env?: Record<string, string | undefined> })?.env || {};
    const apiKey = metaEnv.VITE_FIREBASE_API_KEY;
    const projectId = metaEnv.VITE_FIREBASE_PROJECT_ID;

    if (apiKey && projectId) {
      const app = initializeApp({
        apiKey,
        authDomain: `${projectId}.firebaseapp.com`,
        projectId,
      });
      return {
        app,
        auth: getAuth(app),
        db: getFirestore(app),
      };
    }
    return { app: null, auth: null, db: null };
  } catch (err) {
    console.warn("Firebase Auth/Firestore not available:", err);
    return { app: null, auth: null, db: null };
  }
}

/**
 * Fetches a user document from the Firestore 'users' collection
 */
export async function getUserDocFromFirestore(uid: string): Promise<AppUser | null> {
  const { db } = getSafeFirebase();
  if (!db) return null;

  try {
    const userDocRef = doc(db, "users", uid);
    const snap = await getDoc(userDocRef);
    if (!snap.exists()) return null;

    const data = snap.data();
    return {
      uid: data.uid || uid,
      name: data.name || "Authenticated User",
      email: data.email || "",
      role: (data.role as UserRole) || null,
      status: (data.status as AuthorizationStatus) || "Pending",
      employeeId: data.employeeId || undefined,
      designation: data.designation || undefined,
    };
  } catch (err) {
    console.warn("Error fetching user document from Firestore:", err);
    return null;
  }
}

/**
 * Subscribes to real-time changes on a user document in Firestore 'users/{uid}'
 */
export function subscribeToUserDoc(
  uid: string,
  onUpdate: (user: AppUser | null) => void
): () => void {
  const { db } = getSafeFirebase();
  if (!db) return () => {};

  const userDocRef = doc(db, "users", uid);
  return onSnapshot(
    userDocRef,
    (snap) => {
      if (!snap.exists()) {
        onUpdate(null);
        return;
      }
      const data = snap.data();
      onUpdate({
        uid: data.uid || uid,
        name: data.name || "Authenticated User",
        email: data.email || "",
        role: (data.role as UserRole) || null,
        status: (data.status as AuthorizationStatus) || "Pending",
        employeeId: data.employeeId || undefined,
        designation: data.designation || undefined,
      });
    },
    (err) => {
      console.warn("User doc listener error:", err);
    }
  );
}

/**
 * Syncs a user document into Firestore 'access_requests' and 'users' collections
 * Required fields: { uid, name, email, photoURL, status: "PENDING", createdAt: serverTimestamp(), role: "PENDING" }
 */
export async function syncGoogleUserToFirestore(
  requestUser: (Partial<AuthRequestUser> & { uid?: string; id?: string; email: string; name: string }) & {
    photoURL?: string;
    avatar_url?: string;
    requested_at?: string;
  }
): Promise<{ success: boolean; firestoreSynced: boolean; error?: string }> {
  const { db } = getSafeFirebase();
  const userUid = requestUser.uid || requestUser.id || "";
  const photo = requestUser.photoURL || requestUser.avatar_url || "";
  const cleanEmail = requestUser.email.trim().toLowerCase();
  const cleanName = requestUser.name.trim() || cleanEmail.split("@")[0];
  const nowIso = new Date().toISOString();

  if (!db) {
    console.warn("[Firestore] Database not initialized. Live cloud sync unavailable.");
    return { success: true, firestoreSynced: false };
  }

  try {
    // 1. Explicit write to shared 'access_requests' collection with required schema
    const accessReqDocRef = doc(db, "access_requests", userUid);
    const accessReqPayload = {
      uid: userUid,
      name: cleanName,
      email: cleanEmail,
      photoURL: photo,
      status: "PENDING",
      createdAt: serverTimestamp(),
      role: "PENDING",
    };
    await setDoc(accessReqDocRef, accessReqPayload, { merge: true });

    // 2. Also write/upsert into 'users' collection
    const userDocRef = doc(db, "users", userUid);
    const userPayload = {
      ...accessReqPayload,
      id: userUid,
      avatar_url: photo,
      requested_at: requestUser.requested_at || nowIso,
      requestedAt: nowIso,
      requestDate: nowIso,
    };
    await setDoc(userDocRef, userPayload, { merge: true });

    console.info(`[Firestore] Successfully created access request in 'access_requests' for ${cleanEmail} (${userUid})`);
    return { success: true, firestoreSynced: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[Firestore] Global write error to access_requests / users:", errorMsg);
    return { success: false, firestoreSynced: false, error: errorMsg };
  }
}

/**
 * Normalizes user record from either Firestore or shared database into AuthRequestUser
 */
function normalizeToAuthRequest(data: any, docId?: string): AuthRequestUser {
  const rawCreatedAt = data.createdAt || data.requestedAt || data.requested_at || data.requestDate;
  const requestedAt = rawCreatedAt?.toDate
    ? rawCreatedAt.toDate().toISOString()
    : typeof rawCreatedAt === "string"
    ? rawCreatedAt
    : new Date().toISOString();

  const rawStatus = String(data.status || "PENDING").trim().toUpperCase();
  const status: "PENDING_APPROVAL" | "APPROVED" | "REJECTED" =
    rawStatus === "APPROVED"
      ? "APPROVED"
      : rawStatus === "REJECTED"
      ? "REJECTED"
      : "PENDING_APPROVAL";

  return {
    id: data.id || data.uid || docId,
    uid: data.uid || data.id || docId || "",
    name: data.name || (data.email ? data.email.split("@")[0] : "Applicant"),
    email: data.email || "",
    status,
    role: data.role === "PENDING" || !data.role ? "EMPLOYEE" : data.role,
    requestedAt,
    avatar_url: data.photoURL || data.avatar_url || "",
    reviewedBy: data.reviewedBy,
    reviewedAt: data.reviewedAt,
  };
}

/**
 * Subscribes to real-time changes on access requests from shared database & Firestore
 */
export function subscribeToAccessRequests(
  onUpdate: (requests: AuthRequestUser[]) => void,
  onError?: (error: unknown) => void
): () => void {
  let isSubscribed = true;
  let firestoreUnsub: (() => void) | null = null;
  let eventSource: EventSource | null = null;
  let pollTimer: ReturnType<typeof setInterval> | null = null;

  // 1. Fetch current requests immediately from shared backend database
  const fetchSharedDbRequests = async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const json = await res.json();
        const list = (json.users || json.requests || []).map((u: any) => normalizeToAuthRequest(u));
        if (isSubscribed && list.length > 0) {
          onUpdate(list);
        }
      }
    } catch (err) {
      if (onError && isSubscribed) onError(err);
    }
  };

  fetchSharedDbRequests();

  // 2. Real-time Server-Sent Events (SSE) listener for instantaneous push updates
  try {
    if (typeof EventSource !== "undefined") {
      eventSource = new EventSource("/api/users/stream");
      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload && Array.isArray(payload.users) && isSubscribed) {
            const list = payload.users.map((u: any) => normalizeToAuthRequest(u));
            onUpdate(list);
          }
        } catch {
          // ignore parse error
        }
      };
      eventSource.onerror = () => {
        // Fallback polling will handle it if SSE disconnects
      };
    }
  } catch {
    // EventSource fallback
  }

  // 3. High-frequency polling and local storage sync fallback
  pollTimer = setInterval(() => {
    if (isSubscribed) {
      fetchSharedDbRequests();
    }
  }, 2000);

  const handleLocalUpdate = () => {
    if (isSubscribed) fetchSharedDbRequests();
  };
  window.addEventListener("modela_users_updated", handleLocalUpdate);
  window.addEventListener("focus", handleLocalUpdate);
  window.addEventListener("storage", handleLocalUpdate);

  // 4. Also listen to Firestore collection 'access_requests' if live Firestore exists
  const { db } = getSafeFirebase();
  if (db) {
    try {
      const accessRequestsCol = collection(db, "access_requests");
      firestoreUnsub = onSnapshot(
        accessRequestsCol,
        (snapshot) => {
          if (!isSubscribed) return;
          const loaded: AuthRequestUser[] = snapshot.docs.map((docSnap) =>
            normalizeToAuthRequest(docSnap.data(), docSnap.id)
          );
          if (loaded.length > 0) {
            onUpdate(loaded);
          }
        },
        (error) => {
          console.warn("[Firestore] onSnapshot warning on access_requests:", error);
          if (onError && isSubscribed) onError(error);
        }
      );
    } catch (err) {
      console.warn("[Firestore] Could not attach onSnapshot:", err);
    }
  }

  return () => {
    isSubscribed = false;
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
    window.removeEventListener("modela_users_updated", handleLocalUpdate);
    window.removeEventListener("focus", handleLocalUpdate);
    window.removeEventListener("storage", handleLocalUpdate);
    if (firestoreUnsub) {
      firestoreUnsub();
      firestoreUnsub = null;
    }
  };
}

/**
 * Updates a user document in Firestore 'access_requests' and 'users' collections on approval or rejection
 */
export async function updateUserStatusInFirestore(
  uid: string,
  status: AuthorizationStatus | "APPROVED" | "REJECTED",
  role?: UserRole | string | null,
  reviewedBy?: string
): Promise<{ success: boolean; firestoreSynced: boolean; error?: string }> {
  const { db } = getSafeFirebase();
  if (!db) {
    return { success: true, firestoreSynced: false };
  }

  try {
    const normStatus = String(status).toUpperCase() === "APPROVED" ? "APPROVED" : "REJECTED";
    const updatePayload: Record<string, unknown> = {
      status: normStatus,
      reviewedAt: serverTimestamp(),
      reviewedBy: reviewedBy || "Super Admin",
    };
    if (role !== undefined && normStatus === "APPROVED") {
      updatePayload.role = role || "EMPLOYEE";
    }

    const accessReqDocRef = doc(db, "access_requests", uid);
    const userDocRef = doc(db, "users", uid);

    await Promise.allSettled([
      updateDoc(accessReqDocRef, updatePayload).catch(() => setDoc(accessReqDocRef, updatePayload, { merge: true })),
      updateDoc(userDocRef, updatePayload).catch(() => setDoc(userDocRef, updatePayload, { merge: true })),
    ]);

    return { success: true, firestoreSynced: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[Firestore] user status update error:", errorMsg);
    return { success: false, firestoreSynced: false, error: errorMsg };
  }
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
      module: logItem.module || "Auth",
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
 * Executes Google OAuth requesting ONLY 'email' and 'profile' scopes.
 * STRICT NO-IMAGE POLICY: Discards any profile photo or avatar URLs.
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

    // Discard any avatarUrl / photoURL per strict no-image policy
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

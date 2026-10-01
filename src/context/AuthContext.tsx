/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { AppUser, UserRole, AuthorizationStatus } from "../types";
import { DEMO_USERS } from "../data/initialData";
import { useToast } from "./ToastContext";
import {
  getSafeFirebase,
  getUserDocFromFirestore,
  subscribeToUserDoc,
  submitAccessRequest,
  subscribeToUserRequestStatus,
  subscribeToPendingRequests,
} from "../services/firebaseAuthService";
import {
  isRoleSuperAdmin,
  isRoleAdmin,
  isRoleEmployee,
  normalizeUserRole,
  checkIsUserSuperAdmin,
  isApprovedStatus,
  isPendingStatus,
  isRejectedStatus,
} from "../lib/authUtils";
import { onAuthStateChanged, signOut as fbSignOut } from "firebase/auth";
import { syncGoogleUserToFirestore } from "../services/firebaseAuthService";

// Explicitly configured authorized HR Admin / Super Admin Google emails
export const AUTHORIZED_ADMIN_EMAILS = [
  "modelatech2026@gmail.com",
  "YOUR_EXACT_GOOGLE_EMAIL@gmail.com",
  "your_exact_google_email@gmail.com",
  "sushoovandas@gmail.com",
];

export function isAuthorizedAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  return (
    AUTHORIZED_ADMIN_EMAILS.some((admin) => admin.toLowerCase() === clean) ||
    clean === "modelatech2026@gmail.com" ||
    clean === "your_exact_google_email@gmail.com" ||
    (typeof import.meta !== "undefined" &&
      typeof (import.meta as any).env?.VITE_ADMIN_EMAIL === "string" &&
      (import.meta as any).env.VITE_ADMIN_EMAIL.trim().toLowerCase() === clean)
  );
}

/**
 * Safe fetch response handler:
 * - Checks response.ok
 * - Verifies Content-Type includes application/json
 * - If response is HTML (<!DOCTYPE...), logs the route error cleanly instead of crashing JSON parser
 */
export async function safeFetchJson<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<{ ok: boolean; status: number; data: T | null; isHtml: boolean; rawText?: string }> {
  try {
    const res = await fetch(input, init);
    const contentType = res.headers.get("content-type") || "";
    const isJson =
      contentType.toLowerCase().includes("application/json") ||
      contentType.toLowerCase().includes("+json");

    if (!isJson) {
      const text = await res.text().catch(() => "");
      const isHtml = text.trim().startsWith("<") || contentType.toLowerCase().includes("text/html");
      const urlStr = typeof input === "string" ? input : (input as any)?.url || "unknown-endpoint";
      console.warn(
        `[AuthContext] API endpoint ${urlStr} returned non-JSON response (status ${res.status}, contentType: "${contentType}").`,
        { isHtml, snippet: text.slice(0, 150) }
      );
      return { ok: false, status: res.status, data: null, isHtml, rawText: text };
    }

    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      console.warn(`[AuthContext] API endpoint returned error status ${res.status}:`, errorData);
      return { ok: false, status: res.status, data: errorData, isHtml: false };
    }

    const data = await res.json();
    return { ok: true, status: res.status, data, isHtml: false };
  } catch (err: any) {
    console.warn(`[AuthContext] Network/fetch error:`, err);
    return { ok: false, status: 0, data: null, isHtml: false, rawText: err?.message };
  }
}

interface AuthContextType {
  currentUser: AppUser | null;
  currentRole: UserRole;
  isAuthenticated: boolean;
  isApproved: boolean;
  isPending: boolean;
  isRejected: boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isEmployee: boolean;
  isLoading: boolean;
  demoUsers: AppUser[];
  pendingRequests: AppUser[];
  fetchPendingUsers: () => Promise<AppUser[]>;
  loginWithGoogle: (email: string, name?: string, avatarUrl?: string) => Promise<{
    success: boolean;
    case: "A" | "B" | "C" | "D";
    status: AuthorizationStatus;
    message: string;
    user?: AppUser;
  }>;
  login: (email: string, pass?: string) => Promise<{ success: boolean; user?: AppUser; error?: string }>;
  logout: () => void;
  switchDemoUser: (target: string) => AppUser | null;
  switchPersona: (employeeIdOrUid: string) => AppUser | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<AppUser | null>>;
  hasPermission: (allowedRoles: (UserRole | string)[]) => boolean;
  refreshUserStatus: () => Promise<AuthorizationStatus | null>;
  isSignInModalOpen: boolean;
  setIsSignInModalOpen: (open: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = "modela_active_user_data";
export const SESSION_REQUEST_KEY = "modela_session_request_submitted";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toast, success, info, error: toastError } = useToast();

  // Reset local storage state on initial load so the application always opens to Step 1
  // unless an approved user/admin is authenticated or a request was submitted in the session.
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.email) {
          const norm = String(parsed.status || "").toUpperCase();
          if (norm === "APPROVED" || parsed.isSuperAdmin || isAuthorizedAdminEmail(parsed.email)) {
            return parsed;
          }
          const hasSessionRequest = sessionStorage.getItem(SESSION_REQUEST_KEY);
          if (hasSessionRequest) {
            return parsed;
          }
        }
      }
    } catch {
      // ignore
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSignInModalOpen, setIsSignInModalOpen] = useState<boolean>(false);
  const [pendingRequests, setPendingRequests] = useState<AppUser[]>([]);

  // Function to fetch all entries from shared Firestore database where status === 'pending'
  const fetchPendingUsers = useCallback(async (): Promise<AppUser[]> => {
    return new Promise((resolve) => {
      const unsub = subscribeToPendingRequests(
        (requests) => {
          const list: AppUser[] = requests.map((r) => ({
            id: r.id,
            uid: r.uid,
            name: r.name,
            email: r.email,
            status: r.status,
            role: r.role,
            requestedAt: r.requestedAt,
            requestDate: r.requestDate,
            reviewedBy: r.reviewedBy,
            reviewedAt: r.reviewedAt,
            avatar_url: r.avatar_url,
          }));
          setPendingRequests(list);
          resolve(list);
        },
        (err) => {
          console.warn("Error fetching pending requests from Firestore:", err);
          resolve([]);
        }
      );
      setTimeout(() => {
        if (typeof unsub === "function") unsub();
      }, 5000);
    });
  }, []);

  // Sync current user to local storage (no images stored)
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [currentUser]);

  // Initial session hydration
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // When admin is logged in, attach real-time listener for pending requests
  useEffect(() => {
    if (!currentUser?.email) return;
    const isAdm = isAuthorizedAdminEmail(currentUser.email) || checkIsUserSuperAdmin(currentUser) || isRoleAdmin(currentUser.role);
    if (!isAdm) return;

    const unsub = subscribeToPendingRequests((requests) => {
      const list: AppUser[] = requests.map((r) => ({
        id: r.id,
        uid: r.uid,
        name: r.name,
        email: r.email,
        status: r.status,
        role: r.role,
        requestedAt: r.requestedAt,
        requestDate: r.requestDate,
        reviewedBy: r.reviewedBy,
        reviewedAt: r.reviewedAt,
        avatar_url: r.avatar_url,
      }));
      setPendingRequests(list);
    });

    return () => {
      if (typeof unsub === "function") unsub();
    };
  }, [currentUser?.email, currentUser?.role]);

  // 2. Real-Time Listener: Listen to employee's request status across all devices
  // Unlocks app on "approved", shows alert on "rejected"
  useEffect(() => {
    if (!currentUser?.email) return;
    const isAdm = isAuthorizedAdminEmail(currentUser.email) || checkIsUserSuperAdmin(currentUser);
    if (isAdm) return;

    const norm = String(currentUser.status || "").toUpperCase();
    if (norm === "APPROVED") return;

    const unsub = subscribeToUserRequestStatus(
      currentUser.email,
      (status, requestDoc) => {
        if (status === "approved") {
          setCurrentUser((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              status: "Approved",
              role: requestDoc.role || "Employee",
              reviewedBy: requestDoc.reviewedBy,
              reviewedAt: requestDoc.reviewedAt,
            };
          });
          success("Access Approved", "Your access request has been approved! Workspace unlocked.");
        } else if (status === "rejected") {
          setCurrentUser((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              status: "Rejected",
              reviewedBy: requestDoc.reviewedBy,
              reviewedAt: requestDoc.reviewedAt,
            };
          });
          toastError("Access Rejected", "Your access request was rejected by HR/Super Admin.");
        }
      }
    );

    return () => {
      if (typeof unsub === "function") unsub();
    };
  }, [currentUser?.email, success, toastError]);

  // Google OAuth Login Action
  const loginWithGoogle = useCallback(
    async (
      email: string,
      name?: string,
      avatarUrl?: string
    ): Promise<{
      success: boolean;
      case: "A" | "B" | "C" | "D";
      status: AuthorizationStatus;
      message: string;
      user?: AppUser;
    }> => {
      setIsLoading(true);
      const cleanEmail = email.trim().toLowerCase();
      const cleanName = name?.trim() || cleanEmail.split("@")[0];
      const isEmailSuperAdmin = isAuthorizedAdminEmail(cleanEmail);
      const timestamp = new Date().toISOString();
      const finalAvatar =
        avatarUrl ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=0284c7&color=fff`;

      // Always prepare Super Admin clearance object for local authorization
      const superAdminClearedUser: AppUser = {
        id: "USR-SUPERADMIN-01",
        uid: "USR-SUPERADMIN-01",
        name: cleanName,
        email: cleanEmail,
        avatar_url: finalAvatar,
        status: "Approved",
        role: "Super Admin",
        employeeId: "MOD000",
        isSuperAdmin: true,
        requested_at: timestamp,
        requestDate: timestamp,
        requestedAt: timestamp,
      };

      try {
        // Step 1: Submit to single Firestore collection `access_requests`
        const accessReqResult = await submitAccessRequest({
          userId: isEmailSuperAdmin ? "USR-SUPERADMIN-01" : undefined,
          userEmail: cleanEmail,
          applicantName: cleanName,
          photoURL: finalAvatar,
          requestedRole: "employee",
        });

        // 2. Ensure Super Admin Fallback / Clearance:
        if (isEmailSuperAdmin) {
          const finalAdmin: AppUser = {
            ...superAdminClearedUser,
            name: cleanName,
            avatar_url: finalAvatar,
            status: "Approved",
            role: "Super Admin",
            isSuperAdmin: true,
          };

          setCurrentUser(finalAdmin);
          setIsLoading(false);

          fetchPendingUsers().catch(() => []);

          success(
            "Access Authorized",
            `Welcome back, ${finalAdmin.name}. Authenticated as Super Admin.`
          );

          return {
            success: true,
            case: "D",
            status: "Approved",
            message: "Super Admin Access Authorized",
            user: finalAdmin,
          };
        }

        const resolvedUser: AppUser = {
          id: accessReqResult.user?.id || accessReqResult.requestId || ("USR-" + Math.random().toString(36).substring(2, 9)),
          uid: accessReqResult.user?.uid || accessReqResult.requestId || ("USR-" + Math.random().toString(36).substring(2, 9)),
          name: accessReqResult.user?.name || cleanName,
          email: cleanEmail,
          avatar_url: finalAvatar,
          status: accessReqResult.user?.status || (accessReqResult.status === "approved" ? "Approved" : accessReqResult.status === "rejected" ? "Rejected" : "Pending"),
          role: accessReqResult.user?.role || (accessReqResult.status === "approved" ? "Employee" : null),
          employeeId: accessReqResult.user?.employeeId,
          isSuperAdmin: checkIsUserSuperAdmin(accessReqResult.user),
          requested_at: accessReqResult.user?.requestedAt || timestamp,
          requestDate: accessReqResult.user?.requestDate || timestamp,
          requestedAt: accessReqResult.user?.requestedAt || timestamp,
          reviewedBy: accessReqResult.user?.reviewedBy,
          reviewedAt: accessReqResult.user?.reviewedAt,
        };

        setCurrentUser(resolvedUser);
        setIsLoading(false);

        const finalStatus = resolvedUser.status || "Pending";
        const normStatus = String(finalStatus).toUpperCase();

        if (normStatus === "APPROVED") {
          success(
            "Access Authorized",
            `Welcome back, ${resolvedUser.name}. Authenticated as ${resolvedUser.role || "Staff Member"}.`
          );
        } else if (normStatus === "REJECTED") {
          toastError("Access Denied", "Your request for access has been rejected.");
        } else {
          info(
            "Access Request Submitted",
            "Your access request has been submitted. Please wait for HR/Super Admin approval."
          );
        }

        return {
          success: true,
          case: normStatus === "APPROVED" ? "D" : normStatus === "REJECTED" ? "C" : (accessReqResult.status === "pending" ? "A" : "B"),
          status: finalStatus,
          message: accessReqResult.message,
          user: resolvedUser,
        };
      } catch (err: any) {
        setIsLoading(false);
        const errorMsg = err?.message || "Failed to authenticate with Google.";
        console.warn("[AuthContext] Caught error during Google sign-in:", errorMsg);

        // Even on network error, ensure Super Admin local clearance
        if (isEmailSuperAdmin) {
          setCurrentUser(superAdminClearedUser);
          success("Access Authorized", `Welcome back, ${cleanName}. Local Super Admin clearance active.`);
          return {
            success: true,
            case: "D",
            status: "Approved",
            message: "Super Admin local clearance active",
            user: superAdminClearedUser,
          };
        }

        toastError("Sign In Notice", "Could not complete request: " + errorMsg);
        return {
          success: false,
          case: "A",
          status: "Pending",
          message: errorMsg,
        };
      }
    },
    [success, info, toastError, fetchPendingUsers]
  );

  // Classic login helper for modals/demo switching
  const login = useCallback(
    async (
      email: string,
      _pass?: string
    ): Promise<{ success: boolean; user?: AppUser; error?: string }> => {
      const res = await loginWithGoogle(email);
      return {
        success: res.status === "Approved",
        user: res.user,
        error: res.status !== "Approved" ? res.message : undefined,
      };
    },
    [loginWithGoogle]
  );

  // Switch demo persona
  const switchDemoUser = useCallback(
    (identifier: string): AppUser | null => {
      const cleanId = identifier.trim().toLowerCase();
      const target =
        DEMO_USERS.find((u) => u.employeeId?.toLowerCase() === cleanId) ||
        DEMO_USERS.find((u) => u.uid?.toLowerCase() === cleanId) ||
        DEMO_USERS.find((u) => u.email.toLowerCase() === cleanId) ||
        DEMO_USERS.find((u) => u.name.toLowerCase() === cleanId) ||
        DEMO_USERS.find((u) => u.name.toLowerCase().includes(cleanId));

      if (target) {
        setCurrentUser(target);
        info("Active Persona", `${target.name} (${target.role})`);
        return target;
      }
      return null;
    },
    [info]
  );

  const switchPersona = useCallback(
    (employeeIdOrUid: string): AppUser | null => {
      return switchDemoUser(employeeIdOrUid);
    },
    [switchDemoUser]
  );

  // Refresh user status from server
  const refreshUserStatus = useCallback(async (): Promise<AuthorizationStatus | null> => {
    if (!currentUser?.email) return null;
    try {
      const res = await fetch(`/api/auth/status?email=${encodeURIComponent(currentUser.email)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.token) {
          localStorage.setItem("modela_jwt_token", data.token);
        }
        if (data.user) {
          const updated: AppUser = {
            ...currentUser,
            status: data.user.status,
            role: data.user.role,
            isSuperAdmin: checkIsUserSuperAdmin(data.user),
          };
          setCurrentUser(updated);
          return data.user.status;
        }
      }
    } catch (err) {
      console.warn("Error refreshing user status:", err);
    }
    return currentUser.status || null;
  }, [currentUser]);

  // Logout with server audit log
  const logout = useCallback(() => {
    const userEmail = currentUser?.email;
    if (userEmail) {
      fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail }),
      }).catch(() => {});
    }

    const { auth } = getSafeFirebase();
    if (auth) {
      fbSignOut(auth).catch(() => {});
    }

    setCurrentUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem("modela_jwt_token");
    sessionStorage.removeItem(SESSION_REQUEST_KEY);
    toast({
      type: "info",
      title: "Signed Out",
      description: "You have securely signed out of Modela Connect.",
    });
  }, [currentUser?.email, toast]);

  // Derived authorization flags
  const isSuperAdmin = checkIsUserSuperAdmin(currentUser);
  const currentRole: UserRole = isSuperAdmin
    ? "Super Admin"
    : currentUser?.role
    ? normalizeUserRole(currentUser.role)
    : "Employee";

  const isAdmin = isSuperAdmin || isRoleAdmin(currentUser?.role);
  const isEmployee = !isSuperAdmin && !isAdmin && (isRoleEmployee(currentUser?.role) || currentRole === "Employee");

  const isApproved =
    Boolean(currentUser) &&
    isApprovedStatus(currentUser?.status) &&
    currentUser?.role !== null &&
    currentUser?.role !== "Guest";

  const isPending = Boolean(currentUser) && isPendingStatus(currentUser?.status);
  const isRejected = Boolean(currentUser) && isRejectedStatus(currentUser?.status);

  const hasPermission = useCallback(
    (allowedRoles: (UserRole | string)[]): boolean => {
      if (!currentUser || !isApproved) return false;
      if (isSuperAdmin) return true;
      return allowedRoles.some((r) => {
        const norm = String(r).trim().toUpperCase();
        if (norm === "SUPERADMIN" || norm === "SUPER ADMIN") return isSuperAdmin;
        if (norm === "ADMIN" || norm === "HR ADMIN") return isAdmin;
        if (norm === "EMPLOYEE") return isEmployee;
        return norm === String(currentUser.role).trim().toUpperCase() || norm === currentRole.toUpperCase();
      });
    },
    [currentUser, isApproved, isSuperAdmin, isAdmin, isEmployee, currentRole]
  );

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentRole,
        isAuthenticated: !!currentUser,
        isApproved,
        isPending,
        isRejected,
        isSuperAdmin,
        isAdmin,
        isEmployee,
        isLoading,
        demoUsers: DEMO_USERS,
        pendingRequests,
        fetchPendingUsers,
        loginWithGoogle,
        login,
        logout,
        switchDemoUser,
        switchPersona,
        setCurrentUser,
        hasPermission,
        refreshUserStatus,
        isSignInModalOpen,
        setIsSignInModalOpen,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

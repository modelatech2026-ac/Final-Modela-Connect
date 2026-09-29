/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from "react";
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
  UserX,
  Mail,
  Sliders,
  Filter,
  RefreshCw,
  Search,
  ExternalLink,
  Shield,
  Layers,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useData } from "../../context/DataContext";
import { AccessRestricted } from "../ui/AccessRestricted";
import { useToast } from "../../context/ToastContext";
import { AuthRequestUser } from "../../types";
import { checkIsUserSuperAdmin } from "../../lib/authUtils";
import {
  getSafeFirebase,
  updateUserStatusInFirestore,
  subscribeToAccessRequests,
} from "../../services/firebaseAuthService";
import { doc, updateDoc, setDoc, serverTimestamp } from "firebase/firestore";

export const AdminNexusModule: React.FC = () => {
  const { currentRole, currentUser } = useAuth();
  const { authRequests, approveAuthRequest, rejectAuthRequest } = useData();
  const { info } = useToast();

  // Role selections for each pending request UID
  const [selectedRoles, setSelectedRoles] = useState<
    Record<string, "EMPLOYEE" | "HR" | "MANAGER" | "DEVELOPERS" | "ADMIN" | "SUPERADMIN">
  >({});
  const [filterTab, setFilterTab] = useState<"PENDING" | "APPROVED" | "REJECTED" | "ALL">(
    "PENDING"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [processingUid, setProcessingUid] = useState<string | null>(null);

  // Real-time Firestore access_requests state
  const [firestoreRequests, setFirestoreRequests] = useState<AuthRequestUser[]>([]);

  // Security Perimeter state (preserves security enclave controls)
  const [activeSubTab, setActiveSubTab] = useState<"REQUESTS" | "PERIMETER">("REQUESTS");
  const [threshold, setThreshold] = useState(85);
  const [ipAllowlist, setIpAllowlist] = useState("192.168.1.0/24\n10.0.0.0/16");
  const [livenessCheck, setLivenessCheck] = useState(true);

  // Requirement 2: Real-Time Admin Nexus Listener on shared 'access_requests' collection
  useEffect(() => {
    const unsubscribe = subscribeToAccessRequests(
      (loaded) => {
        setFirestoreRequests(loaded);
      },
      (err) => {
        console.error("[Admin Nexus] onSnapshot listener error:", err);
      }
    );
    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, []);

  // Merge live Firestore access_requests with DataContext authRequests
  const combinedRequests = useMemo(() => {
    const map = new Map<string, AuthRequestUser>();

    // 1. DataContext requests
    authRequests.forEach((req) => {
      const key = (req.email || req.uid || req.id || "").trim().toLowerCase();
      if (key) map.set(key, req);
    });

    // 2. Authoritative real-time Firestore access_requests
    firestoreRequests.forEach((req) => {
      const key = (req.email || req.uid || req.id || "").trim().toLowerCase();
      if (key) {
        const existing = map.get(key);
        map.set(key, { ...existing, ...req });
      }
    });

    return Array.from(map.values());
  }, [authRequests, firestoreRequests]);

  const isPendingStatus = (status?: string | null) => {
    const s = String(status || "").trim().toUpperCase();
    return s === "PENDING" || s === "PENDING_APPROVAL";
  };

  const isApprovedStatus = (status?: string | null) => {
    const s = String(status || "").trim().toUpperCase();
    return s === "APPROVED";
  };

  const isRejectedStatus = (status?: string | null) => {
    const s = String(status || "").trim().toUpperCase();
    return s === "REJECTED";
  };

  // Restrict access strictly to Super Admin (Sushoovan Das)
  const isSuperAdmin = currentRole === "Super Admin" || checkIsUserSuperAdmin(currentUser);

  if (!isSuperAdmin) {
    return (
      <AccessRestricted
        allowedRoles={["Super Admin"]}
        requiredRoles={["Super Admin"]}
        moduleName="ADMIN NEXUS • Primary Architect Terminal"
        description="Exclusive clearance zone. Access to the Admin Nexus terminal and identity authorization queue is restricted to the Super Admin (Sushoovan Das)."
      />
    );
  }

  const handleRoleChange = (
    uid: string,
    role: "EMPLOYEE" | "HR" | "MANAGER" | "DEVELOPERS" | "ADMIN" | "SUPERADMIN"
  ) => {
    setSelectedRoles((prev) => ({ ...prev, [uid]: role }));
  };

  // Requirement 3: ACCEPT handler performing explicit Firestore updateDoc: Set status: "APPROVED" and role: "EMPLOYEE"
  const handleAccept = async (request: AuthRequestUser) => {
    const roleToAssign = selectedRoles[request.uid] || "EMPLOYEE";
    setProcessingUid(request.uid);
    try {
      // 1. Explicit Firestore updateDoc on access_requests and users
      const { db } = getSafeFirebase();
      if (db) {
        const reqDocRef = doc(db, "access_requests", request.uid);
        const userDocRef = doc(db, "users", request.uid);
        const updatePayload = {
          status: "APPROVED",
          role: roleToAssign,
          reviewedAt: serverTimestamp(),
          reviewedBy: currentUser?.email || "Super Admin",
        };
        await Promise.allSettled([
          updateDoc(reqDocRef, updatePayload).catch(() => setDoc(reqDocRef, updatePayload, { merge: true })),
          updateDoc(userDocRef, updatePayload).catch(() => setDoc(userDocRef, updatePayload, { merge: true })),
        ]);
      } else {
        await updateUserStatusInFirestore(request.uid, "APPROVED", roleToAssign, currentUser?.email || "Super Admin");
      }

      // 2. Synchronize with DataContext and backend
      await approveAuthRequest(request.uid, roleToAssign);

      // 3. Optimistic state update
      setFirestoreRequests((prev) =>
        prev.map((r) =>
          r.uid === request.uid ? { ...r, status: "APPROVED", role: roleToAssign } : r
        )
      );
    } catch (err) {
      console.error("[Admin Nexus] Error accepting access request:", err);
    } finally {
      setProcessingUid(null);
    }
  };

  // Requirement 3: REJECT handler performing explicit Firestore updateDoc: Set status: "REJECTED"
  const handleReject = async (request: AuthRequestUser) => {
    setProcessingUid(request.uid);
    try {
      // 1. Explicit Firestore updateDoc on access_requests and users
      const { db } = getSafeFirebase();
      if (db) {
        const reqDocRef = doc(db, "access_requests", request.uid);
        const userDocRef = doc(db, "users", request.uid);
        const updatePayload = {
          status: "REJECTED",
          reviewedAt: serverTimestamp(),
          reviewedBy: currentUser?.email || "Super Admin",
        };
        await Promise.allSettled([
          updateDoc(reqDocRef, updatePayload).catch(() => setDoc(reqDocRef, updatePayload, { merge: true })),
          updateDoc(userDocRef, updatePayload).catch(() => setDoc(userDocRef, updatePayload, { merge: true })),
        ]);
      } else {
        await updateUserStatusInFirestore(request.uid, "REJECTED", undefined, currentUser?.email || "Super Admin");
      }

      // 2. Synchronize with DataContext and backend
      await rejectAuthRequest(request.uid);

      // 3. Optimistic state update
      setFirestoreRequests((prev) =>
        prev.map((r) =>
          r.uid === request.uid ? { ...r, status: "REJECTED" } : r
        )
      );
    } catch (err) {
      console.error("[Admin Nexus] Error rejecting access request:", err);
    } finally {
      setProcessingUid(null);
    }
  };

  const pendingRequests = combinedRequests.filter((r) => isPendingStatus(r.status));
  const approvedRequests = combinedRequests.filter((r) => isApprovedStatus(r.status));
  const rejectedRequests = combinedRequests.filter((r) => isRejectedStatus(r.status));

  const filteredRequests = combinedRequests.filter((r) => {
    const matchesTab =
      filterTab === "ALL" ||
      (filterTab === "PENDING" && isPendingStatus(r.status)) ||
      (filterTab === "APPROVED" && isApprovedStatus(r.status)) ||
      (filterTab === "REJECTED" && isRejectedStatus(r.status));

    const matchesSearch =
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.uid.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-[#0B132B] via-[#1C2541] to-[#0B132B] border border-blue-500/30 text-white shadow-lg">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-sky-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  ADMIN NEXUS
                </h1>
                <span className="px-2.5 py-0.5 text-[11px] font-extrabold rounded-full bg-[#FACC15] text-stone-950 uppercase tracking-wider">
                  Super Admin Exclusive
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Primary Architect Authorization Hub • User Onboarding Queue & Identity Clearance
              </p>
            </div>
          </div>
        </div>

        {/* Pending Badge Counter */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-black/40 border border-blue-500/30 flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              {pendingRequests.length > 0 && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FACC15] opacity-75"></span>
              )}
              <span
                className={`relative inline-flex rounded-full h-3 w-3 ${
                  pendingRequests.length > 0 ? "bg-[#FACC15]" : "bg-blue-500"
                }`}
              ></span>
            </span>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Pending Requests</p>
              <p className="text-lg font-black text-[#FACC15] leading-none">
                {pendingRequests.length}
              </p>
            </div>
          </div>

          <div className="hidden sm:block text-right border-l border-white/10 pl-3">
            <p className="text-[10px] text-slate-400">Authenticated Architect</p>
            <p className="text-xs font-bold text-white truncate max-w-[140px]">
              {currentUser?.name || "Sushoovan Das"}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            id="nexus-tab-requests"
            onClick={() => setActiveSubTab("REQUESTS")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === "REQUESTS"
                ? "bg-blue-900/40 text-sky-400 shadow-xs border border-blue-500/40"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <UserCheck className="w-4 h-4" />
            Access Request Management Table
            {pendingRequests.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-black bg-[#FACC15] text-stone-950">
                {pendingRequests.length}
              </span>
            )}
          </button>

          <button
            id="nexus-tab-perimeter"
            onClick={() => setActiveSubTab("PERIMETER")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === "PERIMETER"
                ? "bg-blue-900/40 text-sky-400 shadow-xs border border-blue-500/40"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Sliders className="w-4 h-4" />
            Perimeter & Optical Controls
          </button>
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 hidden md:flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-blue-500" />
          <span>Real-time Firestore & Local Sync active</span>
        </div>
      </div>

      {activeSubTab === "REQUESTS" ? (
        <div className="space-y-4">
          {/* Filter Bar & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                id="filter-pending"
                onClick={() => setFilterTab("PENDING")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  filterTab === "PENDING"
                    ? "bg-[#FACC15] text-stone-950 shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                Pending Queue ({pendingRequests.length})
              </button>

              <button
                id="filter-approved"
                onClick={() => setFilterTab("APPROVED")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  filterTab === "APPROVED"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Approved ({approvedRequests.length})
              </button>

              <button
                id="filter-rejected"
                onClick={() => setFilterTab("REJECTED")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  filterTab === "REJECTED"
                    ? "bg-rose-600 text-white shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                }`}
              >
                <XCircle className="w-3.5 h-3.5" />
                Rejected ({rejectedRequests.length})
              </button>

              <button
                id="filter-all"
                onClick={() => setFilterTab("ALL")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                  filterTab === "ALL"
                    ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                }`}
              >
                All Records ({combinedRequests.length})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="nexus-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search user name or Gmail..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Access Request Management Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table
                id="access-request-management-table"
                className="w-full text-left border-collapse text-xs"
              >
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                    <th className="py-3.5 px-4">User Name & Avatar</th>
                    <th className="py-3.5 px-4">Gmail Address</th>
                    <th className="py-3.5 px-4">Request Timestamp</th>
                    <th className="py-3.5 px-4">Current Status</th>
                    <th className="py-3.5 px-4">Role Assignment</th>
                    <th className="py-3.5 px-4 text-right">Architect Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200 font-medium">
                  {filteredRequests.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500 dark:text-slate-400">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <CheckCircle2 className="w-8 h-8 text-blue-500 opacity-80" />
                          <p className="font-semibold text-sm">No authorization requests found</p>
                          <p className="text-xs text-slate-400 max-w-sm">
                            {filterTab === "PENDING"
                              ? "All Google Sync identity registrations have been cleared by the Super Admin."
                              : "No records match the current filter or search criteria."}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredRequests.map((req) => {
                      const isPending = isPendingStatus(req.status);
                      const currentSelectedRole = selectedRoles[req.uid] || "EMPLOYEE";
                      const isProcessing = processingUid === req.uid;

                      return (
                        <tr
                          key={req.uid}
                          id={`request-row-${req.uid}`}
                          className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors ${
                            isPending ? "bg-amber-50/20 dark:bg-amber-950/10" : ""
                          }`}
                        >
                          {/* User Name (Plain text - No Image Policy) */}
                          <td className="py-3.5 px-4">
                            <div>
                              <p className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                                {req.name}
                                {req.employeeId && (
                                  <span className="font-mono text-[10px] text-slate-400 font-normal">
                                    ({req.employeeId})
                                  </span>
                                )}
                              </p>
                              <p className="text-[11px] text-slate-400 font-mono">{req.uid}</p>
                            </div>
                          </td>

                          {/* Gmail Address */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate max-w-[200px]" title={req.email}>
                                {req.email}
                              </span>
                            </div>
                          </td>

                          {/* Request Timestamp */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 text-[11px]">
                              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{new Date(req.requestedAt).toLocaleString()}</span>
                            </div>
                          </td>

                          {/* Current Status */}
                          <td className="py-3.5 px-4">
                            {isPending ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#FACC15]/20 text-yellow-800 dark:text-yellow-300 border border-[#FACC15]/40 animate-pulse">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#FACC15]" />
                                PENDING_APPROVAL
                              </span>
                            ) : isApprovedStatus(req.status) ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-sky-300 border border-blue-300 dark:border-blue-800">
                                <CheckCircle2 className="w-3 h-3 text-blue-600 dark:text-sky-400" />
                                APPROVED ({req.role ? req.role.toUpperCase() : "EMPLOYEE"})
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                                <XCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                                REJECTED
                              </span>
                            )}
                          </td>

                          {/* Role Selector Dropdown */}
                          <td className="py-3.5 px-4">
                            {isPending ? (
                              <div className="flex items-center gap-2">
                                <select
                                  id={`role-select-${req.uid}`}
                                  value={currentSelectedRole}
                                  onChange={(e) =>
                                    handleRoleChange(
                                      req.uid,
                                      e.target.value as "EMPLOYEE" | "HR" | "MANAGER" | "DEVELOPERS" | "ADMIN" | "SUPERADMIN"
                                    )
                                  }
                                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="EMPLOYEE">EMPLOYEE</option>
                                  <option value="HR">HR</option>
                                  <option value="MANAGER">MANAGER</option>
                                  <option value="DEVELOPERS">DEVELOPERS</option>
                                  <option value="ADMIN">ADMIN</option>
                                  <option value="SUPERADMIN">SUPERADMIN</option>
                                </select>
                              </div>
                            ) : (
                              <span className="font-semibold text-slate-500 dark:text-slate-400">
                                {req.role ? req.role.toUpperCase() : "EMPLOYEE"}
                              </span>
                            )}
                          </td>

                          {/* Action Buttons: ACCEPT & REJECT */}
                          <td className="py-3.5 px-4 text-right">
                            {isPending ? (
                              <div className="flex items-center justify-end gap-2">
                                {/* Blue ACCEPT Button */}
                                <button
                                  id={`btn-accept-${req.uid}`}
                                  disabled={isProcessing}
                                  onClick={() => handleAccept(req)}
                                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 active:scale-95 text-white shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                                  title="Approve access and assign selected clearance role"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  ACCEPT
                                </button>

                                {/* Red REJECT Button */}
                                <button
                                  id={`btn-reject-${req.uid}`}
                                  disabled={isProcessing}
                                  onClick={() => handleReject(req)}
                                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 active:scale-95 text-white shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                                  title="Deny access and flag as rejected"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  REJECT
                                </button>
                              </div>
                            ) : (
                              <div className="text-right">
                                <span className="text-[11px] text-slate-400">
                                  Reviewed by {req.reviewedBy || "Super Admin"}
                                </span>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer info */}
            <div className="px-4 py-3 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#FACC15]" />
                Cleared identities obtain instantaneous access to self-service or admin dashboards
                upon platform refresh.
              </span>
              <span className="font-mono text-[11px]">
                Active Queue: {pendingRequests.length} pending
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* Perimeter & Identity Security Form */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 space-y-6">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                info(
                  "Security Perimeter Updated",
                  `Biometric matching threshold updated to ${threshold}%. Liveness verification: ${
                    livenessCheck ? "ACTIVE" : "DISABLED"
                  }.`
                );
              }}
              className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-5"
            >
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-600 dark:text-sky-400" />
                Biometric Optical Threshold Settings
              </h3>

              <div>
                <div className="flex justify-between items-center text-xs mb-2">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Minimum AI Vector Confidence Match
                  </span>
                  <span className="font-mono font-bold text-blue-600 dark:text-sky-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                    {threshold}%
                  </span>
                </div>
                <input
                  id="biometric-threshold-slider"
                  type="range"
                  min="70"
                  max="99"
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Liveness Anti-Spoofing Detection
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Micro-blinking and 3D depth parity analysis
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={livenessCheck}
                  onChange={(e) => setLivenessCheck(e.target.checked)}
                  className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Enclave IP Address Allowlist (CIDR notation)
                </label>
                <textarea
                  rows={3}
                  value={ipAllowlist}
                  onChange={(e) => setIpAllowlist(e.target.value)}
                  className="w-full text-xs font-mono p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs"
              >
                Save Enclave Policies
              </button>
            </form>
          </div>

          <div className="lg:col-span-6 space-y-4">
            <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#FACC15]" />
                Active Security Posture
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                  <span className="font-semibold text-blue-900 dark:text-blue-200">
                    Primary Architect Role
                  </span>
                  <span className="font-mono font-bold text-blue-700 dark:text-sky-300">
                    Sushoovan Das (Super Admin)
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-600 dark:text-slate-300">Firestore Access Guard</span>
                  <span className="font-bold text-blue-600 dark:text-sky-400">
                    STRICT RBAC ENFORCED
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-600 dark:text-slate-300">Google Sync Encryption</span>
                  <span className="font-bold text-blue-600 dark:text-sky-400">
                    TLS 1.3 / OAuth 2.0 PKCE
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

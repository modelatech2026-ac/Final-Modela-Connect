/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Search,
  UserCheck,
  UserX,
  X,
  Users,
  Edit,
  FileText,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useNavigate } from "react-router-dom";
import {
  getSafeFirebase,
  updateUserStatusInFirestore,
  handleRequestAction,
  subscribeToAllRequests,
} from "../../services/firebaseAuthService";
import { collection, onSnapshot } from "firebase/firestore";

export interface ManagedUser {
  id?: string;
  uid: string;
  userId?: string;
  name: string;
  applicantName?: string;
  email: string;
  userEmail?: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "Pending" | "Approved" | "Rejected" | "pending" | "approved" | "rejected";
  role:
    | "SUPER_ADMIN"
    | "HR_ADMIN"
    | "HR_MANAGER"
    | "EMPLOYEE"
    | "Super Admin"
    | "HR Admin"
    | "HR Manager"
    | "Employee"
    | null
    | string;
  requestDate?: string;
  requestedAt?: string;
  requestTime?: string;
  statusUpdatedAt?: string;
  reviewedAt?: string;
  reviewTime?: string;
  processedAt?: string;
  actionByUserId?: string | null;
  reviewedBy?: string;
  processedBy?: string;
  rejectionReason?: string | null;
  remarks?: string | null;
  assignedRole?: string | null;
  requestedRole?: string | null;
  notificationUnread?: boolean;
}

export const AdminApprovalDashboard: React.FC = () => {
  const { currentUser, isSuperAdmin, isAdmin } = useAuth();
  const { success, error: toastError, info } = useToast();
  const navigate = useNavigate();

  // Top-level View Tab: "Access Requests" vs "Audit History" vs "Employees"
  const [activeView, setActiveView] = useState<"ACCESS_REQUESTS" | "AUDIT_HISTORY" | "EMPLOYEES">("ACCESS_REQUESTS");

  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL");

  // Accept/Review Modal state
  const [isAcceptModalOpen, setIsAcceptModalOpen] = useState(false);
  const [selectedUserForApproval, setSelectedUserForApproval] = useState<ManagedUser | null>(null);
  const [selectedRole, setSelectedRole] = useState<
    "SUPER_ADMIN" | "HR_ADMIN" | "HR_MANAGER" | "EMPLOYEE" | "HR Admin" | "HR Manager" | "Employee" | "Super Admin"
  >("EMPLOYEE");
  const [remarks, setRemarks] = useState<string>("");
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);
  const [isProcessingUid, setIsProcessingUid] = useState<string | null>(null);

  // Security check: Only Super Admin / HR Admin can access
  const hasAccess = isSuperAdmin || isAdmin;

  // Normalize status for comparisons
  const normalizeStatus = (status?: string | null): "PENDING" | "APPROVED" | "REJECTED" => {
    if (!status) return "PENDING";
    const s = String(status).trim().toUpperCase();
    if (s === "APPROVED") return "APPROVED";
    if (s === "REJECTED") return "REJECTED";
    return "PENDING";
  };

  // Helper to check if role is Employee
  const isEmployeeRole = (role?: string | null): boolean => {
    if (!role) return false;
    const r = String(role).trim().toUpperCase();
    return r === "EMPLOYEE";
  };

  // Load all users from backend API with RBAC authorization header
  const getAuthHeaders = (): Record<string, string> => {
    const token = localStorage.getItem("modela_jwt_token") || "";
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "x-user-email": currentUser?.email || "",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
  };

  const fetchUsers = async (silent = false) => {
    if (!currentUser?.email) return;
    if (!silent) setIsLoading(true);

    try {
      const res = await fetch("/api/users", {
        headers: getAuthHeaders(),
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.users)) {
          setUsers(data.users);
        }
      } else if (res.status === 403 || res.status === 401) {
        if (!silent) toastError("Access Denied", "Administrative clearance is required.");
      }
    } catch (err: any) {
      console.warn("Error fetching /api/users:", err);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  // Realtime Firestore subscription:
  // Subscribes to live Firestore access_requests collection so new requests, approvals,
  // and rejections sync live on the dashboard across all devices without page refresh.
  useEffect(() => {
    if (!hasAccess) return;

    setIsLoading(true);
    const unsubscribeFirestore = subscribeToAllRequests(
      (loadedRequests) => {
        setUsers(loadedRequests as any);
        setIsLoading(false);
      },
      (err) => {
        console.warn("Firestore subscription error:", err);
        setIsLoading(false);
      }
    );

    return () => {
      if (typeof unsubscribeFirestore === "function") {
        unsubscribeFirestore();
      }
    };
  }, [hasAccess]);

  if (!hasAccess) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800 border border-red-900/50 rounded-2xl p-8 text-center shadow-xl space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
            <XCircle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-white">Access Restricted</h2>
          <p className="text-slate-300 text-xs leading-relaxed">
            The User Management panel is restricted to Super Admin and HR Admin personnel.
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="w-full py-2.5 px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-semibold"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Open Accept/Review Modal for a request
  const handleOpenAcceptModal = (user: ManagedUser) => {
    setSelectedUserForApproval(user);
    setRemarks(user.remarks || user.rejectionReason || "");
    const existing = user.role;
    if (existing) {
      const upper = String(existing).toUpperCase();
      if (upper === "SUPER_ADMIN" || upper === "SUPER ADMIN") setSelectedRole("SUPER_ADMIN");
      else if (upper === "HR_ADMIN" || upper === "HR ADMIN") setSelectedRole("HR_ADMIN");
      else if (upper === "HR_MANAGER" || upper === "HR MANAGER") setSelectedRole("HR_MANAGER");
      else setSelectedRole("EMPLOYEE");
    } else {
      setSelectedRole("EMPLOYEE");
    }
    setIsAcceptModalOpen(true);
  };

  // Section 4.B: "Approve & Assign Role" Action
  // Atomically updates status to 'approved', sets processedBy, processedAt, and assignedRole
  const handleApproveAndAssignRole = async () => {
    if (!selectedUserForApproval || !currentUser?.email) return;

    // Default employee role if none selected
    const roleToAssign = selectedRole || "EMPLOYEE";

    // Hierarchy check: Non-Super Admin cannot assign Super Admin role
    const isAssigningSuperAdmin = roleToAssign === "SUPER_ADMIN" || roleToAssign === "Super Admin";
    if (isAssigningSuperAdmin && !isSuperAdmin) {
      toastError(
        "Permission Denied",
        "Only a Super Admin can assign the Super Admin role."
      );
      return;
    }

    setIsSubmittingApproval(true);
    const targetUid = selectedUserForApproval.id || selectedUserForApproval.uid;

    try {
      const res = await handleRequestAction(
        targetUid,
        "approved",
        currentUser.email,
        remarks,
        roleToAssign
      );

      if (res.success) {
        success(
          "Role Assigned & Approved",
          `${selectedUserForApproval.name} (${selectedUserForApproval.email}) has been approved with role '${roleToAssign}'.`
        );
        setIsAcceptModalOpen(false);
        setSelectedUserForApproval(null);
        setRemarks("");
      } else {
        toastError("Approval Failed", res.error || "Failed to approve user.");
      }
    } catch (err: any) {
      toastError("Approval Error", err.message || "Failed to approve user.");
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  // Section 4.B: "Reject Request" Action
  // Atomically updates status to 'rejected', sets processedBy, processedAt, and remarks
  const handleRejectRequest = async (uid: string, userEmail: string, userName: string, reasonInput?: string) => {
    if (!currentUser?.email) return;
    setIsProcessingUid(uid);

    try {
      const res = await handleRequestAction(
        uid,
        "rejected",
        currentUser.email,
        reasonInput || remarks || "Access request rejected by HR/Super Admin"
      );

      if (res.success) {
        info(
          "Request Rejected",
          `Access request for ${userName} (${userEmail}) has been set to 'REJECTED'.`
        );
        if (isAcceptModalOpen) {
          setIsAcceptModalOpen(false);
          setSelectedUserForApproval(null);
          setRemarks("");
        }
      } else {
        toastError("Rejection Failed", res.error || "Failed to reject user.");
      }
    } catch (err: any) {
      toastError("Rejection Error", err.message || "Failed to reject user.");
    } finally {
      setIsProcessingUid(null);
    }
  };

  // Filtered users for Access Requests section
  const filteredAccessRequests = users.filter((u) => {
    const norm = normalizeStatus(u.status);
    const matchesStatus =
      statusFilter === "ALL" || norm === statusFilter;
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.role && u.role.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  // Section 4.C: Categorized Employees Management Section
  // Display ONLY users where status == 'APPROVED' and role == 'EMPLOYEE'
  const categorizedEmployees = users.filter((u) => {
    const isApproved = normalizeStatus(u.status) === "APPROVED";
    const isEmployee = isEmployeeRole(u.role);
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    return isApproved && isEmployee && matchesSearch;
  });

  const pendingCount = users.filter((u) => normalizeStatus(u.status) === "PENDING").length;
  const approvedEmployeesCount = users.filter(
    (u) => normalizeStatus(u.status) === "APPROVED" && isEmployeeRole(u.role)
  ).length;

  const resolvedRequests = users.filter((u) => {
    const norm = normalizeStatus(u.status);
    const isResolved = norm === "APPROVED" || norm === "REJECTED";
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.role && u.role.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.reviewedBy && u.reviewedBy.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.processedBy && u.processedBy.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.remarks && u.remarks.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.rejectionReason && u.rejectionReason.toLowerCase().includes(searchQuery.toLowerCase()));
    return isResolved && matchesSearch;
  });

  const resolvedCount = users.filter((u) => {
    const norm = normalizeStatus(u.status);
    return norm === "APPROVED" || norm === "REJECTED";
  }).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto antialiased">
      {/* Header Banner */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              User Management & Access Control
            </h1>
            {pendingCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                {pendingCount} Pending
              </span>
            )}
          </div>
          <p className="text-slate-400 text-xs mt-1">
            Govern Google OAuth identity access requests, assign hierarchical roles, and oversee approved personnel.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchUsers}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-semibold border border-slate-600 transition-colors cursor-pointer self-start md:self-auto disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Primary Section Switcher: Access Requests vs Dedicated Employees View vs Audit History */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-800/90 rounded-2xl border border-slate-700 w-fit">
        <button
          onClick={() => setActiveView("ACCESS_REQUESTS")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeView === "ACCESS_REQUESTS"
              ? "bg-blue-600 text-white shadow-md"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Access Requests</span>
          {pendingCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-400 text-slate-900 font-extrabold">
              {pendingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveView("AUDIT_HISTORY")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeView === "AUDIT_HISTORY"
              ? "bg-blue-600 text-white shadow-md"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Audit History</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-700 text-slate-300 font-medium">
            {resolvedCount}
          </span>
        </button>

        <button
          onClick={() => setActiveView("EMPLOYEES")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeView === "EMPLOYEES"
              ? "bg-blue-600 text-white shadow-md"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Employees View</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-700 text-slate-300 font-medium">
            {approvedEmployeesCount}
          </span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-800/80 p-3 rounded-2xl border border-slate-700">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={
              activeView === "ACCESS_REQUESTS"
                ? "Search by User Name or Email..."
                : activeView === "AUDIT_HISTORY"
                ? "Search Audit History by Name, Auditor, Remarks..."
                : "Search Approved Employees..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        {activeView === "ACCESS_REQUESTS" && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Filter Status:</span>
            {(
              [
                { label: "All", value: "ALL" },
                { label: "Pending", value: "PENDING" },
                { label: "Approved", value: "APPROVED" },
                { label: "Rejected", value: "REJECTED" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  statusFilter === tab.value
                    ? "bg-blue-600 text-white"
                    : "bg-slate-900 text-slate-400 hover:text-white border border-slate-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 4.A: ACCESS REQUESTS TABLE (HR Admin & Super Admin)                */}
      {/* Columns: [User Name | Email | Request Date | Status | Actions]             */}
      {/* Strict NO-IMAGE Policy: Standard plain text identification only           */}
      {/* ========================================================================= */}
      {activeView === "ACCESS_REQUESTS" ? (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/90 border-b border-slate-700 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">User Name</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4">Request Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60 text-xs">
                {filteredAccessRequests.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400 text-xs">
                      {isLoading
                        ? "Loading access requests..."
                        : "No user requests match the selected criteria."}
                    </td>
                  </tr>
                ) : (
                  filteredAccessRequests.map((user) => {
                    const normStatus = normalizeStatus(user.status);
                    const isPending = normStatus === "PENDING";
                    const isApproved = normStatus === "APPROVED";
                    const isRejected = normStatus === "REJECTED";
                    const uid = user.id || user.uid;
                    const isProcessing = isProcessingUid === uid;
                    const reqDate = user.requestDate || user.requestedAt;

                    return (
                      <tr
                        key={uid}
                        id={`user-row-${uid}`}
                        className={`hover:bg-slate-700/30 transition-colors ${
                          isPending ? "bg-amber-500/[0.03]" : ""
                        }`}
                      >
                        {/* 1. User Name (Plain Text Only) */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-white">
                            {user.name}
                          </div>
                          {user.role && (
                            <div className="text-[11px] text-slate-400 font-medium">
                              Role: {user.role}
                            </div>
                          )}
                        </td>

                        {/* 2. Email Address (Plain Text) */}
                        <td className="py-3.5 px-4 font-mono text-slate-300">
                          {user.email}
                        </td>

                        {/* 3. Request Date (Plain Text) */}
                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-300 whitespace-nowrap">
                          {reqDate
                            ? new Date(reqDate).toLocaleString([], {
                                dateStyle: "medium",
                                timeStyle: "short",
                              })
                            : "N/A"}
                        </td>

                        {/* 4. Status Badge */}
                        <td className="py-3.5 px-4">
                          {isPending && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                              <Clock className="w-3 h-3 text-amber-400" />
                              Pending
                            </span>
                          )}
                          {isApproved && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              Approved
                            </span>
                          )}
                          {isRejected && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/15 text-red-300 border border-red-500/30">
                              <XCircle className="w-3 h-3 text-red-400" />
                              Rejected
                            </span>
                          )}
                        </td>

                        {/* 5. Actions */}
                        <td className="py-3.5 px-4 text-right">
                          {isPending ? (
                            <div className="inline-flex items-center gap-2">
                              {/* Section 4.B: Clicking "Approve" on a Pending Request opens Role Modal */}
                              <button
                                id={`approve-btn-${uid}`}
                                onClick={() => handleOpenAcceptModal(user)}
                                disabled={isProcessing}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 shadow-sm disabled:opacity-50"
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>Approve</span>
                              </button>

                              {/* Reject Request Action */}
                              <button
                                id={`reject-btn-${uid}`}
                                onClick={() =>
                                  handleRejectRequest(uid, user.email, user.name)
                                }
                                disabled={isProcessing}
                                className="px-3 py-1.5 bg-red-600/80 hover:bg-red-600 active:bg-red-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-50"
                              >
                                <UserX className="w-3.5 h-3.5" />
                                <span>Reject</span>
                              </button>
                            </div>
                          ) : isApproved ? (
                            <div className="inline-flex items-center gap-2">
                              <button
                                onClick={() => handleOpenAcceptModal(user)}
                                className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1"
                                title="Change Role"
                              >
                                <Edit className="w-3 h-3" />
                                <span>Change Role</span>
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-500 text-xs font-medium">Blocked</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeView === "AUDIT_HISTORY" ? (
        /* ========================================================================= */
        /* AUDIT HISTORY VIEW: Resolved items (Approved & Rejected requests)         */
        /* Displays auditor info, timestamps, assigned role, and remarks/reason      */
        /* ========================================================================= */
        <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-900/60 border-b border-slate-700 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-sm">
                Resolved Requests Audit History
              </h3>
              <p className="text-slate-400 text-xs">
                History of all approved and rejected requests with auditor details and rationale.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-700 text-slate-300 border border-slate-600">
              {resolvedRequests.length} Resolved
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/90 border-b border-slate-700 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Applicant</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4">Decision</th>
                  <th className="py-3.5 px-4">Role Assigned</th>
                  <th className="py-3.5 px-4">Processed By</th>
                  <th className="py-3.5 px-4">Processed Time</th>
                  <th className="py-3.5 px-4">Remarks / Reason</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60 text-xs">
                {resolvedRequests.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                      No resolved requests found in audit history.
                    </td>
                  </tr>
                ) : (
                  resolvedRequests.map((req) => {
                    const norm = normalizeStatus(req.status);
                    const uid = req.id || req.uid;
                    const dateStr = req.processedAt || req.reviewedAt || req.reviewTime || req.statusUpdatedAt;

                    return (
                      <tr key={uid} className="hover:bg-slate-700/30 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-white">
                          {req.name}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-300">
                          {req.email}
                        </td>
                        <td className="py-3.5 px-4">
                          {norm === "APPROVED" ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              Approved
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/15 text-red-300 border border-red-500/30">
                              <XCircle className="w-3 h-3 text-red-400" />
                              Rejected
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-300 font-medium">
                          {req.assignedRole || req.role || "—"}
                        </td>
                        <td className="py-3.5 px-4 text-slate-300 font-mono text-[11px]">
                          {req.processedBy || req.reviewedBy || "HR Admin"}
                        </td>
                        <td className="py-3.5 px-4 text-slate-300 font-mono text-[11px] whitespace-nowrap">
                          {dateStr
                            ? new Date(dateStr).toLocaleString([], {
                                dateStyle: "medium",
                                timeStyle: "short",
                              })
                            : "N/A"}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 max-w-xs truncate" title={req.remarks || req.rejectionReason || "No remarks"}>
                          {req.remarks || req.rejectionReason || "—"}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleOpenAcceptModal(req)}
                            className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded-lg text-xs font-medium transition-colors cursor-pointer inline-flex items-center gap-1"
                          >
                            <Edit className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* SECTION 4.C: CATEGORIZED EMPLOYEES MANAGEMENT SECTION                     */
        /* Dedicated "Employees" view under User Management                          */
        /* Display ONLY users where status == 'APPROVED' and role == 'EMPLOYEE'      */
        /* Table columns: [Employee Name | Email | Status: Active | Role: Employee]  */
        /* Strict NO-IMAGE Policy: Standard plain text identification only           */
        /* ========================================================================= */
        <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-900/60 border-b border-slate-700 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-sm">
                Approved Employees Roster
              </h3>
              <p className="text-slate-400 text-xs">
                Displaying only users with Status: APPROVED and Role: EMPLOYEE.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
              {categorizedEmployees.length} Active Employees
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/90 border-b border-slate-700 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  {/* Column 1: Employee Name */}
                  <th className="py-3.5 px-4">Employee Name</th>
                  {/* Column 2: Email */}
                  <th className="py-3.5 px-4">Email</th>
                  {/* Column 3: Status: Active */}
                  <th className="py-3.5 px-4">Status</th>
                  {/* Column 4: Role: Employee */}
                  <th className="py-3.5 px-4 text-right">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60 text-xs">
                {categorizedEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-400 text-xs">
                      No approved employee records found.
                    </td>
                  </tr>
                ) : (
                  categorizedEmployees.map((emp) => {
                    const uid = emp.id || emp.uid;
                    return (
                      <tr
                        key={uid}
                        className="hover:bg-slate-700/30 transition-colors"
                      >
                        {/* 1. Employee Name (Plain Text Only - No Image) */}
                        <td className="py-3.5 px-4 font-semibold text-white">
                          {emp.name}
                        </td>

                        {/* 2. Email (Plain Text) */}
                        <td className="py-3.5 px-4 font-mono text-slate-300">
                          {emp.email}
                        </td>

                        {/* 3. Status: Active */}
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Active
                          </span>
                        </td>

                        {/* 4. Role: Employee */}
                        <td className="py-3.5 px-4 text-right font-medium text-slate-300">
                          <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 font-mono text-xs">
                            Employee
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 4.B: ROLE ASSIGNMENT & APPROVAL WORKFLOW MODAL DIALOG              */}
      {/* Displays: Name, Email, Request Date                                       */}
      {/* Role Selection Dropdown: [ HR Admin, HR Manager, Employee, Super Admin ]  */}
      {/* Remarks / Reason input textarea                                           */}
      {/* Actions: "Approve & Assign Role" and "Reject Request"                      */}
      {/* ========================================================================= */}
      {isAcceptModalOpen && selectedUserForApproval && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-5 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-base">
                  Review Access Request
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsAcceptModalOpen(false);
                  setSelectedUserForApproval(null);
                  setRemarks("");
                }}
                className="text-slate-400 hover:text-white p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: Name, Email, Request Date */}
            <div className="bg-slate-900 border border-slate-700/80 rounded-xl p-4 space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">Name:</span>
                <span className="text-white font-semibold">
                  {selectedUserForApproval.name}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">Email:</span>
                <span className="text-slate-200 font-mono">
                  {selectedUserForApproval.email}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">Request Date:</span>
                <span className="text-slate-300 font-mono text-[11px]">
                  {selectedUserForApproval.requestDate || selectedUserForApproval.requestedAt
                    ? new Date(
                        (selectedUserForApproval.requestDate ||
                          selectedUserForApproval.requestedAt)!
                      ).toLocaleString([], {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })
                    : "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">Current Status:</span>
                <span className="text-slate-300 font-semibold uppercase">
                  {selectedUserForApproval.status}
                </span>
              </div>
            </div>

            {/* Role Selection Dropdown: [ SUPER_ADMIN, HR_ADMIN, HR_MANAGER, EMPLOYEE ] */}
            <div className="space-y-1.5">
              <label
                htmlFor="role-dropdown"
                className="block text-xs font-semibold text-slate-300"
              >
                Assign System Role:
              </label>
              <select
                id="role-dropdown"
                value={selectedRole}
                onChange={(e) =>
                  setSelectedRole(
                    e.target.value as any
                  )
                }
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-medium"
              >
                <option value="SUPER_ADMIN">SUPER_ADMIN (Super Admin)</option>
                <option value="HR_ADMIN">HR_ADMIN (HR Admin)</option>
                <option value="HR_MANAGER">HR_MANAGER (HR Manager)</option>
                <option value="EMPLOYEE">EMPLOYEE (Employee)</option>
              </select>
            </div>

            {/* Remarks / Reason Input */}
            <div className="space-y-1.5">
              <label
                htmlFor="modal-remarks-input"
                className="block text-xs font-semibold text-slate-300"
              >
                Remarks / Reason (Optional):
              </label>
              <textarea
                id="modal-remarks-input"
                rows={2}
                placeholder="Add approval remarks or rejection rationale..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-medium resize-none"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-700">
              {/* Reject Request Action */}
              <button
                type="button"
                onClick={() =>
                  handleRejectRequest(
                    selectedUserForApproval.id || selectedUserForApproval.uid,
                    selectedUserForApproval.email,
                    selectedUserForApproval.name,
                    remarks
                  )
                }
                disabled={isSubmittingApproval}
                className="px-3.5 py-2 bg-red-600/80 hover:bg-red-600 active:bg-red-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer disabled:opacity-60 flex items-center gap-1.5"
              >
                <UserX className="w-3.5 h-3.5" />
                <span>Reject Request</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAcceptModalOpen(false);
                    setSelectedUserForApproval(null);
                    setRemarks("");
                  }}
                  disabled={isSubmittingApproval}
                  className="px-3.5 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                {/* "Approve & Assign Role" Action */}
                <button
                  id="modal-approve-user-btn"
                  type="button"
                  onClick={handleApproveAndAssignRole}
                  disabled={isSubmittingApproval}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-md disabled:opacity-60 flex items-center gap-1.5"
                >
                  {isSubmittingApproval ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Approve & Assign Role</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

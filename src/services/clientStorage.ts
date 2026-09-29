/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface StoredUser {
  id: string;
  uid: string;
  name: string;
  email: string;
  avatar_url?: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "Pending" | "Approved" | "Rejected";
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
  requested_at?: string;
  requestDate: string;
  requestedAt?: string;
  statusUpdatedAt?: string;
  reviewedAt?: string;
  actionByUserId?: string | null;
  reviewedBy?: string;
  notificationUnread: boolean;
  employeeId?: string;
}

export interface ClientAuditLog {
  id: string;
  timestamp: string;
  action: string;
  targetUser: string;
  executedBy: string;
  details?: string;
}

export interface ClientEmployee {
  id: string;
  firstName: string;
  lastName: string;
  joiningDate: string;
  designation: string;
  phone: string;
  department: string;
  status: "ACTIVE" | "INACTIVE" | "ON_LEAVE" | "TERMINATED";
  location: string;
  managerId?: string;
  compensation: {
    basic: number;
    allowances: number;
  };
}

const STORAGE_KEY_USERS = "modela_users_v2";
const STORAGE_KEY_LOGS = "modela_audit_logs_v2";
const STORAGE_KEY_EMPLOYEES = "modela_employees_v2";

export const INITIAL_CLIENT_USERS: StoredUser[] = [
  {
    id: "USR-SUPERADMIN-01",
    uid: "USR-SUPERADMIN-01",
    name: "Modela Tech",
    email: "modelatech2026@gmail.com",
    status: "APPROVED",
    role: "SUPER_ADMIN",
    requestDate: "2026-09-20T08:00:00.000Z",
    requestedAt: "2026-09-20T08:00:00.000Z",
    statusUpdatedAt: "2026-09-20T08:00:00.000Z",
    reviewedAt: "2026-09-20T08:00:00.000Z",
    actionByUserId: "SYS-ROOT",
    reviewedBy: "System Root",
    notificationUnread: false,
    employeeId: "MOD000",
  },
  {
    id: "USR-Q94BIIQ5",
    uid: "USR-Q94BIIQ5",
    name: "Sushoovan Das",
    email: "sushoovandas@gmail.com",
    status: "APPROVED",
    role: "SUPER_ADMIN",
    requestDate: "2026-09-20T08:44:15.481Z",
    requestedAt: "2026-09-20T08:44:15.481Z",
    statusUpdatedAt: "2026-09-20T08:44:35.660Z",
    reviewedAt: "2026-09-20T08:44:35.660Z",
    actionByUserId: "SYS-ROOT",
    reviewedBy: "System Root",
    notificationUnread: false,
    employeeId: "MOD001",
  },
  {
    id: "USR-HR-ADM01",
    uid: "USR-HR-ADM01",
    name: "Alex Morgan",
    email: "alex.morgan@modela.io",
    status: "APPROVED",
    role: "HR_ADMIN",
    requestDate: "2026-09-21T09:15:00.000Z",
    requestedAt: "2026-09-21T09:15:00.000Z",
    statusUpdatedAt: "2026-09-21T09:20:00.000Z",
    reviewedAt: "2026-09-21T09:20:00.000Z",
    actionByUserId: "USR-Q94BIIQ5",
    reviewedBy: "Sushoovan Das",
    notificationUnread: false,
    employeeId: "MOD002",
  },
  {
    id: "USR-HR-MGR01",
    uid: "USR-HR-MGR01",
    name: "Marcus Vance",
    email: "marcus.vance@modela.io",
    status: "APPROVED",
    role: "HR_MANAGER",
    requestDate: "2026-09-22T10:00:00.000Z",
    requestedAt: "2026-09-22T10:00:00.000Z",
    statusUpdatedAt: "2026-09-22T10:05:00.000Z",
    reviewedAt: "2026-09-22T10:05:00.000Z",
    actionByUserId: "USR-Q94BIIQ5",
    reviewedBy: "Sushoovan Das",
    notificationUnread: false,
    employeeId: "MOD003",
  },
  {
    id: "USR-EMP-001",
    uid: "USR-EMP-001",
    name: "Elena Rostova",
    email: "elena.rostova@modela.io",
    status: "APPROVED",
    role: "EMPLOYEE",
    requestDate: "2026-09-23T11:00:00.000Z",
    requestedAt: "2026-09-23T11:00:00.000Z",
    statusUpdatedAt: "2026-09-23T11:10:00.000Z",
    reviewedAt: "2026-09-23T11:10:00.000Z",
    actionByUserId: "USR-HR-ADM01",
    reviewedBy: "Alex Morgan",
    notificationUnread: false,
    employeeId: "MOD004",
  },
  {
    id: "USR-PENDING-01",
    uid: "USR-PENDING-01",
    name: "Aditi Chakraborty",
    email: "aditichakraborty2005@gmail.com",
    avatar_url: "https://ui-avatars.com/api/?name=Aditi+Chakraborty&background=f59e0b&color=fff",
    status: "PENDING",
    role: null,
    requested_at: "2026-09-24T14:30:00.000Z",
    requestDate: "2026-09-24T14:30:00.000Z",
    requestedAt: "2026-09-24T14:30:00.000Z",
    notificationUnread: true,
  },
];

export const INITIAL_CLIENT_EMPLOYEES: ClientEmployee[] = [
  {
    id: "MOD001",
    firstName: "Sushoovan",
    lastName: "Das",
    joiningDate: "2024-01-15",
    designation: "Executive Director",
    phone: "+1 (555) 234-5678",
    department: "Executive Office",
    status: "ACTIVE",
    location: "San Francisco HQ",
    compensation: { basic: 85000, allowances: 25000 },
  },
  {
    id: "MOD002",
    firstName: "Alex",
    lastName: "Morgan",
    joiningDate: "2024-03-01",
    designation: "Head of Human Resources",
    phone: "+1 (555) 345-6789",
    department: "Human Resources",
    status: "ACTIVE",
    location: "San Francisco HQ",
    compensation: { basic: 60000, allowances: 18000 },
  },
  {
    id: "MOD003",
    firstName: "Marcus",
    lastName: "Vance",
    joiningDate: "2024-05-10",
    designation: "HR Operations Manager",
    phone: "+1 (555) 456-7890",
    department: "Human Resources",
    status: "ACTIVE",
    location: "New York Regional Office",
    compensation: { basic: 48000, allowances: 14000 },
  },
  {
    id: "MOD004",
    firstName: "Elena",
    lastName: "Rostova",
    joiningDate: "2024-08-20",
    designation: "Senior Software Engineer",
    phone: "+1 (555) 567-8901",
    department: "Engineering",
    status: "ACTIVE",
    location: "Remote - Seattle",
    compensation: { basic: 52000, allowances: 15000 },
  },
  {
    id: "MOD005",
    firstName: "David",
    lastName: "Chen",
    joiningDate: "2024-09-01",
    designation: "Lead Cloud Architect",
    phone: "+1 (555) 678-9012",
    department: "Infrastructure",
    status: "ACTIVE",
    location: "Austin Center",
    compensation: { basic: 58000, allowances: 16000 },
  },
  {
    id: "MOD006",
    firstName: "Sarah",
    lastName: "Jenkins",
    joiningDate: "2024-10-15",
    designation: "Senior Product Manager",
    phone: "+1 (555) 789-0123",
    department: "Product",
    status: "ACTIVE",
    location: "San Francisco HQ",
    compensation: { basic: 54000, allowances: 15000 },
  },
];

export const INITIAL_CLIENT_LOGS: ClientAuditLog[] = [
  {
    id: "AUD-1790321753839-7SXP",
    timestamp: "2026-09-25T07:35:53.839Z",
    action: "Login Attempt",
    targetUser: "sushoovandas@gmail.com",
    executedBy: "sushoovandas@gmail.com",
    details: "Google login attempt. Current status: APPROVED, Role: SUPER_ADMIN",
  },
  {
    id: "AUD-1790320938434-U0I6",
    timestamp: "2026-09-25T07:22:18.434Z",
    action: "Role Assigned",
    targetUser: "modelatech2026@gmail.com",
    executedBy: "sushoovandas@gmail.com",
    details: "Role assigned: 'EMPLOYEE' by auditor USR-Q94BIIQ5",
  },
  {
    id: "AUD-1790320938434-DBUL",
    timestamp: "2026-09-25T07:22:18.434Z",
    action: "Request Approved",
    targetUser: "modelatech2026@gmail.com",
    executedBy: "sushoovandas@gmail.com",
    details: "Access request approved by Sushoovan Das (sushoovandas@gmail.com). Assigned Role: EMPLOYEE",
  },
  {
    id: "AUD-1790320491039-AAG6",
    timestamp: "2026-09-25T07:14:51.039Z",
    action: "Login Attempt",
    targetUser: "sushoovandas@gmail.com",
    executedBy: "sushoovandas@gmail.com",
    details: "Google login attempt. Current status: APPROVED, Role: SUPER_ADMIN",
  },
];

// Normalize status
export function normalizeUserStatus(status?: string | null): "PENDING" | "APPROVED" | "REJECTED" {
  if (!status) return "PENDING";
  const s = String(status).trim().toUpperCase();
  if (s === "APPROVED") return "APPROVED";
  if (s === "REJECTED") return "REJECTED";
  return "PENDING";
}

// Normalize role
export function normalizeUserRoleString(role?: string | null): string | null {
  if (!role) return null;
  const upper = String(role).trim().toUpperCase();
  if (upper === "SUPER_ADMIN" || upper === "SUPER ADMIN" || upper === "SUPERADMIN") return "SUPER_ADMIN";
  if (upper === "HR_ADMIN" || upper === "HR ADMIN" || upper === "ADMIN") return "HR_ADMIN";
  if (upper === "HR_MANAGER" || upper === "HR MANAGER") return "HR_MANAGER";
  if (upper === "EMPLOYEE") return "EMPLOYEE";
  return role;
}

export function loadStoredUsers(): StoredUser[] {
  if (typeof window === "undefined") return INITIAL_CLIENT_USERS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Failed to load users from localStorage, resetting to defaults:", e);
  }
  saveStoredUsers(INITIAL_CLIENT_USERS);
  return INITIAL_CLIENT_USERS;
}

export function saveStoredUsers(users: StoredUser[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
    window.dispatchEvent(new Event("modela_users_updated"));
  } catch (e) {
    console.error("Failed to save users to localStorage:", e);
  }
}

export function loadStoredAuditLogs(): ClientAuditLog[] {
  if (typeof window === "undefined") return INITIAL_CLIENT_LOGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LOGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Failed to load audit logs from localStorage:", e);
  }
  saveStoredAuditLogs(INITIAL_CLIENT_LOGS);
  return INITIAL_CLIENT_LOGS;
}

export function saveStoredAuditLogs(logs: ClientAuditLog[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(logs.slice(0, 500)));
    window.dispatchEvent(new Event("modela_logs_updated"));
  } catch (e) {
    console.error("Failed to save audit logs to localStorage:", e);
  }
}

export function appendClientAuditLog(entry: {
  action: string;
  targetUser: string;
  executedBy: string;
  details?: string;
}): ClientAuditLog {
  const newEntry: ClientAuditLog = {
    id: "AUD-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6).toUpperCase(),
    timestamp: new Date().toISOString(),
    action: entry.action,
    targetUser: entry.targetUser,
    executedBy: entry.executedBy,
    details: entry.details || "",
  };
  const logs = loadStoredAuditLogs();
  logs.unshift(newEntry);
  saveStoredAuditLogs(logs);
  return newEntry;
}

export function loadStoredEmployees(): ClientEmployee[] {
  if (typeof window === "undefined") return INITIAL_CLIENT_EMPLOYEES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_EMPLOYEES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Failed to load employees from localStorage:", e);
  }
  saveStoredEmployees(INITIAL_CLIENT_EMPLOYEES);
  return INITIAL_CLIENT_EMPLOYEES;
}

export function saveStoredEmployees(employees: ClientEmployee[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_EMPLOYEES, JSON.stringify(employees));
    window.dispatchEvent(new Event("modela_employees_updated"));
  } catch (e) {
    console.error("Failed to save employees to localStorage:", e);
  }
}

// Client-side authentication handler (Google sign-in / access request)
export function clientLoginWithGoogle(
  email: string,
  name?: string,
  avatarUrl?: string
): {
  success: boolean;
  case: "A" | "B" | "C" | "D";
  status: "PENDING" | "APPROVED" | "REJECTED";
  token?: string;
  message: string;
  user: StoredUser;
} {
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = name?.trim() || cleanEmail.split("@")[0];
  const finalAvatar =
    avatarUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=0284c7&color=fff`;
  const users = loadStoredUsers();
  const existingIndex = users.findIndex((u) => u.email.toLowerCase() === cleanEmail);

  // Check if email matches configured Super Admin / HR Admin email
  const isSuperAdminEmail =
    cleanEmail === "modelatech2026@gmail.com" ||
    cleanEmail === "your_exact_google_email@gmail.com" ||
    cleanEmail === "sushoovandas@gmail.com";

  if (isSuperAdminEmail) {
    const mockToken = "modela_session_" + Date.now() + "_" + Math.random().toString(36).substring(2);
    if (existingIndex !== -1) {
      const superUser = users[existingIndex];
      superUser.status = "APPROVED";
      superUser.role = "SUPER_ADMIN";
      superUser.avatar_url = superUser.avatar_url || finalAvatar;
      saveStoredUsers(users);
      return {
        success: true,
        case: "D",
        status: "APPROVED",
        token: mockToken,
        message: "Super Admin Clearance Verified. Immediate access granted.",
        user: superUser,
      };
    } else {
      const nowIso = new Date().toISOString();
      const superUser: StoredUser = {
        id: "USR-SUPERADMIN-01",
        uid: "USR-SUPERADMIN-01",
        name: cleanName,
        email: cleanEmail,
        avatar_url: finalAvatar,
        status: "APPROVED",
        role: "SUPER_ADMIN",
        requestDate: nowIso,
        requested_at: nowIso,
        requestedAt: nowIso,
        statusUpdatedAt: nowIso,
        reviewedAt: nowIso,
        actionByUserId: "SYS-ROOT",
        reviewedBy: "System Root",
        notificationUnread: false,
        employeeId: "MOD000",
      };
      users.unshift(superUser);
      saveStoredUsers(users);
      return {
        success: true,
        case: "D",
        status: "APPROVED",
        token: mockToken,
        message: "Super Admin Clearance Verified. Immediate access granted.",
        user: superUser,
      };
    }
  }

  // Case A: User does NOT exist in the database -> create record with status PENDING, role null
  if (existingIndex === -1) {
    const nowIso = new Date().toISOString();
    const newId = "USR-" + Math.random().toString(36).substring(2, 10).toUpperCase();
    const newUser: StoredUser = {
      id: newId,
      uid: newId,
      name: cleanName,
      email: cleanEmail,
      avatar_url: finalAvatar,
      status: "PENDING",
      role: null,
      requested_at: nowIso,
      requestDate: nowIso,
      requestedAt: nowIso,
      statusUpdatedAt: nowIso,
      actionByUserId: null,
      notificationUnread: true,
    };
    users.push(newUser);
    saveStoredUsers(users);

    appendClientAuditLog({
      action: "New Access Request Created",
      targetUser: cleanEmail,
      executedBy: cleanEmail,
      details: `Initial access request submitted by ${cleanName} (${cleanEmail}). Status: PENDING, Role: NULL.`,
    });

    return {
      success: true,
      case: "A",
      status: "PENDING",
      message: "Your request has been sent to the HR Admin. Please wait for approval.",
      user: newUser,
    };
  }

  const existing = users[existingIndex];
  if (finalAvatar && !existing.avatar_url) {
    existing.avatar_url = finalAvatar;
    saveStoredUsers(users);
  }
  const normStatus = normalizeUserStatus(existing.status);

  appendClientAuditLog({
    action: "Login Attempt",
    targetUser: cleanEmail,
    executedBy: cleanEmail,
    details: `Google login attempt. Current status: ${normStatus}, Role: ${existing.role || "NULL"}`,
  });

  // Case B: User exists with Status 'PENDING'
  if (normStatus === "PENDING") {
    return {
      success: true,
      case: "B",
      status: "PENDING",
      message: "Your request has been sent to the HR Admin. Please wait for approval.",
      user: existing,
    };
  }

  // Case C: User exists with Status 'REJECTED'
  if (normStatus === "REJECTED") {
    return {
      success: false,
      case: "C",
      status: "REJECTED",
      message: "Your access request has been rejected by the HR Admin.",
      user: existing,
    };
  }

  // Case D: User exists with Status 'APPROVED'
  const mockToken = "modela_session_" + Date.now() + "_" + Math.random().toString(36).substring(2);
  return {
    success: true,
    case: "D",
    status: "APPROVED",
    token: mockToken,
    message: `Your account has been approved. Assigned Role: ${existing.role || "EMPLOYEE"}`,
    user: existing,
  };
}

export function clientApproveUser(
  uid: string,
  role: string,
  auditorEmail: string
): { success: boolean; user?: StoredUser; error?: string } {
  const users = loadStoredUsers();
  const idx = users.findIndex(
    (u) => u.id === uid || u.uid === uid || u.email.toLowerCase() === uid.toLowerCase()
  );
  if (idx === -1) {
    return { success: false, error: "User not found" };
  }

  const user = users[idx];
  const prevRole = user.role;
  const nowIso = new Date().toISOString();

  let targetRole = role.trim().toUpperCase().replace(/\s+/g, "_");
  if (targetRole === "ADMIN") targetRole = "HR_ADMIN";
  if (targetRole === "SUPERADMIN") targetRole = "SUPER_ADMIN";

  user.status = "APPROVED";
  user.role = targetRole;
  user.statusUpdatedAt = nowIso;
  user.reviewedAt = nowIso;
  user.actionByUserId = auditorEmail;
  user.reviewedBy = auditorEmail;
  user.notificationUnread = true;

  saveStoredUsers(users);

  appendClientAuditLog({
    action: "Request Approved",
    targetUser: user.email,
    executedBy: auditorEmail,
    details: `Access request approved. Assigned Role: ${targetRole}`,
  });
  appendClientAuditLog({
    action: "Role Assigned",
    targetUser: user.email,
    executedBy: auditorEmail,
    details: `Role assigned: '${targetRole}' (previous: ${prevRole || "NULL"}) by ${auditorEmail}`,
  });

  return { success: true, user };
}

export function clientRejectUser(
  uid: string,
  auditorEmail: string
): { success: boolean; user?: StoredUser; error?: string } {
  const users = loadStoredUsers();
  const idx = users.findIndex(
    (u) => u.id === uid || u.uid === uid || u.email.toLowerCase() === uid.toLowerCase()
  );
  if (idx === -1) {
    return { success: false, error: "User not found" };
  }

  const user = users[idx];
  const nowIso = new Date().toISOString();

  user.status = "REJECTED";
  user.statusUpdatedAt = nowIso;
  user.reviewedAt = nowIso;
  user.actionByUserId = auditorEmail;
  user.reviewedBy = auditorEmail;
  user.notificationUnread = true;

  saveStoredUsers(users);

  appendClientAuditLog({
    action: "Request Rejected",
    targetUser: user.email,
    executedBy: auditorEmail,
    details: `Access request rejected by ${auditorEmail}`,
  });

  return { success: true, user };
}

export function clientUpdateUserRole(
  uid: string,
  role: string,
  auditorEmail: string
): { success: boolean; user?: StoredUser; error?: string } {
  const users = loadStoredUsers();
  const idx = users.findIndex(
    (u) => u.id === uid || u.uid === uid || u.email.toLowerCase() === uid.toLowerCase()
  );
  if (idx === -1) {
    return { success: false, error: "User not found" };
  }

  const user = users[idx];
  const oldRole = user.role;
  const nowIso = new Date().toISOString();

  user.role = role;
  user.statusUpdatedAt = nowIso;
  user.reviewedAt = nowIso;
  user.actionByUserId = auditorEmail;
  user.reviewedBy = auditorEmail;
  user.notificationUnread = true;

  saveStoredUsers(users);

  appendClientAuditLog({
    action: "Role Changed",
    targetUser: user.email,
    executedBy: auditorEmail,
    details: `Role updated from '${oldRole || "NULL"}' to '${role}' by ${auditorEmail}`,
  });

  return { success: true, user };
}

export function clientMarkNotificationRead(uid: string): boolean {
  const users = loadStoredUsers();
  const idx = users.findIndex(
    (u) => u.id === uid || u.uid === uid || u.email.toLowerCase() === uid.toLowerCase()
  );
  if (idx !== -1) {
    users[idx].notificationUnread = false;
    saveStoredUsers(users);
    return true;
  }
  return false;
}

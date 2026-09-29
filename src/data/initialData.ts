import {
  Employee,
  AppUser,
  ActivityLog,
  AttendanceRecord,
  PayrollRecord,
  RequestRecord,
  OnboardingCandidate,
  AuthRequestUser,
} from "../types";

/**
 * Modela Connect Master Data Stores
 */
export const INITIAL_EMPLOYEES: Employee[] = [];

export const DEMO_USERS: AppUser[] = [
  {
    uid: "USR-SUPERADMIN-01",
    email: "modelatech2026@gmail.com",
    name: "Modela Tech",
    role: "Super Admin",
    isSuperAdmin: true,
    employeeId: "MOD000",
    designation: "Executive Director & Super Admin",
    roleBadge: "Super Admin",
    status: "Approved",
  },
  {
    uid: "USR-Q94BIIQ5",
    email: "sushoovandas@gmail.com",
    name: "Sushoovan Das",
    role: "Super Admin",
    isSuperAdmin: true,
    employeeId: "MOD001",
    designation: "Executive Director & Super Admin",
    roleBadge: "Super Admin",
    status: "Approved",
  },
];

export const INITIAL_ACTIVITY_LOGS: ActivityLog[] = [
  {
    id: "LOG-INIT-001",
    timestamp: "2026-09-20T08:44:35.660Z",
    action: "Request Approved",
    targetUser: "sushoovandas@gmail.com",
    executedBy: "System Root",
    details: "Super Admin access granted to Sushoovan Das",
    userRole: "Super Admin",
    module: "Auth",
    recordId: "USR-Q94BIIQ5",
    result: "SUCCESS",
  },
  {
    id: "LOG-INIT-002",
    timestamp: "2026-09-20T08:44:35.661Z",
    action: "Role Assigned",
    targetUser: "sushoovandas@gmail.com",
    executedBy: "System Root",
    details: "Role assigned: 'Super Admin'",
    userRole: "Super Admin",
    module: "Auth",
    recordId: "USR-Q94BIIQ5",
    result: "SUCCESS",
  },
];

export const INITIAL_ATTENDANCE: AttendanceRecord[] = [];
export const INITIAL_PAYROLL: PayrollRecord[] = [];
export const INITIAL_REQUESTS: RequestRecord[] = [];
export const INITIAL_ONBOARDING: OnboardingCandidate[] = [];

export const INITIAL_AUTH_REQUESTS: AuthRequestUser[] = [
  {
    uid: "USR-Q94BIIQ5",
    name: "Sushoovan Das",
    email: "sushoovandas@gmail.com",
    status: "Approved",
    role: "Super Admin",
    requestedAt: "2026-09-20T08:44:15.000Z",
    reviewedAt: "2026-09-20T08:44:35.000Z",
    reviewedBy: "System Root",
    employeeId: "MOD001",
  },
];

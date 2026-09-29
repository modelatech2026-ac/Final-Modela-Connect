export type UserRole =
  | "Super Admin"
  | "HR Admin"
  | "HR Manager"
  | "Employee"
  | "HR"
  | "Manager"
  | "Developers"
  | "Admin"
  | "Security Officer"
  | "Guest"
  | "SUPERADMIN"
  | "ADMIN"
  | "EMPLOYEE"
  | null;

export type AuthorizationStatus =
  | "Pending"
  | "Approved"
  | "Rejected"
  | "PENDING"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "REJECTED";

export interface AuthRequestUser {
  id?: string;
  uid: string;
  name: string;
  email: string;
  avatar_url?: string;
  status: AuthorizationStatus;
  role: UserRole | string | null;
  requested_at?: string;
  requestDate?: string;
  requestedAt?: string;
  statusUpdatedAt?: string;
  reviewedAt?: string;
  actionByUserId?: string | null;
  reviewedBy?: string;
  notificationUnread?: boolean;
  employeeId?: string;
}

export type EmployeeStatus = "ONBOARDING" | "ACTIVE" | "INACTIVE" | "TERMINATED";

export interface Compensation {
  basic: number;
  allowances: number;
}

export interface EmployeeDocument {
  id: string;
  name: string;
  type: string;
  status: "VERIFIED" | "PENDING" | "REJECTED";
  uploadDate: string;
  size: string;
}

export interface Employee {
  id: string; // EMPxxx or MODxxx
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  department: string;
  designation: string;
  managerId: string;
  managerName?: string;
  status: EmployeeStatus;
  joiningDate: string;
  compensation: Compensation;
  location?: string;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  documents?: EmployeeDocument[];
}

export interface AppUser {
  id?: string;
  uid: string;
  email: string;
  name: string;
  avatar_url?: string;
  role: UserRole | string | null;
  isSuperAdmin?: boolean;
  employeeId?: string;
  designation?: string;
  roleBadge?: string;
  status?: AuthorizationStatus;
  requested_at?: string;
  requestDate?: string;
  requestedAt?: string;
  statusUpdatedAt?: string;
  reviewedAt?: string;
  actionByUserId?: string | null;
  reviewedBy?: string;
  notificationUnread?: boolean;
}

export type AuditAction =
  | "Login Attempt"
  | "New Access Request Created"
  | "Request Approved"
  | "Request Rejected"
  | "Role Assigned"
  | "Role Changed"
  | "Logout"
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "VERIFY"
  | "BULK_EMPLOYEE_PURGE"
  | "SYSTEM_INIT";

export interface BulkPurgeSummary {
  deletedEmployeesCount: number;
  deletedAttendanceCount: number;
  deletedPayrollCount: number;
  deletedRequestsCount: number;
  deletedOnboardingCount: number;
  deletedStorageFilesCount: number;
  purgedUsersCount: number;
  timestamp: string;
  purgedBy: string;
}

export type AuditModule =
  | "Employees"
  | "Attendance"
  | "Facial Verification"
  | "Payroll"
  | "Requests"
  | "Security"
  | "Settings"
  | "Auth"
  | "Onboarding"
  | "Users";

export interface ActivityLog {
  id: string;
  timestamp: string; // ISO string
  action: AuditAction | string;
  targetUser?: string;
  executedBy?: string;
  details?: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  userRole?: UserRole | string;
  module?: AuditModule | string;
  recordId?: string;
  payload?: string;
  metadata?: {
    oldVal?: any;
    newVal?: any;
    note?: string;
    device?: string;
    ipAddress?: string;
    confidence?: number;
    verificationType?: string;
    [key: string]: any;
  };
  result?: "SUCCESS" | "FAILED";
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  date: string;
  checkInTime: string;
  checkOutTime?: string;
  verificationMethod: "FACIAL_AI" | "MANUAL_OVERRIDE" | "CARD_SCAN";
  status: "PRESENT" | "LATE" | "HALF_DAY" | "ABSENT";
  confidenceScore?: number;
  overrideNote?: string;
  overrideSupervisorId?: string;
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  month: string;
  basic: number;
  allowances: number;
  deductions: number;
  netPay: number;
  status: "PROCESSED" | "PENDING" | "HOLD";
  paymentDate: string;
}

export type RequestType = "LEAVE" | "EXPENSE" | "EQUIPMENT" | "CERTIFICATION";

export interface RequestRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  type: RequestType;
  title: string;
  description: string;
  amountOrDays?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  reviewedBy?: string;
  reviewDate?: string;
}

export type RequestItem = RequestRecord;

export interface OnboardingCandidate {
  id: string;
  candidateName: string;
  role: string;
  department: string;
  status: "OFFER_EXTENDED" | "DOCUMENT_VERIFICATION" | "IT_SETUP" | "READY_TO_JOIN";
  joiningDate: string;
  progress: number;
}

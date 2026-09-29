import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  Employee,
  ActivityLog,
  AttendanceRecord,
  PayrollRecord,
  RequestRecord,
  OnboardingCandidate,
  AuditAction,
  AuditModule,
  BulkPurgeSummary,
  AuthRequestUser,
  UserRole,
} from "../types";
import {
  INITIAL_EMPLOYEES,
  INITIAL_ACTIVITY_LOGS,
  INITIAL_ATTENDANCE,
  INITIAL_PAYROLL,
  INITIAL_REQUESTS,
  INITIAL_ONBOARDING,
  INITIAL_AUTH_REQUESTS,
} from "../data/initialData";
import {
  executeBulkEmployeePurge,
  PurgeExecutionResult,
  PurgeProgressCallback,
} from "../services/firebasePurgeService";
import { batchWriteEmployeesToFirestore } from "../services/employeeDataService";
import {
  syncGoogleUserToFirestore,
  updateUserStatusInFirestore,
  appendActivityLogToFirestore,
  subscribeToAccessRequests,
} from "../services/firebaseAuthService";
import { useAuth } from "./AuthContext";
import { useToast } from "./ToastContext";
import { checkIsUserSuperAdmin, isRoleSuperAdmin } from "../lib/authUtils";

interface DataContextType {
  employees: Employee[];
  activityLogs: ActivityLog[];
  attendanceRecords: AttendanceRecord[];
  payrollRecords: PayrollRecord[];
  requests: RequestRecord[];
  onboardingCandidates: OnboardingCandidate[];
  authRequests: AuthRequestUser[];
  pendingAuthRequestsCount: number;
  isLoading: boolean;
  createEmployee: (employee: Omit<Employee, "id"> & { id?: string }) => Promise<Employee>;
  bulkCreateEmployees: (
    recordsToImport: Array<Partial<Employee> & { firstName: string; lastName: string }>
  ) => Promise<Employee[]>;
  updateEmployee: (id: string, updates: Partial<Employee>) => Promise<boolean>;
  deleteEmployee: (id: string) => Promise<boolean>;
  approveAuthRequest: (
    uid: string,
    assignedRole: UserRole | "EMPLOYEE" | "ADMIN" | "SUPERADMIN" | "HR" | "MANAGER" | "DEVELOPERS"
  ) => Promise<boolean>;
  rejectAuthRequest: (uid: string) => Promise<boolean>;
  submitGoogleAuthRequest: (
    user: Partial<AuthRequestUser> & { email: string; name: string }
  ) => Promise<AuthRequestUser>;
  logActivity: (
    action: AuditAction,
    module: AuditModule,
    recordId: string,
    metadata: Record<string, any>,
    result?: "SUCCESS" | "FAILED"
  ) => void;
  recordAttendance: (
    employeeId: string,
    method: "FACIAL_AI" | "MANUAL_OVERRIDE" | "CARD_SCAN",
    confidence?: number,
    overrideSupervisorId?: string,
    overrideNote?: string
  ) => Promise<{ success: boolean; message: string; record?: AttendanceRecord }>;
  updateRequestStatus: (id: string, status: "APPROVED" | "REJECTED") => void;
  createRequest: (request: Omit<RequestRecord, "id" | "createdAt" | "status">) => void;
  runPayrollBatch: () => Promise<number>;
  getNextEmployeeId: () => string;
  purgeAllEmployeeData: (onProgress?: PurgeProgressCallback) => Promise<PurgeExecutionResult>;
  resetAllData: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const STORAGE_KEYS = {
  EMPLOYEES: "modela_employees_v1",
  LOGS: "modela_logs_v1",
  ATTENDANCE: "modela_attendance_v1",
  PAYROLL: "modela_payroll_v1",
  REQUESTS: "modela_requests_v1",
  ONBOARDING: "modela_onboarding_v1",
  AUTH_REQUESTS: "modela_auth_requests_v1",
};

// Clear legacy HR360 cache keys to enforce clean Employee Master and updated auth
try {
  if (typeof window !== "undefined" && window.localStorage) {
    [
      "hr360_employees_v1", "hr360_employees_v2", "hr360_employees_v3",
      "hr360_attendance_v1", "hr360_attendance_v2", "hr360_attendance_v3",
      "hr360_payroll_v1", "hr360_payroll_v2", "hr360_payroll_v3",
      "hr360_requests_v1", "hr360_requests_v2", "hr360_requests_v3",
      "hr360_onboarding_v1", "hr360_onboarding_v2", "hr360_onboarding_v3",
      "hr360_auth_requests_v1", "hr360_active_user_uid"
    ].forEach((k) => localStorage.removeItem(k));
  }
} catch {
  // ignore
}

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const { success, error: toastError, info } = useToast();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Initialize state from localStorage or initial seed (empty by default)
  const [employees, setEmployees] = useState<Employee[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
      return INITIAL_EMPLOYEES;
    } catch {
      return INITIAL_EMPLOYEES;
    }
  });

  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LOGS);
      return saved ? JSON.parse(saved) : INITIAL_ACTIVITY_LOGS;
    } catch {
      return INITIAL_ACTIVITY_LOGS;
    }
  });

  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed.some((a: any) => a.employeeId?.startsWith("MTK"))) {
          return parsed;
        }
      }
      return INITIAL_ATTENDANCE;
    } catch {
      return INITIAL_ATTENDANCE;
    }
  });

  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PAYROLL);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed.some((p: any) => p.employeeId?.startsWith("MTK"))) {
          return parsed;
        }
      }
      return INITIAL_PAYROLL;
    } catch {
      return INITIAL_PAYROLL;
    }
  });

  const [requests, setRequests] = useState<RequestRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.REQUESTS);
      return saved ? JSON.parse(saved) : INITIAL_REQUESTS;
    } catch {
      return INITIAL_REQUESTS;
    }
  });

  const [onboardingCandidates, setOnboardingCandidates] = useState<OnboardingCandidate[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ONBOARDING);
      return saved ? JSON.parse(saved) : INITIAL_ONBOARDING;
    } catch {
      return INITIAL_ONBOARDING;
    }
  });

  const [authRequests, setAuthRequests] = useState<AuthRequestUser[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.AUTH_REQUESTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      return INITIAL_AUTH_REQUESTS;
    } catch {
      return INITIAL_AUTH_REQUESTS;
    }
  });

  // Load from backend /api/users and /api/audit-logs when admin session is active
  useEffect(() => {
    if (!currentUser?.email) return;

    // Check if user is Super Admin or HR Admin
    const isAdmin =
      checkIsUserSuperAdmin(currentUser) ||
      currentUser.role === "Super Admin" ||
      currentUser.role === "HR Admin" ||
      currentUser.role === "Admin" ||
      currentUser.role === "SUPERADMIN" ||
      currentUser.email === "modelatech2026@gmail.com" ||
      currentUser.email === "sushoovandas@gmail.com";

    if (!isAdmin) return;

    const token = localStorage.getItem("modela_jwt_token") || "";
    const authHeaders: Record<string, string> = {
      "x-user-email": currentUser.email,
    };
    if (token) {
      authHeaders["Authorization"] = `Bearer ${token}`;
    }

    // Fetch users
    fetch("/api/users", {
      headers: authHeaders,
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.users)) {
          setAuthRequests((prev) => {
            const merged = [...data.users];
            // Combine any local requests not yet on server
            prev.forEach((pr) => {
              if (!merged.some((m) => m.email?.toLowerCase() === pr.email?.toLowerCase())) {
                merged.push(pr);
              }
            });
            return merged;
          });
        }
      })
      .catch((err) => console.warn("Failed to load /api/users:", err));

    // Fetch audit logs
    fetch("/api/audit-logs", {
      headers: authHeaders,
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.logs)) {
          setActivityLogs((prev) => {
            const serverLogs: ActivityLog[] = data.logs.map((l: any) => ({
              id: l.id,
              timestamp: l.timestamp,
              action: l.action,
              targetUser: l.targetUser,
              executedBy: l.executedBy,
              details: l.details,
              module: "Auth",
              result: "SUCCESS" as const,
              userRole: "Admin",
            }));
            const combined = [...serverLogs];
            prev.forEach((pl) => {
              if (!combined.some((c) => c.id === pl.id)) {
                combined.push(pl);
              }
            });
            return combined;
          });
        }
      })
      .catch((err) => console.warn("Failed to load /api/audit-logs:", err));
  }, [currentUser?.email, currentUser?.role]);

  // Seed Firestore on startup if connected
  useEffect(() => {
    batchWriteEmployeesToFirestore(INITIAL_EMPLOYEES).catch(() => {
      // Non-blocking fallback
    });
  }, []);

  // Real-time synchronization of access requests across Firestore and shared database
  useEffect(() => {
    const unsubscribe = subscribeToAccessRequests((incomingRequests) => {
      if (!incomingRequests || incomingRequests.length === 0) return;
      setAuthRequests((prev) => {
        const map = new Map<string, AuthRequestUser>();
        prev.forEach((p) => {
          const key = (p.uid || p.email || "").toLowerCase();
          if (key) map.set(key, p);
        });
        incomingRequests.forEach((inc) => {
          const key = (inc.uid || inc.email || "").toLowerCase();
          if (key) {
            const existing = map.get(key);
            map.set(key, { ...existing, ...inc });
          }
        });
        return Array.from(map.values());
      });
    });

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, []);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AUTH_REQUESTS, JSON.stringify(authRequests));
  }, [authRequests]);

  const pendingAuthRequestsCount = authRequests.filter((r) => {
    const s = String(r.status || "").trim().toUpperCase();
    return s === "PENDING" || s === "PENDING_APPROVAL";
  }).length;

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(activityLogs));
  }, [activityLogs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(attendanceRecords));
  }, [attendanceRecords]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PAYROLL, JSON.stringify(payrollRecords));
  }, [payrollRecords]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(requests));
  }, [requests]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ONBOARDING, JSON.stringify(onboardingCandidates));
  }, [onboardingCandidates]);

  // Activity Logger
  const logActivity = useCallback(
    (
      action: AuditAction,
      module: AuditModule,
      recordId: string,
      metadata: Record<string, any>,
      result: "SUCCESS" | "FAILED" = "SUCCESS",
      payload?: string
    ) => {
      const newLog: ActivityLog = {
        id: "LOG-" + Math.floor(1000 + Math.random() * 9000),
        timestamp: new Date().toISOString(),
        userId: currentUser?.uid || "USR-Q94BIIQ5",
        userEmail: currentUser?.email || "sushoovandas@gmail.com",
        userName: currentUser?.name || "Sushoovan Das",
        userRole: currentUser?.role || "Super Admin",
        action,
        module,
        recordId,
        payload,
        metadata,
        result,
      };
      setActivityLogs((prev) => [newLog, ...prev]);
    },
    [currentUser]
  );

  // Auto-increment MOD EMP ID (starts at MOD001 for clean Modela Connect roster)
  const getNextEmployeeId = useCallback((): string => {
    let maxNum = 0;
    employees.forEach((e) => {
      const match = e.id.match(/^(\D*)0*(\d+)$/i);
      if (match) {
        const n = parseInt(match[2], 10);
        if (n > maxNum) maxNum = n;
      }
    });
    const nextNum = maxNum + 1;
    return `MOD${String(nextNum).padStart(3, "0")}`;
  }, [employees]);

  // Create Employee
  const createEmployee = async (
    employeeData: Omit<Employee, "id"> & { id?: string }
  ): Promise<Employee> => {
    // Security Enforcement: Standard Employee cannot create records
    if (currentUser?.role === "Employee") {
      toastError(
        "Access Denied by Security Policy",
        "Employee creation is restricted to Admin and Super Admin. Direct mutation halted."
      );
      throw new Error("Unauthorized: Standard employees cannot create employee master records.");
    }

    setIsLoading(true);
    const newId = employeeData.id?.trim() ? employeeData.id.trim() : getNextEmployeeId();
    const newEmployee: Employee = {
      ...employeeData,
      id: newId,
      department: employeeData.department || "Engineering",
      designation: employeeData.designation || "Staff",
      status: employeeData.status || "ACTIVE",
      managerId: employeeData.managerId || "MTK005",
      compensation: employeeData.compensation || { basic: 30000, allowances: 10000 },
      joiningDate: employeeData.joiningDate || new Date().toISOString().split("T")[0],
      phone: employeeData.phone || "",
      documents: employeeData.documents || [
        {
          id: `DOC-${newId}-1`,
          name: "Offer_Letter_Countersigned.pdf",
          type: "Offer",
          status: "VERIFIED",
          uploadDate: new Date().toISOString().split("T")[0],
          size: "1.2 MB",
        },
      ],
    };

    setEmployees((prev) => [newEmployee, ...prev]);
    setIsLoading(false);

    // Sync to Firestore collection 'employees'
    batchWriteEmployeesToFirestore([newEmployee]).catch(() => {});

    logActivity(
      "CREATE",
      "Employees",
      newId,
      {
        createdName: `${newEmployee.firstName} ${newEmployee.lastName}`,
        department: newEmployee.department,
        designation: newEmployee.designation,
        joiningDate: newEmployee.joiningDate,
        contact: newEmployee.phone,
      },
      "SUCCESS"
    );

    success(
      "Employee Record Created",
      `${newEmployee.firstName} ${newEmployee.lastName} registered under ${newId}.`
    );

    return newEmployee;
  };

  // Bulk Create / Import Employees
  const bulkCreateEmployees = async (
    recordsToImport: Array<Partial<Employee> & { firstName: string; lastName: string }>
  ): Promise<Employee[]> => {
    // Security Enforcement: Standard employees cannot bulk import
    if (currentUser?.role === "Employee") {
      toastError(
        "Access Denied by Security Policy",
        "Bulk import requires Admin or Super Admin privileges."
      );
      return [];
    }

    setIsLoading(true);

    let currentMax = 22;
    employees.forEach((e) => {
      const match = e.id.match(/^MTK0*(\d+)$/i);
      if (match) {
        const n = parseInt(match[1], 10);
        if (n > currentMax) currentMax = n;
      }
    });

    const createdList: Employee[] = [];
    for (const rec of recordsToImport) {
      let assignedId = rec.id?.trim();
      if (!assignedId) {
        currentMax += 1;
        assignedId = `MTK${String(currentMax).padStart(3, "0")}`;
      }

      const newEmp: Employee = {
        id: assignedId,
        firstName: rec.firstName.trim(),
        lastName: (rec.lastName || "").trim(),
        joiningDate: rec.joiningDate || new Date().toISOString().split("T")[0],
        designation: rec.designation || "Staff",
        phone: rec.phone || "",
        department: rec.department || "Engineering",
        managerId: rec.managerId || "MTK005",
        status: rec.status || "ACTIVE",
        compensation: rec.compensation || { basic: 30000, allowances: 10000 },
      };
      createdList.push(newEmp);
    }

    setEmployees((prev) => {
      const importedIds = new Set(createdList.map((c) => c.id));
      const remaining = prev.filter((e) => !importedIds.has(e.id));
      return [...createdList, ...remaining];
    });

    // Batch write to Firestore collection 'employees'
    const firestoreResult = await batchWriteEmployeesToFirestore(createdList);

    setIsLoading(false);

    logActivity(
      "CREATE",
      "Employees",
      `BULK-IMPORT-${createdList.length}`,
      {
        importedCount: createdList.length,
        firstId: createdList[0]?.id,
        lastId: createdList[createdList.length - 1]?.id,
        syncedToFirestore: firestoreResult.syncedToFirestore,
      },
      "SUCCESS"
    );

    success(
      "Bulk Import Completed",
      `Successfully imported ${createdList.length} employees into Employee Master.`
    );

    return createdList;
  };

  // Update Employee
  const updateEmployee = async (id: string, updates: Partial<Employee>): Promise<boolean> => {
    // Security Enforcement: Standard employee can ONLY update their own record
    if (currentUser?.role === "Employee" && currentUser.employeeId && currentUser.employeeId !== id) {
      toastError(
        "Security Restriction: Access Denied",
        `Security Policy RBAC: Standard employees may only update their own personal employee record (${currentUser.employeeId}). Direct mutation of ${id} is prohibited.`
      );
      return false;
    }

    setIsLoading(true);
    const existing = employees.find((e) => e.id === id);
    if (!existing) {
      setIsLoading(false);
      toastError("Update Failed", `Employee ${id} not found.`);
      return false;
    }

    setEmployees((prev) =>
      prev.map((emp) => (emp.id === id ? { ...emp, ...updates } : emp))
    );
    setIsLoading(false);

    logActivity(
      "UPDATE",
      "Employees",
      id,
      {
        oldVal: {
          status: existing.status,
          designation: existing.designation,
          department: existing.department,
        },
        newVal: updates,
      },
      "SUCCESS"
    );

    success("Profile Updated", `Changes to ${existing.firstName} ${existing.lastName} have been committed.`);
    return true;
  };

  // Delete Employee
  const deleteEmployee = async (id: string): Promise<boolean> => {
    // Security Enforcement: Standard employees cannot delete any records
    if (currentUser?.role === "Employee") {
      toastError(
        "Security Restriction: Access Denied",
        "Employee deletion requires Admin or Super Admin clearance."
      );
      return false;
    }

    const existing = employees.find((e) => e.id === id);
    if (!existing) return false;

    setEmployees((prev) => prev.filter((e) => e.id !== id));

    logActivity(
      "DELETE",
      "Employees",
      id,
      {
        deletedEmployee: `${existing.firstName} ${existing.lastName}`,
        department: existing.department,
      },
      "SUCCESS"
    );

    info("Employee Removed", `Record ${id} removed from the active directory.`);
    return true;
  };

  // Record Attendance
  const recordAttendance = async (
    employeeId: string,
    method: "FACIAL_AI" | "MANUAL_OVERRIDE" | "CARD_SCAN",
    confidence: number = 98.7,
    overrideSupervisorId?: string,
    overrideNote?: string
  ) => {
    // Security Enforcement: Standard employees can only log attendance for themselves
    if (currentUser?.role === "Employee" && currentUser.employeeId && currentUser.employeeId !== employeeId) {
      toastError(
        "Security Policy Denied",
        `Biometric check-ins must match your authenticated employee ID (${currentUser.employeeId}).`
      );
      return { success: false, message: "Standard employees can only log attendance for their own employee ID." };
    }

    const emp = employees.find((e) => e.id === employeeId);
    if (!emp) {
      return { success: false, message: "Target employee record not found." };
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const todayStr = now.toISOString().split("T")[0];

    const newRecord: AttendanceRecord = {
      id: "ATT-" + Math.floor(1000 + Math.random() * 9000),
      employeeId: emp.id,
      employeeName: `${emp.firstName} ${emp.lastName}`,
      department: emp.department,
      date: todayStr,
      checkInTime: timeStr,
      checkOutTime: "--:--",
      verificationMethod: method,
      status: "PRESENT",
      confidenceScore: method === "FACIAL_AI" ? confidence : 100,
      overrideNote,
      overrideSupervisorId,
    };

    setAttendanceRecords((prev) => [newRecord, ...prev]);

    logActivity(
      "VERIFY",
      "Facial Verification",
      newRecord.id,
      {
        employeeId: emp.id,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        method,
        confidence: method === "FACIAL_AI" ? `${confidence}%` : "Manual Override",
        supervisorId: overrideSupervisorId || "N/A",
        note: overrideNote || "Biometric sensor match verified",
      },
      "SUCCESS"
    );

    success(
      "Check-In Recorded",
      `${emp.firstName} ${emp.lastName} checked in at ${timeStr} via ${
        method === "FACIAL_AI" ? "Facial Biometrics" : "Manual Supervisor Override"
      }.`
    );

    return { success: true, message: "Attendance logged successfully.", record: newRecord };
  };

  // Update Request Status
  const updateRequestStatus = (id: string, status: "APPROVED" | "REJECTED") => {
    // Security Enforcement: Standard employee cannot approve requests
    if (currentUser?.role === "Employee") {
      toastError(
        "Security Restriction: Access Denied",
        "Only Supervisors and Administrators can approve or reject employee requests."
      );
      return;
    }

    const req = requests.find((r) => r.id === id);
    if (!req) return;

    setRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status,
              reviewedBy: currentUser?.name || "HR Admin",
              reviewDate: new Date().toISOString().split("T")[0],
            }
          : r
      )
    );

    logActivity(
      "UPDATE",
      "Requests",
      id,
      {
        requestTitle: req.title,
        employeeId: req.employeeId,
        newStatus: status,
        reviewedBy: currentUser?.name,
      },
      "SUCCESS"
    );

    if (status === "APPROVED") {
      success("Request Approved", `Request "${req.title}" marked as Approved.`);
    } else {
      info("Request Rejected", `Request "${req.title}" was declined.`);
    }
  };

  // Create Request
  const createRequest = (newReqData: Omit<RequestRecord, "id" | "createdAt" | "status">) => {
    const newId = "REQ-" + Math.floor(400 + Math.random() * 500);
    const newReq: RequestRecord = {
      ...newReqData,
      id: newId,
      createdAt: new Date().toISOString().split("T")[0],
      status: "PENDING",
    };

    setRequests((prev) => [newReq, ...prev]);

    logActivity(
      "CREATE",
      "Requests",
      newId,
      {
        title: newReq.title,
        type: newReq.type,
        employeeId: newReq.employeeId,
      },
      "SUCCESS"
    );

    success("Request Submitted", `Your ${newReq.type} request has been queued for review.`);
  };

  // Batch Run Payroll
  const runPayrollBatch = async (): Promise<number> => {
    // Security Enforcement: Standard employees blocked from payroll processing
    if (currentUser?.role === "Employee") {
      toastError(
        "Security Restriction: Access Denied",
        "Payroll batch disbursements require Administrator or Super Administrator clearance."
      );
      return 0;
    }

    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 600));

    const currentMonth = "October 2026";
    let count = 0;

    const newPayrolls: PayrollRecord[] = employees
      .filter((e) => e.status === "ACTIVE" || e.status === "ONBOARDING")
      .map((emp) => {
        count++;
        const basic = emp.compensation.basic;
        const allowances = emp.compensation.allowances;
        const deductions = Math.round((basic + allowances) * 0.18);
        const netPay = basic + allowances - deductions;

        return {
          id: `PAY-2026-10-${emp.id}`,
          employeeId: emp.id,
          employeeName: `${emp.firstName} ${emp.lastName}`,
          department: emp.department,
          month: currentMonth,
          basic,
          allowances,
          deductions,
          netPay,
          status: "PROCESSED",
          paymentDate: "2026-10-01",
        };
      });

    setPayrollRecords((prev) => [...newPayrolls, ...prev]);
    setIsLoading(false);

    logActivity(
      "CREATE",
      "Payroll",
      `BATCH-${Date.now()}`,
      {
        cycle: currentMonth,
        recordsProcessed: count,
        totalDisbursed: newPayrolls.reduce((sum, p) => sum + p.netPay, 0),
      },
      "SUCCESS"
    );

    success("Payroll Batch Executed", `Successfully computed and disbursed paystubs for ${count} employees.`);
    return count;
  };

  // Bulk Employee Purge (Strictly Super Admin)
  const purgeAllEmployeeData = async (
    onProgress?: PurgeProgressCallback
  ): Promise<PurgeExecutionResult> => {
    const isAuthorizedSuperAdmin = checkIsUserSuperAdmin(currentUser);
    if (!isAuthorizedSuperAdmin) {
      const deniedResult: PurgeExecutionResult = {
        success: false,
        summary: {
          deletedEmployeesCount: 0,
          deletedAttendanceCount: 0,
          deletedPayrollCount: 0,
          deletedRequestsCount: 0,
          deletedOnboardingCount: 0,
          deletedStorageFilesCount: 0,
          purgedUsersCount: 0,
          timestamp: new Date().toISOString(),
          purgedBy: currentUser?.name || "Unauthorized",
        },
        logs: ["ACCESS DENIED: Master Purge requires active 'Super Admin' role."],
        error: "Insufficient permissions. Only Super Admins can purge master data.",
      };
      toastError("Purge Rejected", deniedResult.error);
      return deniedResult;
    }

    setIsLoading(true);
    const result = await executeBulkEmployeePurge(currentUser!, onProgress);

    if (result.success) {
      // Synchronize in-memory React state immediately
      setEmployees([]);
      setAttendanceRecords([]);
      setPayrollRecords([]);
      setRequests([]);
      setOnboardingCandidates([]);

      // Prepend immutable audit log into state
      const auditLogItem: ActivityLog = {
        id: "LOG-" + Math.floor(1000 + Math.random() * 9000),
        timestamp: result.summary.timestamp,
        userId: currentUser.uid,
        userEmail: currentUser.email,
        userName: currentUser.name,
        userRole: "Super Admin",
        action: "BULK_EMPLOYEE_PURGE",
        module: "Employees",
        recordId: "PURGE-MASTER-" + Date.now(),
        metadata: {
          ...result.summary,
          severity: "CRITICAL_SECURITY_EVENT",
          authorizedRole: "Super Admin",
          verificationMethod: "EXPLICIT_STRING_CONFIRMATION",
        },
        result: "SUCCESS",
      };

      setActivityLogs((prev) => [auditLogItem, ...prev]);

      success(
        "Master Purge Executed",
        `Permanently erased ${result.summary.deletedEmployeesCount} employee records and ${result.summary.deletedStorageFilesCount} storage files.`
      );
    } else {
      toastError("Purge Encountered An Error", result.error || "Execution halted.");
    }

    setIsLoading(false);
    return result;
  };

  // Submit Google Identity Registration Request
  const submitGoogleAuthRequest = async (
    user: Partial<AuthRequestUser> & { email: string; name: string }
  ): Promise<AuthRequestUser> => {
    const cleanEmail = user.email.trim().toLowerCase();
    const existing = authRequests.find(
      (r) => r.email.toLowerCase() === cleanEmail
    );

    if (existing) {
      return existing;
    }

    const newRequest: AuthRequestUser = {
      uid: user.uid || "USR-GOOGLE-" + Math.random().toString(36).substring(2, 9),
      name: user.name,
      email: cleanEmail,
      status: "Pending",
      role: null,
      requestedAt: new Date().toISOString(),
    };

    setAuthRequests((prev) => [newRequest, ...prev]);

    // Synchronize to Firestore 'users' collection
    await syncGoogleUserToFirestore(newRequest).catch(() => {});

    logActivity(
      "New Access Request Created",
      "Users",
      newRequest.uid,
      {
        action: "New Access Request Created",
        targetUser: newRequest.email,
        executedBy: newRequest.email,
        status: "Pending",
        role: null,
      },
      "SUCCESS"
    );

    return newRequest;
  };

  // Super Admin / HR Admin: Approve User Request & Assign Role
  const approveAuthRequest = async (
    uid: string,
    assignedRole: UserRole | "Super Admin" | "HR Admin" | "HR Manager" | "Employee" | string
  ): Promise<boolean> => {
    const isAuthorized =
      checkIsUserSuperAdmin(currentUser) ||
      currentUser?.role === "HR Admin" ||
      currentUser?.role === "Admin" ||
      currentUser?.role === "SUPERADMIN" ||
      currentUser?.email === "modelatech2026@gmail.com" ||
      currentUser?.email === "sushoovandas@gmail.com";

    if (!isAuthorized) {
      toastError("Access Denied", "Only Super Admins or HR Admins can approve access requests.");
      return false;
    }

    const target = authRequests.find((r) => r.uid === uid || r.email.toLowerCase() === uid.toLowerCase());
    if (!target) {
      toastError("Request Not Found", `Unable to locate request with UID ${uid}.`);
      return false;
    }

    const validRoles = ["Super Admin", "HR Admin", "HR Manager", "Employee"];
    let mappedRole: UserRole = "Employee";
    const foundRole = validRoles.find(
      (r) => r.toUpperCase() === String(assignedRole).toUpperCase()
    );
    if (foundRole) {
      mappedRole = foundRole as UserRole;
    } else {
      mappedRole = (assignedRole as UserRole) || "Employee";
    }

    const reviewerName = currentUser?.name || "Sushoovan Das";
    const reviewerEmail = currentUser?.email || "sushoovandas@gmail.com";

    // 1. Update on backend API with RBAC header
    try {
      await fetch(`/api/users/${encodeURIComponent(target.uid)}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": reviewerEmail,
        },
        body: JSON.stringify({ role: mappedRole }),
      });
    } catch (err) {
      console.warn("Backend approval fetch failed:", err);
    }

    // 2. Update in Firestore users collection
    await updateUserStatusInFirestore(
      target.uid,
      "Approved",
      mappedRole,
      reviewerName
    ).catch(() => {});

    // 3. Append audit record to activityLogs Firestore collection
    await appendActivityLogToFirestore({
      action: "Request Approved",
      module: "Users",
      recordId: target.uid,
      targetUser: target.email,
      executedBy: reviewerEmail,
      details: `Access request approved for ${target.email}`,
      userEmail: reviewerEmail,
      userName: reviewerName,
      userRole: currentUser?.role || "Super Admin",
    }).catch(() => {});

    await appendActivityLogToFirestore({
      action: "Role Assigned",
      module: "Users",
      recordId: target.uid,
      targetUser: target.email,
      executedBy: reviewerEmail,
      details: `Role assigned: '${mappedRole}' for ${target.email}`,
      userEmail: reviewerEmail,
      userName: reviewerName,
      userRole: currentUser?.role || "Super Admin",
    }).catch(() => {});

    // 4. Update local auth requests state
    setAuthRequests((prev) =>
      prev.map((r) =>
        r.uid === target.uid
          ? {
              ...r,
              status: "Approved" as const,
              role: mappedRole,
              reviewedAt: new Date().toISOString(),
              reviewedBy: reviewerEmail,
            }
          : r
      )
    );

    // 5. Log to local activityLogs state
    logActivity(
      "Request Approved",
      "Users",
      target.uid,
      {
        action: "Request Approved",
        targetUser: target.email,
        executedBy: reviewerEmail,
      },
      "SUCCESS",
      `Request approved for ${target.email}`
    );

    logActivity(
      "Role Assigned",
      "Users",
      target.uid,
      {
        action: "Role Assigned",
        targetUser: target.email,
        executedBy: reviewerEmail,
        role: mappedRole,
      },
      "SUCCESS",
      `Role assigned: '${mappedRole}'`
    );

    success(
      "User Approved",
      `${target.name} (${target.email}) assigned role '${mappedRole}'. Access unlocked.`
    );

    return true;
  };

  // Super Admin / HR Admin: Reject User Request
  const rejectAuthRequest = async (uid: string): Promise<boolean> => {
    const isAuthorized =
      checkIsUserSuperAdmin(currentUser) ||
      currentUser?.role === "HR Admin" ||
      currentUser?.role === "Admin" ||
      currentUser?.role === "SUPERADMIN" ||
      currentUser?.email === "modelatech2026@gmail.com" ||
      currentUser?.email === "sushoovandas@gmail.com";

    if (!isAuthorized) {
      toastError("Access Denied", "Only Super Admins or HR Admins can reject access requests.");
      return false;
    }

    const target = authRequests.find((r) => r.uid === uid || r.email.toLowerCase() === uid.toLowerCase());
    if (!target) {
      toastError("Request Not Found", `Unable to locate request with UID ${uid}.`);
      return false;
    }

    const reviewerEmail = currentUser?.email || "sushoovandas@gmail.com";

    // 1. Update on backend API
    try {
      await fetch(`/api/users/${encodeURIComponent(target.uid)}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": reviewerEmail,
        },
      });
    } catch (err) {
      console.warn("Backend reject fetch failed:", err);
    }

    // 2. Update in Firestore users collection
    await updateUserStatusInFirestore(
      target.uid,
      "Rejected",
      undefined,
      reviewerEmail
    ).catch(() => {});

    // 3. Append audit record to activityLogs Firestore collection
    await appendActivityLogToFirestore({
      action: "Request Rejected",
      module: "Users",
      recordId: target.uid,
      targetUser: target.email,
      executedBy: reviewerEmail,
      details: `Access request rejected for ${target.email}`,
      userEmail: reviewerEmail,
      userName: currentUser?.name || "Admin",
      userRole: currentUser?.role || "Super Admin",
    }).catch(() => {});

    // 4. Update local auth requests state
    setAuthRequests((prev) =>
      prev.map((r) =>
        r.uid === target.uid
          ? {
              ...r,
              status: "Rejected" as const,
              reviewedAt: new Date().toISOString(),
              reviewedBy: reviewerEmail,
            }
          : r
      )
    );

    // 5. Log to local activityLogs state
    logActivity(
      "Request Rejected",
      "Users",
      target.uid,
      {
        action: "Request Rejected",
        targetUser: target.email,
        executedBy: reviewerEmail,
      },
      "SUCCESS",
      `Request rejected for ${target.email}`
    );

    info("User Rejected", `Access request for ${target.email} has been rejected.`);
    return true;
  };

  // Factory Seed Reset
  const resetAllData = () => {
    setEmployees(INITIAL_EMPLOYEES);
    setActivityLogs(INITIAL_ACTIVITY_LOGS);
    setAttendanceRecords(INITIAL_ATTENDANCE);
    setPayrollRecords(INITIAL_PAYROLL);
    setRequests(INITIAL_REQUESTS);
    setOnboardingCandidates(INITIAL_ONBOARDING);
    setAuthRequests(INITIAL_AUTH_REQUESTS);

    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(INITIAL_EMPLOYEES));
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(INITIAL_ACTIVITY_LOGS));
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(INITIAL_ATTENDANCE));
    localStorage.setItem(STORAGE_KEYS.PAYROLL, JSON.stringify(INITIAL_PAYROLL));
    localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(INITIAL_REQUESTS));
    localStorage.setItem(STORAGE_KEYS.ONBOARDING, JSON.stringify(INITIAL_ONBOARDING));
    localStorage.setItem(STORAGE_KEYS.AUTH_REQUESTS, JSON.stringify(INITIAL_AUTH_REQUESTS));

    logActivity(
      "UPDATE",
      "Settings",
      "FACTORY_RESET",
      { note: "Restored all collections to factory seed values" },
      "SUCCESS"
    );
  };

  return (
    <DataContext.Provider
      value={{
        employees,
        activityLogs,
        attendanceRecords,
        payrollRecords,
        requests,
        onboardingCandidates,
        authRequests,
        pendingAuthRequestsCount,
        isLoading,
        createEmployee,
        bulkCreateEmployees,
        updateEmployee,
        deleteEmployee,
        approveAuthRequest,
        rejectAuthRequest,
        submitGoogleAuthRequest,
        logActivity,
        recordAttendance,
        updateRequestStatus,
        createRequest,
        runPayrollBatch,
        getNextEmployeeId,
        purgeAllEmployeeData,
        resetAllData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
};

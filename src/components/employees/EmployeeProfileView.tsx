import React, { useState } from "react";
import {
  X,
  Edit,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building,
  User,
  FileText,
  Clock,
  CreditCard,
  Download,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { Employee } from "../../types";
import { StatusBadge } from "../ui/StatusBadge";
import { useData } from "../../context/DataContext";
import { useAuth } from "../../context/AuthContext";

interface EmployeeProfileViewProps {
  employee: Employee;
  onClose: () => void;
  onEdit: (emp: Employee) => void;
}

type TabKey = "Personal" | "Employment" | "Documents" | "Attendance History" | "Payroll" | "Requests";

export const EmployeeProfileView: React.FC<EmployeeProfileViewProps> = ({
  employee,
  onClose,
  onEdit,
}) => {
  const { currentRole } = useAuth();
  const { attendanceRecords, payrollRecords, requests } = useData();
  const [activeTab, setActiveTab] = useState<TabKey>("Personal");

  const tabs: TabKey[] = [
    "Personal",
    "Employment",
    "Documents",
    "Attendance History",
    "Payroll",
    "Requests",
  ];

  const empAttendance = attendanceRecords.filter((a) => a.employeeId === employee.id);
  const empPayroll = payrollRecords.filter((p) => p.employeeId === employee.id);
  const empRequests = requests.filter((r) => r.employeeId === employee.id);

  const canEdit = ["Super Admin", "HR Admin"].includes(currentRole);

  return (
    <div
      id="employee-profile-view-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
    >
      <div
        id="employee-profile-view-modal"
        className="w-full max-w-4xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-6 flex flex-col max-h-[90vh] transition-colors"
      >
        {/* Profile Header Dossier */}
        <div className="relative bg-gradient-to-r from-slate-900 via-slate-950 to-blue-950 text-white p-6 border-b border-blue-500/20">
          <button
            id="close-profile-btn"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-stone-300 hover:text-white rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="px-4 py-3 rounded-2xl bg-slate-900/90 text-center border border-blue-500/40 shadow-md">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">EMP ID</span>
              <span className="text-xl font-mono font-bold text-sky-400">
                {employee.id}
              </span>
            </div>

            <div className="flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-bold tracking-tight text-white">
                  {employee.firstName} {employee.lastName}
                </h1>
                <StatusBadge label={employee.status} />
              </div>
              <p className="text-slate-300 text-sm font-medium">
                {employee.designation} • <span className="text-sky-300">{employee.department}</span>
              </p>

              <div className="flex flex-wrap items-center gap-4 text-xs text-stone-300 pt-1">
                {employee.phone && (
                  <span className="flex items-center gap-1.5 font-mono">
                    <Phone className="w-3.5 h-3.5 text-stone-400" />
                    {employee.phone}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-stone-400" />
                  DOJ: {employee.joiningDate}
                </span>
                {employee.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-stone-400" />
                    {employee.location}
                  </span>
                )}
              </div>
            </div>

            {canEdit && (
              <button
                id="profile-edit-btn"
                onClick={() => {
                  onEdit(employee);
                  onClose();
                }}
                className="self-start sm:self-center inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5" />
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* Tab Selector Navigation */}
        <div className="flex items-center gap-1 px-6 border-b border-stone-200 dark:border-slate-800 bg-stone-50 dark:bg-slate-950 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab}
              id={`tab-btn-${tab.toLowerCase().replace(/\s+/g, "-")}`}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
                activeTab === tab
                  ? "border-blue-500 text-blue-900 dark:text-sky-400 bg-white dark:bg-slate-900 rounded-t-lg shadow-2xs"
                  : "border-transparent text-stone-500 dark:text-slate-400 hover:text-stone-800 dark:hover:text-slate-200 hover:bg-stone-100/60 dark:hover:bg-slate-800/60"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content Panels */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/60 dark:bg-slate-950/80">
          {/* TAB 1: PERSONAL */}
          {activeTab === "Personal" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-stone-200 dark:border-slate-800 shadow-xs space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400 flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600 dark:text-sky-400" />
                  Biographical & Contact Data
                </h3>
                <div className="divide-y divide-stone-100 dark:divide-slate-800 text-xs">
                  <div className="py-2.5 flex justify-between">
                    <span className="text-stone-500 dark:text-slate-400">Legal First Name</span>
                    <span className="font-semibold text-stone-800 dark:text-slate-100">{employee.firstName}</span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-stone-500 dark:text-slate-400">Legal Last Name</span>
                    <span className="font-semibold text-stone-800 dark:text-slate-100">{employee.lastName}</span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-stone-500 dark:text-slate-400">Date of Joining (DOJ)</span>
                    <span className="font-mono text-stone-800 dark:text-slate-200">{employee.joiningDate}</span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-stone-500 dark:text-slate-400">Phone Contact</span>
                    <span className="font-mono text-stone-800 dark:text-slate-200">{employee.phone || "Not recorded"}</span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-stone-500 dark:text-slate-400">Workstation / Location</span>
                    <span className="font-semibold text-stone-800 dark:text-slate-100">{employee.location || "San Francisco HQ"}</span>
                  </div>
                </div>
              </div>

              <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-stone-200 dark:border-slate-800 shadow-xs space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-sky-400" />
                  Emergency Contact Protocol
                </h3>
                {employee.emergencyContact ? (
                  <div className="divide-y divide-stone-100 dark:divide-slate-800 text-xs">
                    <div className="py-2.5 flex justify-between">
                      <span className="text-stone-500 dark:text-slate-400">Contact Name</span>
                      <span className="font-semibold text-stone-800 dark:text-slate-100">{employee.emergencyContact.name}</span>
                    </div>
                    <div className="py-2.5 flex justify-between">
                      <span className="text-stone-500 dark:text-slate-400">Relationship</span>
                      <span className="font-semibold text-stone-800 dark:text-slate-100">{employee.emergencyContact.relationship}</span>
                    </div>
                    <div className="py-2.5 flex justify-between">
                      <span className="text-stone-500 dark:text-slate-400">Emergency Phone</span>
                      <span className="font-mono font-semibold text-blue-700 dark:text-sky-400">{employee.emergencyContact.phone}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-stone-500 dark:text-slate-400 italic">No emergency contact recorded on file.</p>
                )}

                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200/80 dark:border-amber-800/40 text-[11px] text-amber-800 dark:text-amber-300 flex items-center gap-2 mt-4">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <span>Physical access card assigned and active in facility perimeter security.</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: EMPLOYMENT */}
          {activeTab === "Employment" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-stone-200 dark:border-slate-800 shadow-xs space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400 flex items-center gap-2">
                  <Building className="w-4 h-4 text-blue-600 dark:text-sky-400" />
                  Organizational Hierarchy
                </h3>
                <div className="divide-y divide-stone-100 dark:divide-slate-800 text-xs">
                  <div className="py-2.5 flex justify-between">
                    <span className="text-stone-500 dark:text-slate-400">Department</span>
                    <span className="font-semibold text-stone-800 dark:text-slate-100">{employee.department}</span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-stone-500 dark:text-slate-400">Designation</span>
                    <span className="font-semibold text-stone-800 dark:text-slate-100">{employee.designation}</span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-stone-500 dark:text-slate-400">Direct Manager</span>
                    <span className="font-semibold text-stone-800 dark:text-slate-100">
                      {employee.managerName || "Executive"} ({employee.managerId})
                    </span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-stone-500 dark:text-slate-400">Tenure Commencement</span>
                    <span className="font-mono text-stone-800 dark:text-slate-200">{employee.joiningDate}</span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-stone-500 dark:text-slate-400">Identity Lifecycle</span>
                    <StatusBadge label={employee.status} size="sm" />
                  </div>
                </div>
              </div>

              <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-stone-200 dark:border-slate-800 shadow-xs space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600 dark:text-sky-400" />
                  Work Schedule & Policies
                </h3>
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-stone-50 dark:bg-slate-800/60 rounded-xl border border-stone-200 dark:border-slate-700">
                    <div className="font-semibold text-stone-900 dark:text-slate-100">Standard Shift: General Day</div>
                    <div className="text-stone-500 dark:text-slate-400 text-[11px] mt-0.5">
                      09:30 AM - 06:45 PM • Mon - Sat
                    </div>
                  </div>
                  <div className="p-3 bg-stone-50 dark:bg-slate-800/60 rounded-xl border border-stone-200 dark:border-slate-700">
                    <div className="font-semibold text-stone-900 dark:text-slate-100">Biometric Facial Verification Station</div>
                    <div className="text-stone-500 dark:text-slate-400 text-[11px] mt-0.5">
                      Enrolled in Terminal-FrontGate-01 • AI Threshold: 85%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DOCUMENTS */}
          {activeTab === "Documents" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400">
                  Verified Identity & Compliance Artifacts
                </h3>
                <button
                  id="upload-doc-stub-btn"
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs cursor-pointer"
                >
                  Upload New Document
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {(employee.documents || []).length === 0 ? (
                  <div className="col-span-2 p-8 bg-white dark:bg-slate-900 rounded-xl border border-stone-200 dark:border-slate-800 text-center text-xs text-stone-500 dark:text-slate-400">
                    No documents uploaded for this identity yet.
                  </div>
                ) : (
                  (employee.documents || []).map((doc) => (
                    <div
                      key={doc.id}
                      className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-stone-200 dark:border-slate-800 shadow-xs flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/40 flex items-center justify-center text-blue-700 dark:text-sky-400">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-stone-900 dark:text-slate-100 truncate max-w-[200px]">
                            {doc.name}
                          </div>
                          <div className="text-[11px] text-stone-500 dark:text-slate-400">
                            {doc.type} • {doc.size}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge label={doc.status} size="sm" />
                        <button
                          title="Download Document"
                          className="p-1.5 text-stone-400 hover:text-stone-800 dark:hover:text-slate-200 rounded hover:bg-stone-100 dark:hover:bg-slate-800"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: ATTENDANCE HISTORY */}
          {activeTab === "Attendance History" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400">
                  Biometric Facial & Check-in Ledger
                </h3>
                <span className="text-xs text-stone-500 dark:text-slate-400 font-medium">
                  {empAttendance.length} records logged
                </span>
              </div>

              {empAttendance.length === 0 ? (
                <div className="p-8 bg-white dark:bg-slate-900 rounded-xl border border-stone-200 dark:border-slate-800 text-center text-xs text-stone-500 dark:text-slate-400">
                  No attendance logs found for this employee yet. Use the Facial Verification station to check in.
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-stone-200 dark:border-slate-800 overflow-hidden shadow-xs divide-y divide-stone-100 dark:divide-slate-800">
                  {empAttendance.map((rec) => (
                    <div key={rec.id} className="p-3.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-sky-400 border border-blue-200 dark:border-blue-800/40">
                          <Clock className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-stone-900 dark:text-slate-100">{rec.date}</div>
                          <div className="text-[11px] text-stone-500 dark:text-slate-400">
                            Check In: {rec.checkInTime} • Out: {rec.checkOutTime}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-300 border border-stone-200 dark:border-slate-700">
                          {rec.verificationMethod}
                        </span>
                        <StatusBadge label={rec.status} size="sm" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: PAYROLL */}
          {activeTab === "Payroll" && (
            <div className="space-y-4">
              <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-stone-200 dark:border-slate-800 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <div className="text-xs text-stone-500 dark:text-slate-400">Monthly Base Salary</div>
                  <div className="text-lg font-bold text-stone-900 dark:text-slate-100 mt-0.5">
                    ${employee.compensation.basic.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-stone-500 dark:text-slate-400">Monthly Allowances</div>
                  <div className="text-lg font-bold text-stone-900 dark:text-slate-100 mt-0.5">
                    ${employee.compensation.allowances.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-stone-500 dark:text-slate-400">Total Monthly Cost to Company</div>
                  <div className="text-lg font-bold text-blue-700 dark:text-sky-400 mt-0.5">
                    ${(employee.compensation.basic + employee.compensation.allowances).toLocaleString()}
                  </div>
                </div>
              </div>

              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400 pt-2">
                Processed Pay Stubs
              </h4>
              {empPayroll.length === 0 ? (
                <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-stone-200 dark:border-slate-800 text-center text-xs text-stone-500 dark:text-slate-400">
                  No previous disbursement cycles recorded for this identity.
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-stone-200 dark:border-slate-800 overflow-hidden divide-y divide-stone-100 dark:divide-slate-800">
                  {empPayroll.map((pay) => (
                    <div key={pay.id} className="p-3.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <CreditCard className="w-4 h-4 text-blue-600 dark:text-sky-400" />
                        <div>
                          <div className="font-semibold text-stone-900 dark:text-slate-100">{pay.month}</div>
                          <div className="text-[11px] text-stone-500 dark:text-slate-400">Disbursed on {pay.paymentDate}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-bold text-stone-900 dark:text-slate-100">${pay.netPay.toLocaleString()}</div>
                          <div className="text-[10px] text-stone-500 dark:text-slate-400">Net after tax deductions</div>
                        </div>
                        <StatusBadge label={pay.status} size="sm" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: REQUESTS */}
          {activeTab === "Requests" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400">
                  Leave & Resource Claim History
                </h3>
              </div>

              {empRequests.length === 0 ? (
                <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-stone-200 dark:border-slate-800 text-center text-xs text-stone-500 dark:text-slate-400">
                  No active requests or claims currently submitted by this employee.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {empRequests.map((req) => (
                    <div
                      key={req.id}
                      className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-stone-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-stone-900 dark:text-slate-100">{req.title}</span>
                          <span className="text-[10px] uppercase font-bold text-stone-600 dark:text-slate-300 px-1.5 py-0.5 rounded bg-stone-100 dark:bg-slate-800 border border-stone-200 dark:border-slate-700">
                            {req.type}
                          </span>
                        </div>
                        <p className="text-stone-600 dark:text-slate-300 text-xs mt-1">{req.description}</p>
                        <div className="text-stone-400 dark:text-slate-500 text-[11px] mt-1">
                          Submitted on {req.createdAt} • Value/Duration: {req.amountOrDays || "N/A"}
                        </div>
                      </div>
                      <div className="self-start sm:self-center">
                        <StatusBadge label={req.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-white dark:bg-slate-950 border-t border-stone-200 dark:border-slate-800 flex justify-end">
          <button
            id="close-profile-bottom-btn"
            onClick={onClose}
            className="px-5 py-2 bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 text-stone-800 dark:text-slate-200 text-xs font-semibold rounded-xl border border-stone-200 dark:border-slate-700 transition-colors cursor-pointer"
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
};

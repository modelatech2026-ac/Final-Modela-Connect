import React, { useState, useMemo } from "react";
import {
  CreditCard,
  DollarSign,
  Download,
  CheckCircle2,
  Calendar,
  Sparkles,
  FileText,
  AlertCircle,
  Play,
  ArrowUpRight,
  ShieldCheck,
  Building,
  User,
} from "lucide-react";
import { useData } from "../../context/DataContext";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { StatusBadge } from "../ui/StatusBadge";
import { AccessRestricted } from "../ui/AccessRestricted";
import { PayrollRecord } from "../../types";

export const PayrollModule: React.FC = () => {
  const { currentRole, currentUser } = useAuth();
  const { employees, logActivity } = useData();
  const { success } = useToast();

  const [selectedMonth, setSelectedMonth] = useState("2026-03");
  const [isProcessing, setIsProcessing] = useState(false);
  const [inspectedStub, setInspectedStub] = useState<PayrollRecord | null>(null);

  // Role check: Employee (Self-Service My Payslips), Admin & Super Admin (Company-wide Ledger)
  const isEmployee = currentRole === "Employee";
  const isAdminOrSuper = ["Super Admin", "Admin", "HR Admin"].includes(currentRole);

  // Current employee record for Employee Persona self-service
  const myEmployeeRecord = useMemo(() => {
    if (currentUser?.employeeId) {
      const found = employees.find((e) => e.id === currentUser.employeeId);
      if (found) return found;
    }
    return employees && employees.length > 0 ? employees[0] : null;
  }, [employees, currentUser]);

  const totalMonthlyGross = employees.reduce(
    (sum, emp) => sum + ((emp?.compensation?.basic || 0) + (emp?.compensation?.allowances || 0)),
    0
  );
  const totalTaxWithholding = Math.round(totalMonthlyGross * 0.18);
  const totalNetPay = totalMonthlyGross - totalTaxWithholding;

  const handleRunPayrollBatch = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      logActivity(
        "CREATE",
        "Payroll",
        `BATCH-PAY-${selectedMonth}`,
        {
          cycle: selectedMonth,
          totalEmployees: employees.length,
          totalGross: `$${totalMonthlyGross.toLocaleString()}`,
          totalDisbursed: `$${totalNetPay.toLocaleString()}`,
          status: "COMPLETED",
        },
        "SUCCESS"
      );
      success(
        "Payroll Disbursement Completed",
        `Disbursed $${totalNetPay.toLocaleString()} across ${employees.length} active employee bank accounts.`
      );
    }, 1200);
  };

  // If unauthorized role
  if (!isEmployee && !isAdminOrSuper) {
    return (
      <AccessRestricted
        allowedRoles={["Employee", "HR Admin", "Super Admin"]}
        requiredRoles={["Employee", "HR Admin", "Super Admin"]}
        moduleName="Payroll & Compensation Portal"
        description="Payroll and compensation disbursement data requires verified Employee self-service or HR Administrator clearance."
      />
    );
  }

  // -------------------------------------------------------------
  // Persona View: Employee (My Payslips Self-Service)
  // -------------------------------------------------------------
  if (isEmployee) {
    const base = myEmployeeRecord?.compensation?.basic || 35000;
    const allow = myEmployeeRecord?.compensation?.allowances || 10000;
    const gross = base + allow;
    const deductions = Math.round(gross * 0.18);
    const net = gross - deductions;

    const previousCycles = [
      { month: "March 2026", code: "2026-03", net, date: "2026-03-31", status: "PAID" },
      { month: "February 2026", code: "2026-02", net, date: "2026-02-28", status: "PAID" },
      { month: "January 2026", code: "2026-01", net, date: "2026-01-31", status: "PAID" },
    ];

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                My Payslips & Compensation
              </h1>
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                Self-Service Portal
              </span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
              Personal earnings statements, tax withholdings, and verifiable payment vouchers.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs bg-white dark:bg-[#0B132B] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-blue-500" />
            <span>Direct Deposit: <strong>HDFC Bank (•••• 4092)</strong></span>
          </div>
        </div>

        {/* Personal Breakdown Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 bg-white dark:bg-[#0B132B] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Gross Monthly Entitlement
            </span>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-2">
              ${gross.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Base: ${base.toLocaleString()} • Allowances: ${allow.toLocaleString()}
            </div>
          </div>

          <div className="p-5 bg-white dark:bg-[#0B132B] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Statutory Withholding (18%)
            </span>
            <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-2">
              -${deductions.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              PF, ESI, & Professional Tax Escrow
            </div>
          </div>

          <div className="p-5 bg-white dark:bg-[#0B132B] rounded-2xl border border-blue-500/40 dark:border-blue-500/30 bg-blue-50/30 dark:bg-blue-950/20 shadow-2xs">
            <span className="text-xs font-semibold text-blue-800 dark:text-blue-300">
              Net Credited to Bank Account
            </span>
            <div className="text-2xl font-extrabold text-blue-900 dark:text-sky-300 mt-2">
              ${net.toLocaleString()}
            </div>
            <div className="text-[11px] text-blue-600 dark:text-sky-400 font-medium mt-1">
              Automated ACH Direct Credit Verified
            </div>
          </div>
        </div>

        {/* My Payslips History Table */}
        <div className="bg-white dark:bg-[#0B132B] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              My Historical Payslip Statements
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Employee ID: {myEmployeeRecord.id}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-[#101D42]/40 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Pay Period</th>
                  <th className="py-3 px-4">Disbursement Date</th>
                  <th className="py-3 px-4">Gross Earnings</th>
                  <th className="py-3 px-4">Deductions</th>
                  <th className="py-3 px-4">Net Deposited</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                {previousCycles.map((cycle) => (
                  <tr key={cycle.code} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3.5 px-4 font-bold">{cycle.month}</td>
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-mono">{cycle.date}</td>
                    <td className="py-3.5 px-4 font-mono">${gross.toLocaleString()}</td>
                    <td className="py-3.5 px-4 font-mono text-rose-600 dark:text-rose-400">-${deductions.toLocaleString()}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-600 dark:text-sky-400">
                      ${cycle.net.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge label={cycle.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => {
                          setInspectedStub({
                            id: `PAY-${myEmployeeRecord.id}-${cycle.code}`,
                            employeeId: myEmployeeRecord.id,
                            employeeName: `${myEmployeeRecord.firstName} ${myEmployeeRecord.lastName}`,
                            month: cycle.code,
                            basicSalary: base,
                            allowances: allow,
                            deductions: deductions,
                            netPay: net,
                            paymentDate: cycle.date,
                            status: "PAID",
                          });
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-blue-900 dark:text-sky-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-xl transition-colors cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        View Payslip
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pay Slip Inspection Modal */}
        {inspectedStub && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="w-full max-w-md bg-white dark:bg-[#0B132B] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">Digital Pay Slip</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{inspectedStub.month} Disbursement Cycle</p>
                </div>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {inspectedStub.id}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Employee Name:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{inspectedStub.employeeName}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Employee ID:</span>
                  <span className="font-mono text-slate-900 dark:text-slate-100">{inspectedStub.employeeId}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Base Salary:</span>
                  <span className="font-mono">${inspectedStub.basicSalary.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Housing & Tech Allowances:</span>
                  <span className="font-mono">${inspectedStub.allowances.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Statutory Deductions (18%):</span>
                  <span className="font-mono text-rose-600 dark:text-rose-400">-${inspectedStub.deductions.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-900 dark:text-slate-100 font-bold pt-2 border-t border-slate-200 dark:border-slate-800 text-sm">
                  <span>Net Credited:</span>
                  <span className="text-blue-600 dark:text-sky-400">${inspectedStub.netPay.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => setInspectedStub(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    success("Download Complete", "Official payslip PDF generated and saved.");
                    setInspectedStub(null);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 text-white dark:text-slate-950 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download PDF
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // Persona View: HR Admin & Super Admin (Company-Wide Ledger)
  // -------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Payroll & Compensation Ledger
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
              Tax Compliant (FY 2026)
            </span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
            Synchronized with Employee Master salary structures, attendance deductions, and statutory withholdings.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            id="select-payroll-cycle"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 text-xs bg-white dark:bg-[#0B132B] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            <option value="2026-03">Cycle: March 2026</option>
            <option value="2026-02">Cycle: February 2026</option>
            <option value="2026-01">Cycle: January 2026</option>
          </select>

          <button
            id="run-batch-payroll-btn"
            onClick={handleRunPayrollBatch}
            disabled={isProcessing}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition-all disabled:opacity-50 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            {isProcessing ? "Executing ACH Transfer..." : "Run Batch Disbursement"}
          </button>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white dark:bg-[#0B132B] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Gross Payroll Obligation</span>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-2">
            ${totalMonthlyGross.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Across {employees.length} active positions</div>
        </div>

        <div className="p-5 bg-white dark:bg-[#0B132B] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Statutory Tax Withholding (18%)</span>
          <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-2">
            -${totalTaxWithholding.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Escrowed for Federal & State taxes</div>
        </div>

        <div className="p-5 bg-white dark:bg-[#0B132B] rounded-2xl border border-blue-500/40 dark:border-blue-500/30 bg-blue-50/20 dark:bg-blue-950/20 shadow-2xs">
          <span className="text-xs font-semibold text-blue-800 dark:text-blue-300">Net Disbursed Compensation</span>
          <div className="text-2xl font-extrabold text-blue-900 dark:text-sky-300 mt-2">
            ${totalNetPay.toLocaleString()}
          </div>
          <div className="text-[11px] text-blue-600 dark:text-sky-400 font-medium mt-1">Ready for automated direct deposit</div>
        </div>
      </div>

      {/* Pay Stubs Table */}
      <div className="bg-white dark:bg-[#0B132B] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Individual Employee Disbursement Schedules
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">Cycle: {selectedMonth}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-[#101D42]/40 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">EMP ID</th>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Base Salary</th>
                <th className="py-3 px-4">Allowances</th>
                <th className="py-3 px-4">Deductions</th>
                <th className="py-3 px-4">Net Payout</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Pay Slip</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
              {employees.map((emp) => {
                const base = emp.compensation.basic;
                const allow = emp.compensation.allowances;
                const deductions = Math.round((base + allow) * 0.18);
                const net = base + allow - deductions;

                return (
                  <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">{emp.id}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                      {emp.firstName} {emp.lastName}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{emp.department}</td>
                    <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">${base.toLocaleString()}</td>
                    <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">${allow.toLocaleString()}</td>
                    <td className="py-3 px-4 font-mono text-rose-600 dark:text-rose-400">-${deductions.toLocaleString()}</td>
                    <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-sky-400">
                      ${net.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge label="PAID" size="sm" />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setInspectedStub({
                            id: `PAY-${emp.id}-${selectedMonth}`,
                            employeeId: emp.id,
                            employeeName: `${emp.firstName} ${emp.lastName}`,
                            month: selectedMonth,
                            basicSalary: base,
                            allowances: allow,
                            deductions: deductions,
                            netPay: net,
                            paymentDate: "2026-03-31",
                            status: "PAID",
                          });
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-blue-600 dark:text-sky-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded-lg cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pay Slip Modal */}
      {inspectedStub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-[#0B132B] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">Digital Pay Slip</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{inspectedStub.month} Disbursement Cycle</p>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {inspectedStub.id}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Employee Name:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{inspectedStub.employeeName}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Employee ID:</span>
                <span className="font-mono text-slate-900 dark:text-slate-100">{inspectedStub.employeeId}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Base Salary:</span>
                <span className="font-mono">${inspectedStub.basicSalary.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Housing & Tech Allowances:</span>
                <span className="font-mono">${inspectedStub.allowances.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Statutory Deductions (18%):</span>
                <span className="font-mono text-rose-600 dark:text-rose-400">-${inspectedStub.deductions.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-900 dark:text-slate-100 font-bold pt-2 border-t border-slate-200 dark:border-slate-800 text-sm">
                <span>Net Credited:</span>
                <span className="text-blue-600 dark:text-sky-400">${inspectedStub.netPay.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setInspectedStub(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  success("Download Complete", "Official payslip PDF generated and saved.");
                  setInspectedStub(null);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 text-white dark:text-slate-950 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

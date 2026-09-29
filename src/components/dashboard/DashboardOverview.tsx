import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  CalendarCheck,
  CreditCard,
  FileCheck2,
  ScanFace,
  UserPlus,
  ArrowUpRight,
  TrendingUp,
  ShieldCheck,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Lock,
  UserCheck,
  FileText,
  Building,
  ArrowRight,
  KeyRound,
} from "lucide-react";
import { useData } from "../../context/DataContext";
import { useAuth } from "../../context/AuthContext";
import { StatusBadge } from "../ui/StatusBadge";

export const DashboardOverview: React.FC = () => {
  const { employees, attendanceRecords, requests, payrollRecords, activityLogs } = useData();
  const { currentUser, currentRole } = useAuth();
  const navigate = useNavigate();

  const isEmployee = currentRole === "Employee";

  // System-wide metrics for Admin / Super Admin
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter((e) => e.status === "ACTIVE").length;
  const pendingRequests = requests.filter((r) => r.status === "PENDING").length;

  const totalMonthlyPayroll = employees.reduce(
    (acc, cur) => acc + (cur.compensation.basic + cur.compensation.allowances),
    0
  );

  const recentLogs = activityLogs.slice(0, 5);

  // Personal metrics for standard Employee self-service
  const myEmployeeId = currentUser?.employeeId || "MTK020";
  const myEmployeeRecord =
    (currentUser?.employeeId ? employees.find((e) => e.id === currentUser.employeeId) : null) ||
    (employees.length > 0 ? employees[0] : null);
  const myAttendance = attendanceRecords.filter((a) => a.employeeId === myEmployeeId);
  const myTodayAttendance = attendanceRecords.find(
    (a) => a.employeeId === myEmployeeId && a.date === new Date().toISOString().split("T")[0]
  );
  const myRequests = requests.filter((r) => r.employeeId === myEmployeeId);
  const myPendingRequests = myRequests.filter((r) => r.status === "PENDING").length;

  const myGrossPay =
    (myEmployeeRecord?.compensation?.basic || 35000) +
    (myEmployeeRecord?.compensation?.allowances || 10000);
  const myNetPay = Math.round(myGrossPay * 0.82);

  // ==========================================
  // EMPLOYEE SELF-SERVICE VIEW (Strict User UI Policy)
  // ==========================================
  if (isEmployee) {
    return (
      <div className="space-y-6">
        {/* Employee Self-Service Banner */}
        <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-[#0B132B] via-[#101D42] to-[#080E1E] text-white shadow-xl border border-blue-500/30">
          <div className="absolute -right-16 -bottom-16 w-80 h-80 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
          <div className="absolute -left-16 -top-16 w-80 h-80 rounded-full bg-sky-400/15 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-sky-400/30 text-xs font-semibold text-sky-300">
                <UserCheck className="w-3.5 h-3.5" />
                Modela Connect Self-Service
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Welcome back, {(currentUser?.name || "User").split(" (")[0]}
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                Department: <span className="font-semibold text-white">{myEmployeeRecord?.department || "Operations"}</span> •{" "}
                Workplace Status: <span className="text-emerald-400 font-medium">Synchronized</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                id="employee-facial-checkin-btn"
                onClick={() => navigate("/facial-verification")}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <ScanFace className="w-4 h-4" />
                Facial Gate Check-In
              </button>
              <button
                id="employee-view-requests-btn"
                onClick={() => navigate("/requests")}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl backdrop-blur-md border border-white/20 transition-colors cursor-pointer"
              >
                <FileCheck2 className="w-4 h-4" />
                Submit Request
              </button>
            </div>
          </div>
        </div>

        {/* Self-Service KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Today's Attendance Status */}
          <div
            onClick={() => navigate("/attendance")}
            className="p-5 bg-white dark:bg-[#0B132B] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:border-blue-500/60 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Today's Gate Status
              </span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <CalendarCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
                {myTodayAttendance ? "PRESENT" : "CHECK-IN DUE"}
              </span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-blue-500" />
              {myTodayAttendance ? `Logged at ${myTodayAttendance.checkInTime}` : "Optical kiosk online"}
            </div>
          </div>

          {/* Card 2: Personal Leave & Expense Requests */}
          <div
            onClick={() => navigate("/requests")}
            className="p-5 bg-white dark:bg-[#0B132B] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:border-amber-400 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                My Requests Status
              </span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <FileCheck2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                {myPendingRequests}
              </span>
              <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">Pending Review</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
              {myRequests.length} total requests filed
            </div>
          </div>

          {/* Card 3: My Monthly Pay */}
          <div className="p-5 bg-white dark:bg-[#0B132B] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                My Estimated Net Pay
              </span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-800 dark:text-blue-200 flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                ${myNetPay.toLocaleString()}
              </span>
              <span className="text-xs text-slate-400">USD/mo</span>
            </div>
            <div className="mt-2 text-[11px] text-blue-600 dark:text-sky-400 flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3 h-3" />
              Direct deposit active
            </div>
          </div>

          {/* Card 4: Standard Shift Schedule (No role or supervisor info) */}
          <div className="p-5 bg-white dark:bg-[#0B132B] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Working Schedule
              </span>
              <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
                <Building className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                General Shift
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                09:30 AM - 06:45 PM • Mon - Fri
              </p>
            </div>
            <div className="mt-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              Flexible check-in window
            </div>
          </div>
        </div>

        {/* Self-Service Action Center */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: My Recent Requests & Submissions */}
          <div className="lg:col-span-8 p-6 bg-white dark:bg-[#0B132B] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  My Active Requests & Filings
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Track leaves, expense claims, and workplace requests
                </p>
              </div>
              <button
                id="dashboard-new-request-btn"
                onClick={() => navigate("/requests")}
                className="text-xs font-bold text-blue-600 dark:text-sky-400 hover:text-blue-700 dark:hover:text-sky-300 flex items-center gap-1 cursor-pointer"
              >
                <span>New Request</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {myRequests.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                No active requests submitted yet. Click "New Request" to create a leave or expense filing.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 space-y-3 pt-1">
                {myRequests.slice(0, 4).map((r) => (
                  <div key={r.id} className="pt-3 first:pt-0 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                          {r.title}
                        </span>
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {r.type}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {r.description || r.amountOrDays} • Submitted {r.createdAt}
                      </p>
                    </div>
                    <StatusBadge label={r.status} size="sm" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Quick Links */}
          <div className="lg:col-span-4 p-6 bg-white dark:bg-[#0B132B] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Self-Service Hub
            </h2>

            <div className="space-y-2.5">
              <button
                onClick={() => navigate("/attendance")}
                className="w-full p-3 text-left rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-slate-800 transition-colors flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <CalendarCheck className="w-4 h-4 text-blue-500" />
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Personal Attendance</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                onClick={() => navigate("/facial-verification")}
                className="w-full p-3 text-left rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-slate-800 transition-colors flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <ScanFace className="w-4 h-4 text-blue-500" />
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Biometric Check-In</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                onClick={() => navigate("/requests")}
                className="w-full p-3 text-left rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-slate-800 transition-colors flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <FileCheck2 className="w-4 h-4 text-blue-500" />
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">File Leave or Expense</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                onClick={() => navigate("/settings")}
                className="w-full p-3 text-left rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-slate-800 transition-colors flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <UserCheck className="w-4 h-4 text-blue-500" />
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Personal Preferences</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // ADMIN & SUPER ADMIN VIEW (Full Controls)
  // ==========================================
  return (
    <div className="space-y-6">
      {/* Welcome Banner with Warm Enterprise Gradient */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-[#0B132B] via-[#101D42] to-[#080E1E] text-white shadow-xl border border-blue-500/30">
        <div className="absolute -right-16 -bottom-16 w-80 h-80 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -top-16 w-80 h-80 rounded-full bg-sky-400/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-sky-400/30 text-xs font-semibold text-sky-300">
              <Sparkles className="w-3.5 h-3.5" />
              Modela Connect Workforce Ecosystem
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Welcome back, {(currentUser?.name || "User").split(" (")[0]}
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Operating under <span className="text-sky-300 font-semibold">{currentRole}</span> clearance.
              All employee records, facial verification gates, and payroll disbursements are synchronized.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              id="dashboard-facial-checkin-btn"
              onClick={() => navigate("/facial-verification")}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <ScanFace className="w-4 h-4" />
              Facial Gate Check-In
            </button>
            <button
              id="dashboard-view-employees-btn"
              onClick={() => navigate("/employees")}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl backdrop-blur-md border border-white/20 transition-colors cursor-pointer"
            >
              <Users className="w-4 h-4" />
              Employee Master
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Active Staff */}
        <div
          onClick={() => navigate("/employees")}
          className="p-5 bg-white dark:bg-[#0B132B] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:border-blue-500/60 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Active Workforce
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
              {activeEmployees}
            </span>
            <span className="text-xs text-slate-400">/ {totalEmployees} Total</span>
          </div>
          <div className="mt-2 text-[11px] text-blue-600 dark:text-sky-400 flex items-center gap-1 font-medium">
            <TrendingUp className="w-3 h-3" />
            100% Identity Synchronization
          </div>
        </div>

        {/* KPI 2: Today's Attendance */}
        <div
          onClick={() => navigate("/attendance")}
          className="p-5 bg-white dark:bg-[#0B132B] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:border-blue-500/60 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Today's Check-ins
            </span>
            <div className="w-9 h-9 rounded-xl bg-sky-400/20 text-blue-900 dark:text-sky-300 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
              {attendanceRecords.length}
            </span>
            <span className="text-xs text-slate-400">Present</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium">
            <Clock className="w-3 h-3 text-blue-500" />
            Biometric Gate Online
          </div>
        </div>

        {/* KPI 3: Pending Requests */}
        <div
          onClick={() => navigate("/requests")}
          className="p-5 bg-white dark:bg-[#0B132B] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:border-amber-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Pending Requests
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
              {pendingRequests}
            </span>
            <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">Requires Action</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            Leaves & expense reimbursements
          </div>
        </div>

        {/* KPI 4: Monthly Payroll Cost */}
        <div
          onClick={() => navigate("/payroll")}
          className="p-5 bg-white dark:bg-[#0B132B] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:border-blue-500/60 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Monthly Payroll Run
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-800 dark:text-blue-200 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
              ${(totalMonthlyPayroll / 1000).toFixed(1)}k
            </span>
            <span className="text-xs text-slate-400">USD/mo</span>
          </div>
          <div className="mt-2 text-[11px] text-blue-600 dark:text-sky-400 flex items-center gap-1 font-medium">
            <CheckCircle2 className="w-3 h-3" />
            Ledger balanced
          </div>
        </div>
      </div>

      {/* Mid Section: Quick Functional Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Department Allocation & Quick Actions */}
        <div className="lg:col-span-7 space-y-6">
          {/* Department Breakdown Visual Card */}
          <div className="p-6 bg-white dark:bg-[#0B132B] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Workforce Distribution by Department
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">15 Staff</span>
            </div>

            <div className="space-y-3 pt-1">
              {[
                { dept: "Engineering", count: 7, pct: 47, color: "bg-blue-600" },
                { dept: "Human Resources", count: 3, pct: 20, color: "bg-sky-400" },
                { dept: "Security & Operations", count: 2, pct: 13, color: "bg-slate-800 dark:bg-slate-600" },
                { dept: "Product & Marketing", count: 3, pct: 20, color: "bg-amber-500" },
              ].map((item) => (
                <div key={item.dept} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{item.dept}</span>
                    <span className="text-slate-500 dark:text-slate-400">{item.count} staff ({item.pct}%)</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full transition-all duration-500`}
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Action Buttons Bento */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <button
              id="admin-add-employee-quick-btn"
              onClick={() => navigate("/employees")}
              className="p-4 bg-white dark:bg-[#0B132B] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:border-blue-500 hover:bg-blue-50/20 dark:hover:bg-blue-950/20 text-left transition-all cursor-pointer"
            >
              <UserPlus className="w-5 h-5 text-blue-500 mb-2" />
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Add Employee</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">Multi-step wizard</div>
            </button>

            <button
              id="admin-facial-scanner-quick-btn"
              onClick={() => navigate("/facial-verification")}
              className="p-4 bg-white dark:bg-[#0B132B] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:border-blue-500 hover:bg-blue-50/20 dark:hover:bg-blue-950/20 text-left transition-all cursor-pointer"
            >
              <ScanFace className="w-5 h-5 text-blue-500 mb-2" />
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Facial Scanner</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">Optical check-in</div>
            </button>

            <button
              id="admin-run-payroll-quick-btn"
              onClick={() => navigate("/payroll")}
              className="p-4 bg-white dark:bg-[#0B132B] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:border-blue-500 hover:bg-blue-50/20 dark:hover:bg-blue-950/20 text-left transition-all cursor-pointer"
            >
              <CreditCard className="w-5 h-5 text-blue-500 mb-2" />
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Run Payroll</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">Disburse salaries</div>
            </button>
          </div>
        </div>

        {/* Right: Live Activity Stream */}
        <div className="lg:col-span-5 p-6 bg-white dark:bg-[#0B132B] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Live Audit Stream
            </h2>
            <button
              id="dashboard-full-ledger-btn"
              onClick={() => navigate("/activity-logs")}
              className="text-xs font-semibold text-blue-600 dark:text-sky-400 hover:text-blue-700 dark:hover:text-sky-300 cursor-pointer"
            >
              Full Ledger &rarr;
            </button>
          </div>

          <div className="divide-y divide-stone-100 dark:divide-stone-800 space-y-3 pt-1">
            {recentLogs.map((log) => (
              <div key={log.id} className="pt-3 first:pt-0 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-stone-900 dark:text-stone-100">
                    {log.module || "System"} • {log.action}
                  </span>
                  <span className="text-[10px] text-stone-400 font-mono">
                    {log.timestamp
                      ? new Date(log.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : ""}
                  </span>
                </div>
                <p className="text-stone-600 dark:text-stone-400 text-[11px] line-clamp-1">
                  {log.details ||
                    log.metadata?.note ||
                    log.metadata?.targetName ||
                    `Audited event by ${log.userName || log.executedBy || "System"}`}
                </p>
                <div className="flex items-center gap-2 pt-0.5">
                  <span className="text-[10px] font-mono text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 rounded">
                    {log.recordId || log.id}
                  </span>
                  <StatusBadge label={log.result || "SUCCESS"} size="sm" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

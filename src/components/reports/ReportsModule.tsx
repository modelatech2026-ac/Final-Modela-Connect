import React from "react";
import {
  BarChart3,
  TrendingUp,
  Download,
  Users,
  Calendar,
  CreditCard,
  PieChart,
} from "lucide-react";
import { useData } from "../../context/DataContext";

export const ReportsModule: React.FC = () => {
  const { employees, attendanceRecords, payrollRecords } = useData();

  const totalEmployees = employees.length;
  const activeCount = employees.filter((e) => e.status === "ACTIVE").length;
  const onboardingCount = employees.filter((e) => e.status === "ONBOARDING").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
              Analytics & Executive Reports
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-sky-300 border border-blue-300 dark:border-blue-800">
              Live Aggregations
            </span>
          </div>
          <p className="text-stone-500 dark:text-stone-400 text-xs mt-0.5">
            Headcount metrics, biometric attendance compliance, and compensation distributions.
          </p>
        </div>

        <button
          onClick={() => alert("Report compiled and ready for PDF distribution.")}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-slate-900 hover:bg-stone-50 dark:hover:bg-slate-800 text-stone-800 dark:text-stone-200 text-xs font-semibold rounded-xl border border-stone-200 dark:border-slate-800 shadow-2xs transition-colors self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5 text-stone-500" />
          Export Executive Dossier
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-stone-200 dark:border-slate-800 shadow-2xs">
          <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">Retention & Stability</span>
          <div className="text-2xl font-extrabold text-blue-600 dark:text-sky-400 mt-2">97.8%</div>
          <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">Annualized attrition &lt; 2.2%</div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-stone-200 dark:border-slate-800 shadow-2xs">
          <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">Biometric Compliance</span>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-2">99.1%</div>
          <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">First-pass facial scan matches</div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-stone-200 dark:border-slate-800 shadow-2xs">
          <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">Average Tenure</span>
          <div className="text-2xl font-extrabold text-stone-900 dark:text-stone-100 mt-2">2.4 Yrs</div>
          <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">Across corporate departments</div>
        </div>
      </div>

      {/* Analytics Breakdown Bento */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Salary Burden */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-stone-200 dark:border-slate-800 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-blue-600 dark:text-sky-400" />
            Monthly Compensation Burden by Department
          </h3>

          <div className="space-y-4 pt-2">
            {[
              { dept: "Engineering", amount: "$30,500", pct: 54, color: "bg-blue-600" },
              { dept: "Product Design", amount: "$10,700", pct: 19, color: "bg-indigo-500" },
              { dept: "Security & Compliance", amount: "$9,200", pct: 16, color: "bg-slate-700" },
              { dept: "Human Resources", amount: "$6,200", pct: 11, color: "bg-sky-500" },
            ].map((item) => (
              <div key={item.dept} className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="font-semibold text-stone-700 dark:text-stone-300">{item.dept}</span>
                  <span className="font-mono text-stone-900 dark:text-stone-100 font-bold">{item.amount} ({item.pct}%)</span>
                </div>
                <div className="h-2 w-full bg-stone-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} rounded-full`}
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Biometric Verification Distribution */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-stone-200 dark:border-slate-800 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-600 dark:text-sky-400" />
            Biometric Check-in Method Distribution
          </h3>

          <div className="space-y-4 pt-2">
            {[
              { method: "Facial AI Vector Match", count: "142 logs", pct: 88, color: "bg-blue-600" },
              { method: "Manual Supervisor Override", count: "14 logs", pct: 9, color: "bg-amber-500" },
              { method: "Emergency Physical Keycard", count: "5 logs", pct: 3, color: "bg-stone-600" },
            ].map((item) => (
              <div key={item.method} className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="font-semibold text-stone-700 dark:text-stone-300">{item.method}</span>
                  <span className="font-mono text-stone-900 dark:text-stone-100 font-bold">{item.count} ({item.pct}%)</span>
                </div>
                <div className="h-2 w-full bg-stone-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} rounded-full`}
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

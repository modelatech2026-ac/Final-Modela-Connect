import React, { useState, useMemo } from "react";
import {
  History,
  Search,
  Filter,
  Download,
  Calendar,
  Shield,
  Eye,
  X,
  Code,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useData } from "../../context/DataContext";
import { ActivityLog, AuditAction, AuditModule } from "../../types";
import { StatusBadge } from "../ui/StatusBadge";

export const ActivityLogViewer: React.FC = () => {
  const { activityLogs } = useData();

  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedModule, setSelectedModule] = useState<string>("ALL");
  const [selectedAction, setSelectedAction] = useState<string>("ALL");
  const [selectedUserRole, setSelectedUserRole] = useState<string>("ALL");

  // Selected log for JSON payload inspector
  const [inspectedLog, setInspectedLog] = useState<ActivityLog | null>(null);

  // Available unique modules
  const modules: AuditModule[] = [
    "Auth",
    "Users",
    "Employees",
    "Attendance",
    "Facial Verification",
    "Payroll",
    "Requests",
    "Security",
    "Settings",
    "Onboarding",
  ];

  const actions: string[] = [
    "Login Attempt",
    "New Access Request Created",
    "Request Approved",
    "Request Rejected",
    "Role Assigned",
    "Role Changed",
    "Logout",
    "CREATE",
    "UPDATE",
    "DELETE",
    "VERIFY",
  ];

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return activityLogs.filter((log) => {
      const matchesSearch =
        `${log.id} ${log.recordId || ""} ${log.action} ${log.targetUser || ""} ${
          log.executedBy || ""
        } ${log.userName || ""} ${log.userEmail || ""} ${log.details || ""} ${
          log.module || ""
        } ${JSON.stringify(log.metadata || {})}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesModule =
        selectedModule === "ALL" || log.module === selectedModule;
      const matchesAction =
        selectedAction === "ALL" || log.action === selectedAction;
      const matchesRole =
        selectedUserRole === "ALL" || log.userRole === selectedUserRole;

      return matchesSearch && matchesModule && matchesAction && matchesRole;
    });
  }, [activityLogs, searchTerm, selectedModule, selectedAction, selectedUserRole]);

  // Export JSON
  const handleExportJSON = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute(
      "download",
      `Modela_Connect_Audit_Trail_${new Date().toISOString().split("T")[0]}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case "Request Approved":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800";
      case "Request Rejected":
        return "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border border-red-300 dark:border-red-800";
      case "New Access Request Created":
        return "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800";
      case "Role Assigned":
        return "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-300 dark:border-purple-800";
      case "Role Changed":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800";
      case "Login Attempt":
        return "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300 dark:border-blue-800";
      case "Logout":
        return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700";
      case "CREATE":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300";
      case "DELETE":
        return "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300";
      case "VERIFY":
        return "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300";
      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Activity & Audit Trail
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
              Append-Only Ledger
            </span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
            Immutable system audit logs tracking login attempts, access requests, role assignments, and security operations.
          </p>
        </div>

        <button
          id="export-audit-json-btn"
          onClick={handleExportJSON}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export JSON Audit Log</span>
        </button>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by action, user, target, or ref..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
          />
        </div>

        <select
          value={selectedAction}
          onChange={(e) => setSelectedAction(e.target.value)}
          className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
        >
          <option value="ALL">All Actions</option>
          {actions.map((act) => (
            <option key={act} value={act}>
              {act}
            </option>
          ))}
        </select>

        <select
          value={selectedModule}
          onChange={(e) => setSelectedModule(e.target.value)}
          className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
        >
          <option value="ALL">All Modules</option>
          {modules.map((mod) => (
            <option key={mod} value={mod}>
              {mod}
            </option>
          ))}
        </select>
      </div>

      {/* Audit Log Table (Timestamp, Action, Target User, Executed By) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Target User</th>
                <th className="py-3.5 px-4">Executed By</th>
                <th className="py-3.5 px-4">Details</th>
                <th className="py-3.5 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No matching audit records found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const target = log.targetUser || log.userEmail || log.recordId || "System";
                  const actor = log.executedBy || log.userName || "System";

                  return (
                    <tr
                      key={log.id}
                      id={`log-row-${log.id}`}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Timestamp */}
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString([], {
                          dateStyle: "short",
                          timeStyle: "medium",
                        })}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${getActionBadgeColor(
                            log.action
                          )}`}
                        >
                          {log.action}
                        </span>
                      </td>

                      {/* Target User (Plain text) */}
                      <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-100">
                        {target}
                      </td>

                      {/* Executed By (Plain text) */}
                      <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">
                        {actor}
                      </td>

                      {/* Details */}
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                        {log.details ||
                          log.payload ||
                          log.metadata?.note ||
                          "Operational event logged."}
                      </td>

                      {/* Inspect */}
                      <td className="py-3 px-4 text-right">
                        <button
                          id={`inspect-log-${log.id}`}
                          onClick={() => setInspectedLog(log)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-semibold transition-colors cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Inspect</span>
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

      {/* JSON Inspector Modal */}
      {inspectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-blue-500" />
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  Audit Entry Details: {inspectedLog.id}
                </h3>
              </div>
              <button
                onClick={() => setInspectedLog(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <pre className="p-4 bg-slate-950 text-slate-200 rounded-xl font-mono text-xs overflow-x-auto max-h-96">
              {JSON.stringify(inspectedLog, null, 2)}
            </pre>

            <div className="flex justify-end">
              <button
                onClick={() => setInspectedLog(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

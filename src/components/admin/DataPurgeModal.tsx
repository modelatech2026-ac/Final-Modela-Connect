/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  AlertTriangle,
  Trash2,
  ShieldAlert,
  Database,
  ImageOff,
  CheckCircle2,
  XCircle,
  Loader2,
  Lock,
  FileSpreadsheet,
  Users,
  Check,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useData } from "../../context/DataContext";
import { BulkPurgeSummary } from "../../types";

interface DataPurgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (summary: BulkPurgeSummary) => void;
}

export const DataPurgeModal: React.FC<DataPurgeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { currentUser, currentRole } = useAuth();
  const { purgeAllEmployeeData, employees } = useData();

  const [confirmInput, setConfirmInput] = useState("");
  const [isPurging, setIsPurging] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [currentStage, setCurrentStage] = useState("");
  const [stageDetails, setStageDetails] = useState("");
  const [executionLogs, setExecutionLogs] = useState<string[]>([]);
  const [purgeSummary, setPurgeSummary] = useState<BulkPurgeSummary | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const isSuperAdmin = currentRole === "Super Admin";
  const isConfirmed = confirmInput.trim().toUpperCase() === "DELETE";

  const handleExecutePurge = async () => {
    if (!isSuperAdmin || !isConfirmed || isPurging) return;

    setIsPurging(true);
    setErrorMessage(null);
    setExecutionLogs([]);
    setProgressPercent(5);
    setCurrentStage("Initializing Master Purge Protocol...");

    try {
      const result = await purgeAllEmployeeData((stage, pct, details) => {
        setCurrentStage(stage);
        setProgressPercent(pct);
        if (details) setStageDetails(details);
        setExecutionLogs((prev) => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] ${stage}${details ? `: ${details}` : ""}`,
        ]);
      });

      if (result.success) {
        setPurgeSummary(result.summary);
        if (result.logs && result.logs.length > 0) {
          setExecutionLogs(result.logs);
        }
        if (onSuccess) onSuccess(result.summary);
      } else {
        setErrorMessage(result.error || "Purge execution was terminated with an error.");
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Purge failed unexpectedly.");
    } finally {
      setIsPurging(false);
    }
  };

  const handleClose = () => {
    if (isPurging) return; // Prevent closing mid-operation
    setConfirmInput("");
    setPurgeSummary(null);
    setErrorMessage(null);
    setExecutionLogs([]);
    setProgressPercent(0);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-rose-200 dark:border-rose-900/60 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-6 bg-gradient-to-r from-rose-600 via-rose-700 to-red-800 text-white flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shrink-0">
              <ShieldAlert className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-black/40 text-rose-200 border border-rose-300/30">
                  Critical Admin Authority
                </span>
                <span className="text-[10px] font-bold text-white/80">Tier 0 Clearance</span>
              </div>
              <h2 className="text-xl font-black tracking-tight text-white mt-1">
                Complete Employee Data & Media Purge
              </h2>
              <p className="text-xs text-rose-100 mt-0.5 font-medium">
                Irreversible cascading wipe of Firebase Storage, Firestore Master, and linked collections.
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            disabled={isPurging}
            className="text-white/70 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors disabled:opacity-40"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-stone-800 dark:text-slate-200 text-xs">
          {/* Super Admin Validation Banner */}
          {!isSuperAdmin ? (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 flex items-start gap-3">
              <Lock className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm">Clearance Level Insufficient</p>
                <p className="text-xs mt-0.5">
                  Your active role is <strong>{currentRole}</strong>. This operation is restricted
                  strictly to <strong>Super Admin</strong> personas to safeguard tenant integrity.
                </p>
              </div>
            </div>
          ) : purgeSummary ? (
            /* Post-Purge Success Dossier */
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-sky-200 space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-sky-400" />
                  <span className="font-extrabold text-sm">Purge Successfully Finalized</span>
                </div>
                <p className="text-xs leading-relaxed text-blue-800 dark:text-sky-300">
                  All employee identity records, photos, documents, and cascaded operational
                  data have been permanently eliminated from storage buckets and collections.
                </p>
              </div>

              {/* Summary Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-stone-50 dark:bg-slate-800 rounded-xl border border-stone-200 dark:border-slate-700">
                  <span className="text-[11px] text-stone-500 dark:text-slate-400 font-medium">Employees Erased</span>
                  <div className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1">
                    {purgeSummary.deletedEmployeesCount}
                  </div>
                </div>
                <div className="p-3 bg-stone-50 dark:bg-slate-800 rounded-xl border border-stone-200 dark:border-slate-700">
                  <span className="text-[11px] text-stone-500 dark:text-slate-400 font-medium">Storage Files Erased</span>
                  <div className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                    {purgeSummary.deletedStorageFilesCount}
                  </div>
                </div>
                <div className="p-3 bg-stone-50 dark:bg-slate-800 rounded-xl border border-stone-200 dark:border-slate-700">
                  <span className="text-[11px] text-stone-500 dark:text-slate-400 font-medium">Attendance Logs Purged</span>
                  <div className="text-xl font-bold text-stone-900 dark:text-slate-100 mt-1">
                    {purgeSummary.deletedAttendanceCount}
                  </div>
                </div>
                <div className="p-3 bg-stone-50 dark:bg-slate-800 rounded-xl border border-stone-200 dark:border-slate-700">
                  <span className="text-[11px] text-stone-500 dark:text-slate-400 font-medium">Payroll Stubs Purged</span>
                  <div className="text-xl font-bold text-stone-900 dark:text-slate-100 mt-1">
                    {purgeSummary.deletedPayrollCount}
                  </div>
                </div>
                <div className="p-3 bg-stone-50 dark:bg-slate-800 rounded-xl border border-stone-200 dark:border-slate-700">
                  <span className="text-[11px] text-stone-500 dark:text-slate-400 font-medium">Requests Purged</span>
                  <div className="text-xl font-bold text-stone-900 dark:text-slate-100 mt-1">
                    {purgeSummary.deletedRequestsCount}
                  </div>
                </div>
                <div className="p-3 bg-stone-50 dark:bg-slate-800 rounded-xl border border-stone-200 dark:border-slate-700">
                  <span className="text-[11px] text-stone-500 dark:text-slate-400 font-medium">User Accounts Sanitized</span>
                  <div className="text-xl font-bold text-blue-600 dark:text-sky-400 mt-1">
                    {purgeSummary.purgedUsersCount}
                  </div>
                </div>
              </div>

              {/* Audit Notice */}
              <div className="p-3 bg-stone-100 dark:bg-slate-800 rounded-xl border border-stone-200 dark:border-slate-700 flex items-center justify-between text-[11px]">
                <span className="text-stone-500 dark:text-slate-400">
                  Audit action logged as <strong>BULK_EMPLOYEE_PURGE</strong> in Activity Logs.
                </span>
                <span className="font-mono text-stone-700 dark:text-slate-300 font-semibold">
                  {new Date(purgeSummary.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ) : (
            /* Pre-Execution Warning & Confirmation Input */
            <div className="space-y-4">
              {/* Destruction Scope Matrix */}
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-800/80 border border-stone-200 dark:border-slate-700 space-y-3">
                <span className="font-bold text-stone-900 dark:text-slate-100 uppercase text-[11px] tracking-wider block">
                  Mandatory Execution Scope
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="flex items-start gap-2 p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-stone-200 dark:border-slate-700">
                    <ImageOff className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-stone-900 dark:text-slate-100 block">Firebase Storage Erase</strong>
                      <span className="text-[11px] text-stone-500 dark:text-slate-400">
                        Recursively deletes profile photos, KYC IDs, contracts, and onboarding assets. No pictures remain.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-stone-200 dark:border-slate-700">
                    <Users className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-stone-900 dark:text-slate-100 block">Firestore Master 'employees'</strong>
                      <span className="text-[11px] text-stone-500 dark:text-slate-400">
                        Batch-deletes all authoritative employee documents across the tenant directory ({employees.length} records).
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-stone-200 dark:border-slate-700">
                    <Database className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-stone-900 dark:text-slate-100 block">Cascading Collections</strong>
                      <span className="text-[11px] text-stone-500 dark:text-slate-400">
                        Purges linked records in <code>attendance</code>, <code>payroll</code>, <code>requests</code>, and <code>onboarding</code>.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-stone-200 dark:border-slate-700">
                    <FileSpreadsheet className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-stone-900 dark:text-slate-100 block">Immutable Audit Trail</strong>
                      <span className="text-[11px] text-stone-500 dark:text-slate-400">
                        Permanently commits <code>BULK_EMPLOYEE_PURGE</code> entry with Super Admin identifier and execution stats.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Execution Progress Bar if running */}
              {isPurging && (
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-200">
                      <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                      <span>{currentStage}</span>
                    </div>
                    <span className="font-mono font-bold text-amber-700 dark:text-amber-300">
                      {progressPercent}%
                    </span>
                  </div>

                  <div className="w-full h-2.5 bg-amber-200 dark:bg-amber-900/60 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 via-rose-500 to-red-600 rounded-full transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  {stageDetails && (
                    <p className="text-[11px] text-amber-700 dark:text-amber-300 font-mono">
                      &gt; {stageDetails}
                    </p>
                  )}
                </div>
              )}

              {/* Error Message */}
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-900 text-rose-800 dark:text-rose-200 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Real-time Execution Terminal Logs */}
              {executionLogs.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                    Operation Console Stream
                  </span>
                  <div className="p-3 bg-slate-950 text-sky-400 rounded-xl font-mono text-[11px] max-h-36 overflow-y-auto space-y-1">
                    {executionLogs.map((log, index) => (
                      <div key={index} className="leading-tight">
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Explicit Confirmation Input */}
              {!isPurging && (
                <div className="p-4 rounded-2xl bg-rose-50/70 dark:bg-slate-800/90 border border-rose-200 dark:border-rose-900/80 space-y-2">
                  <label
                    htmlFor="purge-confirmation-input"
                    className="block font-bold text-stone-900 dark:text-slate-100"
                  >
                    High-Severity Safety Check:
                  </label>
                  <p className="text-[11px] text-stone-600 dark:text-slate-300">
                    To acknowledge this destructive action and prevent accidental invocation,
                    please type <strong className="text-rose-600 dark:text-rose-400 font-mono">DELETE</strong> in
                    the box below:
                  </p>
                  <div className="relative">
                    <input
                      id="purge-confirmation-input"
                      type="text"
                      value={confirmInput}
                      onChange={(e) => setConfirmInput(e.target.value)}
                      placeholder="Type DELETE to enable purge button"
                      autoComplete="off"
                      className="w-full px-3.5 py-2.5 text-sm font-mono tracking-wider bg-white dark:bg-slate-800 border-2 border-rose-300 dark:border-rose-700 rounded-xl focus:outline-none focus:border-rose-600 dark:focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 text-rose-900 dark:text-rose-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    />
                    {isConfirmed && (
                      <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-600 dark:text-sky-400" />
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-stone-50 dark:bg-slate-950 border-t border-stone-200 dark:border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={handleClose}
            disabled={isPurging}
            className="px-4 py-2 bg-stone-200 dark:bg-slate-800 hover:bg-stone-300 dark:hover:bg-slate-700 text-stone-700 dark:text-slate-300 rounded-xl font-semibold transition-colors disabled:opacity-50 cursor-pointer"
          >
            {purgeSummary ? "Close Dossier" : "Cancel"}
          </button>

          {!purgeSummary && (
            <button
              id="confirm-master-purge-btn"
              type="button"
              onClick={handleExecutePurge}
              disabled={!isSuperAdmin || !isConfirmed || isPurging}
              className={`px-5 py-2.5 rounded-xl font-bold text-white shadow-md flex items-center gap-2 transition-all ${
                isSuperAdmin && isConfirmed && !isPurging
                  ? "bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 cursor-pointer scale-100"
                  : "bg-stone-400 dark:bg-slate-700 opacity-60 cursor-not-allowed"
              }`}
            >
              {isPurging ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Executing Master Purge...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Execute Complete Data Purge</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

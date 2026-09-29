/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  X,
  Copy,
  Check,
  Download,
  Printer,
  RefreshCw,
  ShieldCheck,
  AlertTriangle,
  Lock,
} from "lucide-react";
import { useTwoFactor } from "../../context/TwoFactorContext";

export const BackupCodesModal: React.FC = () => {
  const {
    isBackupCodesModalOpen,
    closeBackupCodesModal,
    backupCodes,
    regenerateBackupCodes,
    isLoading,
  } = useTwoFactor();

  const [copiedAll, setCopiedAll] = useState<boolean>(false);
  const [isConfirmingRegen, setIsConfirmingRegen] = useState<boolean>(false);

  if (!isBackupCodesModalOpen) return null;

  const handleCopyAll = () => {
    if (backupCodes.length === 0) return;
    const textToCopy = [
      "MODELA CONNECT ENTERPRISE 2FA EMERGENCY RECOVERY CODES",
      `Generated: ${new Date().toLocaleString()}`,
      "-------------------------------------------------------",
      ...backupCodes.map((code, index) => `${index + 1}. ${code}`),
      "-------------------------------------------------------",
      "Treat these codes like passwords. Each code may only be used once.",
    ].join("\n");

    navigator.clipboard.writeText(textToCopy);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleDownload = () => {
    if (backupCodes.length === 0) return;
    const fileContent = [
      "MODELA CONNECT ENTERPRISE 2FA EMERGENCY RECOVERY CODES",
      `Generated: ${new Date().toLocaleString()}`,
      "-------------------------------------------------------",
      ...backupCodes.map((code, index) => `${index + 1}. ${code}`),
      "-------------------------------------------------------",
      "Store this file in an encrypted vault or password manager.",
    ].join("\n");

    const blob = new Blob([fileContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `modela-2fa-backup-codes-${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleRegenerate = async () => {
    await regenerateBackupCodes();
    setIsConfirmingRegen(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="backup-codes-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200 print:p-0 print:bg-white"
    >
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden relative print:border-none print:shadow-none">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 print:bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="backup-codes-title"
                className="text-base font-bold text-slate-900 dark:text-slate-100"
              >
                Emergency Recovery Backup Codes
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Single-use fail-safe keys to access your enterprise account if phone is lost
              </p>
            </div>
          </div>
          <button
            onClick={closeBackupCodesModal}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer print:hidden"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60 rounded-xl flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Important Security Notice</span>
              <span>
                Each code can only be used once. Keep them in a password manager or secure location.
              </span>
            </div>
          </div>

          {/* 8-Grid Backup Codes Display */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80">
            <div className="grid grid-cols-2 gap-2.5">
              {backupCodes.map((code, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200/80 dark:border-slate-700/60 shadow-2xs"
                >
                  <span className="text-[11px] font-mono text-slate-400 select-none">
                    #{String(idx + 1).padStart(2, "0")}
                  </span>
                  <span className="font-mono text-xs sm:text-sm font-bold tracking-widest text-slate-900 dark:text-slate-100 select-all">
                    {code}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Tools (Copy All, Download, Print) */}
          <div className="flex flex-wrap items-center gap-2 pt-1 print:hidden">
            <button
              type="button"
              onClick={handleCopyAll}
              className="flex-1 min-w-[130px] py-2 px-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-2xs cursor-pointer"
            >
              {copiedAll ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400">Copied All Codes</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy All Codes</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="py-2 px-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-2xs cursor-pointer"
              title="Download text file"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Download (.txt)</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="py-2 px-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-2xs cursor-pointer"
              title="Print recovery sheet"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Print</span>
            </button>
          </div>

          {/* Regenerate Warning Section */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs print:hidden">
            {!isConfirmingRegen ? (
              <button
                type="button"
                onClick={() => setIsConfirmingRegen(true)}
                className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 inline-flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Generate new backup codes</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-rose-500 font-semibold">
                  This voids previous codes!
                </span>
                <button
                  type="button"
                  onClick={handleRegenerate}
                  disabled={isLoading}
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[11px] font-bold cursor-pointer"
                >
                  Confirm
                </button>
                <button
                  type="button"
                  onClick={() => setIsConfirmingRegen(false)}
                  className="px-2 py-1 text-slate-500 text-[11px] hover:underline cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={closeBackupCodesModal}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Done / Saved
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

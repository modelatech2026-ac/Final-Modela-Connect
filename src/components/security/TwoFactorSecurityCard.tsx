/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Smartphone,
  KeyRound,
  Lock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { useTwoFactor } from "../../context/TwoFactorContext";
import { useAuth } from "../../context/AuthContext";

export const TwoFactorSecurityCard: React.FC = () => {
  const {
    isEnabled,
    openSetupModal,
    openBackupCodesModal,
    openVerificationModal,
    disable2FA,
    remainingBackupCodesCount,
    isDeviceTrusted,
    isLoading,
  } = useTwoFactor();

  const { currentUser } = useAuth();
  const [isConfirmingDisable, setIsConfirmingDisable] = useState<boolean>(false);

  return (
    <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-5 text-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              isEnabled
                ? "bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                : "bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400"
            }`}
          >
            {isEnabled ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Two-Factor Authentication (2FA)
              </h3>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  isEnabled
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                    : "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                }`}
              >
                {isEnabled ? "ACTIVE & ENFORCED" : "NOT CONFIGURED"}
              </span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
              Protect your enterprise credentials with time-based one-time password (TOTP) verification.
            </p>
          </div>
        </div>
      </div>

      {isEnabled ? (
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Authenticator App Linked
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                Account: {currentUser?.email || "Staff"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
              <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200/60 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                  Device Trust Status
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isDeviceTrusted ? "bg-emerald-500" : "bg-slate-400"
                    }`}
                  />
                  {isDeviceTrusted ? "30-Day Browser Trust Active" : "Challenge On Every Ingress"}
                </span>
              </div>

              <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200/60 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                  Emergency Recovery
                </span>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {remainingBackupCodesCount} Codes Remaining
                  </span>
                  <button
                    type="button"
                    onClick={openBackupCodesModal}
                    className="text-blue-600 dark:text-sky-400 hover:underline font-bold text-[11px] cursor-pointer"
                  >
                    View / Print
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={openVerificationModal}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Smartphone className="w-3.5 h-3.5 text-blue-500" />
                <span>Test 2FA Challenge</span>
              </button>

              <button
                type="button"
                onClick={openBackupCodesModal}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                <span>Manage Backup Codes</span>
              </button>
            </div>

            {/* Disable 2FA with Confirmation */}
            {!isConfirmingDisable ? (
              <button
                type="button"
                onClick={() => setIsConfirmingDisable(true)}
                className="text-rose-600 dark:text-rose-400 hover:underline font-semibold cursor-pointer"
              >
                Disable 2FA
              </button>
            ) : (
              <div className="flex items-center gap-2 p-1.5 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900">
                <span className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold">
                  Confirm turn off?
                </span>
                <button
                  type="button"
                  onClick={async () => {
                    await disable2FA();
                    setIsConfirmingDisable(false);
                  }}
                  disabled={isLoading}
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg cursor-pointer"
                >
                  Yes, Disable
                </button>
                <button
                  type="button"
                  onClick={() => setIsConfirmingDisable(false)}
                  className="px-2 py-1 text-slate-500 hover:underline cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Disabled State Prompt */
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-sky-400 shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                Recommended Enterprise Security Baseline
              </h4>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                Two-Factor Authentication adds an indispensable layer of defense against credential
                harvesting, phishing, and unauthorized session hijackings.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
            <span className="text-[11px] text-slate-400">
              Requires Google Authenticator, 1Password, or Authy.
            </span>
            <button
              type="button"
              onClick={openSetupModal}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Enable 2FA Now</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

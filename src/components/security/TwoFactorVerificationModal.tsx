/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  X,
  ShieldAlert,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Smartphone,
  ArrowRight,
  Shield,
  LifeBuoy,
} from "lucide-react";
import { useTwoFactor } from "../../context/TwoFactorContext";
import { DigitCodeInput } from "./DigitCodeInput";

interface TwoFactorVerificationModalProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  title?: string;
  subtitle?: string;
}

export const TwoFactorVerificationModal: React.FC<TwoFactorVerificationModalProps> = ({
  onSuccess,
  onCancel,
  title = "Two-Factor Verification",
  subtitle = "Enter the 6-digit verification code from your authenticator app.",
}) => {
  const {
    isVerificationModalOpen,
    closeVerificationModal,
    verifySessionWithOtp,
    verifyWithBackupCode,
    isLoading,
    error,
    clearError,
    remainingBackupCodesCount,
  } = useTwoFactor();

  const [otpCode, setOtpCode] = useState<string>("");
  const [trustDevice, setTrustDevice] = useState<boolean>(true);
  const [isBackupMode, setIsBackupMode] = useState<boolean>(false);
  const [backupInput, setBackupInput] = useState<string>("");

  if (!isVerificationModalOpen) return null;

  const handleClose = () => {
    closeVerificationModal();
    if (onCancel) onCancel();
    clearError();
  };

  const handleOtpSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (otpCode.length !== 6 || isLoading) return;

    const ok = await verifySessionWithOtp(otpCode, trustDevice);
    if (ok && onSuccess) {
      onSuccess();
    }
  };

  const handleBackupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = backupInput.trim().toUpperCase();
    if (clean.length < 8 || isLoading) return;

    const ok = await verifyWithBackupCode(clean);
    if (ok && onSuccess) {
      onSuccess();
    }
  };

  const toggleBackupMode = () => {
    setIsBackupMode((prev) => !prev);
    clearError();
    setOtpCode("");
    setBackupInput("");
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="verify-2fa-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden relative">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/10 dark:bg-sky-500/20 text-blue-600 dark:text-sky-400 flex items-center justify-center">
              {isBackupMode ? <KeyRound className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />}
            </div>
            <div>
              <h2
                id="verify-2fa-title"
                className="text-base font-bold text-slate-900 dark:text-slate-100"
              >
                {isBackupMode ? "Emergency Backup Code" : title}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isBackupMode
                  ? "Enter one of your 8-digit emergency recovery codes"
                  : subtitle}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {!isBackupMode ? (
            /* Mode 1: TOTP 6-Digit Code Entry */
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <div className="text-center space-y-1">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Authentication Code
                </span>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  Tip: For testing, try <code className="font-mono font-bold text-blue-600 dark:text-sky-400">123456</code> or any 6 digits.
                </p>
              </div>

              <DigitCodeInput
                value={otpCode}
                onChange={(val) => {
                  setOtpCode(val);
                  if (error) clearError();
                }}
                onComplete={async (code) => {
                  const ok = await verifySessionWithOtp(code, trustDevice);
                  if (ok && onSuccess) onSuccess();
                }}
                disabled={isLoading}
                hasError={Boolean(error)}
                idPrefix="verify-screen"
              />

              {error && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl flex items-start gap-2 text-xs text-rose-700 dark:text-rose-300 animate-in fade-in duration-150">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Trust this device checkbox */}
              <div className="pt-1">
                <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-800 transition-colors">
                  <input
                    type="checkbox"
                    checked={trustDevice}
                    onChange={(e) => setTrustDevice(e.target.checked)}
                    className="w-4 h-4 mt-0.5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                  />
                  <div className="text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                      Trust this device for 30 days
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                      Skip 2FA challenges on this browser for the next month.
                    </span>
                  </div>
                </label>
              </div>

              {/* Primary Action Button */}
              <button
                type="submit"
                disabled={otpCode.length !== 6 || isLoading}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm & Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Fallback Option */}
              <div className="pt-2 text-center border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={toggleBackupMode}
                  className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-sky-400 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <LifeBuoy className="w-3.5 h-3.5" />
                  <span>Don't have your device? Use an Emergency Backup Code</span>
                </button>
              </div>
            </form>
          ) : (
            /* Mode 2: Emergency Backup Code Entry */
            <form onSubmit={handleBackupSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  8-Character Backup Code
                </label>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={9}
                    placeholder="XXXX-XXXX"
                    value={backupInput}
                    onChange={(e) => {
                      setBackupInput(e.target.value.toUpperCase());
                      if (error) clearError();
                    }}
                    autoFocus
                    className="w-full px-4 py-3 font-mono text-center text-lg font-bold tracking-widest bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/40 focus:outline-none uppercase"
                  />
                  <KeyRound className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                </div>
                <div className="flex justify-between text-[11px] text-slate-400 dark:text-slate-500 px-1">
                  <span>Format: 8 alphanumeric characters</span>
                  <span>{remainingBackupCodesCount} codes remaining</span>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl flex items-start gap-2 text-xs text-rose-700 dark:text-rose-300 animate-in fade-in duration-150">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={backupInput.replace(/[^A-Z0-9]/g, "").length !== 8 || isLoading}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Validating Code...</span>
                  </>
                ) : (
                  <>
                    <span>Validate Backup Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="pt-2 text-center border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={toggleBackupMode}
                  className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-sky-400 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Back to Authenticator App OTP</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

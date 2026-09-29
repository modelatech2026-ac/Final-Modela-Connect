/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  X,
  Copy,
  Check,
  ShieldCheck,
  QrCode,
  Smartphone,
  Key,
  AlertCircle,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { useTwoFactor } from "../../context/TwoFactorContext";
import { DigitCodeInput } from "./DigitCodeInput";

export const TwoFactorSetupModal: React.FC = () => {
  const {
    isSetupModalOpen,
    closeSetupModal,
    activeSecretData,
    confirmSetupWithCode,
    isLoading,
    error,
    clearError,
  } = useTwoFactor();

  const [copiedKey, setCopiedKey] = useState<boolean>(false);
  const [verificationCode, setVerificationCode] = useState<string>("");
  const [showManualKey, setShowManualKey] = useState<boolean>(false);

  if (!isSetupModalOpen) return null;

  const handleCopyKey = () => {
    if (!activeSecretData?.secret) return;
    const cleanSecret = activeSecretData.secret.replace(/\s+/g, "");
    navigator.clipboard.writeText(cleanSecret);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (verificationCode.length !== 6 || isLoading) return;
    await confirmSetupWithCode(verificationCode);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="setup-2fa-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden relative">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/10 dark:bg-sky-500/20 text-blue-600 dark:text-sky-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="setup-2fa-title"
                className="text-base font-bold text-slate-900 dark:text-slate-100"
              >
                Set Up Two-Factor Authentication
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Enhance your enterprise access security using TOTP Authenticator
              </p>
            </div>
          </div>
          <button
            onClick={closeSetupModal}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Step 1: Scan QR */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px]">
                1
              </span>
              <span>Scan QR Code with Authenticator App</span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Use Google Authenticator, 1Password, Authy, or Microsoft Authenticator to scan this
              configured QR code.
            </p>

            {/* QR Code Container */}
            <div className="flex flex-col sm:flex-row items-center gap-5 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60">
              <div className="w-40 h-40 bg-white p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm shrink-0 flex items-center justify-center">
                {activeSecretData?.qrSvgDataUri ? (
                  <img
                    src={activeSecretData.qrSvgDataUri}
                    alt="2FA TOTP QR Code"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400 text-xs">
                    <QrCode className="w-10 h-10 mb-1 animate-pulse" />
                    <span>Generating QR...</span>
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-3 w-full text-xs">
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-semibold">
                  <Smartphone className="w-4 h-4 text-blue-500" />
                  <span>Compatible with any standard TOTP app</span>
                </div>

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setShowManualKey((prev) => !prev)}
                    className="text-xs font-semibold text-blue-600 dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Key className="w-3.5 h-3.5" />
                    {showManualKey ? "Hide manual entry key" : "Can't scan? Enter key manually"}
                  </button>
                </div>

                {showManualKey && activeSecretData && (
                  <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 space-y-1.5 animate-in fade-in duration-150">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Base32 Secret Key
                    </span>
                    <div className="flex items-center justify-between gap-2">
                      <code className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100 tracking-wider break-all select-all">
                        {activeSecretData.secret}
                      </code>
                      <button
                        type="button"
                        onClick={handleCopyKey}
                        className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md transition-colors cursor-pointer shrink-0"
                        title="Copy Secret Key"
                      >
                        {copiedKey ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Step 2: Verification Input */}
          <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px]">
                2
              </span>
              <span>Verify 6-Digit Authenticator Code</span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Enter the 6-digit rolling code generated by your authenticator app to finalize configuration.
            </p>

            <form onSubmit={handleVerify} className="space-y-4">
              <DigitCodeInput
                value={verificationCode}
                onChange={(val) => {
                  setVerificationCode(val);
                  if (error) clearError();
                }}
                onComplete={async (code) => {
                  await confirmSetupWithCode(code);
                }}
                disabled={isLoading}
                hasError={Boolean(error)}
                idPrefix="setup-modal"
              />

              {error && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl flex items-start gap-2 text-xs text-rose-700 dark:text-rose-300 animate-in fade-in duration-150">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeSetupModal}
                  disabled={isLoading}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={verificationCode.length !== 6 || isLoading}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Verifying Token...</span>
                    </>
                  ) : (
                    <>
                      <span>Activate 2FA</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

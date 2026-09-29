/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, ArrowLeft, AlertCircle, Lock } from "lucide-react";
import { useAuth, SESSION_REQUEST_KEY } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useTwoFactor } from "../../context/TwoFactorContext";
import { checkIsDeviceTrusted, getStoredTwoFactorState } from "../../services/twoFactorService";

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { loginWithGoogle, logout } = useAuth();
  const { success, error: toastError } = useToast();

  const { openVerificationModal } = useTwoFactor();

  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleAdminAuth = async (targetEmail: string, targetName?: string) => {
    const cleanEmail = targetEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setErrorMessage("Please enter a valid administrative email address.");
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const cleanName =
        targetName ||
        cleanEmail.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

      const res = await loginWithGoogle(cleanEmail, cleanName);

      const r = (res.user?.role || "").trim().toUpperCase();
      const isAdminRole =
        r === "SUPER_ADMIN" ||
        r === "SUPER ADMIN" ||
        r === "SUPERADMIN" ||
        r === "HR_ADMIN" ||
        r === "HR ADMIN" ||
        r === "ADMIN" ||
        r === "HR_MANAGER" ||
        r === "HR MANAGER";

      const isStatusApproved = (res.status || "").toUpperCase() === "APPROVED";

      if (isStatusApproved && (isAdminRole || res.user?.isSuperAdmin)) {
        sessionStorage.setItem(SESSION_REQUEST_KEY, cleanEmail);

        // Check if user has active 2FA enabled on their account
        const twoFactor = getStoredTwoFactorState(cleanEmail);
        const deviceTrusted = checkIsDeviceTrusted(cleanEmail);

        if (twoFactor.isEnabled && !deviceTrusted) {
          // Open 2FA Challenge Verification Screen
          openVerificationModal();
          navigate("/admin", { replace: true });
        } else {
          success("Clearance Verified", `Welcome back, ${res.user?.name || cleanName}.`);
          navigate("/admin", { replace: true });
        }
      } else {
        // Not approved or not admin role
        logout();
        setErrorMessage(
          "Access Denied: This account is not authorized with Super Admin or HR Admin clearance."
        );
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to authenticate administrator.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAdminAuth(email);
  };

  const handleBackToLanding = () => {
    localStorage.removeItem("modela_active_user_data");
    localStorage.removeItem("modela_jwt_token");
    sessionStorage.removeItem(SESSION_REQUEST_KEY);
    logout();
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4 antialiased font-sans">
      <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-2xl p-8 sm:p-10 shadow-2xl relative">
        {/* Back Link */}
        <button
          onClick={handleBackToLanding}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 mb-6 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Landing</span>
        </button>

        {/* Header */}
        <div className="text-center space-y-2 mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 mb-2">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            HR Admin Login
          </h1>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Authorized Super Admin & HR Admin personnel only. All access is cryptographically audited.
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-6 p-3.5 bg-red-900/30 border border-red-500/50 rounded-xl flex items-start gap-2.5 text-xs text-red-200">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{errorMessage}</p>
          </div>
        )}

        {/* Email Form */}
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="admin-email"
              className="block text-xs font-semibold text-slate-300 mb-2"
            >
              Admin Email ID
            </label>
            <input
              id="admin-email"
              type="email"
              required
              placeholder="e.g. alex.morgan@modela.io"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errorMessage) setErrorMessage("");
              }}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-colors cursor-pointer shadow-md disabled:opacity-60 flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4" />
            <span>{isSubmitting ? "Authenticating..." : "Sign in as Admin"}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

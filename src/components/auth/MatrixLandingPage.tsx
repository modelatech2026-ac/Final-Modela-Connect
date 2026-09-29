/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, SESSION_REQUEST_KEY, isAuthorizedAdminEmail } from "../../context/AuthContext";
import { useTwoFactor } from "../../context/TwoFactorContext";
import { checkIsDeviceTrusted, getStoredTwoFactorState } from "../../services/twoFactorService";

type FlowStep = "STEP_1_LANDING" | "STEP_2_EMAIL_INPUT" | "STEP_3_REQUEST_SENT" | "APPROVED" | "REJECTED";

export const MatrixLandingPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    currentUser,
    loginWithGoogle,
    logout,
  } = useAuth();
  const { openVerificationModal } = useTwoFactor();

  // Reset local storage state on initial load so the application always opens to Step 1
  // unless a request has actually been submitted during the session.
  const [currentStep, setCurrentStep] = useState<FlowStep>(() => {
    try {
      const sessionSubmittedEmail = sessionStorage.getItem(SESSION_REQUEST_KEY);
      if (!sessionSubmittedEmail) {
        localStorage.removeItem("modela_active_user_data");
        localStorage.removeItem("modela_jwt_token");
        return "STEP_1_LANDING";
      }
      return "STEP_3_REQUEST_SENT";
    } catch {
      return "STEP_1_LANDING";
    }
  });

  const [emailInput, setEmailInput] = useState<string>(() => {
    try {
      return sessionStorage.getItem(SESSION_REQUEST_KEY) || "";
    } catch {
      return "";
    }
  });

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string>("");

  // Determine permitted dashboard based on server-verified role
  const getPermittedRoute = useCallback((role?: string | null) => {
    const r = (role || "").trim().toUpperCase();
    if (
      r === "SUPER_ADMIN" ||
      r === "SUPER ADMIN" ||
      r === "SUPERADMIN" ||
      r === "HR_ADMIN" ||
      r === "HR ADMIN" ||
      r === "ADMIN" ||
      r === "HR_MANAGER" ||
      r === "HR MANAGER"
    ) {
      return "/admin";
    }
    return "/dashboard";
  }, []);

  // Update step if user gets approved or rejected
  useEffect(() => {
    if (!currentUser) return;
    const norm = (currentUser.status || "").toUpperCase();
    if (norm === "APPROVED") {
      setCurrentStep("APPROVED");
    } else if (norm === "REJECTED") {
      setCurrentStep("REJECTED");
    }
  }, [currentUser]);

  // Polling while on Step 3 (Request Sent / Pending)
  useEffect(() => {
    if (currentStep !== "STEP_3_REQUEST_SENT") return;

    const emailToPoll = emailInput.trim() || currentUser?.email;
    if (!emailToPoll) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/auth/status?email=${encodeURIComponent(emailToPoll)}`);
        if (res.ok) {
          const data = await res.json();
          const norm = (data.status || "").toUpperCase();
          if (norm === "APPROVED") {
            await loginWithGoogle(emailToPoll, data.user?.name || emailToPoll.split("@")[0]);
            setCurrentStep("APPROVED");
          } else if (norm === "REJECTED") {
            await loginWithGoogle(emailToPoll, data.user?.name || emailToPoll.split("@")[0]);
            setCurrentStep("REJECTED");
          }
        }
      } catch {
        // silent polling
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [currentStep, emailInput, currentUser?.email, loginWithGoogle]);

  // Step 1 -> Step 2
  const handleStartGoogleSignIn = () => {
    setValidationError("");
    setCurrentStep("STEP_2_EMAIL_INPUT");
  };

  // Step 2 Submission -> Step 3 or Approved
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = emailInput.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      setValidationError("Please enter a valid email address.");
      return;
    }

    setValidationError("");
    setIsSubmitting(true);

    try {
      const cleanName = cleanEmail.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      const res = await loginWithGoogle(cleanEmail, cleanName);

      const norm = (res.status || "").toUpperCase();
      const isSuperAdminEmail = isAuthorizedAdminEmail(cleanEmail);

      if (isSuperAdminEmail || norm === "APPROVED") {
        sessionStorage.setItem(SESSION_REQUEST_KEY, cleanEmail);
        if (isSuperAdminEmail || res.user?.role === "Super Admin" || res.user?.isSuperAdmin) {
          navigate("/admin", { replace: true });
        } else {
          setCurrentStep("APPROVED");
        }
      } else if (norm === "REJECTED") {
        sessionStorage.setItem(SESSION_REQUEST_KEY, cleanEmail);
        setCurrentStep("REJECTED");
      } else if (res.success) {
        // Confirmed database write: Pending / new request
        sessionStorage.setItem(SESSION_REQUEST_KEY, cleanEmail);
        setCurrentStep("STEP_3_REQUEST_SENT");
      } else {
        // Never show "request sent" if database write fails
        console.error("Access request write failed:", res.message);
        setValidationError(res.message || "Failed to submit access request. Database write was not confirmed.");
      }
    } catch (err: any) {
      console.error("Sign-in caught error:", err);
      if (isAuthorizedAdminEmail(cleanEmail)) {
        navigate("/admin", { replace: true });
      } else {
        setValidationError(err?.message || "Failed to connect to authentication server. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Approved -> Continue to Dashboard
  const handleContinue = async () => {
    if (currentUser?.uid || currentUser?.id) {
      const uid = currentUser.id || currentUser.uid;
      try {
        await fetch(`/api/users/${encodeURIComponent(uid)}/mark-notification-read`, {
          method: "POST",
        });
      } catch {
        // silent
      }
    }

    const email = currentUser?.email || "";
    if (email) {
      const twoFactor = getStoredTwoFactorState(email);
      const isTrusted = checkIsDeviceTrusted(email);
      if (twoFactor.isEnabled && !isTrusted) {
        openVerificationModal();
      }
    }

    const targetRoute = getPermittedRoute(currentUser?.role);
    navigate(targetRoute, { replace: true });
  };

  // Clear local session/storage state and return view to initial landing page (Step 1)
  const handleBackToLogin = () => {
    localStorage.removeItem("modela_active_user_data");
    localStorage.removeItem("modela_jwt_token");
    sessionStorage.removeItem(SESSION_REQUEST_KEY);
    logout();
    setEmailInput("");
    setValidationError("");
    setCurrentStep("STEP_1_LANDING");
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4 antialiased font-sans selection:bg-blue-600/30">
      {/* ========================================================================= */}
      {/* APPROVED USER VIEW                                                        */}
      {/* Show ONLY:                                                                */}
      {/* - Title: "Request Approved"                                               */}
      {/* - Text: "Your request has been approved."                                 */}
      {/* - Button: "[ Continue ]"                                                  */}
      {/* ========================================================================= */}
      {currentStep === "APPROVED" && (
        <div className="w-full max-w-md bg-slate-800 border border-emerald-500/40 rounded-2xl p-8 sm:p-10 shadow-2xl text-center space-y-5">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white tracking-tight">Request Approved</h2>
            <p className="text-slate-300 text-sm leading-relaxed max-w-sm mx-auto">
              Your request has been approved.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={handleContinue}
              className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 text-sm transition-colors cursor-pointer shadow-lg shadow-emerald-950/40"
            >
              <span>[ Continue ]</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* REJECTED USER VIEW                                                        */}
      {/* Show ONLY:                                                                */}
      {/* - Title: "Request Rejected"                                               */}
      {/* - Text: "Your request has been rejected by the HR Admin."                 */}
      {/* ========================================================================= */}
      {currentStep === "REJECTED" && (
        <div className="w-full max-w-md bg-slate-800 border border-red-900/50 rounded-2xl p-8 sm:p-10 shadow-2xl text-center space-y-4">
          <h2 className="text-2xl font-bold text-white tracking-tight">Request Rejected</h2>
          <p className="text-slate-300 text-sm leading-relaxed max-w-sm mx-auto">
            Your request has been rejected by the HR Admin.
          </p>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: REQUEST SENT STATUS PAGE                                          */}
      {/* Show ONLY:                                                                */}
      {/* - Badge: "Status: Pending" (gold/amber styling)                           */}
      {/* - Title: "Request Sent"                                                   */}
      {/* - Message: "Your request has been sent to the HR Admin. Please wait for   */}
      {/*   approval."                                                              */}
      {/* - Primary Action: "Back to Login"                                         */}
      {/* ========================================================================= */}
      {currentStep === "STEP_3_REQUEST_SENT" && (
        <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-2xl p-8 sm:p-10 shadow-2xl text-center space-y-4">
          <div className="inline-block px-3.5 py-1 bg-amber-500/15 border border-amber-500/30 rounded-full text-xs font-bold text-amber-400 tracking-wider shadow-xs">
            Status: Pending
          </div>

          <h2 className="text-2xl font-bold text-white tracking-tight">Request Sent</h2>

          <p className="text-slate-300 text-sm leading-relaxed max-w-sm mx-auto">
            Your request has been sent to the HR Admin. Please wait for approval.
          </p>

          <div className="pt-4">
            <button
              id="back-to-login-btn"
              type="button"
              onClick={handleBackToLogin}
              className="w-full py-3 px-4 bg-slate-700 hover:bg-slate-600 active:bg-slate-800 text-white font-medium rounded-xl text-sm transition-colors cursor-pointer shadow-sm"
            >
              Back to Login
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: EMAIL INPUT / GOOGLE SIGN-IN INTERFACE                            */}
      {/* Interface asking "Give your email id" with a "Submit Request" / "Continue"*/}
      {/* button.                                                                   */}
      {/* ========================================================================= */}
      {currentStep === "STEP_2_EMAIL_INPUT" && (
        <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-2xl p-8 sm:p-10 shadow-2xl">
          <div className="flex items-center justify-center gap-2 mb-6">
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.1 8.9 5 12 5z"
              />
              <path
                fill="#4285F4"
                d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
              />
              <path
                fill="#FBBC05"
                d="M5.3 14.7c-.2-.7-.4-1.5-.4-2.3 0-.8.2-1.6.4-2.3L1.6 7.2C.6 9.2 0 11.5 0 14s.6 4.8 1.6 6.8l3.7-2.9z"
              />
              <path
                fill="#34A853"
                d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.1-6.7-5.1L1.6 16.1C3.5 20.1 7.4 23 12 23z"
              />
            </svg>
            <h2 className="text-xl font-bold text-white tracking-tight">Sign in with Google</h2>
          </div>

          <form onSubmit={handleEmailSubmit} className="space-y-5">
            <div>
              <label htmlFor="user-email-input" className="block text-sm font-semibold text-slate-200 mb-2">
                Give your email id
              </label>
              <input
                id="user-email-input"
                type="email"
                required
                autoFocus
                placeholder="name@example.com"
                value={emailInput}
                onChange={(e) => {
                  setEmailInput(e.target.value);
                  if (validationError) setValidationError("");
                }}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
              {validationError && (
                <p className="text-red-400 text-xs mt-1.5">{validationError}</p>
              )}
            </div>

            <div className="space-y-2.5 pt-1">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-colors cursor-pointer shadow-md disabled:opacity-60 flex items-center justify-center gap-2"
              >
                <span>{isSubmitting ? "Submitting..." : "Submit Request"}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setValidationError("");
                  setCurrentStep("STEP_1_LANDING");
                }}
                className="w-full py-2 text-slate-400 hover:text-slate-200 text-xs font-medium transition-colors cursor-pointer"
              >
                Back
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 1: INITIAL LANDING PAGE                                              */}
      {/* Render a card with title "Welcome to Modela Connect".                     */}
      {/* Provide a single button: "Sign in with Google".                           */}
      {/* Do NOT show the "Request Sent" status card on initial page load.          */}
      {/* ========================================================================= */}
      {currentStep === "STEP_1_LANDING" && (
        <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-2xl p-8 sm:p-10 shadow-2xl">
          <h1 className="text-2xl sm:text-3xl font-bold text-white text-center mb-8 tracking-tight">
            Welcome to Modela Connect
          </h1>

          <button
            onClick={handleStartGoogleSignIn}
            className="w-full py-3.5 px-4 bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-900 font-medium rounded-xl flex items-center justify-center gap-3 text-base transition-colors shadow-sm cursor-pointer"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.1 8.9 5 12 5z"
              />
              <path
                fill="#4285F4"
                d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
              />
              <path
                fill="#FBBC05"
                d="M5.3 14.7c-.2-.7-.4-1.5-.4-2.3 0-.8.2-1.6.4-2.3L1.6 7.2C.6 9.2 0 11.5 0 14s.6 4.8 1.6 6.8l3.7-2.9z"
              />
              <path
                fill="#34A853"
                d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.1-6.7-5.1L1.6 16.1C3.5 20.1 7.4 23 12 23z"
              />
            </svg>
            <span>Sign in with Google</span>
          </button>
        </div>
      )}
    </div>
  );
};

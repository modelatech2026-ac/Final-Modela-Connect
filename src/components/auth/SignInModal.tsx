/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { X } from "lucide-react";
import { useAuth, SESSION_REQUEST_KEY } from "../../context/AuthContext";

export const SignInModal: React.FC = () => {
  const {
    isSignInModalOpen,
    setIsSignInModalOpen,
    loginWithGoogle,
  } = useAuth();

  const [step, setStep] = useState<"INITIAL" | "EMAIL">("INITIAL");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isSignInModalOpen) return null;

  const handleClose = () => {
    setIsSignInModalOpen(false);
    setStep("INITIAL");
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      setError("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const cleanName = cleanEmail.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      const res = await loginWithGoogle(cleanEmail, cleanName);
      if (res.success || res.status === "Approved") {
        sessionStorage.setItem(SESSION_REQUEST_KEY, cleanEmail);
        handleClose();
      } else {
        setError(res.message || "Failed to submit request.");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to submit request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="signin-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        id="signin-modal-container"
        className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-2xl p-8 sm:p-10 shadow-2xl relative"
      >
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {step === "INITIAL" ? (
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-8 tracking-tight">
              Welcome to Modela Connect
            </h2>

            <button
              onClick={() => setStep("EMAIL")}
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
        ) : (
          <div>
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

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-2">
                  Give your email id
                </label>
                <input
                  type="email"
                  required
                  autoFocus
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError("");
                  }}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
                {error && <p className="text-red-400 text-xs mt-1.5">{error}</p>}
              </div>

              <div className="space-y-2 pt-1">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-colors cursor-pointer shadow-md disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  <span>{isSubmitting ? "Submitting..." : "Submit Request"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStep("INITIAL")}
                  className="w-full py-2 text-slate-400 hover:text-slate-200 text-xs font-medium transition-colors cursor-pointer"
                >
                  Back
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

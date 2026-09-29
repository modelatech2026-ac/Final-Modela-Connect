import React, { useState } from "react";
import {
  Building,
  Clock,
  ShieldAlert,
  Trash2,
  Lock,
  Moon,
  Sun,
  Laptop,
  User,
  Bell,
  ShieldCheck,
  Palette,
} from "lucide-react";
import { useToast } from "../../context/ToastContext";
import { useData } from "../../context/DataContext";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { DataPurgeModal } from "../admin/DataPurgeModal";
import { TwoFactorSecurityCard } from "../security/TwoFactorSecurityCard";

export const SettingsModule: React.FC = () => {
  const { success } = useToast();
  const { employees } = useData();
  const { currentRole, currentUser } = useAuth();
  const { theme, setTheme } = useTheme();

  // Tenant / Operational Settings
  const [orgName, setOrgName] = useState("Modela Connect Enterprise");
  const [tenantId] = useState("US-EAST-ORG01");
  const [shiftStart, setShiftStart] = useState("09:30");
  const [shiftEnd, setShiftEnd] = useState("18:45");
  const [gracePeriod, setGracePeriod] = useState("15");
  const [isPurgeModalOpen, setIsPurgeModalOpen] = useState(false);

  // Personal Profile Settings for Employee
  const [displayName, setDisplayName] = useState(currentUser?.name || "Subhasish Das");
  const [notificationsEmail, setNotificationsEmail] = useState(true);
  const [notificationsSlack, setNotificationsSlack] = useState(true);

  const isSuperAdmin = currentRole === "Super Admin";
  const isHRAdmin = currentRole === "HR Admin" || currentRole === "Admin";
  const isEmployee = currentRole === "Employee";

  const handleSaveOperationalSettings = (e: React.FormEvent) => {
    e.preventDefault();
    success("Operational Settings Saved", "Tenant shift policies and department parameters updated.");
  };

  const handleSavePersonalProfile = (e: React.FormEvent) => {
    e.preventDefault();
    success("Personal Preferences Saved", "Your profile details and theme preferences have been applied.");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
              {isEmployee ? "Personal Profile & Preferences" : "System Settings & Tenant Policy"}
            </h1>
            {!isEmployee && (
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-700">
                Role: {currentRole}
              </span>
            )}
          </div>
          <p className="text-stone-500 dark:text-stone-400 text-xs mt-0.5">
            {isEmployee
              ? "Manage your display credentials, application theme, and notification preferences."
              : "Manage organization parameters, working hour shift tolerances, and tenant policies."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Personal Preferences & Operational Settings */}
        <div className="lg:col-span-7 space-y-6">
          {/* Section 1: Personal Profile & Theme (Accessible to All Roles, Emphasized for Employee) */}
          <form
            onSubmit={handleSavePersonalProfile}
            className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4 text-xs"
          >
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-500" />
              Personal Profile & Workspace Preferences
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500/40 focus:outline-none"
                />
              </div>

              {!isEmployee && (
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Assigned Clearance Role
                  </label>
                  <input
                    type="text"
                    value={currentRole}
                    disabled
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-400 cursor-not-allowed font-medium"
                  />
                </div>
              )}
            </div>

            {/* Theme Selector */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                <Palette className="w-4 h-4 text-blue-500" />
                Visual Appearance Mode
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setTheme("light")}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    theme === "light"
                      ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 text-blue-800 dark:text-sky-300 shadow-2xs"
                      : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  }`}
                >
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span>Light</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme("dark")}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    theme === "dark"
                      ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 text-blue-800 dark:text-sky-300 shadow-2xs"
                      : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  }`}
                >
                  <Moon className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Dark</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme("system")}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    theme === "system"
                      ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 text-blue-800 dark:text-sky-300 shadow-2xs"
                      : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  }`}
                >
                  <Laptop className="w-3.5 h-3.5 text-slate-500" />
                  <span>System</span>
                </button>
              </div>
            </div>

            {/* Notification Toggles */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2">
                <Bell className="w-4 h-4 text-blue-500" />
                Event Notifications
              </label>
              <div className="flex flex-col sm:flex-row gap-4">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationsEmail}
                    onChange={(e) => setNotificationsEmail(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-slate-600 dark:text-slate-400">Email Attendance & Payslip Alerts</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationsSlack}
                    onChange={(e) => setNotificationsSlack(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-slate-600 dark:text-slate-400">Biometric Verification Confirmations</span>
                </label>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Save Preferences
              </button>
            </div>
          </form>

          {/* Section 2: Enterprise Multi-Factor Authentication (2FA) */}
          <TwoFactorSecurityCard />

          {/* Section 3: Corporate Shift & Ingress Policies */}
          <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4 text-xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600 dark:text-sky-400" />
                Standard Shift & Grace Period Tolerances
              </h3>
              {isEmployee && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-900">
                  <Lock className="w-3 h-3" />
                  Read-Only Policy
                </span>
              )}
            </div>

            <form onSubmit={handleSaveOperationalSettings} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Shift Ingress
                  </label>
                  <input
                    type="time"
                    value={shiftStart}
                    disabled={isEmployee}
                    onChange={(e) => setShiftStart(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-xl focus:outline-none ${
                      isEmployee
                        ? "bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 text-slate-500 cursor-not-allowed"
                        : "border-slate-300 dark:border-slate-700 bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/40"
                    }`}
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Shift Egress
                  </label>
                  <input
                    type="time"
                    value={shiftEnd}
                    disabled={isEmployee}
                    onChange={(e) => setShiftEnd(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-xl focus:outline-none ${
                      isEmployee
                        ? "bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 text-slate-500 cursor-not-allowed"
                        : "border-slate-300 dark:border-slate-700 bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/40"
                    }`}
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Late Grace (Mins)
                  </label>
                  <input
                    type="number"
                    value={gracePeriod}
                    disabled={isEmployee}
                    onChange={(e) => setGracePeriod(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-xl focus:outline-none ${
                      isEmployee
                        ? "bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 text-slate-500 cursor-not-allowed"
                        : "border-slate-300 dark:border-slate-700 bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/40"
                    }`}
                  />
                </div>
              </div>

              {!isEmployee && (
                <div className="pt-1">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    Save Operational Tolerances
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Right Column: High-Level System Tenant Options (Strictly Super Admin) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Tenant Identity Block */}
          <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Building className="w-4 h-4 text-blue-600 dark:text-sky-400" />
                Tenant Infrastructure
              </h3>
              {!isSuperAdmin && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-900">
                  <Lock className="w-3 h-3" />
                  Super Admin Only
                </span>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Organization Registered Name
                </label>
                <input
                  type="text"
                  value={orgName}
                  disabled={!isSuperAdmin && !isHRAdmin}
                  onChange={(e) => setOrgName(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-xl focus:outline-none ${
                    !isSuperAdmin && !isHRAdmin
                      ? "bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 text-slate-500 cursor-not-allowed"
                      : "border-slate-300 dark:border-slate-700 bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/40"
                  }`}
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tenant Cloud Enclave ID
                </label>
                <input
                  type="text"
                  value={tenantId}
                  disabled
                  className="w-full px-3 py-2 font-mono bg-slate-100 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-400 cursor-not-allowed"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  High-level tenant enclave routing is locked to prevent cross-tenant leakage.
                </p>
              </div>
            </div>
          </div>

          {/* Super Admin Master Purge Card */}
          <div className="p-6 bg-rose-50/70 dark:bg-[#1C1315] rounded-2xl border-2 border-rose-300/80 dark:border-rose-900/60 shadow-sm space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-rose-950 dark:text-rose-200">
                      Master Purge & Data Enclave
                    </h3>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-rose-600 text-white">
                      Strictly Super Admin
                    </span>
                  </div>
                  <p className="text-[11px] text-rose-700 dark:text-rose-300 mt-0.5">
                    High-level tenant database purge and storage asset cascade wipe.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-white dark:bg-stone-900/90 rounded-xl border border-rose-200 dark:border-rose-900/40 text-xs space-y-2">
              <div className="flex items-center justify-between text-[11px] text-stone-600 dark:text-stone-400">
                <span>Active Employee Directory:</span>
                <span className="font-bold text-stone-900 dark:text-stone-100">{employees.length} Records</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-stone-600 dark:text-stone-400">
                <span>Tenant Isolation:</span>
                <span className="font-semibold text-rose-600 dark:text-rose-400 text-right">
                  Enclave US-EAST-ORG01
                </span>
              </div>
            </div>

            <div className="pt-1">
              {isSuperAdmin ? (
                <button
                  id="open-master-purge-modal-btn"
                  type="button"
                  onClick={() => setIsPurgeModalOpen(true)}
                  className="w-full justify-center px-4 py-2.5 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Execute Complete Data & Media Purge</span>
                </button>
              ) : (
                <div className="flex items-center gap-2 p-3 bg-rose-100/60 dark:bg-rose-950/40 rounded-xl text-xs text-rose-800 dark:text-rose-300 font-medium">
                  <Lock className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                  <span>
                    Locked for <strong>{currentRole}</strong>. High-level system tenant options require <strong>Super Admin</strong> clearance.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <DataPurgeModal
        isOpen={isPurgeModalOpen}
        onClose={() => setIsPurgeModalOpen(false)}
      />
    </div>
  );
};

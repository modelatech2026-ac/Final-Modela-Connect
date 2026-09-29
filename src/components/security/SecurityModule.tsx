import React, { useState } from "react";
import { Sliders, Globe } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { AccessRestricted } from "../ui/AccessRestricted";
import { useToast } from "../../context/ToastContext";
import { TwoFactorSecurityCard } from "./TwoFactorSecurityCard";

export const SecurityModule: React.FC = () => {
  const { currentRole } = useAuth();
  const { success } = useToast();

  const [threshold, setThreshold] = useState(85);
  const [ipAllowlist, setIpAllowlist] = useState("192.168.1.0/24\n10.0.0.0/16");
  const [livenessCheck, setLivenessCheck] = useState(true);

  const hasAccess = ["Super Admin", "Security Officer"].includes(currentRole);

  if (!hasAccess) {
    return (
      <AccessRestricted
        allowedRoles={["Super Admin", "Security Officer"]}
        requiredRoles={["Super Admin", "Security Officer"]}
        moduleName="Perimeter & Identity Security Enclave"
        description="Physical biometric parameters and IP perimeter enforcement require high-security clearance."
      />
    );
  }

  const handleSaveSecurity = (e: React.FormEvent) => {
    e.preventDefault();
    success(
      "Security Policy Updated",
      `Biometric matching threshold updated to ${threshold}% with Liveness Detection ${livenessCheck ? "ACTIVE" : "DISABLED"}.`
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-slate-100">
              Perimeter & Identity Security
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
              High Assurance Enclave
            </span>
          </div>
          <p className="text-stone-500 dark:text-slate-400 text-xs mt-0.5">
            Biometric optical threshold configuration and perimeter IP rules.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Biometric & Perimeter Form */}
        <div className="lg:col-span-6 space-y-6">
          <form
            onSubmit={handleSaveSecurity}
            className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-stone-200/80 dark:border-slate-800 shadow-2xs space-y-5"
          >
            <h3 className="text-sm font-bold text-stone-900 dark:text-slate-100 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-600 dark:text-sky-400" />
              Biometric Optical Threshold Settings
            </h3>

            <div>
              <div className="flex justify-between items-center text-xs mb-2">
                <span className="font-semibold text-stone-700 dark:text-slate-300">
                  Minimum AI Vector Confidence Match
                </span>
                <span className="font-mono font-bold text-blue-700 dark:text-sky-400 px-2 py-0.5 bg-blue-50 dark:bg-blue-950/50 rounded border border-blue-200 dark:border-blue-800">
                  {threshold}%
                </span>
              </div>
              <input
                id="threshold-slider"
                type="range"
                min="70"
                max="99"
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="w-full h-2 bg-stone-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-[10px] text-stone-400 dark:text-slate-400 mt-1">
                <span>70% (Permissive)</span>
                <span>85% (Industry Standard)</span>
                <span>99% (High Security)</span>
              </div>
            </div>

            <div className="p-4 bg-stone-50 dark:bg-slate-800/90 rounded-xl border border-stone-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-stone-900 dark:text-slate-100">Anti-Spoofing Liveness Check</div>
                <div className="text-[11px] text-stone-500 dark:text-slate-400">
                  Detects screen replays and 3D silicone masks using optical depth
                </div>
              </div>
              <input
                type="checkbox"
                checked={livenessCheck}
                onChange={(e) => setLivenessCheck(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-white dark:bg-slate-700 border-stone-300 dark:border-slate-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-stone-500 dark:text-slate-400" />
                Authorized Gateway CIDR IP Blocks
              </label>
              <textarea
                rows={3}
                value={ipAllowlist}
                onChange={(e) => setIpAllowlist(e.target.value)}
                placeholder="192.168.1.0/24&#10;10.0.0.0/16"
                className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-stone-300 dark:border-slate-700 bg-white text-slate-900 placeholder:text-slate-400 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/40 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              Apply Security Baseline
            </button>
          </form>
        </div>

        {/* Right: RBAC Matrix */}
        <div className="lg:col-span-6 space-y-6">
          <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-stone-200/80 dark:border-slate-800 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400">
              Role-Based Access Control (RBAC) Matrix
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-200 dark:border-slate-800 text-stone-500 dark:text-slate-400 text-[10px]">
                    <th className="pb-2">Role</th>
                    <th className="pb-2">Employees</th>
                    <th className="pb-2">Payroll</th>
                    <th className="pb-2">Audit Logs</th>
                    <th className="pb-2">Security</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-slate-800 font-medium">
                  <tr>
                    <td className="py-2 font-bold text-stone-900 dark:text-slate-100">Super Admin</td>
                    <td className="py-2 text-blue-700 dark:text-sky-400">Full CRUD</td>
                    <td className="py-2 text-blue-700 dark:text-sky-400">Disburse</td>
                    <td className="py-2 text-blue-700 dark:text-sky-400">Inspect</td>
                    <td className="py-2 text-blue-700 dark:text-sky-400">Configure</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-bold text-stone-900 dark:text-slate-100">HR Admin</td>
                    <td className="py-2 text-blue-700 dark:text-sky-400">Full CRUD</td>
                    <td className="py-2 text-blue-700 dark:text-sky-400">Disburse</td>
                    <td className="py-2 text-blue-700 dark:text-sky-400">Inspect</td>
                    <td className="py-2 text-stone-400 dark:text-slate-500">Restricted</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-bold text-stone-900 dark:text-slate-100">Security Officer</td>
                    <td className="py-2 text-stone-600 dark:text-slate-300">Read-only</td>
                    <td className="py-2 text-stone-400 dark:text-slate-500">Restricted</td>
                    <td className="py-2 text-blue-700 dark:text-sky-400">Inspect</td>
                    <td className="py-2 text-blue-700 dark:text-sky-400">Configure</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-bold text-stone-900 dark:text-slate-100">Manager</td>
                    <td className="py-2 text-stone-600 dark:text-slate-300">Direct Reports</td>
                    <td className="py-2 text-stone-400 dark:text-slate-500">Restricted</td>
                    <td className="py-2 text-stone-400 dark:text-slate-500">Restricted</td>
                    <td className="py-2 text-stone-400 dark:text-slate-500">Restricted</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-bold text-stone-900 dark:text-slate-100">Employee</td>
                    <td className="py-2 text-stone-600 dark:text-slate-300">Self Only</td>
                    <td className="py-2 text-stone-400 dark:text-slate-500">Self Stubs</td>
                    <td className="py-2 text-stone-400 dark:text-slate-500">Restricted</td>
                    <td className="py-2 text-stone-400 dark:text-slate-500">Restricted</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Enterprise Two-Factor Authentication Management */}
      <TwoFactorSecurityCard />
    </div>
  );
};

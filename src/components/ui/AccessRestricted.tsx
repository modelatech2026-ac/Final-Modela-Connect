import React from "react";
import { ShieldAlert, ArrowRight, UserCheck } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { UserRole } from "../../types";

interface AccessRestrictedProps {
  moduleName: string;
  allowedRoles?: UserRole[];
  requiredRoles?: UserRole[];
  description?: string;
}

export const AccessRestricted: React.FC<AccessRestrictedProps> = ({
  moduleName,
  allowedRoles,
  requiredRoles,
  description = "You do not have the designated clearance to view or modify this administrative enclave.",
}) => {
  const { currentRole, switchDemoUser } = useAuth();
  const roles = allowedRoles || requiredRoles || [];

  return (
    <div className="flex flex-col items-center justify-center min-h-[55vh] p-6 text-center">
      <div className="max-w-md w-full p-8 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm space-y-5">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-xs">
          <ShieldAlert className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Access Restricted: {moduleName}
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{description}</p>
        </div>

        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-800 text-left text-xs space-y-1.5">
          <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
            <span>Your Current Role:</span>
            <span className="font-semibold text-rose-600 dark:text-rose-400 px-2 py-0.5 bg-rose-50 dark:bg-rose-950/50 rounded-md border border-rose-200 dark:border-rose-900">
              {currentRole}
            </span>
          </div>
          <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-800">
            <span>Required Clearance:</span>
            <span className="font-medium text-blue-600 dark:text-sky-400">
              {roles.length > 0 ? roles.join(" or ") : "Authorized Personnel"}
            </span>
          </div>
        </div>

        <div className="pt-2 space-y-2.5">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Test this permission boundary by quick-switching to an authorized role:
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {Array.from(new Set<UserRole>(roles.map((r) => (r === "HR Admin" ? "Admin" : r)))).map((role) => (
              <button
                key={role}
                id={`switch-to-${role.toLowerCase().replace(/\s+/g, "-")}`}
                onClick={() => switchDemoUser(role)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5 text-sky-200" />
                <span>Switch to {role}</span>
                <ArrowRight className="w-3 h-3 text-blue-200" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

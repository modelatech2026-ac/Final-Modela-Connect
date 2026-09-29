/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  CalendarCheck,
  ScanFace,
  CreditCard,
  FileCheck2,
  BarChart3,
  ShieldAlert,
  Settings,
  History,
  Lock,
  ChevronLeft,
  ChevronRight,
  Shield,
  Layers,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useData } from "../../context/DataContext";
import { UserRole } from "../../types";
import { ModelaLogo } from "../ui/ModelaLogo";

interface NavItemConfig {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  allowedRoles?: (UserRole | string)[];
  restrictedForEmployee?: boolean;
  superAdminOnly?: boolean;
}

const ALL_NAV_ITEMS: NavItemConfig[] = [
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    to: "/chat",
    label: "Gemini AI Workspace",
    icon: Sparkles,
  },
  {
    to: "/admin",
    label: "User Management",
    icon: ShieldCheck,
    allowedRoles: ["SUPERADMIN", "ADMIN", "Super Admin", "Admin", "HR Admin"],
    restrictedForEmployee: true,
  },
  {
    to: "/employees",
    label: "Employees",
    icon: Users,
    allowedRoles: ["SUPERADMIN", "ADMIN", "Super Admin", "Admin", "HR Admin", "SUPER_ADMIN", "HR_ADMIN"],
    restrictedForEmployee: true,
  },
  {
    to: "/onboarding",
    label: "Onboarding",
    icon: UserPlus,
    allowedRoles: ["SUPERADMIN", "ADMIN", "Super Admin", "Admin", "HR Admin", "HR"],
    restrictedForEmployee: true,
  },
  {
    to: "/attendance",
    label: "Attendance",
    icon: CalendarCheck,
  },
  {
    to: "/facial-verification",
    label: "Facial Verification",
    icon: ScanFace,
  },
  {
    to: "/payroll",
    label: "Payroll",
    icon: CreditCard,
    allowedRoles: ["SUPERADMIN", "ADMIN", "Super Admin", "Admin", "HR", "Manager"],
    restrictedForEmployee: true,
  },
  {
    to: "/requests",
    label: "Requests",
    icon: FileCheck2,
  },
  {
    to: "/reports",
    label: "Reports",
    icon: BarChart3,
    allowedRoles: ["SUPERADMIN", "ADMIN", "Super Admin", "Admin", "HR Admin", "HR", "Manager", "Developers"],
    restrictedForEmployee: true,
  },
  {
    to: "/activity-logs",
    label: "Activity Logs",
    icon: History,
    allowedRoles: ["SUPERADMIN", "ADMIN", "Super Admin", "Admin", "Security Officer", "Developers", "HR"],
    restrictedForEmployee: true,
  },
  {
    to: "/admin-nexus",
    label: "ADMIN NEXUS",
    icon: ShieldAlert,
    allowedRoles: ["SUPERADMIN", "Super Admin"],
    superAdminOnly: true,
  },
  {
    to: "/starone-landing",
    label: "Landing Page",
    icon: Layers,
  },
  {
    to: "/settings",
    label: "Settings",
    icon: Settings,
  },
];

interface SidebarProps {
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpenMobile = false, onCloseMobile }) => {
  const { currentUser, currentRole, isSuperAdmin, isAdmin, isEmployee } = useAuth();
  const { pendingAuthRequestsCount } = useData();
  const [collapsed, setCollapsed] = useState(false);

  const canManageAdmin = isSuperAdmin || isAdmin;

  // USER UI: Block user-side access to admin routes (/admin/*, /employees, /activity-logs, etc.)
  const visibleNavItems = ALL_NAV_ITEMS.filter((item) => {
    if (item.superAdminOnly) {
      return isSuperAdmin;
    }
    if (!canManageAdmin) {
      if (item.restrictedForEmployee) return false;
      if (item.to === "/starone-landing" || item.to === "/admin-nexus") return false;
    }
    return true;
  });

  // Dynamic contextual badge for active persona
  const getItemBadge = (item: NavItemConfig, isLockedForUser: boolean) => {
    if (!canManageAdmin) {
      return undefined;
    }

    if (isLockedForUser) {
      return {
        label: "Locked",
        type: "locked" as const,
      };
    }

    switch (item.to) {
      case "/admin-nexus":
        if (pendingAuthRequestsCount > 0) {
          return {
            label: `${pendingAuthRequestsCount} Pending`,
            type: "warning" as const,
          };
        }
        return { label: "Nexus", type: "success" as const };
      case "/employees":
        return { label: "Master", type: "info" as const };
      default:
        return undefined;
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          id="sidebar-mobile-backdrop"
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Main Sidebar Shell */}
      <aside
        id="app-navigation-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-[#080E1C] dark:bg-[#060A14] text-slate-100 transition-all duration-300 ease-in-out border-r border-[#1E293B] shadow-2xl ${
          collapsed ? "w-20" : "w-64"
        } ${
          isOpenMobile ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-[#1E293B] bg-[#0A1224] dark:bg-[#070D1A]">
          <div className="flex items-center gap-3 overflow-hidden">
            <ModelaLogo className="w-9 h-9 shrink-0 shadow-md" />
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5 truncate">
                  Modela Connect
                </span>
                <span className="text-[11px] text-blue-400 font-medium truncate">
                  Enterprise Platform
                </span>
              </div>
            )}
          </div>

          {/* Desktop Collapse Toggle */}
          <button
            id="sidebar-collapse-toggle-btn"
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center justify-center w-7 h-7 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items List */}
        <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            {!collapsed ? "Operational Enclaves" : "•••"}
          </div>

          {visibleNavItems.map((item) => {
            const Icon = item.icon;

            // Determine if item is restricted for this user
            // Padlock icon required next to restricted menu items when logged in as an EMPLOYEE
            const isLocked =
              !isSuperAdmin &&
              (isEmployee ? !!item.restrictedForEmployee : Boolean(item.allowedRoles && !item.allowedRoles.includes(currentRole)));

            const badgeInfo = getItemBadge(item, isLocked);

            return (
              <NavLink
                key={item.to}
                to={item.to}
                id={`nav-${item.to.replace("/", "") || "dashboard"}`}
                onClick={() => {
                  if (onCloseMobile) onCloseMobile();
                }}
                title={
                  isLocked
                    ? `Restricted: Requires administrative clearance`
                    : item.label
                }
                className={({ isActive }) =>
                  `group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-blue-600/20 text-sky-400 font-semibold border border-sky-400/30 shadow-xs"
                      : isLocked
                      ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent opacity-80"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/60 border border-transparent"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {/* Active Accent Bar Indicator */}
                    {isActive && (
                      <span className="absolute left-0 top-2 bottom-2 w-1.5 rounded-r-full bg-gradient-to-b from-blue-500 to-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.5)]" />
                    )}

                    <div className="shrink-0 relative flex items-center justify-center">
                      <Icon
                        className={`w-5 h-5 transition-transform duration-200 ${
                          isActive
                            ? "text-sky-400 scale-105"
                            : isLocked
                            ? "text-slate-400 group-hover:text-amber-400"
                            : "text-slate-400 group-hover:text-slate-200 group-hover:scale-105"
                        }`}
                      />

                      {/* Small Lock Indicator Dot when collapsed */}
                      {collapsed && isLocked && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full flex items-center justify-center shadow-xs">
                          <Lock className="w-2 h-2 text-slate-950 stroke-[3]" />
                        </span>
                      )}

                      {/* Small Pending Request Badge Dot when collapsed on Admin Nexus */}
                      {collapsed && item.to === "/admin-nexus" && pendingAuthRequestsCount > 0 && (
                        <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 bg-[#FACC15] text-slate-950 text-[9px] font-black rounded-full flex items-center justify-center shadow-xs animate-pulse">
                          {pendingAuthRequestsCount}
                        </span>
                      )}
                    </div>

                    {!collapsed && (
                      <div className="flex-1 flex items-center justify-between min-w-0">
                        <span className="truncate flex items-center gap-1.5">
                          {item.label}
                          {/* Padlock icon next to restricted menu items when logged in as an EMPLOYEE */}
                          {isLocked && (
                            <Lock
                              className="w-3.5 h-3.5 text-amber-400 shrink-0 inline-block animate-pulse"
                              aria-label="Restricted Module"
                            />
                          )}
                        </span>

                        {/* Badges / Lock Pill */}
                        {badgeInfo && (
                          <span
                            className={`ml-1 text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0 leading-tight whitespace-nowrap flex items-center gap-1 ${
                              badgeInfo.type === "locked"
                                ? "bg-amber-400/20 text-amber-300 border border-amber-400/40"
                                : badgeInfo.type === "warning"
                                ? "bg-[#FACC15] text-slate-950 font-bold border border-yellow-300 shadow-xs animate-pulse"
                                : badgeInfo.type === "info"
                                ? "bg-sky-400/20 text-sky-300 border border-sky-400/30"
                                : "bg-blue-400/20 text-blue-300 border border-blue-400/30"
                            }`}
                          >
                            {badgeInfo.type === "locked" && <Lock className="w-2.5 h-2.5" />}
                            {badgeInfo.label}
                          </span>
                        )}
                      </div>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Active Role Clearance Enclave Banner */}
        <div className="p-3 border-t border-[#1E293B] bg-[#0A1224] dark:bg-[#070D1A]">
          {!collapsed ? (
            canManageAdmin ? (
              <div className="p-2.5 rounded-xl bg-[#0F172A] border border-[#1E293B] text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Identity Anchor</span>
                  <span className="font-mono text-sky-300 font-bold text-[11px] bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-800/50">
                    {currentUser?.employeeId || "MOD001"}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-white/5">
                  <span className="text-slate-400 font-medium flex items-center gap-1">
                    <Shield className="w-3 h-3 text-sky-400" />
                    Clearance
                  </span>
                  <span className="text-[11px] font-semibold text-blue-300">
                    {currentRole.toUpperCase()}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-2.5 rounded-xl bg-[#0F172A] border border-[#1E293B] text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Session Status</span>
                  <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Active
                  </span>
                </div>
              </div>
            )
          ) : (
            <div className="flex justify-center" title={canManageAdmin ? `Clearance: ${currentRole}` : "Active Session"}>
              <Shield className="w-5 h-5 text-sky-400" />
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

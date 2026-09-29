import React, { useState, useRef, useEffect } from "react";
import {
  Search,
  Bell,
  LogOut,
  ChevronDown,
  Menu,
  Shield,
  Clock,
  Sparkles,
  ExternalLink,
  Users,
  Check,
  KeyRound,
  LogIn,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useData } from "../../context/DataContext";
import { UserRole } from "../../types";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "./ThemeToggle";
import { ModelaLogo } from "../ui/ModelaLogo";
import { useTwoFactor } from "../../context/TwoFactorContext";

const getRoleBadgeStyle = (badge?: string) => {
  switch (badge) {
    case "Super Admin":
    case "SUPERADMIN":
      return "bg-rose-100 text-rose-800 dark:bg-rose-950/90 dark:text-rose-300 border-rose-300 dark:border-rose-800";
    case "HR":
    case "HR Admin":
      return "bg-purple-100 text-purple-800 dark:bg-purple-950/90 dark:text-purple-300 border-purple-300 dark:border-purple-800";
    case "Manager":
      return "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/90 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800";
    case "Developers":
    case "Developer":
      return "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/90 dark:text-cyan-300 border-cyan-300 dark:border-cyan-800";
    case "Admin":
      return "bg-blue-100 text-blue-800 dark:bg-blue-950/90 dark:text-blue-300 border-blue-300 dark:border-blue-800";
    case "Employee":
    default:
      return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700";
  }
};

interface TopBarProps {
  onToggleSidebar?: () => void;
  onSearch?: (query: string) => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onToggleSidebar, onSearch }) => {
  const {
    currentUser,
    currentRole,
    logout,
    isSuperAdmin,
    isAdmin,
  } = useAuth();
  const { activityLogs } = useData();
  const { isEnabled: is2FAEnabled, openSetupModal, openBackupCodesModal } = useTwoFactor();
  const navigate = useNavigate();

  const canManageAdmin = isSuperAdmin || isAdmin;

  const [searchVal, setSearchVal] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const notificationRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close popovers on click outside or Escape key press
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setShowUserMenu(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowNotifications(false);
        setShowUserMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchVal(val);
    if (onSearch) onSearch(val);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      navigate(`/employees?q=${encodeURIComponent(searchVal.trim())}`);
    }
  };

  const unreadAlerts = activityLogs.slice(0, 4);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 bg-white/95 dark:bg-[#070D1A]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 shadow-2xs transition-colors duration-200">
      {/* Left: Mobile Sidebar Toggle & Application Brand Header */}
      <div className="flex items-center gap-3 flex-1 min-w-0 mr-4">
        {onToggleSidebar && (
          <button
            id="mobile-sidebar-toggle-btn"
            onClick={onToggleSidebar}
            className="p-2 -ml-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden shrink-0"
            aria-label="Toggle Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Modela Connect Enterprise Header Identity */}
        <div className="flex items-center gap-3">
          <ModelaLogo className="w-7 h-7 sm:w-8 sm:h-8" />
          <div className="flex flex-col min-w-0 pr-2">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm md:text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight truncate leading-tight">
                Modela Connect
              </span>
              <span className="hidden sm:inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                Active Session
              </span>
            </div>
            <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
              Enterprise Workforce Platform
            </span>
          </div>
        </div>

        {/* Global Quick Search - Admin Only */}
        {canManageAdmin && (
          <form onSubmit={handleSearchSubmit} className="relative hidden md:block w-56 lg:w-72 ml-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              id="global-search-input"
              type="text"
              placeholder="Search employees..."
              value={searchVal}
              onChange={handleSearchChange}
              className="w-full pl-8.5 pr-3 py-1.5 text-xs bg-slate-100/80 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-900 focus:bg-white dark:focus:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 border border-slate-200/60 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
            />
          </form>
        )}
      </div>

      {/* Right: Theme Toggle, Notifications Popover, User Profile */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Dynamic Light/Dark Mode Theme Toggle */}
        <ThemeToggle />

        {/* Notifications Popover with Click-Outside & Escape Handling - Admin Only (Approval / Audit logs) */}
        {canManageAdmin && (
          <div ref={notificationRef} className="relative">
            <button
              id="notifications-bell-btn"
              type="button"
              onClick={() => {
                setShowNotifications((prev) => !prev);
                setShowUserMenu(false);
              }}
              aria-expanded={showNotifications}
              aria-haspopup="true"
              className={`relative p-2 rounded-xl transition-colors cursor-pointer ${
                showNotifications
                  ? "bg-blue-100 dark:bg-blue-950/60 text-blue-900 dark:text-sky-300"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
              </span>
            </button>

            {showNotifications && (
              <div
                id="notifications-dropdown-menu"
                role="dialog"
                aria-label="Operational Alerts"
                className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-[#0B132B] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden"
              >
                <div className="p-3.5 bg-slate-50/90 dark:bg-[#080E1C] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">Operational Alerts</span>
                  </div>
                  <span className="text-[11px] font-medium text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                    Live Audit Feed
                  </span>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-80 overflow-y-auto">
                  {unreadAlerts.map((log) => (
                    <div
                      key={log.id}
                      id={`notification-alert-${log.id}`}
                      className="p-3 hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                          {log.module || "System"} • {log.action}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">
                          {log.timestamp
                            ? new Date(log.timestamp).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : ""}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-1">
                        {log.details ||
                          log.metadata?.note ||
                          log.metadata?.resultStatus ||
                          `Audit record generated by ${log.userName || log.executedBy || "System"}`}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-[#080E1C] border-t border-slate-200 dark:border-slate-800 text-center">
                  <button
                    id="view-all-logs-btn"
                    onClick={() => {
                      setShowNotifications(false);
                      navigate("/activity-logs");
                    }}
                    className="text-xs font-semibold text-blue-600 dark:text-sky-400 hover:text-blue-700 dark:hover:text-blue-300 inline-flex items-center gap-1 cursor-pointer"
                  >
                    View complete audit logs <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* User Profile & Role Dropdown with Click-Outside Handling */}
        <div ref={userMenuRef} className="relative">
          <button
            id="user-profile-menu-button"
            type="button"
            onClick={() => {
              setShowUserMenu((prev) => !prev);
              setShowNotifications(false);
            }}
            aria-expanded={showUserMenu}
            aria-haspopup="true"
            className="flex items-center gap-2.5 py-1.5 px-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-700/80 cursor-pointer"
          >
            {/* Standard plain text user identification - No Image / No Avatar */}
            <div className="text-left">
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">
                {currentUser?.name || "Authenticated User"}
              </div>
              {/* NEVER show roles in USER UI */}
              {canManageAdmin && (
                <div className="text-[11px] font-medium text-blue-600 dark:text-sky-400 flex items-center gap-1.5 mt-0.5">
                  <Shield className="w-2.5 h-2.5" />
                  <span>{currentUser?.role || currentRole}</span>
                </div>
              )}
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 ml-1" />
          </button>

          {showUserMenu && (
            <div
              id="user-menu-dropdown"
              className="absolute right-0 mt-2 w-72 sm:w-80 bg-white dark:bg-[#0B132B] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 p-2 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="p-3 bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-slate-200/60 dark:border-slate-800 mb-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{currentUser?.name}</p>
                  {/* NEVER show roles or role badges in USER UI */}
                  {canManageAdmin && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getRoleBadgeStyle(
                        currentUser?.roleBadge
                      )}`}
                    >
                      {currentUser?.roleBadge || currentRole}
                    </span>
                  )}
                </div>
                {/* NEVER show email, designation or employee anchor in USER UI */}
                {canManageAdmin && (
                  <>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {currentUser?.designation || "Enterprise Staff"}
                    </p>
                    <div className="mt-2 flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Employee Anchor:</span>
                      <span className="text-xs font-mono font-bold text-blue-700 dark:text-sky-400 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                        {currentUser?.employeeId || "MOD001"}
                      </span>
                    </div>
                  </>
                )}
              </div>

              <div className="pt-1 border-t border-slate-200/80 dark:border-slate-800 space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowUserMenu(false);
                    if (is2FAEnabled) {
                      openBackupCodesModal();
                    } else {
                      openSetupModal();
                    }
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-500" />
                    <span>2FA Security</span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      is2FAEnabled
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                    }`}
                  >
                    {is2FAEnabled ? "Active" : "Set Up"}
                  </span>
                </button>

                <button
                  id="user-menu-logout-btn"
                  onClick={() => {
                    setShowUserMenu(false);
                    logout();
                    navigate("/starone-landing");
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

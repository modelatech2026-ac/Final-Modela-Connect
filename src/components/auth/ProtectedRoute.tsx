/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { UserRole } from "../../types";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: (UserRole | "SUPERADMIN" | "ADMIN" | "EMPLOYEE" | "Super Admin" | "Admin" | "Employee" | string)[];
  moduleName?: string;
  description?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  moduleName = "Protected Module",
}) => {
  const { currentUser, isAuthenticated, isSuperAdmin, isAdmin, isEmployee, isApproved, currentRole, isLoading } = useAuth();
  const { error: toastError } = useToast();
  const location = useLocation();
  const hasTriggeredToastRef = useRef(false);

  // 1. Session Loading Gate: Prevent layout shift and flash-of-unauthorized-content
  if (isLoading) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center p-8 space-y-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-4 border-blue-500/20" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 animate-spin" />
        </div>
        <p className="text-xs text-stone-400 font-mono tracking-widest uppercase animate-pulse">
          Validating Security Clearance Matrix...
        </p>
      </div>
    );
  }

  // 2. Authentication and Authorization Status Verification
  // If user status is PENDING_APPROVAL or REJECTED or Guest, redirect to /starone-landing
  const isClearanceApproved = isAuthenticated && isApproved;

  if (!isClearanceApproved) {
    return <Navigate to="/starone-landing" replace state={{ from: location }} />;
  }

  // 3. Administrative Role Gate
  if (allowedRoles && allowedRoles.length > 0) {
    const isAllowed =
      isSuperAdmin ||
      allowedRoles.some((role) => {
        const normalized = role.trim().toUpperCase();
        if (normalized === "SUPERADMIN" || normalized === "SUPER ADMIN") return isSuperAdmin;
        if (normalized === "ADMIN" || normalized === "HR ADMIN") return isAdmin;
        if (normalized === "EMPLOYEE") return isEmployee;
        return role === currentRole || role === currentUser.role;
      });

    if (!isAllowed) {
      if (!hasTriggeredToastRef.current) {
        hasTriggeredToastRef.current = true;
        toastError(
          "Access Restricted",
          `Administrative clearance (${allowedRoles.join(" or ")}) required for ${moduleName}. Redirected to Dashboard.`
        );
      }
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
};

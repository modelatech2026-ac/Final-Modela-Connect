/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserRole, AuthorizationStatus } from "../types";

/**
 * Fallback list of Super Admin emails
 */
export const SUPER_ADMIN_EMAILS = [
  "modelatech2026@gmail.com",
  "sushoovandas@gmail.com",
];

/**
 * Checks whether a given status represents an Approved status.
 */
export function isApprovedStatus(status?: string | null): boolean {
  if (!status) return false;
  const s = status.trim().toUpperCase();
  return s === "APPROVED";
}

/**
 * Checks whether a given status represents a Pending status.
 */
export function isPendingStatus(status?: string | null): boolean {
  if (!status) return false;
  const s = status.trim().toUpperCase();
  return s === "PENDING" || s === "PENDING_APPROVAL";
}

/**
 * Checks whether a given status represents a Rejected status.
 */
export function isRejectedStatus(status?: string | null): boolean {
  if (!status) return false;
  const s = status.trim().toUpperCase();
  return s === "REJECTED";
}

/**
 * Checks whether a given role string represents the Super Admin role.
 */
export function isRoleSuperAdmin(role?: string | null): boolean {
  if (!role) return false;
  const normalized = role.trim().toUpperCase().replace(/[\s_-]+/g, "_");
  return (
    normalized === "SUPERADMIN" ||
    normalized === "SUPER_ADMIN" ||
    normalized === "PRIMARY_ARCHITECT"
  );
}

/**
 * Comprehensive Super Admin authorization check for a user profile:
 */
export function checkIsUserSuperAdmin(
  user?: {
    role?: string | null;
    isSuperAdmin?: boolean | null;
    email?: string | null;
    name?: string | null;
  } | null
): boolean {
  if (!user) return false;

  if (user.isSuperAdmin === true) return true;
  if (isRoleSuperAdmin(user.role)) return true;

  if (user.email) {
    const cleanEmail = user.email.trim().toLowerCase();
    if (SUPER_ADMIN_EMAILS.some((e) => e.toLowerCase() === cleanEmail)) {
      return true;
    }
  }

  if (user.name) {
    const cleanName = user.name.trim().toLowerCase();
    if (cleanName.includes("sushoovan")) {
      return true;
    }
  }

  return false;
}

/**
 * Checks whether a given role string represents an Admin or Super Admin role.
 * Covers Super Admin, HR Admin, Admin.
 */
export function isRoleAdmin(role?: string | null): boolean {
  if (!role) return false;
  if (isRoleSuperAdmin(role)) return true;
  const normalized = role.trim().toUpperCase().replace(/[\s_-]+/g, "_");
  return (
    normalized === "ADMIN" ||
    normalized === "HR_ADMIN" ||
    normalized === "HR" ||
    normalized === "HR_MANAGER"
  );
}

/**
 * Checks whether a given role string represents an HR role.
 */
export function isRoleHR(role?: string | null): boolean {
  if (!role) return false;
  const normalized = role.trim().toUpperCase().replace(/[\s_-]+/g, "_");
  return (
    normalized === "HR" ||
    normalized === "HR_ADMIN" ||
    normalized === "HR_MANAGER"
  );
}

/**
 * Checks whether a given role string represents a Manager role.
 */
export function isRoleManager(role?: string | null): boolean {
  if (!role) return false;
  const normalized = role.trim().toUpperCase().replace(/[\s_-]+/g, "_");
  return (
    normalized === "MANAGER" ||
    normalized === "HR_MANAGER" ||
    normalized === "MANAGEMENT"
  );
}

/**
 * Checks whether a given role string represents a standard Employee role.
 */
export function isRoleEmployee(role?: string | null): boolean {
  if (!role) return false;
  const normalized = role.trim().toUpperCase().replace(/[\s_-]+/g, "_");
  return normalized === "EMPLOYEE" || normalized === "STAFF";
}

/**
 * Normalizes user role into a display format or standard UserRole enum
 */
export function normalizeUserRole(role?: string | null): UserRole {
  if (!role) return "Employee";
  if (isRoleSuperAdmin(role)) return "Super Admin";
  const normalized = role.trim().toUpperCase().replace(/[\s_-]+/g, "_");
  if (normalized === "HR_ADMIN" || normalized === "ADMIN") return "HR Admin";
  if (normalized === "HR_MANAGER" || normalized === "MANAGER") return "HR Manager";
  if (normalized === "EMPLOYEE" || normalized === "STAFF") return "Employee";
  return (role as UserRole) || "Employee";
}

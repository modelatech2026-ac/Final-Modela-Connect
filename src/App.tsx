/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ToastProvider } from "./context/ToastContext";
import { AuthProvider } from "./context/AuthContext";
import { DataProvider } from "./context/DataContext";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { TwoFactorProvider } from "./context/TwoFactorContext";
import { TwoFactorSetupModal } from "./components/security/TwoFactorSetupModal";
import { TwoFactorVerificationModal } from "./components/security/TwoFactorVerificationModal";
import { BackupCodesModal } from "./components/security/BackupCodesModal";
import { Sidebar } from "./components/layout/Sidebar";
import { TopBar } from "./components/layout/TopBar";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { MatrixLandingPage } from "./components/auth/MatrixLandingPage";
import { AdminLoginPage } from "./components/admin/AdminLoginPage";
import { AdminNexusModule } from "./components/admin/AdminNexusModule";
import { AdminApprovalDashboard } from "./components/admin/AdminApprovalDashboard";
import { GeminiChatDashboard } from "./components/ai/GeminiChatDashboard";
import { useAuth } from "./context/AuthContext";

// Views & Modules
import { DashboardOverview } from "./components/dashboard/DashboardOverview";
import { EmployeeList } from "./components/employees/EmployeeList";
import { OnboardingModule } from "./components/onboarding/OnboardingModule";
import { AttendanceModule } from "./components/attendance/AttendanceModule";
import { FacialVerificationBoundary } from "./components/attendance/FacialVerificationBoundary";
import { PayrollModule } from "./components/payroll/PayrollModule";
import { RequestsModule } from "./components/requests/RequestsModule";
import { ReportsModule } from "./components/reports/ReportsModule";
import { ActivityLogViewer } from "./components/audit/ActivityLogViewer";
import { SettingsModule } from "./components/settings/SettingsModule";

function AppLayout() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { currentUser, isAuthenticated, isApproved, isLoading } = useAuth();
  const location = useLocation();
  const { theme } = useTheme();
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-color-scheme: dark)").matches);

  // Dedicated check: Always show Landing Page on /starone-landing, /landing, or /gateway
  const isLandingPageRoute =
    location.pathname === "/starone-landing" ||
    location.pathname === "/landing" ||
    location.pathname === "/gateway";

  if (isLandingPageRoute) {
    return <MatrixLandingPage />;
  }

  // Admin Login route: /admin/login allows Super Admin / HR Admin authentication
  if (location.pathname === "/admin/login") {
    return <AdminLoginPage />;
  }

  // Clearance Gate: If not authenticated or status is PENDING_APPROVAL/REJECTED or role is Guest,
  // direct immediately to the StarOne Matrix Landing Page & Queue
  const isClearanceApproved = isAuthenticated && isApproved;

  if (!isClearanceApproved && !isLoading) {
    return <MatrixLandingPage />;
  }

  return (
    <div className="min-h-screen flex bg-[#F8FAFC] dark:bg-[#070D1A] text-slate-900 dark:text-slate-100 selection:bg-blue-600/30 selection:text-slate-900 antialiased font-sans transition-colors duration-200">
      {/* Background Decorative Diagonal Light/Dark Gradient */}
      <div
        className="fixed inset-0 pointer-events-none z-0 transition-opacity duration-300"
        style={{
          backgroundImage: isDark
            ? "linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(14,165,233,0.05) 45%, rgba(11,19,43,0.95) 100%)"
            : "linear-gradient(135deg, rgba(59,130,246,0.06) 0%, rgba(14,165,233,0.04) 45%, rgba(241,245,249,0.9) 100%)",
          opacity: isDark ? 0.35 : 0.45,
        }}
      />

      {/* Sidebar Navigation */}
      <Sidebar
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64 transition-all duration-300 relative z-10">
        <TopBar onToggleSidebar={() => setIsMobileSidebarOpen((prev) => !prev)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Routes>
            <Route
              path="/"
              element={
                <ProtectedRoute moduleName="Dashboard">
                  <DashboardOverview />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute moduleName="Dashboard">
                  <DashboardOverview />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chat"
              element={
                <ProtectedRoute moduleName="Gemini AI Workspace">
                  <GeminiChatDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/gemini-ai"
              element={
                <ProtectedRoute moduleName="Gemini AI Workspace">
                  <GeminiChatDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute
                  allowedRoles={["SUPERADMIN", "SUPER_ADMIN", "ADMIN", "Super Admin", "Admin", "HR Admin", "HR_ADMIN", "HR_MANAGER", "HR Manager"]}
                  moduleName="Access Requests / User Management"
                >
                  <AdminApprovalDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/user-management"
              element={
                <ProtectedRoute
                  allowedRoles={["SUPERADMIN", "SUPER_ADMIN", "ADMIN", "Super Admin", "Admin", "HR Admin", "HR_ADMIN", "HR_MANAGER", "HR Manager"]}
                  moduleName="Access Requests / User Management"
                >
                  <AdminApprovalDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/access-requests"
              element={
                <ProtectedRoute
                  allowedRoles={["SUPERADMIN", "SUPER_ADMIN", "ADMIN", "Super Admin", "Admin", "HR Admin", "HR_ADMIN", "HR_MANAGER", "HR Manager"]}
                  moduleName="Access Requests / User Management"
                >
                  <AdminApprovalDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employees"
              element={
                <ProtectedRoute
                  allowedRoles={["SUPERADMIN", "ADMIN", "Super Admin", "Admin", "HR Admin", "SUPER_ADMIN", "HR_ADMIN"]}
                  moduleName="Employees Directory"
                >
                  <EmployeeList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute
                  allowedRoles={["SUPERADMIN", "ADMIN", "Super Admin", "Admin", "HR Admin", "SUPER_ADMIN", "HR_ADMIN"]}
                  moduleName="Admin Portal"
                >
                  <AdminApprovalDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="/starone-landing" element={<MatrixLandingPage />} />
            <Route path="/landing" element={<MatrixLandingPage />} />
            <Route path="/gateway" element={<MatrixLandingPage />} />
            <Route path="/login" element={<MatrixLandingPage />} />
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute
                  allowedRoles={["SUPERADMIN", "ADMIN", "Super Admin", "Admin", "HR Admin"]}
                  moduleName="Employee Onboarding Pipeline"
                  description="Onboarding orchestration and official badge provisioning require HR Admin or Super Admin clearance."
                >
                  <OnboardingModule />
                </ProtectedRoute>
              }
            />
            <Route
              path="/attendance"
              element={
                <ProtectedRoute moduleName="Attendance Terminal">
                  <AttendanceModule />
                </ProtectedRoute>
              }
            />
            <Route
              path="/facial-verification"
              element={
                <ProtectedRoute moduleName="Facial AI Verification Kiosk">
                  <FacialVerificationBoundary />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payroll"
              element={
                <ProtectedRoute
                  allowedRoles={["SUPERADMIN", "ADMIN", "Super Admin", "Admin"]}
                  moduleName="Master Payroll Ledger"
                  description="Master compensation disbursements and payroll batch processing require Admin or Super Admin clearance."
                >
                  <PayrollModule />
                </ProtectedRoute>
              }
            />
            <Route
              path="/requests"
              element={
                <ProtectedRoute moduleName="Requests Portal">
                  <RequestsModule />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute
                  allowedRoles={["SUPERADMIN", "ADMIN", "Super Admin", "Admin", "HR Admin"]}
                  moduleName="Analytics & Executive Reports"
                  description="Executive attrition metrics and organizational reports require Admin or Super Admin clearance."
                >
                  <ReportsModule />
                </ProtectedRoute>
              }
            />
            <Route
              path="/activity-logs"
              element={
                <ProtectedRoute
                  allowedRoles={["SUPERADMIN", "ADMIN", "Super Admin", "Admin", "Security Officer"]}
                  moduleName="System Activity & Audit Logs"
                  description="Forensic activity logs and system event audit records require Admin or Super Admin clearance."
                >
                  <ActivityLogViewer />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin-nexus"
              element={
                <ProtectedRoute
                  allowedRoles={["SUPERADMIN", "Super Admin"]}
                  moduleName="ADMIN NEXUS • Primary Architect Enclave"
                  description="Access to this terminal is restricted strictly to the Super Admin (Damayanti Chanda)."
                >
                  <AdminNexusModule />
                </ProtectedRoute>
              }
            />
            <Route path="/security" element={<Navigate to="/admin-nexus" replace />} />
            <Route
              path="/settings"
              element={
                <ProtectedRoute moduleName="System Settings">
                  <SettingsModule />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <DataProvider>
            <TwoFactorProvider>
              <Router>
                <AppLayout />
                <TwoFactorSetupModal />
                <TwoFactorVerificationModal />
                <BackupCodesModal />
              </Router>
            </TwoFactorProvider>
          </DataProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

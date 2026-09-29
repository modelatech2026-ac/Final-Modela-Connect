/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import type { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const EMPLOYEES_FILE = path.join(DATA_DIR, "employees.json");
const LOGS_FILE = path.join(DATA_DIR, "audit_logs.json");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Authorized Admin Google Emails
const AUTHORIZED_ADMIN_EMAILS = [
  "modelatech2026@gmail.com",
  "your_exact_google_email@gmail.com",
  "sushoovandas@gmail.com",
];

function isAuthorizedAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  return (
    AUTHORIZED_ADMIN_EMAILS.some((admin) => admin.toLowerCase() === clean) ||
    clean === "modelatech2026@gmail.com" ||
    clean === "your_exact_google_email@gmail.com"
  );
}

// Database helper functions
function readJsonFile<T>(filePath: string, fallback: T): T {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(data) as T;
    }
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
  }
  return fallback;
}

function writeJsonFile<T>(filePath: string, data: T): void {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
  }
}

const sseClients = new Set<Response>();

function broadcastUsersUpdate(users: any[]): void {
  const pending = users.filter((u) => {
    const s = String(u.status || "").trim().toUpperCase();
    return s === "PENDING" || s === "PENDING_APPROVAL";
  });
  const data = JSON.stringify({ type: "USERS_UPDATED", users, pending });
  sseClients.forEach((client) => {
    try {
      client.write(`data: ${data}\n\n`);
    } catch {
      sseClients.delete(client);
    }
  });
}

function getStoredUsers(): any[] {
  return readJsonFile<any[]>(USERS_FILE, []);
}

function saveStoredUsers(users: any[]): void {
  writeJsonFile(USERS_FILE, users);
  broadcastUsersUpdate(users);
}

function getStoredLogs(): any[] {
  return readJsonFile<any[]>(LOGS_FILE, []);
}

function saveStoredLogs(logs: any[]): void {
  writeJsonFile(LOGS_FILE, logs);
}

function appendAuditLog(entry: {
  action: string;
  targetUser: string;
  executedBy: string;
  details?: string;
}): void {
  const logs = getStoredLogs();
  const newLog = {
    id: "AUD-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6).toUpperCase(),
    timestamp: new Date().toISOString(),
    action: entry.action,
    targetUser: entry.targetUser,
    executedBy: entry.executedBy,
    details: entry.details || "",
  };
  logs.unshift(newLog);
  saveStoredLogs(logs.slice(0, 500));
}

function getParamStr(val: unknown): string {
  if (Array.isArray(val)) return String(val[0] || "");
  return String(val || "");
}

function getStoredEmployees(): any[] {
  return readJsonFile<any[]>(EMPLOYEES_FILE, []);
}

function saveStoredEmployees(employees: any[]): void {
  writeJsonFile(EMPLOYEES_FILE, employees);
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // 1. Health endpoint
  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      mode: "full-stack-server",
    });
  });

  // 2. GET all users
  app.get("/api/users", (_req: Request, res: Response) => {
    const users = getStoredUsers();
    res.json({ success: true, users, requests: users });
  });

  // 3. GET all pending users (Shared database query where status === 'PENDING')
  app.get("/api/users/pending", (_req: Request, res: Response) => {
    const users = getStoredUsers();
    const pendingUsers = users.filter((u) => {
      const s = String(u.status || "").trim().toUpperCase();
      return s === "PENDING" || s === "PENDING_APPROVAL";
    });
    res.json({ success: true, users: pendingUsers, pendingRequests: pendingUsers, requests: pendingUsers });
  });

  // 3b. Real-time SSE synchronization stream for Admin Nexus & DataContext
  app.get(["/api/users/stream", "/api/access_requests/stream", "/api/access-requests/stream"], (req: Request, res: Response) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    sseClients.add(res);

    // Immediately push current snapshot to connected client
    const users = getStoredUsers();
    const pending = users.filter((u) => {
      const s = String(u.status || "").trim().toUpperCase();
      return s === "PENDING" || s === "PENDING_APPROVAL";
    });
    res.write(`data: ${JSON.stringify({ type: "INITIAL_STATE", users, pending })}\n\n`);

    req.on("close", () => {
      sseClients.delete(res);
    });
  });

  // 3c. access_requests aliases for full Firestore / database collection parity
  app.get(["/api/access_requests", "/api/access-requests"], (_req: Request, res: Response) => {
    const users = getStoredUsers();
    res.json({ success: true, requests: users, users });
  });

  app.get(["/api/access_requests/pending", "/api/access-requests/pending"], (_req: Request, res: Response) => {
    const users = getStoredUsers();
    const pendingUsers = users.filter((u) => {
      const s = String(u.status || "").trim().toUpperCase();
      return s === "PENDING" || s === "PENDING_APPROVAL";
    });
    res.json({ success: true, requests: pendingUsers, users: pendingUsers, pendingRequests: pendingUsers });
  });

  function handleAuthGoogle(req: Request, res: Response) {
    const rawEmail = String(req.body.email || "");
    const cleanEmail = rawEmail.trim().toLowerCase();
    const cleanName = String(req.body.name || "").trim() || cleanEmail.split("@")[0];
    const avatarUrl =
      req.body.avatar_url ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=0284c7&color=fff`;

    if (!cleanEmail) {
      return res.status(400).json({ success: false, message: "Email is required." });
    }

    const users = getStoredUsers();
    const existingIndex = users.findIndex((u) => (u.email || "").toLowerCase() === cleanEmail);
    const nowIso = new Date().toISOString();

    // Check if hardcoded Super Admin / HR Admin
    const isAdmin = isAuthorizedAdminEmail(cleanEmail);

    if (isAdmin) {
      const mockToken = "modela_session_" + Date.now() + "_" + Math.random().toString(36).substring(2);
      if (existingIndex !== -1) {
        const adminUser = users[existingIndex];
        adminUser.status = "APPROVED";
        adminUser.role = "SUPER_ADMIN";
        adminUser.avatar_url = adminUser.avatar_url || avatarUrl;
        saveStoredUsers(users);
        appendAuditLog({
          action: "Admin Sign In",
          targetUser: cleanEmail,
          executedBy: cleanEmail,
          details: `Authorized HR Admin/Super Admin logged in: ${cleanEmail}`,
        });
        return res.json({
          success: true,
          case: "D",
          status: "APPROVED",
          token: mockToken,
          message: "Super Admin Clearance Verified. Immediate access granted.",
          user: adminUser,
        });
      } else {
        const adminUser = {
          id: "USR-SUPERADMIN-01",
          uid: "USR-SUPERADMIN-01",
          name: cleanName,
          email: cleanEmail,
          avatar_url: avatarUrl,
          status: "APPROVED",
          role: "SUPER_ADMIN",
          requestDate: nowIso,
          requested_at: nowIso,
          requestedAt: nowIso,
          statusUpdatedAt: nowIso,
          reviewedAt: nowIso,
          actionByUserId: "SYS-ROOT",
          reviewedBy: "System Root",
          notificationUnread: false,
          employeeId: "MOD000",
        };
        users.unshift(adminUser);
        saveStoredUsers(users);
        appendAuditLog({
          action: "Admin Sign In",
          targetUser: cleanEmail,
          executedBy: cleanEmail,
          details: `Authorized HR Admin/Super Admin initialized and signed in: ${cleanEmail}`,
        });
        return res.json({
          success: true,
          case: "D",
          status: "APPROVED",
          token: mockToken,
          message: "Super Admin Clearance Verified. Immediate access granted.",
          user: adminUser,
        });
      }
    }

    // New user sign in -> write/upsert profile record into shared database table
    if (existingIndex === -1) {
      const newId = "USR-" + Math.random().toString(36).substring(2, 10).toUpperCase();
      const newUser = {
        id: newId,
        uid: newId,
        name: cleanName,
        email: cleanEmail,
        avatar_url: avatarUrl,
        status: "PENDING",
        role: null,
        requested_at: nowIso,
        requestDate: nowIso,
        requestedAt: nowIso,
        statusUpdatedAt: nowIso,
        actionByUserId: null,
        reviewedBy: null,
        notificationUnread: true,
      };

      users.push(newUser);
      saveStoredUsers(users);

      appendAuditLog({
        action: "New Access Request Created",
        targetUser: cleanEmail,
        executedBy: cleanEmail,
        details: `Initial access request submitted by ${cleanName} (${cleanEmail}). Status: PENDING, Role: NULL.`,
      });

      return res.json({
        success: true,
        case: "A",
        status: "PENDING",
        message: "Your request has been sent to the HR Admin. Please wait for approval.",
        user: newUser,
      });
    }

    // Existing user
    const existing = users[existingIndex];
    const normStatus = String(existing.status || "").trim().toUpperCase();

    // If avatar_url was updated, preserve it
    if (avatarUrl && !existing.avatar_url) {
      existing.avatar_url = avatarUrl;
      saveStoredUsers(users);
    }

    appendAuditLog({
      action: "Login Attempt",
      targetUser: cleanEmail,
      executedBy: cleanEmail,
      details: `Google login attempt. Current status: ${normStatus}, Role: ${existing.role || "NULL"}`,
    });

    if (normStatus === "PENDING" || normStatus === "PENDING_APPROVAL") {
      return res.json({
        success: true,
        case: "B",
        status: "PENDING",
        message: "Your request has been sent to the HR Admin. Please wait for approval.",
        user: existing,
      });
    }

    if (normStatus === "REJECTED") {
      return res.json({
        success: false,
        case: "C",
        status: "REJECTED",
        message: "Your access request has been rejected by the HR Admin.",
        user: existing,
      });
    }

    // Approved
    const token = "modela_session_" + Date.now() + "_" + Math.random().toString(36).substring(2);
    return res.json({
      success: true,
      case: "D",
      status: "APPROVED",
      token,
      message: `Your account has been approved. Assigned Role: ${existing.role || "EMPLOYEE"}`,
      user: existing,
    });
  }

  app.post(["/api/access_requests", "/api/access-requests"], (req: Request, res: Response) => {
    handleAuthGoogle(req, res);
  });

  // 4. POST Google Auth / Sign-in / Access Request
  // Persists new sign-in with { id, name, email, avatar_url, status: 'PENDING', requested_at: timestamp }
  app.post("/api/auth/google", (req: Request, res: Response) => {
    handleAuthGoogle(req, res);
  });

  // Alias for /api/auth/login
  app.post("/api/auth/login", (req: Request, res: Response) => {
    // Forward to google auth logic
    const forwardReq = { body: req.body } as Request;
    // Call same logic
    const rawEmail = String(req.body.email || "");
    const cleanEmail = rawEmail.trim().toLowerCase();
    const cleanName = String(req.body.name || "").trim() || cleanEmail.split("@")[0];
    const avatarUrl = req.body.avatar_url || "";
    // Re-use handler logic
    const users = getStoredUsers();
    const existing = users.find((u) => (u.email || "").toLowerCase() === cleanEmail);
    if (existing) {
      const norm = String(existing.status || "").toUpperCase();
      return res.json({
        success: norm === "APPROVED",
        status: norm,
        user: existing,
      });
    }
    return res.json({ success: false, status: "NotFound", message: "User not found" });
  });

  // 5. GET User status
  app.get("/api/auth/status", (req: Request, res: Response) => {
    const email = String(req.query.email || "").toLowerCase().trim();
    if (!email) {
      return res.status(400).json({ success: false, message: "Email required" });
    }

    const users = getStoredUsers();
    const matched = users.find((u) => (u.email || "").toLowerCase() === email);

    if (!matched) {
      return res.json({ success: true, status: "NotFound", user: null });
    }

    const normStatus = String(matched.status || "").trim().toUpperCase();
    const token =
      normStatus === "APPROVED"
        ? "modela_session_" + Date.now() + "_" + Math.random().toString(36).substring(2)
        : undefined;

    res.json({
      success: true,
      status: normStatus,
      token,
      user: matched,
    });
  });

  // 6. POST /api/users/:uid/approve & /api/access_requests/:uid/approve
  // Database UPDATE query: status = 'APPROVED' and assign default employee role
  app.post(["/api/users/:uid/approve", "/api/access_requests/:uid/approve", "/api/access-requests/:uid/approve"], (req: Request, res: Response) => {
    const targetUid = decodeURIComponent(getParamStr(req.params.uid));
    const role = req.body.role || "EMPLOYEE";
    const auditorEmail = (req.headers["x-user-email"] as string) || "HR Admin";

    const users = getStoredUsers();
    const idx = users.findIndex(
      (u) =>
        u.id === targetUid ||
        u.uid === targetUid ||
        (u.email || "").toLowerCase() === targetUid.toLowerCase()
    );

    if (idx === -1) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const user = users[idx];
    const nowIso = new Date().toISOString();

    let targetRole = String(role).trim().toUpperCase().replace(/\s+/g, "_");
    if (targetRole === "ADMIN") targetRole = "HR_ADMIN";
    if (targetRole === "SUPERADMIN") targetRole = "SUPER_ADMIN";

    // Update query
    user.status = "APPROVED";
    user.role = targetRole;
    user.statusUpdatedAt = nowIso;
    user.reviewedAt = nowIso;
    user.actionByUserId = auditorEmail;
    user.reviewedBy = auditorEmail;
    user.notificationUnread = true;

    saveStoredUsers(users);

    appendAuditLog({
      action: "Request Approved",
      targetUser: user.email,
      executedBy: auditorEmail,
      details: `Access request approved by ${auditorEmail}. Assigned Role: ${targetRole}`,
    });

    return res.json({ success: true, user });
  });

  // 7. POST /api/users/:uid/reject & /api/access_requests/:uid/reject
  // Database UPDATE query: status = 'REJECTED'
  app.post(["/api/users/:uid/reject", "/api/access_requests/:uid/reject", "/api/access-requests/:uid/reject"], (req: Request, res: Response) => {
    const targetUid = decodeURIComponent(getParamStr(req.params.uid));
    const auditorEmail = (req.headers["x-user-email"] as string) || "HR Admin";

    const users = getStoredUsers();
    const idx = users.findIndex(
      (u) =>
        u.id === targetUid ||
        u.uid === targetUid ||
        (u.email || "").toLowerCase() === targetUid.toLowerCase()
    );

    if (idx === -1) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const user = users[idx];
    const nowIso = new Date().toISOString();

    // Update query
    user.status = "REJECTED";
    user.statusUpdatedAt = nowIso;
    user.reviewedAt = nowIso;
    user.actionByUserId = auditorEmail;
    user.reviewedBy = auditorEmail;
    user.notificationUnread = true;

    saveStoredUsers(users);

    appendAuditLog({
      action: "Request Rejected",
      targetUser: user.email,
      executedBy: auditorEmail,
      details: `Access request rejected by ${auditorEmail}. Status set to REJECTED.`,
    });

    return res.json({ success: true, user });
  });

  // 8. POST /api/users/:uid/role
  app.post("/api/users/:uid/role", (req: Request, res: Response) => {
    const targetUid = decodeURIComponent(getParamStr(req.params.uid));
    const role = req.body.role;
    const auditorEmail = (req.headers["x-user-email"] as string) || "HR Admin";

    const users = getStoredUsers();
    const idx = users.findIndex(
      (u) =>
        u.id === targetUid ||
        u.uid === targetUid ||
        (u.email || "").toLowerCase() === targetUid.toLowerCase()
    );

    if (idx === -1) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const user = users[idx];
    user.role = role;
    user.statusUpdatedAt = new Date().toISOString();
    saveStoredUsers(users);

    appendAuditLog({
      action: "Role Assigned",
      targetUser: user.email,
      executedBy: auditorEmail,
      details: `Role assigned: '${role}' by auditor ${auditorEmail}`,
    });

    return res.json({ success: true, user });
  });

  // 9. POST /api/users/:uid/mark-notification-read
  app.post("/api/users/:uid/mark-notification-read", (req: Request, res: Response) => {
    const targetUid = decodeURIComponent(getParamStr(req.params.uid));
    const users = getStoredUsers();
    const user = users.find(
      (u) =>
        u.id === targetUid ||
        u.uid === targetUid ||
        (u.email || "").toLowerCase() === targetUid.toLowerCase()
    );

    if (user) {
      user.notificationUnread = false;
      saveStoredUsers(users);
      return res.json({ success: true });
    }
    return res.status(404).json({ success: false, message: "User not found" });
  });

  // 10. Audit logs endpoints
  app.get("/api/audit-logs", (_req: Request, res: Response) => {
    const logs = getStoredLogs();
    res.json({ success: true, logs });
  });

  app.post("/api/audit-logs", (req: Request, res: Response) => {
    const entry = req.body;
    appendAuditLog({
      action: entry.action || "System Event",
      targetUser: entry.targetUser || "System",
      executedBy: entry.executedBy || "System",
      details: entry.details || "",
    });
    res.status(201).json({ success: true });
  });

  // 11. Employees Directory
  app.get("/api/employees", (_req: Request, res: Response) => {
    const employees = getStoredEmployees();
    res.json({ success: true, employees });
  });

  app.post("/api/employees", (req: Request, res: Response) => {
    const employees = getStoredEmployees();
    const newId = req.body.id || "MOD" + String(employees.length + 1).padStart(3, "0");
    const created = {
      ...req.body,
      id: newId,
      status: req.body.status || "ACTIVE",
      compensation: req.body.compensation || { basic: 30000, allowances: 10000 },
    };
    employees.unshift(created);
    saveStoredEmployees(employees);
    appendAuditLog({
      action: "Employee Created",
      targetUser: `${created.firstName} ${created.lastName}`,
      executedBy: "Admin",
      details: `New employee created: ${created.id} - ${created.designation}`,
    });
    res.status(201).json({ success: true, employee: created });
  });

  app.put("/api/employees/:id", (req: Request, res: Response) => {
    const empId = decodeURIComponent(getParamStr(req.params.id));
    const employees = getStoredEmployees();
    const idx = employees.findIndex((e) => e.id === empId);
    if (idx !== -1) {
      employees[idx] = { ...employees[idx], ...req.body, id: empId };
      saveStoredEmployees(employees);
      return res.json({ success: true, employee: employees[idx] });
    }
    return res.status(404).json({ success: false, message: "Employee not found" });
  });

  app.delete("/api/employees/:id", (req: Request, res: Response) => {
    const empId = decodeURIComponent(getParamStr(req.params.id));
    const employees = getStoredEmployees();
    const filtered = employees.filter((e) => e.id !== empId);
    saveStoredEmployees(filtered);
    res.json({ success: true });
  });

  // 12. Logout
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    if (req.body.email) {
      appendAuditLog({
        action: "Logout",
        targetUser: req.body.email,
        executedBy: req.body.email,
        details: "User initiated sign out session termination.",
      });
    }
    res.json({ success: true });
  });

  // Mount Vite middleware in development or serve static in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "dist");
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.use((_req: Request, res: Response) => {
        res.sendFile(path.resolve(distPath, "index.html"));
      });
    }
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Modela Connect Full-Stack Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

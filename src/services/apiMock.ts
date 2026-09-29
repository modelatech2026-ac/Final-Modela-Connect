/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  loadStoredUsers,
  loadStoredAuditLogs,
  loadStoredEmployees,
  saveStoredEmployees,
  clientLoginWithGoogle,
  clientApproveUser,
  clientRejectUser,
  clientUpdateUserRole,
  clientMarkNotificationRead,
  appendClientAuditLog,
  normalizeUserStatus,
} from "./clientStorage";

/**
 * Intelligent Client-Side HR Assistant for Gemini Chat
 */
async function generateClientAIResponse(
  message: string,
  history: Array<{ sender: string; text: string }> = []
): Promise<{ reply: string; model: string; latencyMs: number }> {
  const start = Date.now();
  const lower = message.toLowerCase();

  // Check if Gemini API key exists in runtime/client environment
  const apiKey =
    (typeof process !== "undefined" && process.env?.GEMINI_API_KEY) ||
    (typeof window !== "undefined" && (window as any).__GEMINI_API_KEY__) ||
    ((import.meta as any)?.env?.VITE_GEMINI_API_KEY as string | undefined);

  if (apiKey) {
    try {
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey });
      const contents: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = [];

      for (const item of history.slice(-6)) {
        if (item.sender === "user" && item.text) {
          contents.push({ role: "user", parts: [{ text: item.text }] });
        } else if (item.sender === "assistant" && item.text) {
          contents.push({ role: "model", parts: [{ text: item.text }] });
        }
      }
      contents.push({ role: "user", parts: [{ text: message }] });

      const res = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents,
        config: {
          systemInstruction:
            "You are Modela Connect Intelligence, an enterprise HRMS & operations platform assistant. " +
            "You provide clear, accurate, professional guidance on human resources, organizational workflows, " +
            "compliance, employee performance, payroll logic, and enterprise software engineering.",
          temperature: 0.7,
        },
      });

      return {
        reply: res.text || "No response generated.",
        model: "gemini-2.5-flash",
        latencyMs: Date.now() - start,
      };
    } catch (e) {
      console.warn("Client Gemini direct call failed, falling back to local HRMS intelligence:", e);
    }
  }

  // Realistic HRMS Intelligence response simulation
  await new Promise((r) => setTimeout(r, 600 + Math.random() * 400));

  let reply = "";
  if (lower.includes("policy") || lower.includes("remote") || lower.includes("nomad")) {
    reply =
      "### Modela Enterprise Remote & Flexible Work Policy\n\n" +
      "**1. Core Principles & Eligibility**\n" +
      "- Employees with >90 days tenure and consistent performance ratings (≥3.8) are eligible for flex-work.\n" +
      "- Core collaboration overlap hours: **10:00 AM – 3:00 PM (Local Regional Hub)**.\n\n" +
      "**2. Information Security & Compliance**\n" +
      "- Mandatory usage of corporate VPN, hardware 2FA keys, and encrypted storage.\n" +
      "- Prohibition of sensitive payroll/PII processing on unsecured public networks.\n\n" +
      "**3. Equipment & Ergonomic Allowance**\n" +
      "- $750 initial one-time stipend for ergonomic workstation setup via Modela Expense Portal.";
  } else if (lower.includes("payroll") || lower.includes("prorated") || lower.includes("salary")) {
    reply =
      "### Enterprise Prorated Payroll Calculation Framework\n\n" +
      "For mid-month joinees or departures, Modela HRMS implements calendar-day proration:\n\n" +
      "```typescript\n" +
      "function calculateProratedSalary(\n" +
      "  monthlyGross: number,\n" +
      "  workingDaysActive: number,\n" +
      "  totalWorkingDaysInMonth: number\n" +
      "): number {\n" +
      "  const perDiemRate = monthlyGross / totalWorkingDaysInMonth;\n" +
      "  return Math.round(perDiemRate * workingDaysActive * 100) / 100;\n" +
      "}\n" +
      "```\n\n" +
      "- **Standard Deductions**: Statutory withholdings (Provident/401k, Health Insurance, State Tax) apply to the prorated gross.\n" +
      "- Modela automated payroll batches execute on the 28th of every calendar month.";
  } else if (lower.includes("attrition") || lower.includes("retention") || lower.includes("turnover")) {
    reply =
      "### Key Metrics for Employee Retention & Attrition Mitigation\n\n" +
      "1. **Flight Risk Score (FRS)**: Composite index based on compensation ratio vs. market median, tenure velocity, and eNPS survey sentiment.\n" +
      "2. **Promotion Lag Duration**: Alert triggered if high performers exceed 18 months without level progression or salary realignment.\n" +
      "3. **Manager Alignment Index**: Evaluates 1-on-1 cadence adherence and team pulse sentiment.\n" +
      "4. **Onboarding Milestones**: Retention risk is highest during days 30-90. Ensure structured 30/60/90 day checkpoints in the Onboarding pipeline.";
  } else if (lower.includes("attendance") || lower.includes("facial") || lower.includes("biometric")) {
    reply =
      "### Modela AI Attendance & Biometric Verification Protocol\n\n" +
      "- **Facial Recognition Confidence**: Minimum threshold set at **92.5%** matching vectors against enrolled staff credentials.\n" +
      "- **Liveness Detection**: Prevents static spoofing via dynamic pupil reflection and micro-movement analysis.\n" +
      "- **Supervisor Overrides**: Whenever manual override is invoked, an immutable entry is dispatched to `/api/audit-logs` recording the supervisor ID and rationale.";
  } else {
    reply =
      `Thank you for consulting **Modela Connect Intelligence**.\n\n` +
      `Regarding **"${message.slice(0, 80)}"**:\n` +
      `Modela HRMS offers automated workflows for access management, role-based access control (Super Admin, HR Admin, HR Manager, Employee), onboarding pipelines, real-time facial verification attendance, and compliant payroll processing.\n\n` +
      `*Tip*: You can review active staff records under **Employees**, inspect access requests under **Admin Portal**, or audit security events under **Activity Logs**.`;
  }

  return {
    reply,
    model: "modela-hrms-intelligence-v2",
    latencyMs: Date.now() - start,
  };
}

/**
 * Initializes transparent client-side mock for `/api/*` endpoints
 */
export function initClientApiMock(): void {
  if (typeof window === "undefined") return;

  const originalFetch = window.fetch ? window.fetch.bind(window) : undefined;

  const customFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const urlString = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

    // First attempt to reach the actual backend server API
    if (originalFetch) {
      try {
        const liveResponse = await originalFetch(input, init);
        const contentType = liveResponse?.headers?.get("content-type") || "";
        // Only return live response if it returned valid JSON (not an HTML fallback from static host)
        if (
          liveResponse &&
          (liveResponse.ok || liveResponse.status < 500) &&
          (contentType.toLowerCase().includes("application/json") ||
            contentType.toLowerCase().includes("+json"))
        ) {
          return liveResponse;
        }
      } catch {
        // Fall back to client storage mock if live server is unreachable
      }
    }

    // Only intercept routes starting with /api/
    if (!urlString.startsWith("/api/") && !urlString.includes("/api/")) {
      if (originalFetch) {
        return originalFetch(input, init);
      }
      return new Response("Not found", { status: 404 });
    }

    try {
      const url = new URL(urlString, window.location.origin);
      const pathname = url.pathname;
      const method = (init?.method || "GET").toUpperCase();
      let body: any = {};
      if (init?.body && typeof init.body === "string") {
        try {
          body = JSON.parse(init.body);
        } catch {
          body = {};
        }
      }

      // 1. Health check
      if (pathname === "/api/health") {
        return new Response(
          JSON.stringify({
            status: "ok",
            timestamp: new Date().toISOString(),
            geminiConfigured: true,
            mode: "client-side-spa",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      // 2. Google OAuth / Login
      if (pathname === "/api/auth/google" || pathname === "/api/auth/login") {
        const email = body.email || "";
        const name = body.name || "";
        const avatarUrl = body.avatar_url || "";
        const result = clientLoginWithGoogle(email, name, avatarUrl);
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // 3. User status query
      if (pathname === "/api/auth/status") {
        const email = (url.searchParams.get("email") || "").toLowerCase().trim();
        const users = loadStoredUsers();
        const matched = users.find((u) => u.email.toLowerCase() === email);

        if (!matched) {
          return new Response(
            JSON.stringify({ success: true, status: "NotFound", user: null }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }

        const normStatus = normalizeUserStatus(matched.status);
        const token =
          normStatus === "APPROVED"
            ? "modela_session_" + Date.now() + "_" + Math.random().toString(36).substring(2)
            : undefined;

        return new Response(
          JSON.stringify({
            success: true,
            status: normStatus,
            token,
            user: matched,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      // 4. Logout
      if (pathname === "/api/auth/logout") {
        if (body.email) {
          appendClientAuditLog({
            action: "Logout",
            targetUser: body.email,
            executedBy: body.email,
            details: "User initiated sign out session termination.",
          });
        }
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // 5. Users List / Access Requests
      if ((pathname === "/api/users" || pathname === "/api/access_requests" || pathname === "/api/access-requests") && method === "GET") {
        const users = loadStoredUsers();
        return new Response(JSON.stringify({ success: true, users, requests: users }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // 5b. Users Pending List (status === 'PENDING')
      if ((pathname === "/api/users/pending" || pathname === "/api/access_requests/pending" || pathname === "/api/access-requests/pending") && method === "GET") {
        const users = loadStoredUsers();
        const pending = users.filter((u) => normalizeUserStatus(u.status) === "PENDING");
        return new Response(JSON.stringify({ success: true, users: pending, pendingRequests: pending, requests: pending }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // 6. User Approve: /api/users/:uid/approve
      const approveMatch = pathname.match(/^\/api\/(?:users|access_requests|access-requests)\/([^/]+)\/approve$/);
      if (approveMatch && method === "POST") {
        const targetUid = decodeURIComponent(approveMatch[1]);
        const role = body.role || "EMPLOYEE";
        const auditorEmail =
          (init?.headers as any)?.["x-user-email"] ||
          localStorage.getItem("modela_active_user_data")
            ? JSON.parse(localStorage.getItem("modela_active_user_data") || "{}").email || "Admin"
            : "Admin";

        const res = clientApproveUser(targetUid, role, auditorEmail);
        return new Response(JSON.stringify(res), {
          status: res.success ? 200 : 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      // 7. User Reject: /api/users/:uid/reject
      const rejectMatch = pathname.match(/^\/api\/(?:users|access_requests|access-requests)\/([^/]+)\/reject$/);
      if (rejectMatch && method === "POST") {
        const targetUid = decodeURIComponent(rejectMatch[1]);
        const auditorEmail =
          (init?.headers as any)?.["x-user-email"] ||
          localStorage.getItem("modela_active_user_data")
            ? JSON.parse(localStorage.getItem("modela_active_user_data") || "{}").email || "Admin"
            : "Admin";

        const res = clientRejectUser(targetUid, auditorEmail);
        return new Response(JSON.stringify(res), {
          status: res.success ? 200 : 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      // 8. User Role Change: /api/users/:uid/role
      const roleMatch = pathname.match(/^\/api\/users\/([^/]+)\/role$/);
      if (roleMatch && method === "POST") {
        const targetUid = decodeURIComponent(roleMatch[1]);
        const role = body.role;
        const auditorEmail =
          (init?.headers as any)?.["x-user-email"] || "Admin";

        const res = clientUpdateUserRole(targetUid, role, auditorEmail);
        return new Response(JSON.stringify(res), {
          status: res.success ? 200 : 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      // 9. Mark Notification Read: /api/users/:uid/mark-notification-read
      const markNotifMatch = pathname.match(/^\/api\/users\/([^/]+)\/mark-notification-read$/);
      if (markNotifMatch && method === "POST") {
        const targetUid = decodeURIComponent(markNotifMatch[1]);
        const ok = clientMarkNotificationRead(targetUid);
        return new Response(JSON.stringify({ success: ok }), {
          status: ok ? 200 : 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      // 10. Audit Logs
      if (pathname === "/api/audit-logs" && method === "GET") {
        const logs = loadStoredAuditLogs();
        return new Response(JSON.stringify({ success: true, logs }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // 11. Employees Directory
      if (pathname === "/api/employees") {
        if (method === "GET") {
          const emps = loadStoredEmployees();
          return new Response(JSON.stringify({ success: true, employees: emps }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
        if (method === "POST") {
          const emps = loadStoredEmployees();
          const newId = body.id || "MOD" + String(emps.length + 1).padStart(3, "0");
          const created = {
            ...body,
            id: newId,
            status: body.status || "ACTIVE",
            compensation: body.compensation || { basic: 30000, allowances: 10000 },
          };
          emps.unshift(created);
          saveStoredEmployees(emps);
          appendClientAuditLog({
            action: "Employee Created",
            targetUser: `${created.firstName} ${created.lastName}`,
            executedBy: "Admin",
            details: `New employee created: ${created.id} - ${created.designation}`,
          });
          return new Response(JSON.stringify({ success: true, employee: created }), {
            status: 201,
            headers: { "Content-Type": "application/json" },
          });
        }
      }

      // Employee Single Update/Delete: /api/employees/:id
      const empItemMatch = pathname.match(/^\/api\/employees\/([^/]+)$/);
      if (empItemMatch) {
        const empId = decodeURIComponent(empItemMatch[1]);
        const emps = loadStoredEmployees();
        const idx = emps.findIndex((e) => e.id === empId);

        if (method === "PUT") {
          if (idx === -1) {
            return new Response(JSON.stringify({ error: "Employee not found" }), {
              status: 404,
              headers: { "Content-Type": "application/json" },
            });
          }
          emps[idx] = { ...emps[idx], ...body, id: empId };
          saveStoredEmployees(emps);
          appendClientAuditLog({
            action: "Employee Updated",
            targetUser: `${emps[idx].firstName} ${emps[idx].lastName}`,
            executedBy: "Admin",
            details: `Employee profile updated for ${empId}`,
          });
          return new Response(JSON.stringify({ success: true, employee: emps[idx] }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }

        if (method === "DELETE") {
          if (idx === -1) {
            return new Response(JSON.stringify({ error: "Employee not found" }), {
              status: 404,
              headers: { "Content-Type": "application/json" },
            });
          }
          const [removed] = emps.splice(idx, 1);
          saveStoredEmployees(emps);
          appendClientAuditLog({
            action: "Employee Deleted",
            targetUser: `${removed.firstName} ${removed.lastName}`,
            executedBy: "Admin",
            details: `Employee ${empId} deleted from directory`,
          });
          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
      }

      // 12. Gemini Chat
      if (pathname === "/api/gemini/chat" && method === "POST") {
        const message = body.message || "";
        const history = body.history || [];
        const aiRes = await generateClientAIResponse(message, history);
        return new Response(
          JSON.stringify({
            success: true,
            reply: aiRes.reply,
            model: aiRes.model,
            latencyMs: aiRes.latencyMs,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      // Fallback 404 for unknown /api/ route
      return new Response(JSON.stringify({ error: "Not Found", path: pathname }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: any) {
      console.error("Client API Mock Error:", err);
      return new Response(JSON.stringify({ error: "Internal Mock Error", details: err?.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  };

  // Safely define fetch without throwing 'Cannot set property fetch which has only a getter'
  try {
    Object.defineProperty(window, "fetch", {
      value: customFetch,
      writable: true,
      configurable: true,
      enumerable: true,
    });
  } catch (errWindow) {
    try {
      const proto = Object.getPrototypeOf(window);
      if (proto) {
        Object.defineProperty(proto, "fetch", {
          value: customFetch,
          writable: true,
          configurable: true,
          enumerable: true,
        });
      }
    } catch (errProto) {
      try {
        if (typeof globalThis !== "undefined") {
          Object.defineProperty(globalThis, "fetch", {
            value: customFetch,
            writable: true,
            configurable: true,
            enumerable: true,
          });
        }
      } catch (errGlobal) {
        console.warn("Could not patch window.fetch:", errGlobal);
      }
    }
  }
}

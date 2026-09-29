/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Send,
  Bot,
  User as UserIcon,
  RefreshCw,
  Copy,
  Check,
  ShieldCheck,
  Lock,
  Cpu,
  ArrowRight,
  Info,
  Trash2,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useNavigate } from "react-router-dom";

interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
  latencyMs?: number;
  model?: string;
}

const SAMPLE_PROMPTS = [
  {
    title: "HR Policy Drafter",
    prompt: "Draft a modern enterprise remote work and digital nomad policy with compliance guidelines.",
  },
  {
    title: "Attrition Analysis",
    prompt: "What key metrics should an enterprise track to predict and mitigate quarterly employee attrition?",
  },
  {
    title: "Payroll Proration",
    prompt: "Explain how to calculate prorated payroll for mid-month joinees with tax withholdings in TypeScript.",
  },
  {
    title: "Performance Review",
    prompt: "Write a balanced 360-degree performance review feedback template for a Senior BIM Automation Engineer.",
  },
];

export const GeminiChatDashboard: React.FC = () => {
  const { currentUser, isApproved, isSuperAdmin, isAdmin } = useAuth();
  const { success, error: toastError, info } = useToast();
  const navigate = useNavigate();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg-welcome",
      sender: "assistant",
      text: `Hello ${
        currentUser?.name ? currentUser.name.split(" ")[0] : "there"
      }! I am **Modela AI**, powered by Google **Gemini 3.8 Flash** via the server-side Gemini API.\n\nYour account has been verified with **${
        currentUser?.role || "Employee"
      }** clearance. How can I assist you with HR operations, compliance policies, or workflow intelligence today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      model: "gemini-3.8-flash",
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Security Verification Guard:
  // If user is not approved, block AI access completely
  if (!isApproved || currentUser?.status === "PENDING_APPROVAL" || currentUser?.status === "REJECTED") {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#0d162b] border border-[#1e2d4d] rounded-3xl p-8 text-center shadow-2xl space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-amber-950/40 border border-amber-600/40 flex items-center justify-center mx-auto text-amber-400">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <span className="inline-block px-3 py-1 bg-amber-950/60 border border-amber-600/50 rounded-full text-xs font-bold text-amber-400 tracking-wider uppercase">
              Access Restricted
            </span>
            <h2 className="text-2xl font-bold text-white">Protected Gemini AI Enclave</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Your account is currently in a <strong>{currentUser?.status || "Pending"}</strong> state.
              The Google Gemini AI features are strictly gated until an administrator approves your identity request.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-800 space-y-3">
            <button
              onClick={() => navigate("/starone-landing")}
              className="w-full py-3 px-4 bg-[#142340] hover:bg-[#1a2d52] border border-[#233b66] text-white font-medium rounded-xl text-sm transition-all"
            >
              View Verification Status
            </button>
            {(isSuperAdmin || isAdmin) && (
              <button
                onClick={() => navigate("/admin")}
                className="w-full py-2.5 px-4 bg-purple-950/40 hover:bg-purple-900/50 border border-purple-600/40 text-purple-300 font-medium rounded-xl text-xs transition-all"
              >
                Go to Admin Approval Enclave
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const handleSendMessage = async (textToSend?: string) => {
    const prompt = (textToSend || inputMessage).trim();
    if (!prompt || isLoading) return;

    const userMsg: ChatMessage = {
      id: "msg-" + Date.now(),
      sender: "user",
      text: prompt,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: prompt,
          userEmail: currentUser?.email,
          history: messages.slice(-6).map((m) => ({
            sender: m.sender,
            text: m.text,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || "Failed to communicate with Gemini API");
      }

      const assistantMsg: ChatMessage = {
        id: "msg-ai-" + Date.now(),
        sender: "assistant",
        text: data.reply || "No response received.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        latencyMs: data.latencyMs,
        model: data.model || "gemini-3.8-flash",
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error("Gemini call failed:", err);
      toastError("AI Service Notice", err.message || "Failed to generate response.");

      const errorMsg: ChatMessage = {
        id: "msg-err-" + Date.now(),
        sender: "assistant",
        text: `⚠️ **Error communicating with Gemini API**: ${err.message || "Request timed out."}\n\nPlease check server logs and ensure your \`GEMINI_API_KEY\` is configured in the environment settings.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    success("Copied to Clipboard", "Message text copied successfully.");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: "msg-reset",
        sender: "assistant",
        text: `Chat session refreshed. Ready for your next query.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        model: "gemini-3.8-flash",
      },
    ]);
    info("Chat Cleared", "Conversation history has been reset.");
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-[#0c1427] via-[#101b33] to-[#0a1020] text-white border border-[#1e3054] shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/60 border border-blue-500/30 text-xs font-semibold text-blue-300">
              <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
              Protected Gemini AI Interface • Authorized Access
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              Modela AI Assistant
              <span className="text-xs px-2.5 py-1 bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 font-semibold rounded-full">
                Active & Approved
              </span>
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Powered by Google <strong className="text-white">Gemini 3.8 Flash</strong> via secure server-side proxy.
              Connected as <strong className="text-blue-300">{currentUser?.name}</strong> ({currentUser?.role}).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleClearChat}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#131e36] hover:bg-[#1a2948] border border-[#233860] text-slate-300 hover:text-white text-xs font-medium rounded-xl transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear Chat
            </button>
            {(isSuperAdmin || isAdmin) && (
              <button
                onClick={() => navigate("/admin")}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Admin Enclave
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Suggested Prompt Chips */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {SAMPLE_PROMPTS.map((item, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(item.prompt)}
            disabled={isLoading}
            className="text-left p-3.5 rounded-2xl bg-[#0c1426] hover:bg-[#111c36] border border-[#1b2b48] hover:border-blue-500/40 transition-all duration-200 group cursor-pointer shadow-sm"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-blue-400 group-hover:text-blue-300">
                {item.title}
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 transition-transform group-hover:translate-x-0.5" />
            </div>
            <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
              {item.prompt}
            </p>
          </button>
        ))}
      </div>

      {/* Chat Messages Container */}
      <div className="bg-[#0a1122] border border-[#192742] rounded-3xl overflow-hidden shadow-xl flex flex-col h-[560px]">
        {/* Chat Status Bar */}
        <div className="px-5 py-3 bg-[#0d162b] border-b border-[#182744] flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium text-slate-300">Model: gemini-3.8-flash</span>
            <span className="text-slate-600">•</span>
            <span>Server Proxy Security: Active</span>
          </div>
          <div className="hidden sm:flex items-center gap-3 text-[11px]">
            <span>User: {currentUser?.name || "Modela Member"}</span>
            <span className="px-2 py-0.5 rounded bg-blue-950/60 text-blue-300 font-mono text-[10px] border border-blue-500/30">
              {currentUser?.role}
            </span>
          </div>
        </div>

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((msg) => {
            const isAi = msg.sender === "assistant";
            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-3xl ${
                  isAi ? "mr-auto" : "ml-auto flex-row-reverse"
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    isAi
                      ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30"
                      : "bg-[#182745] text-slate-200 border border-[#233a64]"
                  }`}
                >
                  {isAi ? <Bot className="w-4 h-4" /> : <UserIcon className="w-4 h-4" />}
                </div>

                {/* Bubble */}
                <div
                  className={`rounded-2xl px-4 py-3.5 text-xs sm:text-sm leading-relaxed space-y-2 shadow-sm ${
                    isAi
                      ? "bg-[#0e172e] border border-[#1b2b48] text-slate-100"
                      : "bg-blue-600 text-white"
                  }`}
                >
                  <div className="whitespace-pre-wrap font-sans">
                    {msg.text}
                  </div>

                  <div
                    className={`flex items-center justify-between gap-3 pt-1 border-t text-[10px] ${
                      isAi
                        ? "border-slate-800 text-slate-500"
                        : "border-blue-500/40 text-blue-100"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{msg.timestamp}</span>
                      {msg.latencyMs && (
                        <span>• {msg.latencyMs}ms</span>
                      )}
                    </div>

                    {isAi && (
                      <button
                        onClick={() => copyToClipboard(msg.text, msg.id)}
                        className="hover:text-slate-300 transition-colors p-1 cursor-pointer flex items-center gap-1"
                        title="Copy text"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span className="text-[10px]">{copiedId === msg.id ? "Copied" : "Copy"}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3 mr-auto max-w-xl">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 animate-pulse">
                <Bot className="w-4 h-4" />
              </div>
              <div className="rounded-2xl px-4 py-3 bg-[#0e172e] border border-[#1b2b48] text-slate-300 text-xs flex items-center gap-2.5">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
                <span>Gemini 3.8 Flash is thinking...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-3 sm:p-4 bg-[#0d162a] border-t border-[#182642]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask Gemini about HR operations, policies, calculations, code..."
              disabled={isLoading}
              className="flex-1 bg-[#091122] border border-[#1c2c4a] focus:border-blue-500 rounded-xl px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:pointer-events-none text-white font-medium rounded-xl text-xs sm:text-sm flex items-center gap-2 transition-all shadow-md shadow-blue-600/20 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
          <div className="flex items-center justify-between text-[10px] text-slate-500 px-1 pt-2">
            <span>Powered by Gemini API • Protected Server Proxy</span>
            <span>Press Enter to send</span>
          </div>
        </div>
      </div>
    </div>
  );
};

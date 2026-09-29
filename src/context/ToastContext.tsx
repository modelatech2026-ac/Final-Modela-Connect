import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, X, AlertTriangle } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

interface ToastContextType {
  toast: (options: Omit<ToastItem, "id">) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    ({ type, title, description, duration = 4000 }: Omit<ToastItem, "id">) => {
      const id = "toast-" + Math.random().toString(36).substring(2, 9);
      const newToast: ToastItem = { id, type, title, description, duration };
      setToasts((prev) => [...prev, newToast]);

      setTimeout(() => {
        removeToast(id);
      }, duration);
    },
    [removeToast]
  );

  const success = useCallback(
    (title: string, description?: string) => toast({ type: "success", title, description }),
    [toast]
  );
  const error = useCallback(
    (title: string, description?: string) => toast({ type: "error", title, description }),
    [toast]
  );
  const warning = useCallback(
    (title: string, description?: string) => toast({ type: "warning", title, description }),
    [toast]
  );
  const info = useCallback(
    (title: string, description?: string) => toast({ type: "info", title, description }),
    [toast]
  );

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info }}>
      {children}
      {/* Toast Render Viewport */}
      <div
        id="toast-viewport"
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-md w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((t) => {
          const isSuccess = t.type === "success";
          const isError = t.type === "error";
          const isWarning = t.type === "warning";
          const isInfo = t.type === "info";

          return (
            <div
              key={t.id}
              id={`toast-${t.id}`}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-md transition-all duration-300 transform translate-y-0 ${
                isSuccess
                  ? "bg-[#1A2E1A]/95 text-white border-[#22C55E]/40"
                  : isError
                  ? "bg-[#2A1515]/95 text-white border-red-500/40"
                  : isWarning
                  ? "bg-[#2A2315]/95 text-white border-amber-500/40"
                  : "bg-[#16222F]/95 text-white border-blue-500/40"
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {isSuccess && <CheckCircle2 className="w-5 h-5 text-[#22C55E]" />}
                {isError && <AlertCircle className="w-5 h-5 text-red-400" />}
                {isWarning && <AlertTriangle className="w-5 h-5 text-amber-400" />}
                {isInfo && <Info className="w-5 h-5 text-blue-400" />}
              </div>
              <div className="flex-1 pr-2">
                <div className="font-semibold text-sm leading-tight text-white">{t.title}</div>
                {t.description && (
                  <div className="mt-1 text-xs text-stone-300 leading-normal">{t.description}</div>
                )}
              </div>
              <button
                id={`toast-close-${t.id}`}
                onClick={() => removeToast(t.id)}
                className="text-stone-400 hover:text-white transition-colors p-1 rounded-md"
                aria-label="Close notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

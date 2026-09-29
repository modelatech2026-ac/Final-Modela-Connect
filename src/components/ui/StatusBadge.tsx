import React from "react";
import { cn } from "../../lib/utils";

export type BadgeTone = "green" | "yellow" | "red" | "blue" | "cyan" | "indigo" | "neutral";

interface StatusBadgeProps {
  label: string;
  tone?: BadgeTone;
  className?: string;
  size?: "sm" | "md";
  dot?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  tone,
  className,
  size = "md",
  dot = true,
}) => {
  // Infer tone if not provided explicitly
  let resolvedTone = tone;
  if (!resolvedTone) {
    const l = label.toUpperCase();
    if (l === "SUPER ADMIN" || l === "SUPERADMIN") {
      resolvedTone = "indigo";
    } else if (l === "DEVELOPERS" || l === "DEVELOPER" || l === "DEV") {
      resolvedTone = "cyan";
    } else if (l === "ACTIVE" || l === "APPROVED" || l === "SUCCESS" || l === "VERIFIED" || l === "PRESENT" || l === "PROCESSED" || l === "HR" || l === "MANAGER") {
      resolvedTone = "blue";
    } else if (l === "PENDING" || l === "WARNING" || l === "ONBOARDING" || l === "LATE" || l === "HOLD") {
      resolvedTone = "yellow";
    } else if (l === "REJECTED" || l === "FAILED" || l === "TERMINATED" || l === "ABSENT" || l === "INACTIVE") {
      resolvedTone = "red";
    } else if (l === "COMPLETED" || l === "INFO" || l === "REVIEW" || l === "HALF_DAY") {
      resolvedTone = "cyan";
    } else {
      resolvedTone = "neutral";
    }
  }

  const toneStyles: Record<BadgeTone, { bg: string; text: string; border: string; dot: string }> = {
    green: {
      bg: "bg-blue-50 dark:bg-blue-950/70 text-blue-900 dark:text-blue-200",
      text: "text-blue-700 dark:text-blue-300",
      border: "border-blue-200 dark:border-blue-800/60",
      dot: "bg-blue-500",
    },
    blue: {
      bg: "bg-blue-50 dark:bg-blue-950/70 text-blue-900 dark:text-blue-200",
      text: "text-blue-700 dark:text-blue-300",
      border: "border-blue-200 dark:border-blue-800/60",
      dot: "bg-blue-500",
    },
    cyan: {
      bg: "bg-sky-50 dark:bg-sky-950/70 text-sky-900 dark:text-sky-200",
      text: "text-sky-700 dark:text-sky-300",
      border: "border-sky-200 dark:border-sky-800/60",
      dot: "bg-sky-400",
    },
    indigo: {
      bg: "bg-indigo-50 dark:bg-indigo-950/70 text-indigo-900 dark:text-indigo-200",
      text: "text-indigo-700 dark:text-indigo-300",
      border: "border-indigo-200 dark:border-indigo-800/60",
      dot: "bg-indigo-500",
    },
    yellow: {
      bg: "bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200",
      text: "text-amber-700 dark:text-amber-300",
      border: "border-amber-200 dark:border-amber-800/60",
      dot: "bg-amber-400",
    },
    red: {
      bg: "bg-rose-50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200",
      text: "text-rose-700 dark:text-rose-300",
      border: "border-rose-200 dark:border-rose-800/60",
      dot: "bg-rose-500",
    },
    neutral: {
      bg: "bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300",
      text: "text-slate-700 dark:text-slate-300",
      border: "border-slate-200 dark:border-slate-800",
      dot: "bg-slate-400",
    },
  };

  const style = toneStyles[resolvedTone];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-medium border rounded-full whitespace-nowrap shadow-xs",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs",
        style.bg,
        style.border,
        className
      )}
    >
      {dot && <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", style.dot)} />}
      <span className={cn("tracking-tight font-semibold", style.text)}>{label}</span>
    </span>
  );
};

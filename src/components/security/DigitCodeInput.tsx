/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState, useId } from "react";

interface DigitCodeInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (code: string) => void;
  disabled?: boolean;
  hasError?: boolean;
  autoFocus?: boolean;
  idPrefix?: string;
}

export const DigitCodeInput: React.FC<DigitCodeInputProps> = ({
  length = 6,
  value,
  onChange,
  onComplete,
  disabled = false,
  hasError = false,
  autoFocus = true,
  idPrefix,
}) => {
  const generatedId = useId();
  const prefix = idPrefix || generatedId;
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number>(autoFocus ? 0 : -1);

  // Normalize string array representation
  const digits = Array.from({ length }, (_, i) => value[i] || "");

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  const focusInput = (index: number) => {
    const clamped = Math.max(0, Math.min(length - 1, index));
    if (inputRefs.current[clamped]) {
      inputRefs.current[clamped]?.focus();
      inputRefs.current[clamped]?.select();
      setFocusedIndex(clamped);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (e.key === "Backspace") {
      e.preventDefault();
      if (digits[index]) {
        // Clear current cell
        const next = [...digits];
        next[index] = "";
        const newVal = next.join("");
        onChange(newVal);
      } else if (index > 0) {
        // Move back and clear previous cell
        const next = [...digits];
        next[index - 1] = "";
        const newVal = next.join("");
        onChange(newVal);
        focusInput(index - 1);
      }
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      focusInput(index - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      focusInput(index + 1);
    } else if (e.key === "Delete") {
      e.preventDefault();
      const next = [...digits];
      next[index] = "";
      onChange(next.join(""));
    }
  };

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const rawVal = e.target.value;

    // Handle single character entry
    const cleanChar = rawVal.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = cleanChar;
    const combined = next.join("");
    onChange(combined);

    if (cleanChar && index < length - 1) {
      focusInput(index + 1);
    }

    if (combined.length === length && onComplete) {
      onComplete(combined);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (disabled) return;

    const pastedData = e.clipboardData.getData("text");
    const digitsOnly = pastedData.replace(/\D/g, "").slice(0, length);

    if (digitsOnly.length > 0) {
      onChange(digitsOnly);
      // Focus on the next empty box or the last box
      const targetFocus = Math.min(digitsOnly.length, length - 1);
      focusInput(targetFocus);

      if (digitsOnly.length === length && onComplete) {
        onComplete(digitsOnly);
      }
    }
  };

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3 my-2" onPaste={handlePaste}>
      {Array.from({ length }, (_, index) => {
        const isCurrentFocused = focusedIndex === index;
        const hasChar = Boolean(digits[index]);

        return (
          <input
            key={index}
            id={`${prefix}-digit-${index}`}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={digits[index]}
            disabled={disabled}
            autoComplete="one-time-code"
            onFocus={() => setFocusedIndex(index)}
            onBlur={() => setFocusedIndex(-1)}
            onChange={(e) => handleChange(index, e)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            aria-label={`Digit ${index + 1} of ${length}`}
            className={`
              w-11 h-13 sm:w-12 sm:h-14 text-center font-mono text-xl sm:text-2xl font-bold rounded-xl transition-all duration-150 outline-none
              ${
                hasError
                  ? "border-2 border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 focus:ring-2 focus:ring-rose-400/40"
                  : isCurrentFocused
                  ? "border-2 border-blue-600 dark:border-sky-400 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 ring-4 ring-blue-500/15 dark:ring-sky-500/20 shadow-sm"
                  : hasChar
                  ? "border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100"
                  : "border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 hover:border-slate-300 dark:hover:border-slate-600"
              }
              ${disabled ? "opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-800" : "cursor-text"}
            `}
          />
        );
      })}
    </div>
  );
};

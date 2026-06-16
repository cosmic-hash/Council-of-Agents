"use client";

import { useState } from "react";
import { USER_CONTEXT_KEY } from "@/lib/constants";

interface UserContextInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function UserContextInput({ value, onChange }: UserContextInputProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleClear = () => {
    onChange("");
    if (typeof window !== "undefined") {
      localStorage.removeItem(USER_CONTEXT_KEY);
    }
  };

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="font-mono text-[11px] text-foreground-muted transition-colors hover:text-foreground"
      >
        {isOpen ? "▼" : "▶"} About You (optional)
      </button>

      {isOpen && (
        <div className="mt-2">
          <textarea
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              if (typeof window !== "undefined") {
                localStorage.setItem(USER_CONTEXT_KEY, e.target.value);
              }
            }}
            placeholder="Your role, priorities, risk tolerance, life stage..."
            rows={3}
            className="w-full resize-none rounded-lg border border-surface-border bg-surface px-4 py-3 font-inter text-sm font-light text-debate-text placeholder:text-foreground-muted focus:border-violet-300 focus:outline-none dark:focus:border-violet-600"
          />
          <p className="mt-2 font-mono text-[10px] text-foreground-muted">
            Helps agents speak to your situation — but they always judge your question on its
            own merits, not your history.
          </p>
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="mt-2 font-mono text-[10px] text-foreground-muted hover:text-foreground"
            >
              Clear saved context
            </button>
          )}
        </div>
      )}
    </div>
  );
}

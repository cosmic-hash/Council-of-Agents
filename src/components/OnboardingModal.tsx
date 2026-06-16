"use client";

import { USER_CONTEXT_KEY } from "@/lib/constants";

interface OnboardingModalProps {
  open: boolean;
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onSkip: () => void;
}

export function OnboardingModal({
  open,
  value,
  onChange,
  onSave,
  onSkip,
}: OnboardingModalProps) {
  if (!open) return null;

  const handleSave = () => {
    if (typeof window !== "undefined" && value.trim()) {
      localStorage.setItem(USER_CONTEXT_KEY, value.trim());
    }
    onSave();
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/20 p-6">
      <div className="w-full max-w-md rounded-xl border border-surface-border bg-surface p-6 shadow-lg">
        <h2 className="mb-2 font-playfair text-xl text-ink">
          Tell the council about you
        </h2>
        <p className="mb-4 font-inter text-sm font-light text-foreground-muted">
          Optional — helps agents speak to your situation. They always judge your
          question on its own merits.
        </p>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Your role, priorities, risk tolerance, life stage..."
          rows={4}
          className="w-full resize-none rounded-lg border border-surface-border bg-background px-4 py-3 font-inter text-sm text-debate-text placeholder:text-foreground-muted focus:border-violet-300 focus:outline-none dark:focus:border-violet-600"
        />
        <div className="mt-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={onSkip}
            className="font-mono text-[11px] text-foreground-muted hover:text-foreground"
          >
            Skip
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-lg border border-violet-200 bg-violet-50 px-4 py-2 font-inter text-sm text-violet-800 hover:bg-violet-100 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-200 dark:hover:bg-violet-900/50"
          >
            Save &amp; continue
          </button>
        </div>
      </div>
    </div>
  );
}

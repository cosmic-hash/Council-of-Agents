"use client";

interface AutoAdvanceToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

export function AutoAdvanceToggle({ enabled, onChange }: AutoAdvanceToggleProps) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`rounded-full border px-2.5 py-1 font-mono text-[10px] transition-colors ${
        enabled
          ? "border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-700 dark:bg-violet-900/30 dark:text-violet-300"
          : "border-surface-border bg-surface text-foreground-muted"
      }`}
      title="Auto-advance to next agent when typing completes"
    >
      Auto {enabled ? "on" : "off"}
    </button>
  );
}

"use client";

interface VoiceToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

export function VoiceToggle({ enabled, onChange }: VoiceToggleProps) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`rounded-full border px-2.5 py-1 font-mono text-[10px] transition-colors ${
        enabled
          ? "border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-700 dark:bg-violet-900/30 dark:text-violet-300"
          : "border-surface-border bg-surface text-foreground-muted"
      }`}
      title="Read agent lines aloud (tap once on mobile to enable)"
    >
      Voice {enabled ? "on" : "off"}
    </button>
  );
}

"use client";

import type { Theme } from "@/hooks/useTheme";

interface ThemeToggleProps {
  theme: Theme;
  onToggle: () => void;
}

export function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  return (
    <button
      onClick={onToggle}
      className="rounded-full border border-surface-border bg-surface px-3 py-1 font-mono text-[10px] text-foreground-muted shadow-sm transition-colors hover:text-foreground"
      title={theme === "light" ? "Switch to night mode" : "Switch to light mode"}
    >
      {theme === "light" ? "☀ Light" : "🌙 Night"}
    </button>
  );
}

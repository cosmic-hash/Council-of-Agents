"use client";

import { motion } from "framer-motion";
import type { ViewMode } from "@/lib/types";

interface ViewToggleProps {
  view: ViewMode;
  onChange: (view: ViewMode) => void;
}

export function ViewToggle({ view, onChange }: ViewToggleProps) {
  return (
    <div className="flex items-center gap-1 rounded-full border border-surface-border bg-background p-0.5">
      <button
        onClick={() => onChange("thread")}
        className={`rounded-full px-3 py-1 font-mono text-[10px] transition-all ${
          view === "thread"
            ? "bg-surface text-ink shadow-sm"
            : "text-foreground-muted hover:text-foreground"
        }`}
      >
        ≡ Thread
      </button>
      <button
        onClick={() => onChange("duel")}
        className={`rounded-full px-3 py-1 font-mono text-[10px] transition-all ${
          view === "duel"
            ? "bg-surface text-ink shadow-sm"
            : "text-foreground-muted hover:text-foreground"
        }`}
      >
        ⬛ Duel
      </button>
    </div>
  );
}

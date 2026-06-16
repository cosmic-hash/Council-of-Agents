"use client";

import { motion } from "framer-motion";
import type { ViewMode } from "@/lib/types";

interface ViewToggleProps {
  view: ViewMode;
  onChange: (view: ViewMode) => void;
}

export function ViewToggle({ view, onChange }: ViewToggleProps) {
  return (
    <div className="flex items-center gap-1 rounded-full border border-white/10 bg-black/30 p-0.5 backdrop-blur-sm">
      <button
        onClick={() => onChange("thread")}
        className={`rounded-full px-3 py-1 font-mono text-[10px] transition-all ${
          view === "thread"
            ? "bg-white/10 text-cream"
            : "text-gray-500 hover:text-gray-400"
        }`}
      >
        ≡ Thread
      </button>
      <button
        onClick={() => onChange("duel")}
        className={`rounded-full px-3 py-1 font-mono text-[10px] transition-all ${
          view === "duel"
            ? "bg-white/10 text-cream"
            : "text-gray-500 hover:text-gray-400"
        }`}
      >
        ⬛ Duel
      </button>
    </div>
  );
}

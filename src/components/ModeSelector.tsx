"use client";

import { motion } from "framer-motion";
import { MODES } from "@/lib/constants";
import type { DebateMode } from "@/lib/types";

interface ModeSelectorProps {
  selected: DebateMode | null;
  onSelect: (mode: DebateMode) => void;
}

function SpeakingBarPreview({ energy }: { energy: number }) {
  const heights = [0.4, 0.7, 1, 0.6, 0.3];
  const speed = energy === 0 ? 1.2 : energy === 1 ? 0.8 : 0.5;

  return (
    <div className="flex h-6 items-end justify-center gap-0.5">
      {heights.map((h, i) => (
        <motion.div
          key={i}
          className="w-1 rounded-sm bg-violet-400/50"
          style={{ height: `${h * 16}px`, transformOrigin: "bottom" }}
          animate={{ scaleY: [0.3, h, 0.3] }}
          transition={{
            duration: speed,
            repeat: Infinity,
            delay: i * 0.1,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

export function ModeSelector({ selected, onSelect }: ModeSelectorProps) {
  const modes = Object.values(MODES);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {modes.map((mode) => {
        const energy = mode.id === "normal" ? 0 : mode.id === "moderate" ? 1 : 2;
        const isSelected = selected === mode.id;

        return (
          <motion.button
            key={mode.id}
            onClick={() => onSelect(mode.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`group relative rounded-xl border p-5 text-left transition-all ${
              isSelected
                ? "border-violet-300 bg-violet-50 shadow-md shadow-violet-100 dark:border-violet-700 dark:bg-violet-950/40 dark:shadow-violet-900/20"
                : "border-surface-border bg-surface shadow-sm hover:border-foreground-muted/30 hover:shadow"
            } ${mode.desaturated ? "saturate-[0.85]" : ""}`}
          >
            <div className="mb-3 text-2xl">{mode.icon}</div>
            <h3 className="mb-1 font-inter text-sm font-semibold text-ink">
              {mode.label}
            </h3>
            <p className="mb-4 font-inter text-xs font-light text-foreground-muted">
              {mode.description}
            </p>
            <SpeakingBarPreview energy={energy} />
          </motion.button>
        );
      })}
    </div>
  );
}

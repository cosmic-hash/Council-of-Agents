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
          className="w-1 rounded-sm bg-violet-500/60"
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
                ? "border-violet-500/50 bg-violet-500/10 shadow-lg shadow-violet-500/10"
                : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8"
            } ${mode.desaturated ? "saturate-[0.85]" : ""}`}
          >
            <div className="mb-3 text-2xl">{mode.icon}</div>
            <h3 className="mb-1 font-inter text-sm font-semibold text-cream">
              {mode.label}
            </h3>
            <p className="mb-4 font-inter text-xs font-light text-gray-500">
              {mode.description}
            </p>
            <SpeakingBarPreview energy={energy} />
          </motion.button>
        );
      })}
    </div>
  );
}

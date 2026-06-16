"use client";

import { getTensionWireStyle } from "@/lib/theme";
import type { DebateMode } from "@/lib/types";

interface TensionWireProps {
  mode: DebateMode;
  visible: boolean;
  heatLevel?: number;
}

export function TensionWire({ mode, visible, heatLevel = 0 }: TensionWireProps) {
  if (!visible) return null;

  const style = getTensionWireStyle(mode, heatLevel);

  return (
    <div className="absolute left-0 right-0 top-1/2 z-10 -translate-y-1/2 px-8">
      <div className="relative mx-auto max-w-md">
        <div
          className={`w-full transition-all duration-500 ease-out ${
            style.pulse ? "tension-pulse" : ""
          }`}
          style={{
            backgroundColor: style.color,
            height: `${style.thickness}px`,
            opacity: visible ? style.opacity : 0,
          }}
        />
        {style.sparks && (
          <div
            className="spark-particle absolute top-1/2 h-1 w-1 -translate-y-1/2 rounded-full"
            style={{
              backgroundColor: "#D97706",
              boxShadow: "0 0 6px rgba(217, 119, 6, 0.6)",
            }}
          />
        )}
      </div>
    </div>
  );
}

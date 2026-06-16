"use client";

import type { DebateMode } from "@/lib/types";

interface TensionWireProps {
  mode: DebateMode;
  visible: boolean;
}

export function TensionWire({ mode, visible }: TensionWireProps) {
  if (!visible) return null;

  const isNormal = mode === "normal";
  const isModerate = mode === "moderate";
  const isAggressive = mode === "aggressive";

  return (
    <div className="absolute left-0 right-0 top-1/2 z-10 -translate-y-1/2 px-8">
      <div className="relative mx-auto max-w-md">
        <div
          className={`h-px w-full transition-all duration-500 ease-out ${
            isModerate ? "tension-pulse" : ""
          }`}
          style={{
            backgroundColor: isAggressive
              ? "rgba(245, 158, 11, 0.8)"
              : isNormal
                ? "rgba(124, 58, 237, 0.3)"
                : "rgba(124, 58, 237, 0.6)",
            height: isAggressive ? "2px" : "1px",
            opacity: visible ? 1 : 0,
          }}
        />
        {isAggressive && (
          <div
            className="spark-particle absolute top-1/2 h-1 w-1 -translate-y-1/2 rounded-full bg-amber-400"
            style={{ boxShadow: "0 0 6px rgba(245, 158, 11, 0.8)" }}
          />
        )}
      </div>
    </div>
  );
}

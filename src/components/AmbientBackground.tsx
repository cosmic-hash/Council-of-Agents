"use client";

import { getHeatVisuals } from "@/lib/theme";
import { getParticleColor } from "@/lib/heat";
import type { AppTheme } from "@/lib/heat";
import type { DebateMode } from "@/lib/types";
import { getModeStageFilter } from "@/lib/visuals";

interface AmbientBackgroundProps {
  heatLevel: number;
  isVerdict?: boolean;
  mode?: DebateMode;
  isPreview?: boolean;
  theme?: AppTheme;
}

export function AmbientBackground({
  heatLevel,
  isVerdict = false,
  mode = "moderate",
  isPreview = false,
  theme = "light",
}: AmbientBackgroundProps) {
  const visuals = getHeatVisuals(heatLevel, mode, isVerdict, isPreview, theme);
  const { gradient, resolutionTransitionMs } = visuals;

  const particleCount = Math.round(8 + (heatLevel / 100) * 2);
  const particleDuration = Math.max(8, 20 - (heatLevel / 100) * 12);
  const particleColor = getParticleColor(heatLevel);

  const backgroundImage = gradient.layers.join(", ");
  const transitionMs = isVerdict ? resolutionTransitionMs : visuals.heatTransitionMs;

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <div
        className="absolute inset-0 ease-in-out"
        style={{
          backgroundColor: gradient.base,
          backgroundImage,
          transition: `all ${transitionMs}ms ease`,
        }}
      />

      {Array.from({ length: particleCount }).map((_, i) => (
        <div
          key={i}
          className="particle absolute rounded-full"
          style={{
            width: "3px",
            height: "3px",
            left: `${(i * 17 + 5) % 100}%`,
            backgroundColor: particleColor,
            animationDuration: `${particleDuration + (i % 5)}s`,
            animationDelay: `${i * 0.8}s`,
          }}
        />
      ))}

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            theme === "night"
              ? "radial-gradient(ellipse at center, transparent 65%, rgba(0,0,0,0.35) 100%)"
              : "radial-gradient(ellipse at center, transparent 65%, rgba(0,0,0,0.04) 100%)",
        }}
      />
    </div>
  );
}

export { getModeStageFilter };

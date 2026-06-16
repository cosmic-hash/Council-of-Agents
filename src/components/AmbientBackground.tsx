"use client";

import { getHeatGradient, getHeatState, getParticleColor } from "@/lib/heat";

interface AmbientBackgroundProps {
  heatLevel: number;
  isVerdict?: boolean;
  modeDesaturated?: boolean;
}

export function AmbientBackground({
  heatLevel,
  isVerdict = false,
  modeDesaturated = false,
}: AmbientBackgroundProps) {
  const state = getHeatState(heatLevel, isVerdict);
  const gradient = getHeatGradient(state);
  const particleColor = getParticleColor(heatLevel);
  const particleCount = Math.round(12 + (heatLevel / 100) * 3);
  const particleDuration = Math.max(8, 20 - (heatLevel / 100) * 12);

  const backgroundImage = gradient.layers.join(", ");
  const filter = modeDesaturated ? "saturate(0.7)" : "saturate(1)";

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden" style={{ filter }}>
      <div
        className="absolute inset-0 transition-all duration-[2000ms] ease-in-out"
        style={{
          backgroundColor: gradient.base,
          backgroundImage,
        }}
      />

      <div
        className="breathing-glow pointer-events-none absolute inset-x-0 top-0 h-1/2"
        style={{
          background: `radial-gradient(ellipse 60% 40% at 50% 0%, rgba(124, 58, 237, ${0.05 + (heatLevel / 100) * 0.1}) 0%, transparent 70%)`,
          opacity: 0.6 + (heatLevel / 100) * 0.4,
        }}
      />

      {Array.from({ length: particleCount }).map((_, i) => (
        <div
          key={i}
          className="particle absolute h-0.5 w-0.5 rounded-full"
          style={{
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
            "radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.7) 100%)",
        }}
      />
    </div>
  );
}

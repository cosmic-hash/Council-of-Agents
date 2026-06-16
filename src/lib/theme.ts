import type { DebateMode } from "./types";
import {
  getHeatGradient,
  getHeatState,
  getParticleColor,
  getTensionMeterColor,
  type AppTheme,
  type HeatGradient,
  type HeatState,
} from "./heat";

export const AGENT_COLOR_RULES = {
  optimist: { color: "#10B981", places: ["iconGlow", "name", "speakingBars", "timelineDot"] },
  contrarian: { color: "#F43F5E", places: ["iconGlow", "name", "speakingBars", "timelineDot"] },
  pragmatist: { color: "#0EA5E9", places: ["iconGlow", "name", "speakingBars", "timelineDot"] },
  oracle: { color: "#F59E0B", places: ["iconGlow", "name", "speakingBars", "timelineDot"] },
  judge: { color: "#A855F7", places: ["iconGlow", "name", "speakingBars", "timelineDot"] },
} as const;

export const HEAT_COLOR_STOPS = {
  cool: { range: [0, 24], primary: "#7C3AED", opacity: 0.06 },
  warming: { range: [25, 49], primary: "#7C3AED", secondary: "#F59E0B", opacity: 0.1 },
  hot: { range: [50, 74], primary: "#F43F5E", secondary: "#F59E0B", opacity: 0.14 },
  burning: { range: [75, 100], primary: "#F43F5E", secondary: "#DC2626", opacity: 0.18 },
  resolution: { primary: "#7C3AED", opacity: 0.15 },
} as const;

export interface TensionWireStyle {
  color: string;
  thickness: number;
  pulse: boolean;
  sparks: boolean;
  opacity: number;
}

export interface HeatVisuals {
  state: HeatState;
  gradient: HeatGradient;
  particleColor: string;
  meterColor: string;
  tensionWireStyle: TensionWireStyle;
  heatTransitionMs: number;
  resolutionTransitionMs: number;
  heatOpacityScale: number;
}

const MODE_HEAT_SCALE: Record<DebateMode, number> = {
  normal: 0.9,
  moderate: 1.15,
  aggressive: 1.45,
};

const MODE_TRANSITION_MS: Record<DebateMode, number> = {
  normal: 700,
  moderate: 400,
  aggressive: 200,
};

export function getTensionWireStyle(mode: DebateMode, heatLevel: number): TensionWireStyle {
  if (mode === "aggressive") {
    return {
      color: "#D97706",
      thickness: 2,
      pulse: false,
      sparks: heatLevel >= 50,
      opacity: 0.9,
    };
  }
  if (mode === "moderate") {
    return {
      color: "#7C3AED",
      thickness: 2,
      pulse: true,
      sparks: false,
      opacity: 0.75,
    };
  }
  return {
    color: "#7C3AED",
    thickness: 1,
    pulse: false,
    sparks: false,
    opacity: 0.45,
  };
}

export function getHeatVisuals(
  heatLevel: number,
  mode: DebateMode,
  isVerdict = false,
  isPreview = false,
  theme: AppTheme = "light"
): HeatVisuals {
  const state = getHeatState(heatLevel, isVerdict);
  const gradient = getHeatGradient(state, isPreview, theme);
  const scale = MODE_HEAT_SCALE[mode];

  return {
    state,
    gradient,
    particleColor: getParticleColor(heatLevel),
    meterColor: getTensionMeterColor(heatLevel),
    tensionWireStyle: getTensionWireStyle(mode, heatLevel),
    heatTransitionMs: MODE_TRANSITION_MS[mode],
    resolutionTransitionMs: isVerdict ? 3000 : MODE_TRANSITION_MS[mode],
    heatOpacityScale: scale,
  };
}

export const THEME_TOKENS = {
  light: {
    background: "#FAFAF8",
    foreground: "#1C1917",
    foregroundMuted: "#78716C",
    surface: "#FFFFFF",
    surfaceBorder: "#E7E5E4",
    debateText: "#1C1917",
    accentViolet: "#7C3AED",
    ink: "#1C1917",
  },
  night: {
    background: "#0A0A0F",
    foreground: "#F0EAD6",
    foregroundMuted: "#A8A29E",
    surface: "#14141C",
    surfaceBorder: "#2A2A35",
    debateText: "#F0EAD6",
    accentViolet: "#A78BFA",
    ink: "#F0EAD6",
  },
} as const;

export function getEnergyBeamColor(): string {
  return "rgba(124, 58, 237, 0.65)";
}

export function getVerdictGlowStyle(): { textShadow: string } {
  return {
    textShadow: "0 2px 24px rgba(245, 158, 11, 0.55), 0 0 40px rgba(124, 58, 237, 0.25)",
  };
}

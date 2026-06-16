import type { AgentId } from "./types";
import { AGENTS } from "./constants";

export type HeatState = "cool" | "warming" | "hot" | "burning" | "resolution";

export interface HeatGradient {
  base: string;
  layers: string[];
}

export function getHeatState(level: number, isVerdict = false): HeatState {
  if (isVerdict) return "resolution";
  if (level < 25) return "cool";
  if (level < 50) return "warming";
  if (level < 75) return "hot";
  return "burning";
}

export type AppTheme = "light" | "night";

const THEME_BASE: Record<AppTheme, string> = {
  light: "#FAFAF8",
  night: "#0A0A0F",
};

const STATE_HEAT_LEVEL: Record<HeatState, number> = {
  cool: 12,
  warming: 37,
  hot: 62,
  burning: 87,
  resolution: 40,
};

const STATE_WASH_OPACITY: Record<HeatState, number> = {
  cool: 0.07,
  warming: 0.10,
  hot: 0.12,
  burning: 0.14,
  resolution: 0.11,
};

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function getHeatTintColor(heatLevel: number): string {
  return getTensionMeterColor(heatLevel);
}

function buildSingleWashGradient(
  state: HeatState,
  theme: AppTheme
): HeatGradient {
  const tint = getTensionMeterColor(STATE_HEAT_LEVEL[state]);
  const nightScale = theme === "night" ? 1.25 : 1;
  const opacity = STATE_WASH_OPACITY[state] * nightScale;
  return {
    base: THEME_BASE[theme],
    layers: [
      `radial-gradient(ellipse 90% 70% at 50% 55%, ${hexToRgba(tint, opacity)} 0%, transparent 72%)`,
    ],
  };
}

export function getHeatGradient(
  state: HeatState,
  isPreview = false,
  theme: AppTheme = "light"
): HeatGradient {
  const previewStripe = isPreview
    ? "linear-gradient(180deg, rgba(168,162,158,0.06) 0%, transparent 8%)"
    : null;

  const gradient = buildSingleWashGradient(state, theme);

  if (!previewStripe) return gradient;
  return { ...gradient, layers: [previewStripe, ...gradient.layers] };
}

export function computeHeatDelta(
  agentId: AgentId,
  phase: "opening" | "rebuttal" | "verdict",
  sentiment: number
): number {
  let delta = 0;

  if (phase === "rebuttal") delta += 8;
  if (phase === "opening") delta += 3;

  switch (agentId) {
    case "contrarian":
      delta += 12;
      break;
    case "oracle":
      delta += 8;
      break;
    case "optimist":
      delta -= 5;
      break;
    case "judge":
      delta -= 15;
      break;
    case "pragmatist":
      delta += 3;
      break;
  }

  if (sentiment < -0.3) delta += Math.abs(sentiment) * 10;
  if (sentiment > 0.3) delta -= sentiment * 5;

  return delta;
}

export function getParticleColor(heatLevel: number): string {
  const tint = getTensionMeterColor(heatLevel);
  return hexToRgba(tint, 0.2);
}

export function getTensionMeterColor(heatLevel: number): string {
  if (heatLevel < 33) return "#7C3AED";
  if (heatLevel < 66) return "#F59E0B";
  return "#F43F5E";
}

export function agentMentionsOther(content: string, otherAgentName: string): boolean {
  const patterns = [
    otherAgentName.toLowerCase(),
    otherAgentName.replace("The ", "").toLowerCase(),
  ];
  const lower = content.toLowerCase();
  return patterns.some((p) => lower.includes(p));
}

export function getAgentById(id: AgentId) {
  return AGENTS[id];
}

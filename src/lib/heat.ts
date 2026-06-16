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

export function getHeatGradient(state: HeatState): HeatGradient {
  switch (state) {
    case "cool":
      return {
        base: "#0A0A0F",
        layers: [
          "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(124, 58, 237, 0.07) 0%, transparent 70%)",
          "radial-gradient(ellipse 100% 100% at 100% 50%, rgba(14, 165, 233, 0.03) 0%, transparent 50%)",
          "radial-gradient(ellipse 100% 100% at 0% 50%, rgba(14, 165, 233, 0.03) 0%, transparent 50%)",
        ],
      };
    case "warming":
      return {
        base: "#0D0A14",
        layers: [
          "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(124, 58, 237, 0.12) 0%, transparent 70%)",
          "radial-gradient(ellipse 100% 60% at 50% 100%, rgba(245, 158, 11, 0.05) 0%, transparent 60%)",
        ],
      };
    case "hot":
      return {
        base: "#0F0A0A",
        layers: [
          "radial-gradient(ellipse 60% 80% at 0% 50%, rgba(244, 63, 94, 0.08) 0%, transparent 60%)",
          "radial-gradient(ellipse 60% 80% at 100% 50%, rgba(244, 63, 94, 0.08) 0%, transparent 60%)",
          "radial-gradient(ellipse 100% 60% at 50% 100%, rgba(245, 158, 11, 0.10) 0%, transparent 60%)",
          "radial-gradient(ellipse 80% 40% at 50% 0%, rgba(124, 58, 237, 0.05) 0%, transparent 50%)",
        ],
      };
    case "burning":
      return {
        base: "#120808",
        layers: [
          "radial-gradient(ellipse 60% 80% at 0% 50%, rgba(244, 63, 94, 0.15) 0%, transparent 60%)",
          "radial-gradient(ellipse 60% 80% at 100% 50%, rgba(244, 63, 94, 0.15) 0%, transparent 60%)",
          "radial-gradient(ellipse 100% 60% at 50% 100%, rgba(245, 158, 11, 0.18) 0%, transparent 60%)",
          "radial-gradient(ellipse 50% 50% at 50% 50%, rgba(220, 38, 38, 0.06) 0%, transparent 70%)",
        ],
      };
    case "resolution":
      return {
        base: "#0A0A0F",
        layers: [
          "radial-gradient(ellipse 90% 60% at 50% 30%, rgba(124, 58, 237, 0.15) 0%, transparent 70%)",
        ],
      };
  }
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
  if (heatLevel < 30) return "rgba(124, 58, 237, 0.15)";
  if (heatLevel < 60) return "rgba(245, 158, 11, 0.15)";
  return "rgba(244, 63, 94, 0.15)";
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

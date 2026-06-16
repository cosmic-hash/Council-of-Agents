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

export function getHeatGradient(
  state: HeatState,
  isPreview = false,
  theme: AppTheme = "light"
): HeatGradient {
  const previewStripe = isPreview
    ? "linear-gradient(180deg, rgba(168,162,158,0.08) 0%, transparent 8%)"
    : null;

  const withPreview = (gradient: HeatGradient): HeatGradient => {
    if (!previewStripe) return gradient;
    return { ...gradient, layers: [previewStripe, ...gradient.layers] };
  };

  const isNight = theme === "night";

  switch (state) {
    case "cool":
      return withPreview(
        isNight
          ? {
              base: "#0A0A0F",
              layers: [
                "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(124, 58, 237, 0.20) 0%, transparent 70%)",
                "radial-gradient(ellipse 100% 100% at 100% 50%, rgba(14, 165, 233, 0.14) 0%, transparent 50%)",
                "radial-gradient(ellipse 100% 100% at 0% 50%, rgba(14, 165, 233, 0.14) 0%, transparent 50%)",
              ],
            }
          : {
              base: "#FAFAF8",
              layers: [
                "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(124, 58, 237, 0.14) 0%, transparent 70%)",
                "radial-gradient(ellipse 100% 100% at 100% 50%, rgba(14, 165, 233, 0.10) 0%, transparent 50%)",
                "radial-gradient(ellipse 100% 100% at 0% 50%, rgba(14, 165, 233, 0.10) 0%, transparent 50%)",
              ],
            }
      );
    case "warming":
      return withPreview(
        isNight
          ? {
              base: "#0C0C14",
              layers: [
                "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(124, 58, 237, 0.24) 0%, transparent 70%)",
                "radial-gradient(ellipse 100% 60% at 50% 100%, rgba(245, 158, 11, 0.22) 0%, transparent 60%)",
              ],
            }
          : {
              base: "#F8F6FC",
              layers: [
                "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(124, 58, 237, 0.18) 0%, transparent 70%)",
                "radial-gradient(ellipse 100% 60% at 50% 100%, rgba(245, 158, 11, 0.18) 0%, transparent 60%)",
              ],
            }
      );
    case "hot":
      return withPreview(
        isNight
          ? {
              base: "#100A0C",
              layers: [
                "radial-gradient(ellipse 60% 80% at 0% 50%, rgba(244, 63, 94, 0.28) 0%, transparent 60%)",
                "radial-gradient(ellipse 60% 80% at 100% 50%, rgba(244, 63, 94, 0.28) 0%, transparent 60%)",
                "radial-gradient(ellipse 100% 60% at 50% 100%, rgba(245, 158, 11, 0.30) 0%, transparent 60%)",
              ],
            }
          : {
              base: "#FFF8F6",
              layers: [
                "radial-gradient(ellipse 60% 80% at 0% 50%, rgba(244, 63, 94, 0.22) 0%, transparent 60%)",
                "radial-gradient(ellipse 60% 80% at 100% 50%, rgba(244, 63, 94, 0.22) 0%, transparent 60%)",
                "radial-gradient(ellipse 100% 60% at 50% 100%, rgba(245, 158, 11, 0.26) 0%, transparent 60%)",
              ],
            }
      );
    case "burning":
      return withPreview(
        isNight
          ? {
              base: "#120808",
              layers: [
                "radial-gradient(ellipse 60% 80% at 0% 50%, rgba(244, 63, 94, 0.36) 0%, transparent 60%)",
                "radial-gradient(ellipse 60% 80% at 100% 50%, rgba(244, 63, 94, 0.36) 0%, transparent 60%)",
                "radial-gradient(ellipse 100% 60% at 50% 100%, rgba(245, 158, 11, 0.38) 0%, transparent 60%)",
                "radial-gradient(ellipse 50% 50% at 50% 50%, rgba(220, 38, 38, 0.20) 0%, transparent 70%)",
              ],
            }
          : {
              base: "#FFF5F5",
              layers: [
                "radial-gradient(ellipse 60% 80% at 0% 50%, rgba(244, 63, 94, 0.30) 0%, transparent 60%)",
                "radial-gradient(ellipse 60% 80% at 100% 50%, rgba(244, 63, 94, 0.30) 0%, transparent 60%)",
                "radial-gradient(ellipse 100% 60% at 50% 100%, rgba(245, 158, 11, 0.32) 0%, transparent 60%)",
                "radial-gradient(ellipse 50% 50% at 50% 50%, rgba(220, 38, 38, 0.14) 0%, transparent 70%)",
              ],
            }
      );
    case "resolution":
      return withPreview(
        isNight
          ? {
              base: "#0A0812",
              layers: [
                "radial-gradient(ellipse 90% 60% at 50% 30%, rgba(124, 58, 237, 0.32) 0%, transparent 70%)",
              ],
            }
          : {
              base: "#F7F5FF",
              layers: [
                "radial-gradient(ellipse 90% 60% at 50% 30%, rgba(124, 58, 237, 0.28) 0%, transparent 70%)",
              ],
            }
      );
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
  if (heatLevel < 30) return "rgba(124, 58, 237, 0.35)";
  if (heatLevel < 60) return "rgba(245, 158, 11, 0.40)";
  return "rgba(244, 63, 94, 0.45)";
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

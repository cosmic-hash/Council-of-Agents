import type { HeatState } from "./heat";
import { getHeatState, getHeatGradient, getParticleColor, getTensionMeterColor } from "./heat";
import type { DebateMode } from "./types";
import { getHeatVisuals, getTensionWireStyle } from "./theme";

export { getHeatState, getHeatGradient, getParticleColor, getTensionMeterColor, getHeatVisuals, getTensionWireStyle };
export type { HeatState };

export function getModeStageFilter(mode: DebateMode): string | undefined {
  return mode === "normal" ? "saturate(0.85)" : undefined;
}

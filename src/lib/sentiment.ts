import type { Theme } from "@/hooks/useTheme";
import { getTensionMeterColor } from "@/lib/heat";

export interface SentimentPulseStyle {
  background: string;
  orbGradient: string;
  cycleSeconds: number;
  opacity: number;
}

function sentimentToHeat(sentiment: number): number {
  if (sentiment > 0.3) return 20;
  if (sentiment < -0.3) return 80;
  return 50;
}

export function getSentimentPulseStyle(
  sentiment: number,
  theme: Theme,
  wordBump = 0,
  agentColor?: string
): SentimentPulseStyle {
  const abs = Math.abs(sentiment);
  const isNight = theme === "night";
  const tint = agentColor ?? getTensionMeterColor(sentimentToHeat(sentiment));
  const r = parseInt(tint.slice(1, 3), 16);
  const g = parseInt(tint.slice(3, 5), 16);
  const b = parseInt(tint.slice(5, 7), 16);
  const baseOpacity = (isNight ? 0.12 : 0.08) + abs * 0.04;
  const bump = 1 + wordBump * 0.1;

  const background = `radial-gradient(ellipse 70% 60% at 50% 50%, rgba(${r},${g},${b},${baseOpacity * bump}) 0%, transparent 70%)`;
  const orbOpacity = Math.min(0.55, (isNight ? 0.35 : 0.28) + abs * 0.08) * bump;
  const orbGradient = `radial-gradient(circle, rgba(${r},${g},${b},${orbOpacity}) 0%, rgba(${r},${g},${b},${orbOpacity * 0.35}) 45%, transparent 70%)`;
  const cycleSeconds = Math.max(1.2, 4 - abs * 2.8);

  return {
    background,
    orbGradient,
    cycleSeconds,
    opacity: Math.min(0.85, (0.65 + abs * 0.15) * bump),
  };
}

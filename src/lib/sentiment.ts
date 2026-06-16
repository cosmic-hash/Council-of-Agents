import type { Theme } from "@/hooks/useTheme";

export interface SentimentPulseStyle {
  background: string;
  cycleSeconds: number;
  opacity: number;
}

export function getSentimentPulseStyle(
  sentiment: number,
  theme: Theme,
  wordBump = 0
): SentimentPulseStyle {
  const abs = Math.abs(sentiment);
  const isNight = theme === "night";
  const opacityScale = isNight ? 2.2 : 2.5;
  const bump = 1 + wordBump * 0.2;

  let background: string;
  if (sentiment > 0.4) {
    background = `radial-gradient(ellipse 75% 65% at 50% 50%, rgba(16,185,129,${0.22 * opacityScale * bump}) 0%, rgba(245,158,11,${0.14 * opacityScale}) 40%, transparent 72%)`;
  } else if (sentiment > 0.1) {
    background = `radial-gradient(ellipse 75% 65% at 50% 50%, rgba(124,58,237,${0.20 * opacityScale * bump}) 0%, rgba(245,158,11,${0.16 * opacityScale}) 50%, transparent 75%)`;
  } else if (sentiment >= -0.1) {
    background = `radial-gradient(ellipse 75% 65% at 50% 50%, rgba(124,58,237,${0.18 * opacityScale * bump}) 0%, transparent 72%)`;
  } else if (sentiment >= -0.4) {
    background = `radial-gradient(ellipse 75% 65% at 50% 50%, rgba(245,158,11,${0.20 * opacityScale * bump}) 0%, rgba(244,63,94,${0.16 * opacityScale}) 50%, transparent 75%)`;
  } else {
    background = `radial-gradient(ellipse 75% 65% at 50% 50%, rgba(244,63,94,${0.28 * opacityScale * bump}) 0%, rgba(220,38,38,${0.16 * opacityScale}) 45%, transparent 72%)`;
  }

  const cycleSeconds = Math.max(1.2, 4 - abs * 2.8);

  return {
    background,
    cycleSeconds,
    opacity: Math.min(1, (0.95 + abs * 0.05) * bump),
  };
}

"use client";

import { useEffect, useState } from "react";
import type { Theme } from "@/hooks/useTheme";
import { getSentimentPulseStyle } from "@/lib/sentiment";

interface SentimentPulseProps {
  sentiment: number;
  theme: Theme;
  wordBump: number;
  className?: string;
}

export function SentimentPulse({
  sentiment,
  theme,
  wordBump,
  className = "",
}: SentimentPulseProps) {
  const [bump, setBump] = useState(0);
  const style = getSentimentPulseStyle(sentiment, theme, bump);

  useEffect(() => {
    if (wordBump <= 0) return;
    setBump(1);
    const t = setTimeout(() => setBump(0), 150);
    return () => clearTimeout(t);
  }, [wordBump]);

  return (
    <div
      className={`sentiment-pulse pointer-events-none absolute inset-0 ${className}`}
      style={{
        background: style.background,
        opacity: style.opacity,
        animationDuration: `${style.cycleSeconds}s`,
      }}
    />
  );
}

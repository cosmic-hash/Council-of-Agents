"use client";

import { useEffect, useState } from "react";
import type { Theme } from "@/hooks/useTheme";
import { getSentimentPulseStyle } from "@/lib/sentiment";

interface SentimentPulseProps {
  sentiment: number;
  theme: Theme;
  wordBump: number;
  isSpeaking?: boolean;
  agentColor?: string;
  className?: string;
}

export function SentimentPulse({
  sentiment,
  theme,
  wordBump,
  isSpeaking = false,
  agentColor,
  className = "",
}: SentimentPulseProps) {
  const [bump, setBump] = useState(0);
  const [jolt, setJolt] = useState(false);
  const style = getSentimentPulseStyle(sentiment, theme, bump, agentColor);

  useEffect(() => {
    if (wordBump <= 0) return;
    setBump(1);
    if (isSpeaking) {
      setJolt(true);
      const joltTimer = setTimeout(() => setJolt(false), 150);
      const bumpTimer = setTimeout(() => setBump(0), 150);
      return () => {
        clearTimeout(joltTimer);
        clearTimeout(bumpTimer);
      };
    }
    const t = setTimeout(() => setBump(0), 150);
    return () => clearTimeout(t);
  }, [wordBump, isSpeaking]);

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <div
        className="sentiment-pulse absolute inset-0"
        style={{
          background: style.background,
          opacity: style.opacity * 0.6,
          animationDuration: `${style.cycleSeconds}s`,
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={isSpeaking ? "speaking-orb-drift-wrap" : "speaking-orb-idle-wrap"}>
          <div
            className={`speaking-orb-scale ${isSpeaking ? "speaking-orb-scale-active" : ""} ${
              jolt ? "speaking-orb-jolt" : ""
            }`}
            style={{
              background: style.orbGradient,
              opacity: Math.min(1, style.opacity + 0.15),
            }}
          />
        </div>
      </div>
    </div>
  );
}

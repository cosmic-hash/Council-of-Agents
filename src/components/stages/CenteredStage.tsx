"use client";

import { motion } from "framer-motion";
import type { Agent } from "@/lib/types";
import type { Theme } from "@/hooks/useTheme";
import { SpeakingBars } from "../SpeakingBars";
import { SentimentPulse } from "../SentimentPulse";
import { getEnergyBeamColor } from "@/lib/theme";

interface CenteredStageProps {
  agent: Agent | null;
  displayed: string;
  typingComplete: boolean;
  sentiment: number;
  theme: Theme;
  wordBump: number;
  energyBeam?: boolean;
  showQuestionOrb?: boolean;
  isOpening?: boolean;
  role?: string;
}

export function CenteredStage({
  agent,
  displayed,
  typingComplete,
  sentiment,
  theme,
  wordBump,
  energyBeam = false,
  showQuestionOrb = false,
  role,
}: CenteredStageProps) {
  return (
    <div className="relative flex flex-1 flex-col items-center justify-center px-8">
      <SentimentPulse sentiment={sentiment} theme={theme} wordBump={wordBump} />

      {showQuestionOrb && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute h-32 w-32 rounded-full opacity-55"
          style={{
            background: "radial-gradient(circle, rgba(124,58,237,0.35) 0%, transparent 70%)",
            boxShadow: "0 0 24px rgba(124,58,237,0.35), 0 0 0 2px rgba(124,58,237,0.25)",
          }}
        />
      )}

      {energyBeam && (
        <motion.div
          initial={{ scale: 0, opacity: 0.8 }}
          animate={{ scale: 2.5, opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="pointer-events-none absolute h-48 w-48 rounded-full"
          style={{
            background: `radial-gradient(circle, ${getEnergyBeamColor()}, transparent 70%)`,
          }}
        />
      )}

      {agent && (
        <div className="relative z-10 flex flex-col items-center">
          <SpeakingBars color={agent.color} active={!typingComplete} />
          <div
            className="mb-3 flex h-16 w-16 items-center justify-center text-4xl"
            style={{ filter: `drop-shadow(0 0 20px ${agent.color}90) drop-shadow(0 0 40px ${agent.color}50)` }}
          >
            {agent.icon}
          </div>
          <span
            className="font-inter text-sm font-semibold"
            style={{ color: agent.color }}
          >
            {agent.name}
          </span>
          {role && (
            <span className="font-mono text-[11px] text-foreground-muted">{role}</span>
          )}
          <p className="mt-6 max-w-lg text-center font-inter text-[15px] font-light leading-relaxed text-debate-text">
            {displayed}
            {!typingComplete && (
              <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-debate-text" />
            )}
          </p>
        </div>
      )}
    </div>
  );
}

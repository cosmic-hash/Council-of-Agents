"use client";

import { motion } from "framer-motion";
import type { Agent, DebateMode, Exchange } from "@/lib/types";
import type { Theme } from "@/hooks/useTheme";
import { SpeakingBars } from "../SpeakingBars";
import { TensionWire } from "../TensionWire";
import { SentimentPulse } from "../SentimentPulse";
import { getEnergyBeamColor } from "@/lib/theme";

interface SplitStageProps {
  currentAgent: Agent;
  prevAgent: Agent;
  prevExchange: Exchange;
  displayed: string;
  typingComplete: boolean;
  sentiment: number;
  theme: Theme;
  wordBump: number;
  mode: DebateMode;
  heatLevel: number;
  leftPulse: boolean;
  energyBeam?: boolean;
}

export function SplitStage({
  currentAgent,
  prevAgent,
  prevExchange,
  displayed,
  typingComplete,
  sentiment,
  theme,
  wordBump,
  mode,
  heatLevel,
  leftPulse,
  energyBeam = false,
}: SplitStageProps) {
  return (
    <div className="relative flex flex-1 flex-col md:flex-row">
      <div className="hidden md:block">
        <TensionWire mode={mode} visible heatLevel={heatLevel} />
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.85 }}
        className={`relative flex w-full flex-col items-center justify-center border-b border-surface-border px-4 py-4 md:w-1/2 md:border-b-0 md:border-r md:px-6 ${
          leftPulse ? "animate-pulse" : ""
        } grayscale-[0.2]`}
        style={
          leftPulse
            ? {
                backgroundColor: `${prevAgent.color}28`,
                borderColor: prevAgent.color,
              }
            : undefined
        }
      >
        <div
          className="absolute inset-0 opacity-60"
          style={{
            background: `radial-gradient(ellipse at center, ${prevAgent.color}22 0%, transparent 70%)`,
          }}
        />
        <p className="relative mb-2 font-mono text-[9px] uppercase tracking-wider text-foreground-muted md:hidden">
          Previous speaker
        </p>
        <div
          className="relative mb-2 flex h-10 w-10 items-center justify-center rounded-full text-xl md:mb-3 md:h-12 md:w-12 md:text-2xl"
          style={{ boxShadow: `0 0 24px ${prevAgent.color}60` }}
        >
          {prevAgent.icon}
        </div>
        <span
          className="relative font-inter text-xs font-semibold opacity-60 md:text-sm"
          style={{ color: prevAgent.color }}
        >
          {prevAgent.name}
        </span>
        <p className="relative mt-2 line-clamp-4 max-w-xs text-center font-inter text-xs font-light text-foreground-muted md:mt-4 md:line-clamp-none md:text-sm">
          {prevExchange.content}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative flex w-full flex-col items-center justify-center px-4 py-6 md:w-1/2 md:px-6"
      >
        <SentimentPulse sentiment={sentiment} theme={theme} wordBump={wordBump} />

        {energyBeam && (
          <motion.div
            initial={{ width: 0, opacity: 0.8 }}
            animate={{ width: "100%", opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute left-0 top-1/2 hidden h-px -translate-y-1/2 md:block"
            style={{
              background: `linear-gradient(90deg, ${getEnergyBeamColor()}, transparent)`,
            }}
          />
        )}

        <p className="relative mb-2 font-mono text-[9px] uppercase tracking-wider text-foreground-muted md:hidden">
          Now speaking
        </p>
        <SpeakingBars color={currentAgent.color} active={!typingComplete} />
        <div
          className="relative mb-3 flex h-14 w-14 items-center justify-center text-3xl md:h-16 md:w-16 md:text-4xl"
          style={{ filter: `drop-shadow(0 0 20px ${currentAgent.color}90) drop-shadow(0 0 40px ${currentAgent.color}50)` }}
        >
          {currentAgent.icon}
        </div>
        <span
          className="relative font-inter text-sm font-semibold"
          style={{ color: currentAgent.color }}
        >
          {currentAgent.name}
        </span>
        <span className="relative font-mono text-[11px] text-foreground-muted">
          {currentAgent.role}
        </span>
        <p className="relative mt-4 max-w-sm text-center font-inter text-sm font-light leading-relaxed text-debate-text md:mt-6 md:text-[15px]">
          {displayed}
          {!typingComplete && (
            <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-debate-text" />
          )}
        </p>
      </motion.div>
    </div>
  );
}

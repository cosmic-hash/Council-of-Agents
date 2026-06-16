"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AGENTS } from "@/lib/constants";
import { getTensionMeterColor } from "@/lib/heat";
import { TIMELINE_LABELS } from "@/lib/types";
import type { AgentId } from "@/lib/types";

const TIMELINE_AGENTS: AgentId[] = [
  "optimist",
  "contrarian",
  "pragmatist",
  "oracle",
  "optimist",
  "contrarian",
  "pragmatist",
  "oracle",
  "judge",
];

interface TimelineProps {
  activeIndex: number;
  onDotClick: (index: number) => void;
  isComplete: boolean;
  isStreaming?: boolean;
  heatLevel?: number;
  autoAdvance?: boolean;
}

export function Timeline({
  activeIndex,
  onDotClick,
  isComplete,
  isStreaming = false,
  heatLevel = 0,
  autoAdvance = true,
}: TimelineProps) {
  const prevIndexRef = useRef(activeIndex);
  const traveling = prevIndexRef.current !== activeIndex && activeIndex >= 0;

  useEffect(() => {
    prevIndexRef.current = activeIndex;
  }, [activeIndex]);

  const progress =
    activeIndex < 0 ? 0 : ((activeIndex + (isComplete ? 1 : 0.5)) / 9) * 100;
  const railColor = getTensionMeterColor(heatLevel);

  const phase =
    activeIndex < 4 ? "Opening" : activeIndex < 8 ? "Rebuttals" : "Verdict";

  return (
    <div className="border-t border-surface-border px-8 py-4">
      <div className="relative mx-auto max-w-2xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={phase}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="mb-3 flex justify-between px-2"
          >
            <span
              className={`font-mono text-[9px] ${
                phase === "Opening" ? "text-foreground" : "text-foreground-muted"
              }`}
            >
              Opening
            </span>
            <span
              className={`font-mono text-[9px] ${
                phase === "Rebuttals" ? "text-foreground" : "text-foreground-muted"
              }`}
            >
              Rebuttals
            </span>
            <span
              className={`font-mono text-[9px] ${
                phase === "Verdict" ? "text-foreground" : "text-foreground-muted"
              }`}
            >
              Verdict
            </span>
          </motion.div>
        </AnimatePresence>

        <div className="relative mb-1 h-0.5 overflow-hidden rounded-full bg-surface-border">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            animate={{ width: `${Math.min(100, progress)}%` }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            style={{ backgroundColor: railColor }}
          />
          {traveling && activeIndex > 0 && (
            <motion.div
              className="absolute top-0 h-full w-1 rounded-full"
              initial={{ left: `${((activeIndex - 1) / 9) * 100}%`, opacity: 1 }}
              animate={{ left: `${(activeIndex / 9) * 100}%`, opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              style={{ backgroundColor: railColor, boxShadow: `0 0 12px ${railColor}, 0 0 24px ${railColor}80` }}
            />
          )}
        </div>

        <div className="flex items-center justify-between pt-2">
          {TIMELINE_AGENTS.map((agentId, i) => {
            const agent = AGENTS[agentId];
            const isPast = i < activeIndex || isComplete;
            const isActive = i === activeIndex && !isComplete;
            const isFuture = i > activeIndex && !isComplete;
            const isUpcoming = isStreaming && i === activeIndex + 1;

            return (
              <button
                key={i}
                onClick={() => (isPast || isComplete ? onDotClick(i) : undefined)}
                disabled={isFuture}
                className="group relative flex flex-col items-center"
                title={agent.name}
              >
                <motion.div
                  animate={{
                    scale: isActive ? 1.4 : 1,
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  className={`rounded-full ${
                    isActive ? "h-3 w-3 ring-2 ring-offset-1 ring-offset-background" : "h-2 w-2"
                  } ${isPast ? "opacity-70" : isFuture ? "opacity-20" : "opacity-100"} ${
                    isUpcoming ? "animate-pulse" : ""
                  }`}
                  style={{
                    backgroundColor: isPast || isActive ? agent.color : "transparent",
                    border: `1px solid ${agent.color}`,
                    boxShadow: isActive
                      ? `0 0 16px ${agent.color}70, 0 0 28px ${agent.color}40, 0 0 0 2px ${agent.color}`
                      : undefined,
                  }}
                />
                <span className="mt-1 font-mono text-[9px] text-foreground-muted">
                  {TIMELINE_LABELS[i]}
                </span>
              </button>
            );
          })}
        </div>

        <p className="mt-2 text-center font-mono text-[9px] text-foreground-muted">
          {autoAdvance ? "Space to skip ahead" : "Press Space to continue"}
        </p>
      </div>
    </div>
  );
}

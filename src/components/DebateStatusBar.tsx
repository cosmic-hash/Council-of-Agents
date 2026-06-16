"use client";

import { motion } from "framer-motion";
import type { Agent } from "@/lib/types";

export type DebateStatusPhase = "question" | "opening" | "rebuttal" | "verdict" | "intro";

export type DebateStatusKind =
  | "speaking"
  | "listening"
  | "deliberating"
  | "delivering_verdict"
  | "idle";

interface DebateStatusBarProps {
  phase: DebateStatusPhase;
  activeAgent: Agent | null;
  status: DebateStatusKind;
}

const PHASE_LABELS: Record<DebateStatusPhase, string> = {
  question: "Question",
  opening: "Opening",
  rebuttal: "Rebuttals",
  verdict: "Verdict",
  intro: "Judge",
};

const STATUS_LABELS: Record<DebateStatusKind, string> = {
  speaking: "Speaking…",
  listening: "Listening",
  deliberating: "Deliberating…",
  delivering_verdict: "Delivering verdict",
  idle: "Ready",
};

export function DebateStatusBar({ phase, activeAgent, status }: DebateStatusBarProps) {
  return (
    <div className="border-b border-surface-border bg-surface/90 px-4 py-2 backdrop-blur-sm md:px-6">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="shrink-0 font-mono text-[9px] uppercase tracking-widest text-violet-600 dark:text-violet-400">
            {PHASE_LABELS[phase]}
          </span>
          {activeAgent && (
            <>
              <span className="text-base">{activeAgent.icon}</span>
              <div className="min-w-0">
                <p
                  className="truncate font-inter text-xs font-semibold"
                  style={{ color: activeAgent.color }}
                >
                  {activeAgent.name}
                </p>
                <p className="truncate font-mono text-[9px] text-foreground-muted">
                  {activeAgent.role}
                </p>
              </div>
            </>
          )}
        </div>

        <motion.span
          animate={status === "speaking" ? { opacity: [0.7, 1, 0.7] } : { opacity: 1 }}
          transition={
            status === "speaking"
              ? { duration: 1.2, repeat: Infinity, ease: "easeInOut" }
              : undefined
          }
          className={`shrink-0 rounded-full border px-2.5 py-1 font-mono text-[9px] ${
            status === "speaking"
              ? "border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-700 dark:bg-violet-900/40 dark:text-violet-300"
              : "border-surface-border bg-background text-foreground-muted"
          }`}
        >
          {STATUS_LABELS[status]}
        </motion.span>
      </div>
    </div>
  );
}

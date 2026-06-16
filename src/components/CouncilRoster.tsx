"use client";

import { motion } from "framer-motion";
import { AGENTS, COUNCIL_ROSTER_ORDER } from "@/lib/constants";
import type { AgentId, DebatePhase } from "@/lib/types";

interface CouncilRosterProps {
  activeAgentId: AgentId | null;
  spokenAgentIds: AgentId[];
  upcomingAgentId: AgentId | null;
  phase: DebatePhase | "question" | null;
  isVerdictPhase?: boolean;
}

export function CouncilRoster({
  activeAgentId,
  spokenAgentIds,
  upcomingAgentId,
  phase,
  isVerdictPhase = false,
}: CouncilRosterProps) {
  const spokenSet = new Set(spokenAgentIds);

  return (
    <div className="border-b border-surface-border px-4 py-2 md:px-6">
      <div className="mx-auto max-w-3xl overflow-x-auto">
        <div className="flex min-w-max items-center justify-between gap-4 px-1 md:min-w-0 md:gap-0">
        {COUNCIL_ROSTER_ORDER.map((agentId) => {
          const agent = AGENTS[agentId];
          const isActive = isVerdictPhase
            ? agentId === "judge"
            : activeAgentId === agentId;
          const isSpoken = spokenSet.has(agentId);
          const isUpcoming = upcomingAgentId === agentId;
          const isJudge = agentId === "judge";
          const dimmed =
            isVerdictPhase
              ? agentId !== "judge"
              : isJudge && phase !== "verdict";

          return (
            <motion.div
              key={agentId}
              animate={{
                scale: isActive ? 1.05 : 1,
                opacity: dimmed ? 0.35 : isActive ? 1 : isSpoken ? 0.75 : 0.5,
              }}
              className="flex flex-col items-center gap-0.5"
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-base transition-shadow ${
                  isActive ? "ring-2 ring-offset-1 ring-offset-background" : ""
                } ${isUpcoming ? "animate-pulse" : ""}`}
                style={{
                  boxShadow: isActive ? `0 0 20px ${agent.color}80, 0 0 36px ${agent.color}40` : undefined,
                  borderColor: agent.color,
                  borderWidth: isActive ? 2 : 1,
                }}
              >
                {agent.icon}
              </div>
              <span
                className="max-w-[4.5rem] truncate font-inter text-[9px] font-medium"
                style={{ color: isActive || isSpoken ? agent.color : undefined }}
              >
                {agent.name.replace("The ", "")}
              </span>
              <div
                className="h-1 w-1 rounded-full"
                style={{
                  backgroundColor: isSpoken || isActive ? agent.color : "transparent",
                  border: `1px solid ${agent.color}`,
                  opacity: isSpoken || isActive ? 1 : 0.3,
                }}
              />
            </motion.div>
          );
        })}
        </div>
      </div>
    </div>
  );
}

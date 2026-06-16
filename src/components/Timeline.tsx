"use client";

import { AGENTS } from "@/lib/constants";
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
}

export function Timeline({ activeIndex, onDotClick, isComplete }: TimelineProps) {
  return (
    <div className="px-8 pb-6">
      <div className="relative mx-auto max-w-2xl">
        <div className="mb-2 flex justify-between px-2">
          <span className="font-mono text-[9px] text-gray-600">Opening</span>
          <span className="font-mono text-[9px] text-gray-600">Rebuttals</span>
          <span className="font-mono text-[9px] text-gray-600">Verdict</span>
        </div>

        <div className="flex items-center justify-between">
          {TIMELINE_AGENTS.map((agentId, i) => {
            const agent = AGENTS[agentId];
            const isPast = i < activeIndex || isComplete;
            const isActive = i === activeIndex && !isComplete;
            const isFuture = i > activeIndex && !isComplete;

            return (
              <button
                key={i}
                onClick={() => isPast || isComplete ? onDotClick(i) : undefined}
                disabled={isFuture}
                className="group relative flex flex-col items-center"
                title={agent.name}
              >
                <div
                  className={`rounded-full transition-all duration-300 ${
                    isActive ? "h-3 w-3 ring-2 ring-offset-1 ring-offset-transparent" : "h-2 w-2"
                  } ${isPast ? "opacity-70" : isFuture ? "opacity-20" : "opacity-100"}`}
                  style={{
                    backgroundColor: isPast || isActive ? agent.color : "transparent",
                    border: `1px solid ${agent.color}`,
                    boxShadow: isActive
                      ? `0 0 12px ${agent.color}40, 0 0 0 2px ${agent.color}`
                      : undefined,
                  }}
                />
                <span className="mt-1 font-mono text-[9px] text-gray-600">
                  {TIMELINE_LABELS[i]}
                </span>
                {i < TIMELINE_AGENTS.length - 1 && (
                  <div
                    className="absolute left-full top-1 h-px w-full -translate-y-0"
                    style={{
                      width: "calc((100vw - 4rem) / 9)",
                      maxWidth: "60px",
                      backgroundColor: isPast ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.05)",
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

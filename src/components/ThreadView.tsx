"use client";

import { AGENTS } from "@/lib/constants";
import { getTensionMeterColor } from "@/lib/heat";
import type { DebateMessage } from "@/lib/types";

interface ThreadViewProps {
  messages: DebateMessage[];
  verdict: string | null;
  heatLevel: number;
  question: string;
}

export function ThreadView({ messages, verdict, heatLevel, question }: ThreadViewProps) {
  const meterColor = getTensionMeterColor(heatLevel);

  return (
    <div className="relative flex h-full flex-col">
      <div className="absolute right-4 top-4 flex flex-col items-center gap-1">
        <span className="font-mono text-[10px] text-foreground-muted">tension</span>
        <div className="h-24 w-1 overflow-hidden rounded-full bg-surface-border">
          <div
            className="w-full rounded-full transition-all duration-1000 ease-out"
            style={{
              height: `${heatLevel}%`,
              backgroundColor: meterColor,
              marginTop: `${100 - heatLevel}%`,
            }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="mx-auto max-w-2xl space-y-6 rounded-xl bg-surface/80 p-6 backdrop-blur-sm">
          <div className="border-l-2 border-violet-300 pl-4 dark:border-violet-600">
            <p className="font-playfair text-lg text-foreground-muted">{question}</p>
          </div>

          {messages.map((msg, i) => {
            const agent = AGENTS[msg.agentId];
            return (
              <div
                key={i}
                className="border-l-2 pl-4"
                style={{ borderColor: agent.color }}
              >
                <div className="mb-1 flex items-center gap-2">
                  <span
                    className="font-inter text-sm font-semibold"
                    style={{ color: agent.color }}
                  >
                    {agent.name}
                  </span>
                  <span className="rounded bg-violet-50 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-violet-600 dark:bg-violet-950/50 dark:text-violet-300">
                    {msg.phase}
                  </span>
                </div>
                <p className="font-inter text-[15px] font-light leading-relaxed text-debate-text">
                  {msg.content}
                </p>
              </div>
            );
          })}

          {verdict && (
            <div className="border-l-2 pl-4" style={{ borderColor: AGENTS.judge.color }}>
              <div className="mb-1 flex items-center gap-2">
                <span
                  className="font-inter text-sm font-semibold"
                  style={{ color: AGENTS.judge.color }}
                >
                  {AGENTS.judge.name}
                </span>
                <span className="rounded bg-violet-50 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-violet-600">
                  verdict
                </span>
              </div>
              <p className="whitespace-pre-wrap font-inter text-[15px] font-normal leading-relaxed text-debate-text">
                {verdict}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { AGENTS, COUNCIL_ROSTER_ORDER } from "@/lib/constants";

interface LandingIntroProps {
  hasApiKey: boolean | null;
}

const STEPS = [
  "Pick an intensity — Normal, Moderate, or Aggressive sets the tone and pace.",
  "Ask your question — career moves, big bets, hard tradeoffs.",
  "Add optional context under About You so agents can personalize (saved locally).",
  "Watch the debate in Duel (cinematic) or Thread (readable feed) using the toggle above.",
];

export function LandingIntro({ hasApiKey }: LandingIntroProps) {
  const liveAvailable = hasApiKey === true;
  const livePending = hasApiKey === null;

  return (
    <div className="space-y-6 rounded-xl border border-surface-border bg-surface/80 p-4 backdrop-blur-sm sm:p-6">
      <section>
        <h2 className="mb-2 font-mono text-[10px] uppercase tracking-widest text-violet-600 dark:text-violet-400">
          What is Council of Agents?
        </h2>
        <p className="font-inter text-sm font-light leading-relaxed text-debate-text">
          Five AI personas debate a real decision you are facing — whether to change
          jobs, move cities, start a company, or any fork in the road. Each agent
          argues from a different angle. The Judge closes with a structured verdict.
          You still make the call; the council sharpens your thinking.
        </p>
      </section>

      <section>
        <h2 className="mb-3 font-mono text-[10px] uppercase tracking-widest text-violet-600 dark:text-violet-400">
          How to use it
        </h2>
        <ol className="space-y-2">
          {STEPS.map((step, i) => (
            <li key={i} className="flex gap-3 font-inter text-sm font-light text-debate-text">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-100 font-mono text-[10px] font-medium text-violet-700 dark:bg-violet-950/50 dark:text-violet-300">
                {i + 1}
              </span>
              <span className="leading-relaxed">{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h2 className="mb-3 font-mono text-[10px] uppercase tracking-widest text-violet-600 dark:text-violet-400">
          Meet the council
        </h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
          {COUNCIL_ROSTER_ORDER.map((agentId) => {
            const agent = AGENTS[agentId];
            return (
              <div
                key={agentId}
                className="rounded-lg border border-surface-border bg-background px-3 py-2 text-center"
              >
                <span className="text-lg">{agent.icon}</span>
                <p
                  className="mt-1 font-inter text-[11px] font-semibold leading-tight"
                  style={{ color: agent.color }}
                >
                  {agent.name.replace("The ", "")}
                </p>
                <p className="mt-0.5 font-mono text-[9px] leading-snug text-foreground-muted">
                  {agent.role}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-surface-border bg-background p-4">
          <p className="mb-1 font-inter text-sm font-semibold text-foreground">
            Try preview
          </p>
          <p className="font-inter text-xs font-light leading-relaxed text-foreground-muted">
            Full debate experience with sample responses. No API key required — great
            for exploring the UI or sharing a demo link safely.
          </p>
        </div>
        <div className="rounded-lg border border-surface-border bg-background p-4">
          <p className="mb-1 font-inter text-sm font-semibold text-foreground">
            Convene the Council
          </p>
          <p className="font-inter text-xs font-light leading-relaxed text-foreground-muted">
            {livePending
              ? "Checking whether live AI debates are available on this deployment…"
              : liveAvailable
                ? "Live Gemini-powered debate. Pick a mode, enter your question, and start."
                : "Live debates need a server API key on this deployment. Use Try preview, or ask the host to configure GEMINI_API_KEY."}
          </p>
        </div>
      </section>

      <section className="border-t border-surface-border pt-4">
        <p className="font-mono text-[10px] leading-relaxed text-foreground-muted">
          During a debate: agents auto-advance when typing finishes (toggle Auto in
          Duel view). Press Space to skip ahead. Switch light/night theme anytime.
          Background heat and sentiment pulse rise as tension builds.
        </p>
      </section>
    </div>
  );
}

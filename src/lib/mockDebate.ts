import { AGENTS } from "@/lib/constants";
import { parseSentiment } from "@/lib/prompts";
import type { AgentId, DebateMode } from "@/lib/types";
import { DEBATE_AGENTS_ORDER } from "@/lib/types";
import { computeHeatDelta } from "@/lib/heat";

type SendFn = (event: string, data: Record<string, unknown>) => void;

const OPENING_TEMPLATES: Record<AgentId, string> = {
  optimist:
    "The upside here is real and specific. This decision opens a path to growth you have been circling for months. The best case is not fantasy — it is a credible win if you commit fully. Hold that possibility with conviction.",
  contrarian:
    "The comfortable assumption is that waiting is safer. It is not. The deepest risk is that you optimize for avoiding regret today while guaranteeing stagnation tomorrow. What evidence do you have that delay actually reduces risk?",
  pragmatist:
    "This will take approximately six months of focused effort and real trade-offs in time and energy. The real bottleneck is not the decision — it is execution discipline. Success requires one condition: protected weekly progress.",
  oracle:
    "In 3 out of 5 timelines, this works if you move deliberately. The tail risk is moving too fast without a safety net. What would make this safe is a clear runway and an exit plan if metrics slip.",
  judge: "",
};

const REBUTTAL_TEMPLATES: Record<AgentId, string> = {
  optimist:
    "The Contrarian is right that comfort is dangerous — but fear is not a strategy. The opportunity cost of inaction is the silent killer here. I stand by the upside, with eyes open to the risks.",
  contrarian:
    "The Optimist sees the prize but underweights the execution tax the Pragmatist named. Enthusiasm without structure is how good decisions become expensive lessons. The question is not if — it is whether you are ready now.",
  pragmatist:
    "The Oracle's tail risk is real, which is why I want a phased approach — not paralysis. Six months becomes twelve when scope creeps. One condition: ship something meaningful in the first 30 days.",
  oracle:
    "The Pragmatist's timeline is optimistic if relationships and energy are already stretched. I am not saying no — I am saying the risk landscape demands a buffer. Safety means runway plus honest checkpoints.",
  judge: "",
};

const VERDICT_TEMPLATE = `The Core Tension: conviction versus readiness.

Strongest arguments — Optimist: the upside is concrete and worth pursuing. Contrarian: delay disguised as caution is the real threat. Pragmatist: execution discipline is the bottleneck. Oracle: tail risk demands a buffer.

The Verdict: Do it only if you can protect focused time for the first 90 days.

The One Condition: a clear runway and weekly accountability.

The First Step: block two hours in the next 48 hours to define the smallest shippable milestone.

You do not need more certainty — you need a committed first step.`;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function personalize(text: string, userContext?: string): string {
  if (!userContext?.trim()) return text;
  const snippet = userContext.trim().slice(0, 80);
  return `Given your situation — ${snippet} — ${text.charAt(0).toLowerCase()}${text.slice(1)}`;
}

function mockContent(
  agentId: AgentId,
  phase: "opening" | "rebuttal",
  question: string,
  userContext?: string
): string {
  const base =
    phase === "opening" ? OPENING_TEMPLATES[agentId] : REBUTTAL_TEMPLATES[agentId];
  const withQuestion = base.replace("this", `"${question.slice(0, 60)}"`);
  return personalize(withQuestion, userContext);
}

export interface MockDebateOptions {
  delayMs?: number;
}

export async function runMockDebate(
  question: string,
  mode: DebateMode,
  userContext: string,
  send: SendFn,
  options: MockDebateOptions = {}
): Promise<void> {
  let heatLevel = 0;
  const openingStatements: Record<string, string> = {};
  const fullTranscript: string[] = [];

  const pause = async () => {
    const ms = options.delayMs ?? 400 + Math.random() * 400;
    if (ms > 0) await delay(ms);
  };

  send("phase", { phase: "opening", label: "Opening Statements", heatLevel });

  for (const agentId of DEBATE_AGENTS_ORDER) {
    await pause();
    send("agent_start", { agentId, phase: "opening" });

    const text = mockContent(agentId, "opening", question, userContext);
    const { text: cleanText, sentiment } = parseSentiment(text);

    openingStatements[agentId] = cleanText;
    fullTranscript.push(`${AGENTS[agentId].name}: ${cleanText}`);

    heatLevel = Math.max(
      0,
      Math.min(100, heatLevel + computeHeatDelta(agentId, "opening", sentiment))
    );
    send("agent_message", {
      agentId,
      content: cleanText,
      phase: "opening",
      sentiment,
      mode,
    });
    send("heat_update", { level: heatLevel });
  }

  send("phase", { phase: "rebuttal", label: "Rebuttals", heatLevel });

  for (const agentId of DEBATE_AGENTS_ORDER) {
    await pause();
    send("agent_start", { agentId, phase: "rebuttal" });

    const text = mockContent(agentId, "rebuttal", question, userContext);
    const { text: cleanText, sentiment } = parseSentiment(text);

    fullTranscript.push(`${AGENTS[agentId].name} (rebuttal): ${cleanText}`);

    heatLevel = Math.max(
      0,
      Math.min(100, heatLevel + computeHeatDelta(agentId, "rebuttal", sentiment))
    );
    send("agent_message", {
      agentId,
      content: cleanText,
      phase: "rebuttal",
      sentiment,
      mode,
    });
    send("heat_update", { level: heatLevel });
  }

  send("phase", { phase: "verdict", label: "The Verdict", heatLevel });

  await pause();
  send("agent_start", { agentId: "judge", phase: "verdict" });

  const verdictText = personalize(VERDICT_TEMPLATE, userContext);
  const { text: cleanVerdict } = parseSentiment(verdictText);

  heatLevel = Math.max(0, heatLevel - 30);
  send("verdict", { content: cleanVerdict });
  send("heat_update", { level: heatLevel });
  send("done", {});
}

export async function collectMockDebateEvents(
  question: string,
  mode: DebateMode,
  userContext = "",
  options: MockDebateOptions = { delayMs: 0 }
): Promise<{ event: string; data: Record<string, unknown> }[]> {
  const events: { event: string; data: Record<string, unknown> }[] = [];
  await runMockDebate(
    question,
    mode,
    userContext,
    (event, data) => {
      events.push({ event, data });
    },
    options
  );
  return events;
}

import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { AGENTS } from "@/lib/constants";
import { buildAgentPrompt, parseSentiment } from "@/lib/prompts";
import type { AgentId, DebateMode } from "@/lib/types";
import { DEBATE_AGENTS_ORDER } from "@/lib/types";
import { computeHeatDelta } from "@/lib/heat";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function encodeSSE(event: string, data: Record<string, unknown>): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

async function callAgent(
  client: Anthropic,
  model: string,
  maxTokens: number,
  prompt: string
): Promise<string> {
  const response = await client.messages.create({
    model,
    max_tokens: maxTokens,
    messages: [{ role: "user", content: prompt }],
  });

  const block = response.content[0];
  if (block.type !== "text") return "";
  return block.text;
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";
  const maxTokens = parseInt(process.env.ANTHROPIC_MAX_TOKENS || "500", 10);

  if (!apiKey) {
    return new Response(JSON.stringify({ message: "ANTHROPIC_API_KEY not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: { question: string; mode: DebateMode; userContext?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ message: "Invalid request body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { question, mode, userContext = "" } = body;
  if (!question?.trim()) {
    return new Response(JSON.stringify({ message: "Question is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const client = new Anthropic({ apiKey });
  const encoder = new TextEncoder();
  let heatLevel = 0;
  const openingStatements: Record<string, string> = {};
  const fullTranscript: string[] = [];

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(encodeSSE(event, data)));
      };

      try {
        // Phase 1 — Opening Statements
        send("phase", { phase: "opening", label: "Opening Statements", heatLevel });

        for (const agentId of DEBATE_AGENTS_ORDER) {
          send("agent_start", { agentId, phase: "opening" });

          const prompt = buildAgentPrompt(agentId, mode, question, userContext);
          const raw = await callAgent(client, model, maxTokens, prompt);
          const { text, sentiment } = parseSentiment(raw);

          openingStatements[agentId] = text;
          fullTranscript.push(`${AGENTS[agentId].name}: ${text}`);

          heatLevel = Math.max(0, Math.min(100, heatLevel + computeHeatDelta(agentId, "opening", sentiment)));
          send("agent_message", { agentId, content: text, phase: "opening", sentiment });
          send("heat_update", { level: heatLevel });
        }

        // Phase 2 — Rebuttals
        send("phase", { phase: "rebuttal", label: "Rebuttals", heatLevel });

        for (const agentId of DEBATE_AGENTS_ORDER) {
          send("agent_start", { agentId, phase: "rebuttal" });

          const others = Object.fromEntries(
            Object.entries(openingStatements).filter(([id]) => id !== agentId)
          );
          const prompt = buildAgentPrompt(agentId, mode, question, userContext, others);
          const raw = await callAgent(client, model, maxTokens, prompt);
          const { text, sentiment } = parseSentiment(raw);

          fullTranscript.push(`${AGENTS[agentId].name} (rebuttal): ${text}`);

          heatLevel = Math.max(0, Math.min(100, heatLevel + computeHeatDelta(agentId, "rebuttal", sentiment)));
          send("agent_message", { agentId, content: text, phase: "rebuttal", sentiment });
          send("heat_update", { level: heatLevel });
        }

        // Phase 3 — Verdict
        send("phase", { phase: "verdict", label: "The Verdict", heatLevel });

        const judgePrompt = `${buildAgentPrompt("judge", mode, question, userContext)}\n\nFull debate transcript:\n${fullTranscript.join("\n\n")}`;
        send("agent_start", { agentId: "judge", phase: "verdict" });

        const rawVerdict = await callAgent(client, model, maxTokens + 200, judgePrompt);
        const { text: verdictText } = parseSentiment(rawVerdict);

        heatLevel = Math.max(0, heatLevel - 30);
        send("verdict", { content: verdictText });
        send("heat_update", { level: heatLevel });
        send("done", {});
      } catch (err) {
        const message = err instanceof Error ? err.message : "Debate failed";
        send("error", { message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

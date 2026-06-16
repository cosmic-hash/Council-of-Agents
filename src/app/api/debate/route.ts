import { NextRequest } from "next/server";
import { AGENTS } from "@/lib/constants";
import { computeHeatDelta } from "@/lib/heat";
import { getMaxTokens, hasAnyLlmApiKey } from "@/lib/env";
import { callLLM } from "@/lib/llm";
import { runMockDebate } from "@/lib/mockDebate";
import { buildAgentPrompt, parseSentiment } from "@/lib/prompts";
import type { DebateMode } from "@/lib/types";
import { DEBATE_AGENTS_ORDER } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function encodeSSE(event: string, data: Record<string, unknown>): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function POST(request: NextRequest) {
  let body: {
    question: string;
    mode: DebateMode;
    userContext?: string;
    preview?: boolean;
  };

  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ message: "Invalid request body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { question, mode, userContext = "", preview = false } = body;

  if (!question?.trim()) {
    return new Response(JSON.stringify({ message: "Question is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const hasKey = hasAnyLlmApiKey();

  if (!preview && !hasKey) {
    return new Response(
      JSON.stringify({
        message: "Add GEMINI_API_KEY to .env.local for live debates, or use preview mode",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(encodeSSE(event, data)));
      };

      try {
        if (preview) {
          await runMockDebate(question, mode, userContext, send);
          return;
        }

        const maxTokens = getMaxTokens();

        let heatLevel = 0;
        const openingStatements: Record<string, string> = {};
        const fullTranscript: string[] = [];

        send("phase", { phase: "opening", label: "Opening Statements", heatLevel });

        for (const agentId of DEBATE_AGENTS_ORDER) {
          send("agent_start", { agentId, phase: "opening" });

          const prompt = buildAgentPrompt(agentId, mode, question, userContext);
          const raw = await callLLM(prompt, maxTokens);
          const { text, sentiment } = parseSentiment(raw);

          openingStatements[agentId] = text;
          fullTranscript.push(`${AGENTS[agentId].name}: ${text}`);

          heatLevel = Math.max(
            0,
            Math.min(100, heatLevel + computeHeatDelta(agentId, "opening", sentiment))
          );
          send("agent_message", { agentId, content: text, phase: "opening", sentiment });
          send("heat_update", { level: heatLevel });
        }

        send("phase", { phase: "rebuttal", label: "Rebuttals", heatLevel });

        for (const agentId of DEBATE_AGENTS_ORDER) {
          send("agent_start", { agentId, phase: "rebuttal" });

          const others = Object.fromEntries(
            Object.entries(openingStatements).filter(([id]) => id !== agentId)
          );
          const prompt = buildAgentPrompt(agentId, mode, question, userContext, others);
          const raw = await callLLM(prompt, maxTokens);
          const { text, sentiment } = parseSentiment(raw);

          fullTranscript.push(`${AGENTS[agentId].name} (rebuttal): ${text}`);

          heatLevel = Math.max(
            0,
            Math.min(100, heatLevel + computeHeatDelta(agentId, "rebuttal", sentiment))
          );
          send("agent_message", { agentId, content: text, phase: "rebuttal", sentiment });
          send("heat_update", { level: heatLevel });
        }

        send("phase", { phase: "verdict", label: "The Verdict", heatLevel });

        const judgePrompt = `${buildAgentPrompt("judge", mode, question, userContext)}\n\nFull debate transcript:\n${fullTranscript.join("\n\n")}`;
        send("agent_start", { agentId: "judge", phase: "verdict" });

        const rawVerdict = await callLLM(judgePrompt, maxTokens + 200);
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

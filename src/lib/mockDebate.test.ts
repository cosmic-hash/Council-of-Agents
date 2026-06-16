import { describe, expect, it } from "vitest";
import { collectMockDebateEvents } from "./mockDebate";
import { DEBATE_AGENTS_ORDER } from "./types";

describe("mockDebate", () => {
  it("emits 9 agent messages, verdict, and done without API keys", async () => {
    const events = await collectMockDebateEvents(
      "Should I change careers?",
      "moderate",
      ""
    );

    const agentMessages = events.filter((e) => e.event === "agent_message");
    const verdict = events.find((e) => e.event === "verdict");
    const done = events.find((e) => e.event === "done");

    expect(agentMessages).toHaveLength(8);
    expect(verdict).toBeDefined();
    expect(done).toBeDefined();

    const opening = agentMessages.filter((e) => e.data.phase === "opening");
    const rebuttal = agentMessages.filter((e) => e.data.phase === "rebuttal");
    expect(opening).toHaveLength(4);
    expect(rebuttal).toHaveLength(4);

    for (const id of DEBATE_AGENTS_ORDER) {
      expect(opening.some((e) => e.data.agentId === id)).toBe(true);
      expect(rebuttal.some((e) => e.data.agentId === id)).toBe(true);
    }
  });

  it("returns sentiment values in [-1, 1]", async () => {
    const events = await collectMockDebateEvents("Test question?", "normal");
    const agentMessages = events.filter((e) => e.event === "agent_message");

    for (const msg of agentMessages) {
      const sentiment = msg.data.sentiment as number;
      expect(sentiment).toBeGreaterThanOrEqual(-1);
      expect(sentiment).toBeLessThanOrEqual(1);
    }
  });

  it("personalizes when user context is provided", async () => {
    const events = await collectMockDebateEvents(
      "Should I move?",
      "moderate",
      "software engineer with two kids"
    );
    const firstMessage = events.find((e) => e.event === "agent_message");
    expect(String(firstMessage?.data.content)).toContain("software engineer");
  });
});

import type { AgentId, DebateMode } from "./types";
import { MODES } from "./constants";

const BASE_PROMPTS: Record<AgentId, string> = {
  optimist: `You are The Optimist. Find the real upside — specific, concrete opportunity this decision unlocks. Name what could go beautifully right. Be bold, not naive. End with a call to conviction. Respond in 3-5 sentences max. Tight, sharp, specific.`,
  contrarian: `You are The Contrarian. Challenge the most comfortable assumption in this question. Be rigorous, not cruel. Ask the one question that cuts deepest. You are the immune system of good decisions. Respond in 3-5 sentences max. Tight, sharp, specific.`,
  pragmatist: `You are The Pragmatist. Assess what this actually requires — time, money, energy, relationships. Be concrete: "This will take approximately..." or "The real bottleneck is...". Offer one condition for success. Respond in 3-5 sentences max. Tight, sharp, specific.`,
  oracle: `You are The Oracle. Map the risk landscape. Name the tail risk — the unlikely-but-devastating scenario. Use scenario framing: "In 3 out of 5 timelines...". Also name what would make this safe. Respond in 3-5 sentences max. Tight, sharp, specific.`,
  judge: `You have heard all four agents debate. Deliver a structured verdict: (1) The Core Tension, (2) Strongest argument from each agent in one sentence, (3) The Verdict — Do it / Don't / Do it only if..., (4) The One Condition that must be true, (5) The First Step in the next 48 hours. Be decisive. End with one sentence this person can hold onto. Respond in 3-5 sentences max per section, structured clearly.`,
};

const PERSONALIZATION_RULE = `If the user has provided context about themselves, use it to make arguments more personal and relevant. BUT — always judge the question on its own merits right now, not on the user's past patterns or history.`;

export function buildAgentPrompt(
  agentId: AgentId,
  mode: DebateMode,
  question: string,
  userContext?: string,
  openingStatements?: Record<string, string>
): string {
  const modeInjection = MODES[mode].systemPromptInjection;
  let prompt = `${BASE_PROMPTS[agentId]}\n\n${modeInjection}\n\n${PERSONALIZATION_RULE}`;

  if (userContext?.trim()) {
    prompt += `\n\nUser context: ${userContext.trim()}`;
  }

  prompt += `\n\nThe question: "${question}"`;

  if (openingStatements && Object.keys(openingStatements).length > 0) {
    prompt += `\n\nOpening statements from other agents:\n`;
    for (const [id, statement] of Object.entries(openingStatements)) {
      prompt += `\n${id}: ${statement}`;
    }
    prompt += `\n\nRespond as a rebuttal. You may agree, disagree, or add what was missed.`;
  }

  prompt += `\n\nAt the very end of your response, on a new line, include exactly: SENTIMENT: <number between -1.0 and 1.0>`;

  return prompt;
}

export function parseSentiment(content: string): { text: string; sentiment: number } {
  const match = content.match(/SENTIMENT:\s*(-?[\d.]+)\s*$/i);
  if (match) {
    const sentiment = Math.max(-1, Math.min(1, parseFloat(match[1])));
    const text = content.replace(/SENTIMENT:\s*-?[\d.]+\s*$/i, "").trim();
    return { text, sentiment };
  }

  const negativeWords = ["risk", "danger", "fail", "wrong", "never", "impossible", "disaster"];
  const positiveWords = ["opportunity", "growth", "success", "beautiful", "right", "conviction", "win"];
  const lower = content.toLowerCase();
  let score = 0;
  negativeWords.forEach((w) => { if (lower.includes(w)) score -= 0.15; });
  positiveWords.forEach((w) => { if (lower.includes(w)) score += 0.15; });
  return { text: content.trim(), sentiment: Math.max(-1, Math.min(1, score)) };
}

export function wpmToMsPerWord(wpm: number): number {
  return Math.round(60000 / wpm);
}

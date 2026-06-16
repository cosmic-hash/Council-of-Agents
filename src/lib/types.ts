export type AgentId =
  | "optimist"
  | "contrarian"
  | "pragmatist"
  | "oracle"
  | "judge";

export type DebatePhase = "opening" | "rebuttal" | "verdict";

export type DebateMode = "normal" | "moderate" | "aggressive";

export type ViewMode = "thread" | "duel";

export interface Agent {
  id: AgentId;
  name: string;
  role: string;
  color: string;
  icon: string;
}

export interface DebateMessage {
  agentId: AgentId;
  content: string;
  phase: DebatePhase;
  sentiment: number;
}

export interface PhaseInfo {
  phase: DebatePhase;
  label: string;
  heatLevel: number;
}

export interface Exchange {
  id: string;
  agentId: AgentId;
  phase: DebatePhase;
  content: string;
  sentiment: number;
  sceneIndex: number;
}

export interface ModeConfig {
  id: DebateMode;
  label: string;
  icon: string;
  description: string;
  typingSpeed: number;
  pauseBetweenSentences: number;
  transitionSpeed: number;
  systemPromptInjection: string;
  desaturated: boolean;
}

export interface SSEEvent {
  event: string;
  data: Record<string, unknown>;
}

export const DEBATE_AGENTS_ORDER: AgentId[] = [
  "optimist",
  "contrarian",
  "pragmatist",
  "oracle",
];

export const TIMELINE_LABELS = ["O", "C", "P", "R", "O'", "C'", "P'", "R'", "J"];

export const SCENE_COUNT = 10;

import type { Agent, DebateMode, ModeConfig } from "./types";

export const AGENTS: Record<string, Agent> = {
  optimist: {
    id: "optimist",
    name: "The Optimist",
    role: "Finds upside & opportunity",
    color: "#10B981",
    icon: "☀",
  },
  contrarian: {
    id: "contrarian",
    name: "The Contrarian",
    role: "Challenges assumptions",
    color: "#F43F5E",
    icon: "⚡",
  },
  pragmatist: {
    id: "pragmatist",
    name: "The Pragmatist",
    role: "Assesses feasibility",
    color: "#0EA5E9",
    icon: "⚙",
  },
  oracle: {
    id: "oracle",
    name: "The Oracle",
    role: "Maps risks & scenarios",
    color: "#F59E0B",
    icon: "🔮",
  },
  judge: {
    id: "judge",
    name: "The Judge",
    role: "Delivers the verdict",
    color: "#A855F7",
    icon: "⚖",
  },
};

export const MODES: Record<DebateMode, ModeConfig> = {
  normal: {
    id: "normal",
    label: "Normal",
    icon: "🕊",
    description: "Thoughtful. Balanced. Like a board of advisors.",
    typingSpeed: 55,
    pauseBetweenSentences: 200,
    transitionSpeed: 700,
    systemPromptInjection:
      "Speak thoughtfully and with nuance. Acknowledge the complexity of this decision. Be complete.",
    desaturated: true,
  },
  moderate: {
    id: "moderate",
    label: "Moderate",
    icon: "⚡",
    description: "Sharp. Focused. Like a startup all-hands.",
    typingSpeed: 85,
    pauseBetweenSentences: 150,
    transitionSpeed: 400,
    systemPromptInjection:
      "Be direct. Challenge weak assumptions. Name the agents you're responding to. Don't over-qualify.",
    desaturated: false,
  },
  aggressive: {
    id: "aggressive",
    label: "Aggressive",
    icon: "🔥",
    description: "Brutal. Unfiltered. Like a war room.",
    typingSpeed: 110,
    pauseBetweenSentences: 80,
    transitionSpeed: 200,
    systemPromptInjection:
      "Be brutally direct. No softening. Call out weak reasoning by name. Make your strongest possible case without diplomacy. This person wants the raw truth.",
    desaturated: false,
  },
};

export const MIN_WPM = 100;
export const MAX_WPM = 250;
export const DEFAULT_WPM = 150;
export const DEFAULT_DEBATE_MODE = "moderate" as const;

export const SPEED_PRESETS = {
  slow: MIN_WPM,
  normal: DEFAULT_WPM,
  fast: 200,
  turbo: MAX_WPM,
};

export const AUTO_ADVANCE_KEY = "council_auto_advance";
export const THEME_KEY = "council_theme";
export const VOICE_OUT_KEY = "council_voice_out";
export const VOICE_URI_KEY = "council_voice_uri";
export const PIPER_VOICE_KEY = "council_piper_voice";
export const TTS_ENGINE_KEY = "council_tts_engine";

export const COUNCIL_ROSTER_ORDER = [
  "optimist",
  "contrarian",
  "pragmatist",
  "oracle",
  "judge",
] as const;

export const USER_CONTEXT_KEY = "council_user_context";

/** Server-side environment configuration — all secrets and model settings from env only. */

function optional(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

function required(name: string): string {
  const value = optional(name);
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function hasGeminiApiKey(): boolean {
  return Boolean(optional("GEMINI_API_KEY"));
}

export function hasAnthropicApiKey(): boolean {
  return Boolean(optional("ANTHROPIC_API_KEY"));
}

export function hasAnyLlmApiKey(): boolean {
  return hasGeminiApiKey() || hasAnthropicApiKey();
}

export function getGeminiApiKey(): string {
  return required("GEMINI_API_KEY");
}

export function getAnthropicApiKey(): string {
  return required("ANTHROPIC_API_KEY");
}

export function getGeminiModel(): string | undefined {
  return optional("GEMINI_MODEL");
}

export function getGeminiModelsToTry(): string[] {
  const primary = getGeminiModel();
  const fallbacks =
    optional("GEMINI_MODEL_FALLBACKS")
      ?.split(",")
      .map((s) => s.trim())
      .filter(Boolean) ?? [];

  const ordered = [...(primary ? [primary] : []), ...fallbacks];
  if (ordered.length === 0) {
    throw new Error(
      "Set GEMINI_MODEL (and optional GEMINI_MODEL_FALLBACKS) in .env.local or host env vars"
    );
  }
  return Array.from(new Set(ordered));
}

export function getAnthropicModel(): string {
  return required("ANTHROPIC_MODEL");
}

export function getMaxTokens(): number {
  const raw = optional("GEMINI_MAX_TOKENS") ?? optional("ANTHROPIC_MAX_TOKENS");
  if (!raw) {
    throw new Error(
      "Set GEMINI_MAX_TOKENS in .env.local or host env vars"
    );
  }
  const n = parseInt(raw, 10);
  if (Number.isNaN(n) || n <= 0) {
    throw new Error("GEMINI_MAX_TOKENS must be a positive integer");
  }
  return n;
}

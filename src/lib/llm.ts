import {
  getAnthropicApiKey,
  getAnthropicModel,
  getGeminiApiKey,
  getGeminiModel,
  getGeminiModelsToTry,
  hasAnthropicApiKey,
  hasGeminiApiKey,
} from "./env";

export async function callLLM(
  prompt: string,
  maxTokens: number
): Promise<string> {
  if (hasGeminiApiKey()) {
    return callGemini(getGeminiApiKey(), prompt, maxTokens);
  }

  if (hasAnthropicApiKey()) {
    return callAnthropic(getAnthropicApiKey(), prompt, maxTokens);
  }

  throw new Error("No LLM API key configured (set GEMINI_API_KEY or ANTHROPIC_API_KEY)");
}

function parseGeminiError(status: number, errText: string): string {
  const configuredModel = getGeminiModel() ?? "your configured model";

  try {
    const parsed = JSON.parse(errText);
    const apiMessage: string = parsed?.error?.message ?? "";

    if (status === 401 || status === 403) {
      return "Gemini API key invalid or expired — create a new key at aistudio.google.com/apikey";
    }

    if (
      apiMessage.includes("limit: 0") ||
      apiMessage.includes("free_tier") ||
      apiMessage.includes("Quota exceeded")
    ) {
      if (apiMessage.includes("gemini-2.0-flash-lite")) {
        return `gemini-2.0-flash-lite is shut down. Update GEMINI_MODEL in .env.local (currently: ${configuredModel}) and restart.`;
      }
      return `Gemini quota unavailable for ${configuredModel} — enable billing or adjust GEMINI_MODEL / GEMINI_MODEL_FALLBACKS`;
    }

    if (apiMessage.includes("not found") || apiMessage.includes("NOT_FOUND")) {
      return `Gemini model not found — check GEMINI_MODEL in .env.local (set to: ${configuredModel})`;
    }

    if (apiMessage) return apiMessage;
  } catch {
    // fall through
  }

  if (status === 401 || status === 403) {
    return "Gemini API key invalid or expired";
  }

  return "Gemini API request failed";
}

async function callGeminiOnce(
  apiKey: string,
  model: string,
  prompt: string,
  maxTokens: number
): Promise<{ ok: true; text: string } | { ok: false; status: number; errText: string }> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: maxTokens },
      }),
    }
  );

  if (!response.ok) {
    return { ok: false, status: response.status, errText: await response.text() };
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    return { ok: false, status: 500, errText: "Empty response from Gemini" };
  }

  return { ok: true, text };
}

function shouldTryFallback(status: number, errText: string): boolean {
  if (status === 404) return true;
  const lower = errText.toLowerCase();
  return (
    status === 429 ||
    lower.includes("limit: 0") ||
    lower.includes("not found") ||
    lower.includes("deprecated") ||
    lower.includes("shut down")
  );
}

async function callGemini(
  apiKey: string,
  prompt: string,
  maxTokens: number
): Promise<string> {
  const models = getGeminiModelsToTry();
  let lastStatus = 500;
  let lastErr = "";

  for (const model of models) {
    const result = await callGeminiOnce(apiKey, model, prompt, maxTokens);

    if (result.ok) {
      if (model !== models[0]) {
        console.warn(`[council] Gemini fell back to model: ${model}`);
      }
      return result.text;
    }

    lastStatus = result.status;
    lastErr = result.errText;

    if (!shouldTryFallback(result.status, result.errText)) {
      break;
    }
  }

  throw new Error(parseGeminiError(lastStatus, lastErr));
}

async function callAnthropic(
  apiKey: string,
  prompt: string,
  maxTokens: number
): Promise<string> {
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const model = getAnthropicModel();
  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model,
    max_tokens: maxTokens,
    messages: [{ role: "user", content: prompt }],
  });

  const block = response.content[0];
  if (block.type !== "text") return "";
  return block.text;
}

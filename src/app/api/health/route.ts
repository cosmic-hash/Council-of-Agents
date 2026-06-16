import { NextResponse } from "next/server";
import { hasAnthropicApiKey, hasGeminiApiKey } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET() {
  const hasGemini = hasGeminiApiKey();
  const hasAnthropic = hasAnthropicApiKey();

  let provider: "gemini" | "anthropic" | null = null;
  if (hasGemini) provider = "gemini";
  else if (hasAnthropic) provider = "anthropic";

  return NextResponse.json({
    hasApiKey: hasGemini || hasAnthropic,
    provider,
  });
}

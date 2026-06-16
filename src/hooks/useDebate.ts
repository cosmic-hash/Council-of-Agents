"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DebateMessage, DebateMode, Exchange, PhaseInfo } from "@/lib/types";
import { DEBATE_AGENTS_ORDER } from "@/lib/types";

interface UseDebateOptions {
  onHeatUpdate?: (level: number) => void;
  onPhaseChange?: (phase: PhaseInfo) => void;
  onAgentStart?: (agentId: string, phase: string) => void;
  onMessage?: (msg: DebateMessage) => void;
  onVerdict?: (content: string) => void;
  onDone?: () => void;
  onError?: (message: string) => void;
}

function friendlyError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("api key") || lower.includes("401") || lower.includes("403")) {
    return "API key invalid or expired";
  }
  if (lower.includes("fetch") || lower.includes("network") || lower.includes("failed to fetch")) {
    return "Council unreachable — try preview mode";
  }
  if (lower.includes("quota") || lower.includes("limit: 0") || lower.includes("free_tier")) {
    return "Gemini quota issue — check GEMINI_MODEL in .env.local or use Try preview";
  }
  if (lower.includes("not configured") || lower.includes("no llm")) {
    return "Add GEMINI_API_KEY to .env.local for live debates";
  }
  return message;
}

export function useDebate() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [messages, setMessages] = useState<DebateMessage[]>([]);
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [verdict, setVerdict] = useState<string | null>(null);
  const [currentPhase, setCurrentPhase] = useState<PhaseInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const runDebate = useCallback(
    async (
      question: string,
      mode: DebateMode,
      userContext: string,
      preview: boolean,
      callbacks: UseDebateOptions = {}
    ) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsStreaming(true);
      setIsPreview(preview);
      setMessages([]);
      setExchanges([]);
      setVerdict(null);
      setError(null);
      setCurrentPhase(null);

      let sceneIndex = 0;

      try {
        const response = await fetch("/api/debate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question, mode, userContext, preview }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({ message: "Request failed" }));
          throw new Error(err.message || "Failed to start debate");
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response stream");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          let eventType = "";
          for (const line of lines) {
            if (line.startsWith("event: ")) {
              eventType = line.slice(7).trim();
            } else if (line.startsWith("data: ") && eventType) {
              try {
                const data = JSON.parse(line.slice(6));
                handleEvent(eventType, data, callbacks, sceneIndex, (idx) => {
                  sceneIndex = idx;
                });
              } catch {
                // skip malformed
              }
              eventType = "";
            }
          }
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        const raw = err instanceof Error ? err.message : "Unknown error";
        const message = friendlyError(raw);
        setError(message);
        callbacks.onError?.(message);
      } finally {
        setIsStreaming(false);
      }
    },
    []
  );

  const handleEvent = (
    event: string,
    data: Record<string, unknown>,
    callbacks: UseDebateOptions,
    sceneIndex: number,
    setSceneIndex: (idx: number) => void
  ) => {
    switch (event) {
      case "phase": {
        const phase = data as unknown as PhaseInfo;
        setCurrentPhase(phase);
        callbacks.onPhaseChange?.(phase);
        if (data.heatLevel !== undefined) {
          callbacks.onHeatUpdate?.(data.heatLevel as number);
        }
        break;
      }
      case "agent_start":
        callbacks.onAgentStart?.(data.agentId as string, data.phase as string);
        break;
      case "agent_message": {
        const msg: DebateMessage = {
          agentId: data.agentId as DebateMessage["agentId"],
          content: data.content as string,
          phase: data.phase as DebateMessage["phase"],
          sentiment: data.sentiment as number,
        };
        setMessages((prev) => [...prev, msg]);
        setExchanges((prev) => [
          ...prev,
          {
            id: `exchange-${sceneIndex}`,
            agentId: msg.agentId,
            phase: msg.phase,
            content: msg.content,
            sentiment: msg.sentiment,
            sceneIndex,
          },
        ]);
        setSceneIndex(sceneIndex + 1);
        callbacks.onMessage?.(msg);
        break;
      }
      case "heat_update":
        callbacks.onHeatUpdate?.(data.level as number);
        break;
      case "verdict": {
        const content = data.content as string;
        setVerdict(content);
        setExchanges((prev) => [
          ...prev,
          {
            id: `exchange-${sceneIndex}`,
            agentId: "judge",
            phase: "verdict",
            content,
            sentiment: 0,
            sceneIndex,
          },
        ]);
        callbacks.onVerdict?.(content);
        break;
      }
      case "done":
        callbacks.onDone?.();
        break;
      case "error": {
        const message = friendlyError(data.message as string);
        setError(message);
        callbacks.onError?.(message);
        break;
      }
    }
  };

  const startDebate = useCallback(
    (question: string, mode: DebateMode, userContext: string, callbacks?: UseDebateOptions) =>
      runDebate(question, mode, userContext, false, callbacks),
    [runDebate]
  );

  const startPreviewDebate = useCallback(
    (question: string, mode: DebateMode, userContext: string, callbacks?: UseDebateOptions) =>
      runDebate(question, mode, userContext, true, callbacks),
    [runDebate]
  );

  const cancelDebate = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
  }, []);

  const resetDebate = useCallback(() => {
    cancelDebate();
    setMessages([]);
    setExchanges([]);
    setVerdict(null);
    setCurrentPhase(null);
    setError(null);
    setIsPreview(false);
  }, [cancelDebate]);

  return {
    isStreaming,
    isPreview,
    messages,
    exchanges,
    verdict,
    currentPhase,
    error,
    startDebate,
    startPreviewDebate,
    cancelDebate,
    resetDebate,
    agentOrder: DEBATE_AGENTS_ORDER,
  };
}

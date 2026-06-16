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

export function useDebate() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [messages, setMessages] = useState<DebateMessage[]>([]);
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [verdict, setVerdict] = useState<string | null>(null);
  const [currentPhase, setCurrentPhase] = useState<PhaseInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const startDebate = useCallback(
    async (
      question: string,
      mode: DebateMode,
      userContext: string,
      callbacks: UseDebateOptions = {}
    ) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsStreaming(true);
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
          body: JSON.stringify({ question, mode, userContext }),
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
        const message = err instanceof Error ? err.message : "Unknown error";
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
      case "error":
        setError(data.message as string);
        callbacks.onError?.(data.message as string);
        break;
    }
  };

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
  }, [cancelDebate]);

  return {
    isStreaming,
    messages,
    exchanges,
    verdict,
    currentPhase,
    error,
    startDebate,
    cancelDebate,
    resetDebate,
    agentOrder: DEBATE_AGENTS_ORDER,
  };
}

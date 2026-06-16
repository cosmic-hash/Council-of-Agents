"use client";

import { useCallback, useEffect, useState } from "react";
import { AmbientBackground } from "@/components/AmbientBackground";
import { DuelView } from "@/components/DuelView";
import { ModeSelector } from "@/components/ModeSelector";
import { ThreadView } from "@/components/ThreadView";
import { UserContextInput } from "@/components/UserContextInput";
import { ViewToggle } from "@/components/ViewToggle";
import { MODES, USER_CONTEXT_KEY } from "@/lib/constants";
import type { DebateMode, ViewMode } from "@/lib/types";
import { useDebate } from "@/hooks/useDebate";
import { useHeatLevel } from "@/hooks/useHeatLevel";

type AppPhase = "setup" | "debating" | "complete";

export default function CouncilPage() {
  const [appPhase, setAppPhase] = useState<AppPhase>("setup");
  const [view, setView] = useState<ViewMode>("duel");
  const [selectedMode, setSelectedMode] = useState<DebateMode | null>(null);
  const [question, setQuestion] = useState("");
  const [userContext, setUserContext] = useState("");
  const [submittedQuestion, setSubmittedQuestion] = useState("");

  const { heatLevel, isVerdict, updateHeat, setHeat, resetHeat } = useHeatLevel();
  const {
    isStreaming,
    messages,
    exchanges,
    verdict,
    error,
    startDebate,
    resetDebate,
  } = useDebate();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(USER_CONTEXT_KEY);
      if (saved) setUserContext(saved);
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!selectedMode || !question.trim()) return;

    setSubmittedQuestion(question.trim());
    setAppPhase("debating");
    resetHeat();

    await startDebate(question.trim(), selectedMode, userContext, {
      onHeatUpdate: setHeat,
      onMessage: (msg) => updateHeat(msg.agentId, msg.phase, msg.sentiment),
      onVerdict: () => {
        updateHeat("judge", "verdict", 0);
      },
      onDone: () => setAppPhase("complete"),
      onError: () => setAppPhase("complete"),
    });
  }, [selectedMode, question, userContext, startDebate, resetHeat, setHeat, updateHeat]);

  const handleNewQuestion = useCallback(() => {
    resetDebate();
    resetHeat();
    setAppPhase("setup");
    setQuestion("");
    setSubmittedQuestion("");
    setSelectedMode(null);
  }, [resetDebate, resetHeat]);

  const handleReplay = useCallback(() => {
    setAppPhase("debating");
    resetHeat();
  }, [resetHeat]);

  const modeDesaturated = selectedMode ? MODES[selectedMode].desaturated : false;

  return (
    <main className="relative h-screen overflow-hidden">
      <AmbientBackground
        heatLevel={heatLevel}
        isVerdict={isVerdict || appPhase === "complete"}
        modeDesaturated={modeDesaturated}
      />

      {appPhase === "setup" && (
        <div className="relative z-10 flex h-full flex-col items-center overflow-y-auto px-6 py-12">
          <div className="mb-2 w-full max-w-3xl">
            <ViewToggle view={view} onChange={setView} />
          </div>

          <h1 className="mb-2 font-playfair text-5xl font-bold text-cream">
            Council of Agents
          </h1>
          <p className="mb-10 font-inter text-sm font-light text-gray-500">
            Five minds. One decision. Your call.
          </p>

          <div className="w-full max-w-3xl space-y-8">
            <div>
              <h2 className="mb-4 font-mono text-[10px] uppercase tracking-widest text-violet-400">
                Choose intensity
              </h2>
              <ModeSelector selected={selectedMode} onSelect={setSelectedMode} />
            </div>

            {selectedMode && (
              <div>
                <h2 className="mb-4 font-mono text-[10px] uppercase tracking-widest text-violet-400">
                  Your question
                </h2>
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Should I leave my job to start a company? Should we move cities? ..."
                  rows={3}
                  className="w-full resize-none rounded-xl border border-white/10 bg-black/30 px-5 py-4 font-playfair text-lg italic text-cream placeholder:text-gray-600 focus:border-violet-500/30 focus:outline-none"
                />
                <UserContextInput value={userContext} onChange={setUserContext} />

                <button
                  onClick={handleSubmit}
                  disabled={!question.trim()}
                  className="mt-6 w-full rounded-xl border border-violet-500/30 bg-violet-500/10 py-4 font-inter text-sm font-medium text-cream transition-all hover:bg-violet-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Convene the Council
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {(appPhase === "debating" || appPhase === "complete") && (
        <div className="relative z-10 h-full">
          {view === "duel" ? (
            <DuelView
              question={submittedQuestion}
              mode={selectedMode!}
              exchanges={exchanges}
              verdict={verdict}
              isStreaming={isStreaming}
              isComplete={appPhase === "complete"}
              view={view}
              onViewChange={setView}
              onReplay={handleReplay}
              onNewQuestion={handleNewQuestion}
              onSwitchToThread={() => setView("thread")}
              heatLevel={heatLevel}
            />
          ) : (
            <div className="flex h-full flex-col">
              <div className="flex justify-end px-6 py-4">
                <ViewToggle view={view} onChange={setView} />
              </div>
              <ThreadView
                messages={messages}
                verdict={verdict}
                heatLevel={heatLevel}
                question={submittedQuestion}
              />
              {isStreaming && (
                <div className="border-t border-white/5 px-6 py-3 text-center font-mono text-[10px] text-gray-600">
                  Council is deliberating...
                </div>
              )}
              {appPhase === "complete" && (
                <div className="flex justify-center gap-6 border-t border-white/5 py-4">
                  <button
                    onClick={handleReplay}
                    className="font-mono text-[11px] text-gray-500 hover:text-cream"
                  >
                    Replay
                  </button>
                  <button
                    onClick={() => setView("duel")}
                    className="font-mono text-[11px] text-gray-500 hover:text-cream"
                  >
                    Switch to Duel
                  </button>
                  <button
                    onClick={handleNewQuestion}
                    className="font-mono text-[11px] text-gray-500 hover:text-cream"
                  >
                    New question
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2 font-mono text-xs text-rose-300">
          {error}
        </div>
      )}
    </main>
  );
}

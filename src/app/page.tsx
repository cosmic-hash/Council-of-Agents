"use client";

import { useCallback, useEffect, useState } from "react";
import { AmbientBackground } from "@/components/AmbientBackground";
import { DuelView } from "@/components/DuelView";
import { LandingIntro } from "@/components/LandingIntro";
import { ModeSelector } from "@/components/ModeSelector";
import { NewQuestionPill } from "@/components/NewQuestionPill";
import { OnboardingModal } from "@/components/OnboardingModal";
import { StatusToast, useApiHealth } from "@/components/StatusToast";
import { ThreadView } from "@/components/ThreadView";
import { UserContextInput } from "@/components/UserContextInput";
import { ViewToggle } from "@/components/ViewToggle";
import { ThemeToggle } from "@/components/ThemeToggle";
import { USER_CONTEXT_KEY } from "@/lib/constants";
import type { DebateMessage, DebateMode, ViewMode } from "@/lib/types";
import { useDebate } from "@/hooks/useDebate";
import { useFirstVisit } from "@/hooks/useFirstVisit";
import { useHeatLevel } from "@/hooks/useHeatLevel";
import { useTheme } from "@/hooks/useTheme";

type AppPhase = "setup" | "debating" | "complete";

const DEFAULT_PREVIEW_QUESTION =
  "Should I leave my stable job to start a company?";

export default function CouncilPage() {
  const [appPhase, setAppPhase] = useState<AppPhase>("setup");
  const [view, setView] = useState<ViewMode>("duel");
  const [selectedMode, setSelectedMode] = useState<DebateMode | null>(null);
  const [question, setQuestion] = useState("");
  const [userContext, setUserContext] = useState("");
  const [submittedQuestion, setSubmittedQuestion] = useState("");
  const [dismissedError, setDismissedError] = useState(false);

  const { theme, toggleTheme, mounted } = useTheme();
  const hasApiKey = useApiHealth();
  const { heatLevel, isVerdict, updateHeat, setHeat, resetHeat } = useHeatLevel();
  const {
    isStreaming,
    isPreview,
    messages,
    exchanges,
    verdict,
    error,
    startDebate,
    startPreviewDebate,
    resetDebate,
  } = useDebate();

  const { showOnboarding, dismissOnboarding } = useFirstVisit(Boolean(userContext.trim()));

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(USER_CONTEXT_KEY);
      if (saved) setUserContext(saved);
    }
  }, []);

  const runDebateSession = useCallback(
    async (preview: boolean) => {
      const mode = selectedMode || "moderate";
      const q = question.trim() || (preview ? DEFAULT_PREVIEW_QUESTION : "");
      if (!preview && (!selectedMode || !q)) return;

      if (!selectedMode) setSelectedMode(mode);
      setSubmittedQuestion(q);
      setAppPhase("debating");
      setDismissedError(false);
      resetHeat();

      const callbacks = {
        onHeatUpdate: setHeat,
        onMessage: (msg: DebateMessage) =>
          updateHeat(msg.agentId, msg.phase, msg.sentiment),
        onVerdict: () => updateHeat("judge", "verdict", 0),
        onDone: () => setAppPhase("complete"),
        onError: () => setAppPhase("complete"),
      };

      if (preview) {
        await startPreviewDebate(q, mode, userContext, callbacks);
      } else {
        await startDebate(q, mode, userContext, callbacks);
      }
    },
    [
      selectedMode,
      question,
      userContext,
      startDebate,
      startPreviewDebate,
      resetHeat,
      setHeat,
      updateHeat,
    ]
  );

  const handleSubmit = useCallback(() => runDebateSession(false), [runDebateSession]);

  const handlePreview = useCallback(() => runDebateSession(true), [runDebateSession]);

  const handleNewQuestion = useCallback(() => {
    resetDebate();
    resetHeat();
    setAppPhase("setup");
    setQuestion("");
    setSubmittedQuestion("");
    setSelectedMode(null);
    setDismissedError(false);
  }, [resetDebate, resetHeat]);

  const handleReplay = useCallback(() => {
    setAppPhase("debating");
    resetHeat();
  }, [resetHeat]);

  const modeForVisuals = selectedMode || "moderate";

  return (
    <main className="relative h-screen overflow-hidden bg-background">
      <AmbientBackground
        heatLevel={heatLevel}
        isVerdict={isVerdict || appPhase === "complete"}
        mode={modeForVisuals}
        isPreview={isPreview}
        theme={theme}
      />

      <StatusToast
        hasApiKey={hasApiKey}
        isPreview={isPreview}
        error={dismissedError ? null : error}
        onDismissError={() => setDismissedError(true)}
      />

      <OnboardingModal
        open={showOnboarding && appPhase === "setup"}
        value={userContext}
        onChange={setUserContext}
        onSave={dismissOnboarding}
        onSkip={dismissOnboarding}
      />

      {appPhase === "setup" && (
        <div className="relative z-10 flex h-full flex-col items-center overflow-y-auto px-6 py-12">
          <div className="mb-2 flex w-full max-w-3xl items-center justify-end gap-2">
            {mounted && <ThemeToggle theme={theme} onToggle={toggleTheme} />}
            <ViewToggle view={view} onChange={setView} />
          </div>

          <h1 className="mb-2 font-playfair text-5xl font-bold text-ink">
            Council of Agents
          </h1>
          <p className="mb-10 font-inter text-sm font-light text-foreground-muted">
            Five minds. One decision. Your call.
          </p>

          <div className="w-full max-w-3xl space-y-8">
            <LandingIntro hasApiKey={hasApiKey} />

            <div>
              <h2 className="mb-4 font-mono text-[10px] uppercase tracking-widest text-violet-600">
                Choose intensity
              </h2>
              <ModeSelector selected={selectedMode} onSelect={setSelectedMode} />
            </div>

            <div>
              <h2 className="mb-4 font-mono text-[10px] uppercase tracking-widest text-violet-600">
                Your question
              </h2>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Should I leave my job to start a company? Should we move cities? ..."
                rows={3}
                className="w-full resize-none rounded-xl border border-surface-border bg-surface px-5 py-4 font-playfair text-lg italic text-ink shadow-sm placeholder:text-foreground-muted focus:border-violet-300 focus:outline-none dark:focus:border-violet-600"
              />
              <UserContextInput value={userContext} onChange={setUserContext} />

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={handleSubmit}
                  disabled={!selectedMode || !question.trim()}
                  className="flex-1 rounded-xl border border-violet-200 bg-violet-50 py-4 font-inter text-sm font-medium text-violet-900 transition-all hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-200 dark:hover:bg-violet-900/50"
                >
                  Convene the Council
                </button>
                <button
                  onClick={handlePreview}
                  className="flex-1 rounded-xl border border-surface-border bg-surface py-4 font-inter text-sm font-medium text-foreground transition-all hover:bg-background"
                >
                  Try preview
                </button>
              </div>
              {!selectedMode && (
                <p className="mt-2 text-center font-mono text-[10px] text-foreground-muted">
                  Try preview works without an API key — pick a mode or we&apos;ll use Moderate
                </p>
              )}
            </div>
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
              theme={theme}
              onThemeToggle={toggleTheme}
              onViewChange={setView}
              onReplay={handleReplay}
              onNewQuestion={handleNewQuestion}
              onSwitchToThread={() => setView("thread")}
              heatLevel={heatLevel}
            />
          ) : (
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-end gap-3 px-6 py-4">
                {mounted && <ThemeToggle theme={theme} onToggle={toggleTheme} />}
                <NewQuestionPill onClick={handleNewQuestion} />
                <ViewToggle view={view} onChange={setView} />
              </div>
              <ThreadView
                messages={messages}
                verdict={verdict}
                heatLevel={heatLevel}
                question={submittedQuestion}
              />
              {isStreaming && (
                <div className="border-t border-surface-border px-6 py-3 text-center font-mono text-[10px] text-foreground-muted">
                  Council is deliberating...
                </div>
              )}
              {appPhase === "complete" && (
                <div className="flex justify-center gap-6 border-t border-surface-border py-4">
                  <button
                    onClick={handleReplay}
                    className="font-mono text-[11px] text-foreground-muted hover:text-foreground"
                  >
                    Replay
                  </button>
                  <button
                    onClick={() => setView("duel")}
                    className="font-mono text-[11px] text-foreground-muted hover:text-foreground"
                  >
                    Switch to Duel
                  </button>
                  <button
                    onClick={handleNewQuestion}
                    className="font-mono text-[11px] text-foreground-muted hover:text-foreground"
                  >
                    New question
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </main>
  );
}

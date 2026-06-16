"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AGENTS, AUTO_ADVANCE_KEY, DEFAULT_WPM, MODES, PIPER_VOICE_KEY, VOICE_OUT_KEY } from "@/lib/constants";
import { DEFAULT_PIPER_VOICE } from "@/lib/piperVoices";
import type { AgentId, DebateMode, DebatePhase, Exchange, ViewMode } from "@/lib/types";
import { agentMentionsOther } from "@/lib/heat";
import { parseSentiment } from "@/lib/prompts";
import { useTyping } from "@/hooks/useTyping";
import { useSyncedNarration } from "@/hooks/useSyncedNarration";
import { useAutoAdvance } from "@/hooks/useAutoAdvance";
import { useVoiceOut } from "@/hooks/useVoiceOut";
import type { Theme } from "@/hooks/useTheme";
import { Timeline } from "./Timeline";
import { SpeedSlider } from "./SpeedSlider";
import { getVerdictGlowStyle } from "@/lib/theme";
import { getModeStageFilter } from "@/lib/visuals";
import { NewQuestionPill } from "./NewQuestionPill";
import { ViewToggle } from "./ViewToggle";
import { ThemeToggle } from "./ThemeToggle";
import { AutoAdvanceToggle } from "./AutoAdvanceToggle";
import { VoiceToggle } from "./VoiceToggle";
import { VoicePicker } from "./VoicePicker";
import { VoiceLoadingToast } from "./VoiceLoadingToast";
import { VerdictCTA } from "./VerdictCTA";
import { DebateStatusBar, type DebateStatusKind, type DebateStatusPhase } from "./DebateStatusBar";
import { CouncilRoster } from "./CouncilRoster";
import { SentimentPulse } from "./SentimentPulse";
import { CenteredStage } from "./stages/CenteredStage";
import { SplitStage } from "./stages/SplitStage";

interface DuelViewProps {
  question: string;
  mode: DebateMode;
  exchanges: Exchange[];
  verdict: string | null;
  isStreaming: boolean;
  isComplete: boolean;
  view: ViewMode;
  theme: Theme;
  onThemeToggle: () => void;
  onViewChange: (view: ViewMode) => void;
  onReplay: () => void;
  onNewQuestion: () => void;
  onSwitchToThread: () => void;
  heatLevel: number;
}

type Scene =
  | { type: "question" }
  | { type: "exchange"; index: number }
  | { type: "judge-intro" }
  | { type: "verdict" };

export function DuelView({
  question,
  mode,
  exchanges,
  verdict,
  isStreaming,
  isComplete,
  view,
  theme,
  onThemeToggle,
  onViewChange,
  onReplay,
  onNewQuestion,
  onSwitchToThread,
  heatLevel,
}: DuelViewProps) {
  const modeConfig = MODES[mode];
  const [wpm, setWpm] = useState(DEFAULT_WPM);
  const [sceneIndex, setSceneIndex] = useState(0);
  const [questionAnchored, setQuestionAnchored] = useState(false);
  const [stageReady, setStageReady] = useState(false);
  const [waitingForUser, setWaitingForUser] = useState(false);
  const [showEndActions, setShowEndActions] = useState(false);
  const [leftPulse, setLeftPulse] = useState(false);
  const [edgeFlash, setEdgeFlash] = useState<string | null>(null);
  const [energyBeam, setEnergyBeam] = useState(false);
  const [wordBump, setWordBump] = useState(0);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [voiceOut, setVoiceOut] = useState(true);
  const [piperVoiceId, setPiperVoiceId] = useState(DEFAULT_PIPER_VOICE);
  const [piperFailed, setPiperFailed] = useState(false);
  const [voiceLoading, setVoiceLoading] = useState(false);
  const sentenceModeRef = useRef(false);
  const autoAdvanceCancelRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(AUTO_ADVANCE_KEY);
    if (stored !== null) setAutoAdvance(stored === "true");
    const voiceStored = localStorage.getItem(VOICE_OUT_KEY);
    if (voiceStored !== null) setVoiceOut(voiceStored === "true");
    const uriStored = localStorage.getItem(PIPER_VOICE_KEY);
    if (uriStored) setPiperVoiceId(uriStored);
  }, []);

  const handleVoiceOutChange = (enabled: boolean) => {
    setVoiceOut(enabled);
    localStorage.setItem(VOICE_OUT_KEY, String(enabled));
  };

  const handleAutoAdvanceChange = (enabled: boolean) => {
    setAutoAdvance(enabled);
    localStorage.setItem(AUTO_ADVANCE_KEY, String(enabled));
  };

  const [fallbackPrefix, setFallbackPrefix] = useState("");
  const [fallbackSentence, setFallbackSentence] = useState("");
  const [fallbackVoiceComplete, setFallbackVoiceComplete] = useState(false);

  useEffect(() => {
    if (voiceOut && !piperFailed) {
      void import("@/lib/piper").then((m) => m.resetPiperSession());
    }
  }, [piperVoiceId, voiceOut, piperFailed]);

  const scenes: Scene[] = useMemo(
    () => [
      { type: "question" },
      ...exchanges.map((_, i) => ({ type: "exchange" as const, index: i })),
      ...(verdict ? [{ type: "judge-intro" as const }, { type: "verdict" as const }] : []),
    ],
    [exchanges, verdict]
  );

  const currentScene = scenes[sceneIndex] || scenes[scenes.length - 1];
  const isRebuttal =
    currentScene?.type === "exchange" &&
    exchanges[currentScene.index]?.phase === "rebuttal";
  const isOpening =
    currentScene?.type === "exchange" &&
    exchanges[currentScene.index]?.phase === "opening";
  const layoutMode = isRebuttal ? "split" : "centered";

  const getCurrentText = useCallback(() => {
    if (!currentScene) return "";
    if (currentScene.type === "question") return question;
    if (currentScene.type === "exchange") return exchanges[currentScene.index]?.content || "";
    if (currentScene.type === "verdict") return verdict || "";
    return "";
  }, [currentScene, question, exchanges, verdict]);

  const currentText = getCurrentText();
  const isQuestionScene = currentScene?.type === "question";
  const isJudgeIntro = currentScene?.type === "judge-intro";
  const isVerdictScene = currentScene?.type === "verdict";

  const handleWordTick = useCallback(() => {
    setWordBump((n) => n + 1);
  }, []);

  const handleNarrationComplete = useCallback(() => {
    if (isQuestionScene) {
      setTimeout(() => {
        setQuestionAnchored(true);
        setTimeout(() => setStageReady(true), 350);
      }, 500);
    }
    setWaitingForUser(true);
  }, [isQuestionScene]);

  const usePiperNarration = voiceOut && !piperFailed;
  const useFallbackVoice = voiceOut && piperFailed;

  const narrationEnabled =
    usePiperNarration &&
    !isQuestionScene &&
    !isJudgeIntro &&
    !!currentText &&
    ((currentScene?.type === "exchange" && stageReady) || isVerdictScene);

  const typingEnabled =
    (!usePiperNarration && !useFallbackVoice || isQuestionScene) &&
    !isJudgeIntro &&
    !!currentText;

  const fallbackTypingEnabled =
    useFallbackVoice &&
    !isQuestionScene &&
    !isJudgeIntro &&
    !!fallbackSentence &&
    ((currentScene?.type === "exchange" && stageReady) || isVerdictScene);

  const { displayed: typedDisplayed, isComplete: typedComplete, skipToEnd: typedSkip, advanceSentence } = useTyping({
    text: currentText,
    wpm: isQuestionScene ? 90 : wpm,
    enabled: typingEnabled,
    mode: isQuestionScene ? "letter" : "word",
    pauseBetweenSentences: voiceOut ? 80 : modeConfig.pauseBetweenSentences,
    onWordTick: handleWordTick,
    onComplete: handleNarrationComplete,
  });

  const {
    displayed: fallbackSentenceDisplayed,
    isComplete: fallbackSentenceComplete,
    skipToEnd: fallbackSentenceSkip,
  } = useTyping({
    text: fallbackSentence,
    wpm,
    enabled: fallbackTypingEnabled,
    mode: "word",
    pauseBetweenSentences: 0,
    onWordTick: handleWordTick,
  });

  const handleFallbackSentenceStart = useCallback(
    (_index: number, sentence: string, prefix: string) => {
      setFallbackPrefix(prefix);
      setFallbackSentence(sentence);
      setFallbackVoiceComplete(false);
    },
    []
  );

  const handleFallbackSentenceEnd = useCallback((_index: number, sentence: string) => {
    setFallbackPrefix((prev) => prev + sentence);
    setFallbackSentence("");
  }, []);

  const handleFallbackVoiceComplete = useCallback(() => {
    setFallbackPrefix(currentText);
    setFallbackSentence("");
    setFallbackVoiceComplete(true);
    handleNarrationComplete();
  }, [currentText, handleNarrationComplete]);

  useEffect(() => {
    setFallbackPrefix("");
    setFallbackSentence("");
    setFallbackVoiceComplete(false);
  }, [sceneIndex]);

  const {
    displayed: syncedDisplayed,
    isComplete: syncedComplete,
    skipToEnd: syncedSkip,
  } = useSyncedNarration({
    text: currentText,
    wpm,
    enabled: narrationEnabled,
    voiceId: piperVoiceId,
    sceneKey: sceneIndex,
    onWordTick: handleWordTick,
    onComplete: handleNarrationComplete,
    onLoadingChange: setVoiceLoading,
    onPiperError: () => setPiperFailed(true),
  });

  const { cancel: cancelFallbackVoice } = useVoiceOut({
    enabled:
      useFallbackVoice &&
      stageReady &&
      !isQuestionScene &&
      !isJudgeIntro &&
      !!currentText,
    fullText: currentText,
    sceneKey: sceneIndex,
    wpm,
    onSentenceStart: handleFallbackSentenceStart,
    onSentenceEnd: handleFallbackSentenceEnd,
    onQueueComplete: handleFallbackVoiceComplete,
  });

  const fallbackDisplayed = fallbackPrefix + fallbackSentenceDisplayed;
  const fallbackComplete =
    fallbackVoiceComplete && (!fallbackSentence || fallbackSentenceComplete);

  const displayed = usePiperNarration && !isQuestionScene
    ? syncedDisplayed
    : useFallbackVoice && !isQuestionScene
      ? fallbackDisplayed
      : typedDisplayed;
  const typingComplete = usePiperNarration && !isQuestionScene
    ? syncedComplete
    : useFallbackVoice && !isQuestionScene
      ? fallbackComplete
      : typedComplete;

  const skipToEnd = useCallback(() => {
    if (usePiperNarration && !isQuestionScene) {
      syncedSkip();
      return;
    }
    if (useFallbackVoice && !isQuestionScene) {
      cancelFallbackVoice();
      fallbackSentenceSkip();
      setFallbackPrefix(currentText);
      setFallbackSentence("");
      setFallbackVoiceComplete(true);
      handleNarrationComplete();
      return;
    }
    typedSkip();
  }, [
    usePiperNarration,
    useFallbackVoice,
    isQuestionScene,
    syncedSkip,
    cancelFallbackVoice,
    fallbackSentenceSkip,
    currentText,
    handleNarrationComplete,
    typedSkip,
  ]);

  const currentExchange =
    currentScene?.type === "exchange" ? exchanges[currentScene.index] : null;
  const currentAgent = currentExchange ? AGENTS[currentExchange.agentId] : null;
  const prevExchange =
    currentScene?.type === "exchange" && currentScene.index > 0
      ? exchanges[currentScene.index - 1]
      : null;
  const prevAgent = prevExchange ? AGENTS[prevExchange.agentId] : null;

  const sentiment = useMemo(() => {
    if (currentExchange?.sentiment !== undefined) return currentExchange.sentiment;
    if (displayed) return parseSentiment(displayed).sentiment;
    return 0;
  }, [currentExchange, displayed]);

  const spokenAgentIds = useMemo(() => {
    const ids = new Set<AgentId>();
    for (let i = 0; i < sceneIndex; i++) {
      const scene = scenes[i];
      if (scene?.type === "exchange") {
        ids.add(exchanges[scene.index].agentId);
      }
    }
    if (currentExchange && typingComplete) ids.add(currentExchange.agentId);
    return Array.from(ids);
  }, [sceneIndex, scenes, exchanges, currentExchange, typingComplete]);

  const upcomingAgentId = useMemo((): AgentId | null => {
    const nextScene = scenes[sceneIndex + 1];
    if (nextScene?.type === "exchange") return exchanges[nextScene.index].agentId;
    if (nextScene?.type === "judge-intro" || nextScene?.type === "verdict") return "judge";
    if (isStreaming && exchanges.length > sceneIndex) {
      const nextIdx = currentScene?.type === "exchange" ? currentScene.index + 1 : 0;
      if (nextIdx < exchanges.length) return exchanges[nextIdx].agentId;
    }
    return null;
  }, [scenes, sceneIndex, exchanges, isStreaming, currentScene]);

  const rosterPhase: DebatePhase | "question" | null = isVerdictScene || isJudgeIntro
    ? "verdict"
    : isQuestionScene
      ? "question"
      : currentExchange?.phase ?? null;

  useEffect(() => {
    if (isRebuttal && currentExchange && prevAgent) {
      if (agentMentionsOther(currentExchange.content, prevAgent.name)) {
        setLeftPulse(true);
        setTimeout(() => setLeftPulse(false), 200);
        if (mode === "aggressive") {
          setEdgeFlash(prevAgent.color);
          setTimeout(() => setEdgeFlash(null), 150);
        }
      }
    }
  }, [isRebuttal, currentExchange, prevAgent, mode]);

  useEffect(() => {
    if (isOpening && currentAgent) {
      setEnergyBeam(true);
      const t = setTimeout(() => setEnergyBeam(false), 600);
      return () => clearTimeout(t);
    }
  }, [sceneIndex, isOpening, currentAgent]);

  useEffect(() => {
    if (isComplete && typingComplete && isVerdictScene) {
      const t = setTimeout(() => setShowEndActions(true), 3000);
      return () => clearTimeout(t);
    }
  }, [isComplete, typingComplete, isVerdictScene]);

  const canAdvance = useMemo(() => {
    if (sceneIndex >= scenes.length - 1) return false;
    const next = scenes[sceneIndex + 1];
    if (next?.type === "exchange") {
      return !!exchanges[next.index]?.content;
    }
    if (next?.type === "judge-intro" || next?.type === "verdict") {
      return !!verdict;
    }
    return true;
  }, [sceneIndex, scenes, exchanges, verdict]);

  const advance = useCallback(() => {
    autoAdvanceCancelRef.current?.();

    if (!waitingForUser && !typingComplete && !isJudgeIntro) {
      skipToEnd();
      return;
    }

    if (sentenceModeRef.current && !typingComplete) {
      advanceSentence();
      return;
    }

    if (sceneIndex < scenes.length - 1 && canAdvance) {
      setSceneIndex((i) => i + 1);
      setWaitingForUser(false);
    }
  }, [
    waitingForUser,
    typingComplete,
    isJudgeIntro,
    sceneIndex,
    scenes.length,
    canAdvance,
    skipToEnd,
    advanceSentence,
  ]);

  const awaitingVerdict =
    waitingForUser &&
    typingComplete &&
    !!verdict &&
    scenes[sceneIndex + 1]?.type === "judge-intro";

  const canAdvanceForAuto = canAdvance && !awaitingVerdict;

  const { cancel: cancelAutoAdvance } = useAutoAdvance({
    enabled: autoAdvance,
    typingComplete,
    waitingForUser,
    transitionSpeed: modeConfig.transitionSpeed,
    canAdvance: canAdvanceForAuto,
    onAdvance: advance,
  });
  autoAdvanceCancelRef.current = cancelAutoAdvance;

  const goToExchange = useCallback(
    (index: number) => {
      const sceneIdx = index + 1;
      if (sceneIdx < scenes.length) {
        setSceneIndex(sceneIdx);
        setWaitingForUser(false);
      }
    },
    [scenes.length]
  );

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (view !== "duel") return;
      sentenceModeRef.current = e.shiftKey;

      if (e.code === "Space" && !e.repeat) {
        e.preventDefault();
        advance();
      }
      if (e.code === "ArrowRight") advance();
      if (e.code === "ArrowLeft" && sceneIndex > 0) {
        setSceneIndex((i) => i - 1);
        setWaitingForUser(false);
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [view, advance, sceneIndex]);

  useEffect(() => {
    if (exchanges.length > 0 && sceneIndex === 0 && stageReady) {
      setSceneIndex(1);
      setWaitingForUser(false);
    }
  }, [exchanges.length, sceneIndex, stageReady]);

  useEffect(() => {
    if (isJudgeIntro) {
      const t = setTimeout(() => {
        setSceneIndex((i) => i + 1);
        setWaitingForUser(false);
      }, 1600);
      return () => clearTimeout(t);
    }
  }, [isJudgeIntro, sceneIndex]);

  const activeTimelineIndex =
    currentScene?.type === "exchange"
      ? currentScene.index
      : currentScene?.type === "verdict" || currentScene?.type === "judge-intro"
        ? 8
        : -1;

  const statusAgent =
    isVerdictScene || isJudgeIntro ? AGENTS.judge : currentAgent ?? null;

  const debatePhase: DebateStatusPhase = isQuestionScene
    ? "question"
    : isJudgeIntro
      ? "intro"
      : isVerdictScene
        ? "verdict"
        : currentExchange?.phase === "rebuttal"
          ? "rebuttal"
          : "opening";

  const debateStatus: DebateStatusKind = isJudgeIntro
    ? "idle"
    : isVerdictScene
      ? "delivering_verdict"
      : isStreaming && waitingForUser && !canAdvance
        ? "deliberating"
        : !typingComplete && (currentScene?.type === "exchange" || isQuestionScene)
          ? "speaking"
          : waitingForUser
            ? "listening"
            : "idle";

  return (
    <div className="relative flex h-full flex-col">
      {edgeFlash && (
        <div
          className="pointer-events-none fixed inset-0 z-50 transition-opacity duration-150"
          style={{
            boxShadow: `inset 0 0 60px ${edgeFlash}66`,
            opacity: 0.25,
          }}
        />
      )}

      <VoiceLoadingToast visible={voiceLoading && voiceOut && !piperFailed} />

      <div className="flex flex-col gap-2 px-4 py-3 md:flex-row md:items-center md:justify-between md:px-6 md:py-4">
        <div className="flex items-center justify-center gap-2 md:justify-start">
          <ThemeToggle theme={theme} onToggle={onThemeToggle} />
          <AutoAdvanceToggle enabled={autoAdvance} onChange={handleAutoAdvanceChange} />
          <VoiceToggle enabled={voiceOut} onChange={handleVoiceOutChange} />
          <VoicePicker
            enabled={voiceOut && !piperFailed}
            voiceId={piperVoiceId}
            onChange={setPiperVoiceId}
          />
        </div>
        <div className="flex items-center justify-center gap-3">
          <NewQuestionPill onClick={onNewQuestion} />
          <ViewToggle view={view} onChange={onViewChange} />
        </div>
        <div className="flex items-center justify-center gap-3 md:justify-end">
          <span className="font-mono text-[10px] text-foreground-muted">
            {modeConfig.icon} {modeConfig.label}
          </span>
          <SpeedSlider
            value={wpm}
            modeDefault={DEFAULT_WPM}
            onChange={setWpm}
          />
        </div>
      </div>

      {stageReady && (
        <DebateStatusBar
          phase={debatePhase}
          activeAgent={statusAgent}
          status={debateStatus}
        />
      )}

      {stageReady && (
        <CouncilRoster
          activeAgentId={
            isVerdictScene || isJudgeIntro
              ? "judge"
              : currentExchange?.agentId ?? null
          }
          spokenAgentIds={spokenAgentIds}
          upcomingAgentId={upcomingAgentId}
          phase={rosterPhase}
          isVerdictPhase={isVerdictScene || isJudgeIntro}
        />
      )}

      {questionAnchored && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-b border-surface-border px-6 py-3 text-center"
        >
          <p className="font-playfair text-lg text-foreground-muted">{question}</p>
        </motion.div>
      )}

      <div
        className="relative flex flex-1 flex-col"
        style={{ filter: getModeStageFilter(mode) }}
      >
        {isQuestionScene && !questionAnchored && (
          <div className="relative flex flex-1 items-center justify-center px-8">
            <p className="max-w-2xl text-center font-playfair text-2xl italic text-ink sm:text-4xl">
              {displayed}
              {!typingComplete && (
                <span className="ml-0.5 inline-block h-8 w-0.5 animate-pulse bg-ink" />
              )}
            </p>
          </div>
        )}

        {isJudgeIntro && (
          <div className="flex flex-1 flex-col items-center justify-center">
            <motion.div
              initial={{ scale: 0.2, y: -100, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
              className="relative"
            >
              <div
                className="absolute inset-0 rounded-full blur-3xl"
                style={{ backgroundColor: `${AGENTS.judge.color}55` }}
              />
              <span className="relative text-7xl">{AGENTS.judge.icon}</span>
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-8 font-playfair text-lg italic text-foreground-muted"
            >
              The council has been heard.
            </motion.p>
          </div>
        )}

        {isVerdictScene && (
          <div className="relative flex flex-1 flex-col items-center justify-center px-8">
            <SentimentPulse
              sentiment={0}
              theme={theme}
              wordBump={wordBump}
              isSpeaking={!typingComplete}
              agentColor={AGENTS.judge.color}
            />
            <div className="relative z-10 mb-6 text-5xl">{AGENTS.judge.icon}</div>
            <h3
              className="relative z-10 mb-6 font-inter text-sm font-semibold"
              style={{ color: AGENTS.judge.color }}
            >
              {AGENTS.judge.name}
            </h3>
            <div className="relative z-10 max-w-2xl space-y-4">
              {(displayed.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [displayed]).map((sentence, i, arr) => (
                <motion.p
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className={`font-inter leading-relaxed text-debate-text ${
                    i === arr.length - 1
                      ? "text-center font-playfair text-[22px] italic text-ink"
                      : "debate-body text-[15px] font-normal"
                  }`}
                  style={
                    i === arr.length - 1 ? getVerdictGlowStyle() : undefined
                  }
                >
                  {sentence.trim()}
                </motion.p>
              ))}
            </div>
          </div>
        )}

        {currentScene?.type === "exchange" && stageReady && layoutMode === "centered" && currentAgent && (
          <CenteredStage
            agent={currentAgent}
            displayed={displayed}
            typingComplete={typingComplete}
            sentiment={sentiment}
            theme={theme}
            wordBump={wordBump}
            energyBeam={energyBeam && isOpening}
            showQuestionOrb={isOpening}
            role={currentAgent.role}
          />
        )}

        {currentScene?.type === "exchange" &&
          stageReady &&
          layoutMode === "split" &&
          currentAgent &&
          prevAgent &&
          prevExchange && (
            <SplitStage
              currentAgent={currentAgent}
              prevAgent={prevAgent}
              prevExchange={prevExchange}
              displayed={displayed}
              typingComplete={typingComplete}
              sentiment={sentiment}
              theme={theme}
              wordBump={wordBump}
              mode={mode}
              heatLevel={heatLevel}
              leftPulse={leftPulse}
              energyBeam={false}
            />
          )}
      </div>

      {awaitingVerdict && <VerdictCTA onClick={advance} />}

      {(exchanges.length > 0 || isComplete) && (
        <Timeline
          activeIndex={activeTimelineIndex}
          onDotClick={goToExchange}
          isComplete={isComplete}
          isStreaming={isStreaming}
          heatLevel={heatLevel}
          autoAdvance={autoAdvance}
        />
      )}

      <AnimatePresence>
        {showEndActions && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-20 left-0 right-0 flex justify-center gap-6"
          >
            <button
              onClick={onReplay}
              className="font-mono text-[11px] text-foreground-muted hover:text-foreground"
            >
              Replay
            </button>
            <button
              onClick={onSwitchToThread}
              className="font-mono text-[11px] text-foreground-muted hover:text-foreground"
            >
              Switch to Thread
            </button>
            <button
              onClick={onNewQuestion}
              className="font-mono text-[11px] text-foreground-muted hover:text-foreground"
            >
              New question
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {isComplete && (
        <button
          onClick={onReplay}
          className="absolute right-4 top-24 font-mono text-[10px] text-foreground-muted hover:text-foreground md:right-6 md:top-16"
        >
          ⟳ Replay from start
        </button>
      )}
    </div>
  );
}

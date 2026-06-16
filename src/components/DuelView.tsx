"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AGENTS, MODES } from "@/lib/constants";
import type { DebateMode, Exchange, ViewMode } from "@/lib/types";
import { agentMentionsOther } from "@/lib/heat";
import { useTyping } from "@/hooks/useTyping";
import { SpeakingBars } from "./SpeakingBars";
import { TensionWire } from "./TensionWire";
import { Timeline } from "./Timeline";
import { SpeedSlider } from "./SpeedSlider";
import { ViewToggle } from "./ViewToggle";

interface DuelViewProps {
  question: string;
  mode: DebateMode;
  exchanges: Exchange[];
  verdict: string | null;
  isStreaming: boolean;
  isComplete: boolean;
  view: ViewMode;
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
  onViewChange,
  onReplay,
  onNewQuestion,
  onSwitchToThread,
  heatLevel,
}: DuelViewProps) {
  const modeConfig = MODES[mode];
  const [wpm, setWpm] = useState(modeConfig.typingSpeed);
  const [sceneIndex, setSceneIndex] = useState(0);
  const [questionAnchored, setQuestionAnchored] = useState(false);
  const [stageSplit, setStageSplit] = useState(false);
  const [waitingForUser, setWaitingForUser] = useState(false);
  const [showEndActions, setShowEndActions] = useState(false);
  const [leftPulse, setLeftPulse] = useState(false);
  const [edgeFlash, setEdgeFlash] = useState<string | null>(null);
  const [energyBeam, setEnergyBeam] = useState(false);
  const sentenceModeRef = useRef(false);

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

  const typingMode = isQuestionScene ? "letter" : "word";

  const { displayed, isComplete: typingComplete, skipToEnd, advanceSentence } = useTyping({
    text: currentText,
    wpm: isQuestionScene ? 40 : wpm,
    enabled: !isJudgeIntro && !!currentText,
    mode: typingMode,
    pauseBetweenSentences: modeConfig.pauseBetweenSentences,
    onComplete: () => {
      if (isQuestionScene) {
        setTimeout(() => {
          setQuestionAnchored(true);
          setTimeout(() => setStageSplit(true), 600);
        }, 1200);
      }
      setWaitingForUser(true);
    },
  });

  const currentExchange =
    currentScene?.type === "exchange" ? exchanges[currentScene.index] : null;
  const currentAgent = currentExchange ? AGENTS[currentExchange.agentId] : null;
  const prevExchange =
    currentScene?.type === "exchange" && currentScene.index > 0
      ? exchanges[currentScene.index - 1]
      : null;
  const prevAgent = prevExchange ? AGENTS[prevExchange.agentId] : null;

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

  const advance = useCallback(() => {
    if (!waitingForUser && !typingComplete && !isJudgeIntro) {
      skipToEnd();
      return;
    }

    if (sentenceModeRef.current && !typingComplete) {
      advanceSentence();
      return;
    }

    if (sceneIndex < scenes.length - 1) {
      setSceneIndex((i) => i + 1);
      setWaitingForUser(false);
      if (scenes[sceneIndex + 1]?.type === "exchange" || scenes[sceneIndex + 1]?.type === "verdict") {
        // ready for typing
      }
    }
  }, [waitingForUser, typingComplete, isJudgeIntro, sceneIndex, scenes, skipToEnd, advanceSentence]);

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
    if (isStreaming && exchanges.length > 0) {
      const lastExchange = exchanges[exchanges.length - 1];
      const targetScene = exchanges.length;
      if (sceneIndex < targetScene && currentScene?.type !== "question") {
        // auto-move to latest exchange when streaming
      }
    }
  }, [exchanges, isStreaming, sceneIndex, currentScene]);

  useEffect(() => {
    if (!isStreaming && exchanges.length > 0 && sceneIndex === 0 && questionAnchored) {
      setSceneIndex(1);
    }
  }, [isStreaming, exchanges.length, sceneIndex, questionAnchored]);

  useEffect(() => {
    const latestIdx = exchanges.length;
    if (isStreaming && latestIdx > 0) {
      const expectedScene = latestIdx;
      if (sceneIndex < expectedScene && waitingForUser) {
        // wait for user
      } else if (sceneIndex < expectedScene && !waitingForUser) {
        // stay on current until user advances or typing completes
      }
    }
  }, [exchanges.length, isStreaming, sceneIndex, waitingForUser]);

  useEffect(() => {
    if (exchanges.length > 0 && sceneIndex === 0 && stageSplit) {
      setSceneIndex(1);
      setWaitingForUser(false);
    }
  }, [exchanges.length, sceneIndex, stageSplit]);

  useEffect(() => {
    if (verdict && !isVerdictScene) {
      const judgeIntroIdx = scenes.findIndex((s) => s.type === "judge-intro");
      if (judgeIntroIdx >= 0 && sceneIndex === judgeIntroIdx - 1 && waitingForUser) {
        // user can advance to judge
      }
    }
  }, [verdict, isVerdictScene, scenes, sceneIndex, waitingForUser]);

  useEffect(() => {
    if (isJudgeIntro) {
      const t = setTimeout(() => {
        setSceneIndex((i) => i + 1);
        setWaitingForUser(false);
      }, 2400);
      return () => clearTimeout(t);
    }
  }, [isJudgeIntro, sceneIndex]);

  const verdictSentences = useMemo(
    () => verdict?.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [],
    [verdict]
  );
  const [verdictSentenceIdx, setVerdictSentenceIdx] = useState(0);

  useEffect(() => {
    if (isVerdictScene && verdictSentences.length > 0) {
      if (verdictSentenceIdx < verdictSentences.length - 1 && waitingForUser) {
        // wait
      }
    }
  }, [isVerdictScene, verdictSentences, verdictSentenceIdx, waitingForUser]);

  useEffect(() => {
    if (isVerdictScene) {
      setVerdictSentenceIdx(0);
      const interval = setInterval(() => {
        setVerdictSentenceIdx((i) => {
          if (i >= verdictSentences.length - 1) {
            clearInterval(interval);
            setWaitingForUser(true);
            return i;
          }
          return i + 1;
        });
      }, 1200);
      return () => clearInterval(interval);
    }
  }, [isVerdictScene, verdictSentences.length]);

  const activeTimelineIndex =
    currentScene?.type === "exchange"
      ? currentScene.index
      : currentScene?.type === "verdict" || currentScene?.type === "judge-intro"
        ? 8
        : -1;

  return (
    <div className="relative flex h-full flex-col">
      {edgeFlash && (
        <div
          className="pointer-events-none fixed inset-0 z-50 transition-opacity duration-150"
          style={{
            boxShadow: `inset 0 0 60px ${edgeFlash}66`,
            opacity: 0.4,
          }}
        />
      )}

      <div className="flex items-center justify-between px-6 py-4">
        <div />
        <ViewToggle view={view} onChange={onViewChange} />
        <div className="flex items-center gap-4">
          <span className="font-mono text-[10px] text-gray-600">
            {modeConfig.icon} {modeConfig.label}
          </span>
          <SpeedSlider
            value={wpm}
            modeDefault={modeConfig.typingSpeed}
            onChange={setWpm}
          />
        </div>
      </div>

      {questionAnchored && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-b border-white/5 px-6 py-3 text-center"
        >
          <p className="font-playfair text-lg text-cream-muted">{question}</p>
        </motion.div>
      )}

      <div className="relative flex flex-1 flex-col">
        {isQuestionScene && !questionAnchored && (
          <div className="flex flex-1 items-center justify-center px-8">
            <p className="max-w-2xl text-center font-playfair text-4xl italic text-cream">
              {displayed}
              {!typingComplete && (
                <span className="ml-0.5 inline-block h-8 w-0.5 animate-pulse bg-cream" />
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
                style={{ backgroundColor: `${AGENTS.judge.color}30` }}
              />
              <span className="relative text-7xl">{AGENTS.judge.icon}</span>
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-8 font-playfair text-lg italic text-gray-500"
            >
              The council has been heard.
            </motion.p>
          </div>
        )}

        {isVerdictScene && (
          <div className="flex flex-1 flex-col items-center justify-center px-8">
            <div className="mb-6 text-5xl">{AGENTS.judge.icon}</div>
            <h3
              className="mb-6 font-inter text-sm font-semibold"
              style={{ color: AGENTS.judge.color }}
            >
              {AGENTS.judge.name}
            </h3>
            <div className="max-w-2xl space-y-4">
              {verdictSentences.slice(0, verdictSentenceIdx + 1).map((sentence, i) => (
                <motion.p
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className={`font-inter leading-relaxed text-debate-text ${
                    i === verdictSentences.length - 1
                      ? "text-center font-playfair text-[22px] italic text-cream"
                      : "text-[15px]"
                  }`}
                  style={
                    i === verdictSentences.length - 1
                      ? { textShadow: "0 4px 20px rgba(245, 158, 11, 0.3)" }
                      : undefined
                  }
                >
                  {sentence.trim()}
                </motion.p>
              ))}
            </div>
          </div>
        )}

        {currentScene?.type === "exchange" && stageSplit && (
          <div className="relative flex flex-1">
            <TensionWire mode={mode} visible={isRebuttal} />

            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "50%", opacity: isRebuttal ? 0.7 : 0.5 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className={`relative flex flex-col items-center justify-center border-r border-white/5 px-6 ${
                leftPulse ? "animate-pulse" : ""
              }`}
              style={leftPulse && prevAgent ? { backgroundColor: `${prevAgent.color}10` } : undefined}
            >
              {isRebuttal && prevAgent ? (
                <>
                  <div
                    className="mb-3 flex h-12 w-12 items-center justify-center rounded-full text-2xl"
                    style={{ boxShadow: `0 0 20px ${prevAgent.color}30` }}
                  >
                    {prevAgent.icon}
                  </div>
                  <span
                    className="font-inter text-sm font-semibold opacity-60"
                    style={{ color: prevAgent.color }}
                  >
                    {prevAgent.name}
                  </span>
                  <p className="mt-4 max-w-xs text-center font-inter text-sm font-light text-gray-500">
                    {prevExchange?.content}
                  </p>
                </>
              ) : (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="h-24 w-24 rounded-full"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(124,58,237,0.3) 0%, rgba(240,234,214,0.1) 50%, transparent 70%)",
                    boxShadow: "0 0 40px rgba(124, 58, 237, 0.2)",
                  }}
                />
              )}
            </motion.div>

            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "50%", opacity: 1 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
              className="relative flex flex-col items-center justify-center px-6"
            >
              {energyBeam && (
                <motion.div
                  initial={{ width: 0, opacity: 0.8 }}
                  animate={{ width: "100%", opacity: 0 }}
                  transition={{ duration: 0.6 }}
                  className="absolute left-0 top-1/2 h-px -translate-y-1/2"
                  style={{
                    background: "linear-gradient(90deg, rgba(124,58,237,0.6), transparent)",
                  }}
                />
              )}

              {currentAgent && (
                <>
                  <SpeakingBars color={currentAgent.color} active={!typingComplete} />
                  <div
                    className="mb-3 flex h-16 w-16 items-center justify-center text-4xl"
                    style={{ filter: `drop-shadow(0 0 12px ${currentAgent.color}40)` }}
                  >
                    {currentAgent.icon}
                  </div>
                  <span
                    className="font-inter text-sm font-semibold"
                    style={{ color: currentAgent.color }}
                  >
                    {currentAgent.name}
                  </span>
                  <span className="font-mono text-[11px] text-gray-500">
                    {currentAgent.role}
                  </span>
                  <p className="mt-6 max-w-sm text-center font-inter text-[15px] font-light leading-relaxed text-debate-text">
                    {displayed}
                    {!typingComplete && (
                      <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-debate-text" />
                    )}
                  </p>
                </>
              )}
            </motion.div>
          </div>
        )}

        {(waitingForUser || typingComplete) &&
          !isJudgeIntro &&
          !isVerdictScene &&
          currentScene?.type === "exchange" && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute bottom-24 left-0 right-0 text-center font-mono text-[11px] text-gray-700"
            >
              Press Space to continue
            </motion.p>
          )}
      </div>

      {(exchanges.length > 0 || isComplete) && (
        <Timeline
          activeIndex={activeTimelineIndex}
          onDotClick={goToExchange}
          isComplete={isComplete}
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
              className="font-mono text-[11px] text-gray-500 hover:text-cream"
            >
              Replay
            </button>
            <button
              onClick={onSwitchToThread}
              className="font-mono text-[11px] text-gray-500 hover:text-cream"
            >
              Switch to Thread
            </button>
            <button
              onClick={onNewQuestion}
              className="font-mono text-[11px] text-gray-500 hover:text-cream"
            >
              New question
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {isComplete && (
        <button
          onClick={onReplay}
          className="absolute right-6 top-16 font-mono text-[10px] text-gray-600 hover:text-gray-400"
        >
          ⟳ Replay from start
        </button>
      )}
    </div>
  );
}

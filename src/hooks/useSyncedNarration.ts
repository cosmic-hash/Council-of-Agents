"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { synthesizeSentence } from "@/lib/piper";

function splitSentences(text: string): string[] {
  return text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || (text ? [text] : []);
}

function countWords(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length || 1;
}

function clampPlaybackRate(rate: number): number {
  return Math.min(2, Math.max(0.75, rate));
}

interface UseSyncedNarrationOptions {
  text: string;
  wpm: number;
  enabled: boolean;
  voiceId: string;
  sceneKey: number | string;
  onWordTick?: () => void;
  onComplete?: () => void;
  onLoadingChange?: (loading: boolean) => void;
  onPiperError?: (error: unknown) => void;
}

export function useSyncedNarration({
  text,
  wpm,
  enabled,
  voiceId,
  sceneKey,
  onWordTick,
  onComplete,
  onLoadingChange,
  onPiperError,
}: UseSyncedNarrationOptions) {
  const [displayed, setDisplayed] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const runIdRef = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number>(0);
  const blobUrlsRef = useRef<string[]>([]);
  const lastWordCountRef = useRef(0);
  const onWordTickRef = useRef(onWordTick);
  const onCompleteRef = useRef(onComplete);
  const onLoadingChangeRef = useRef(onLoadingChange);
  const onPiperErrorRef = useRef(onPiperError);

  onWordTickRef.current = onWordTick;
  onCompleteRef.current = onComplete;
  onLoadingChangeRef.current = onLoadingChange;
  onPiperErrorRef.current = onPiperError;

  const cleanupPlayback = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
    blobUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    blobUrlsRef.current = [];
  }, []);

  const skipToEnd = useCallback(() => {
    runIdRef.current += 1;
    cleanupPlayback();
    setDisplayed(text);
    setIsComplete(true);
    onCompleteRef.current?.();
  }, [text, cleanupPlayback]);

  useEffect(() => {
    if (!enabled || !text.trim()) {
      cleanupPlayback();
      setDisplayed("");
      setIsComplete(false);
      return;
    }

    const runId = ++runIdRef.current;
    const sentences = splitSentences(text);
    lastWordCountRef.current = 0;

    const playSentence = async (index: number): Promise<void> => {
      if (runId !== runIdRef.current) return;

      if (index >= sentences.length) {
        setDisplayed(text);
        setIsComplete(true);
        onCompleteRef.current?.();
        return;
      }

      const sentence = sentences[index];
      const prefix = sentences.slice(0, index).join("");

      try {
        if (index === 0) onLoadingChangeRef.current?.(true);
        const blob = await synthesizeSentence(sentence, voiceId, () => {
          onLoadingChangeRef.current?.(true);
        });
        if (runId !== runIdRef.current) return;
        onLoadingChangeRef.current?.(false);

        const url = URL.createObjectURL(blob);
        blobUrlsRef.current.push(url);

        const audio = new Audio(url);
        audioRef.current = audio;

        await new Promise<void>((resolve, reject) => {
          const onMeta = () => {
            const words = countWords(sentence);
            const targetSec = words / (wpm / 60);
            const naturalSec = audio.duration;
            if (Number.isFinite(naturalSec) && naturalSec > 0 && targetSec > 0) {
              audio.playbackRate = clampPlaybackRate(naturalSec / targetSec);
            }
            resolve();
          };
          audio.addEventListener("loadedmetadata", onMeta, { once: true });
          audio.addEventListener("error", () => reject(new Error("Audio failed to load")), {
            once: true,
          });
        });

        if (runId !== runIdRef.current) return;

        const tick = () => {
          if (runId !== runIdRef.current) return;
          const duration = audio.duration || 1;
          const progress = Math.min(1, audio.currentTime / duration);
          const charCount = Math.max(1, Math.floor(progress * sentence.length));
          const current = prefix + sentence.slice(0, charCount);
          setDisplayed(current);

          const words = current.trim().split(/\s+/).filter(Boolean).length;
          if (words > lastWordCountRef.current) {
            lastWordCountRef.current = words;
            onWordTickRef.current?.();
          }

          if (!audio.paused && !audio.ended) {
            rafRef.current = requestAnimationFrame(tick);
          }
        };

        await audio.play();
        rafRef.current = requestAnimationFrame(tick);

        await new Promise<void>((resolve) => {
          audio.addEventListener("ended", () => resolve(), { once: true });
        });

        if (runId !== runIdRef.current) return;

        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = 0;
        }

        await playSentence(index + 1);
      } catch (err) {
        onLoadingChangeRef.current?.(false);
        onPiperErrorRef.current?.(err);
      }
    };

    setDisplayed("");
    setIsComplete(false);
    void playSentence(0);

    return () => {
      runIdRef.current += 1;
      cleanupPlayback();
    };
  }, [text, wpm, enabled, voiceId, sceneKey, cleanupPlayback]);

  const advanceSentence = useCallback(() => {
    skipToEnd();
  }, [skipToEnd]);

  return { displayed, isComplete, skipToEnd, advanceSentence };
}

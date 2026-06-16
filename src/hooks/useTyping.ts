"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseTypingOptions {
  text: string;
  wpm: number;
  enabled: boolean;
  onComplete?: () => void;
  onWordTick?: () => void;
  mode?: "word" | "letter";
  pauseBetweenSentences?: number;
}

export function useTyping({
  text,
  wpm,
  enabled,
  onComplete,
  onWordTick,
  mode = "word",
  pauseBetweenSentences = 500,
}: UseTypingOptions) {
  const [displayed, setDisplayed] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const indexRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sentencesRef = useRef<string[]>([]);

  const msPerUnit = mode === "letter" ? 60000 / (wpm * 6) : 60000 / wpm;

  const reset = useCallback(() => {
    indexRef.current = 0;
    setDisplayed("");
    setIsComplete(false);
    setCurrentSentenceIndex(0);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  useEffect(() => {
    reset();
    sentencesRef.current = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
  }, [text, reset]);

  useEffect(() => {
    if (!enabled || !text) return;

    const units = mode === "letter" ? text.split("") : text.split(/(\s+)/);

    const tick = () => {
      if (indexRef.current >= units.length) {
        setIsComplete(true);
        onComplete?.();
        return;
      }

      indexRef.current += 1;
      setDisplayed(units.slice(0, indexRef.current).join(""));
      onWordTick?.();

      const currentText = units.slice(0, indexRef.current).join("");
      const endsSentence = /[.!?]\s*$/.test(currentText);
      const delay = endsSentence ? Math.min(pauseBetweenSentences, 150) : msPerUnit;

      timeoutRef.current = setTimeout(tick, delay);
    };

    timeoutRef.current = setTimeout(tick, msPerUnit);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [enabled, text, wpm, mode, msPerUnit, pauseBetweenSentences, onComplete, onWordTick]);

  const advanceSentence = useCallback(() => {
    const sentences = sentencesRef.current;
    const nextIdx = currentSentenceIndex + 1;
    if (nextIdx >= sentences.length) {
      setDisplayed(text);
      setIsComplete(true);
      onComplete?.();
      return;
    }
    setCurrentSentenceIndex(nextIdx);
    setDisplayed(sentences.slice(0, nextIdx + 1).join(" ").trim());
    if (nextIdx >= sentences.length - 1) {
      setIsComplete(true);
      onComplete?.();
    }
  }, [currentSentenceIndex, text, onComplete]);

  const skipToEnd = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setDisplayed(text);
    setIsComplete(true);
    onComplete?.();
  }, [text, onComplete]);

  return { displayed, isComplete, reset, advanceSentence, skipToEnd };
}

"use client";

import { useCallback, useEffect, useRef } from "react";

function splitSentences(text: string): string[] {
  return text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || (text ? [text] : []);
}

function pickVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  return voices.find((v) => v.lang.startsWith("en")) ?? voices[0] ?? null;
}

interface UseVoiceOutOptions {
  enabled: boolean;
  text: string;
  sceneKey: number | string;
  typingComplete?: boolean;
}

export function useVoiceOut({
  enabled,
  text,
  sceneKey,
  typingComplete = false,
}: UseVoiceOutOptions) {
  const lastSpokenIndexRef = useRef(-1);
  const sceneKeyRef = useRef(sceneKey);

  const cancel = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const speak = useCallback(
    (utterance: string) => {
      if (!enabled || !utterance.trim()) return;
      if (typeof window === "undefined" || !window.speechSynthesis) return;

      const u = new SpeechSynthesisUtterance(utterance.trim());
      u.rate = 0.98;
      u.pitch = 1;
      const voice = pickVoice();
      if (voice) u.voice = voice;
      window.speechSynthesis.speak(u);
    },
    [enabled]
  );

  useEffect(() => {
    if (sceneKeyRef.current !== sceneKey) {
      sceneKeyRef.current = sceneKey;
      lastSpokenIndexRef.current = -1;
      cancel();
    }
  }, [sceneKey, cancel]);

  useEffect(() => {
    if (!enabled) {
      cancel();
      return;
    }

    const sentences = splitSentences(text);
    if (sentences.length === 0) return;

    let lastCompleteIndex = sentences.length - 1;
    const lastSentence = sentences[lastCompleteIndex] ?? "";
    const lastIsComplete = /[.!?]\s*$/.test(lastSentence.trim());

    if (!lastIsComplete && !typingComplete) {
      lastCompleteIndex = sentences.length - 2;
    }

    if (lastCompleteIndex < 0) return;

    for (let i = lastSpokenIndexRef.current + 1; i <= lastCompleteIndex; i++) {
      const s = sentences[i]?.trim();
      if (s) speak(s);
      lastSpokenIndexRef.current = i;
    }
  }, [enabled, text, typingComplete, speak, cancel]);

  useEffect(() => {
    return () => cancel();
  }, [cancel]);

  return { cancel, speak };
}

"use client";

import { useCallback, useEffect, useRef } from "react";
import { pickVoice } from "@/lib/voices";

function splitSentences(text: string): string[] {
  return text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || (text ? [text] : []);
}

interface UseVoiceOutOptions {
  enabled: boolean;
  fullText: string;
  sceneKey: number | string;
  wpm?: number;
  voiceURI?: string | null;
  onSpeakingChange?: (speaking: boolean) => void;
  onSentenceStart?: (index: number, sentence: string, prefix: string) => void;
  onSentenceEnd?: (index: number, sentence: string) => void;
  onQueueComplete?: () => void;
}

export function useVoiceOut({
  enabled,
  fullText,
  sceneKey,
  wpm = 150,
  voiceURI = null,
  onSpeakingChange,
  onSentenceStart,
  onSentenceEnd,
  onQueueComplete,
}: UseVoiceOutOptions) {
  const lastSpokenIndexRef = useRef(-1);
  const sceneKeyRef = useRef(sceneKey);
  const queueRef = useRef<string[]>([]);
  const sentenceIndexRef = useRef(0);
  const prefixRef = useRef("");
  const speakingRef = useRef(false);
  const enabledRef = useRef(enabled);
  const wpmRef = useRef(wpm);
  const voiceURIRef = useRef(voiceURI);
  const onSpeakingChangeRef = useRef(onSpeakingChange);
  const onSentenceStartRef = useRef(onSentenceStart);
  const onSentenceEndRef = useRef(onSentenceEnd);
  const onQueueCompleteRef = useRef(onQueueComplete);

  enabledRef.current = enabled;
  wpmRef.current = wpm;
  voiceURIRef.current = voiceURI;
  onSpeakingChangeRef.current = onSpeakingChange;
  onSentenceStartRef.current = onSentenceStart;
  onSentenceEndRef.current = onSentenceEnd;
  onQueueCompleteRef.current = onQueueComplete;

  const setSpeaking = useCallback((value: boolean) => {
    speakingRef.current = value;
    onSpeakingChangeRef.current?.(value);
  }, []);

  const clearQueue = useCallback(() => {
    queueRef.current = [];
    sentenceIndexRef.current = 0;
    prefixRef.current = "";
    setSpeaking(false);
  }, [setSpeaking]);

  const cancel = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    clearQueue();
  }, [clearQueue]);

  const resolveVoice = useCallback((): SpeechSynthesisVoice | null => {
    if (typeof window === "undefined" || !window.speechSynthesis) return null;
    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) return null;
    const localEnglish = voices.filter(
      (v) => v.lang.startsWith("en") && v.localService
    );
    return pickVoice(localEnglish.length > 0 ? localEnglish : voices, voiceURIRef.current);
  }, []);

  const processQueue = useCallback(() => {
    if (!enabledRef.current || speakingRef.current) return;
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    const next = queueRef.current.shift();
    if (!next) {
      setSpeaking(false);
      onQueueCompleteRef.current?.();
      return;
    }

    const index = sentenceIndexRef.current;
    onSentenceStartRef.current?.(index, next, prefixRef.current);

    setSpeaking(true);
    const u = new SpeechSynthesisUtterance(next);
    u.rate = Math.min(2, Math.max(0.75, wpmRef.current / 175));
    u.pitch = 0.95;
    u.volume = 1;
    const voice = resolveVoice();
    if (voice) u.voice = voice;

    u.onend = () => {
      onSentenceEndRef.current?.(index, next);
      prefixRef.current += next;
      sentenceIndexRef.current += 1;
      setSpeaking(false);
      processQueue();
    };
    u.onerror = () => {
      onSentenceEndRef.current?.(index, next);
      prefixRef.current += next;
      sentenceIndexRef.current += 1;
      setSpeaking(false);
      processQueue();
    };

    window.speechSynthesis.speak(u);
  }, [resolveVoice, setSpeaking]);

  const speakAll = useCallback(() => {
    if (!enabledRef.current || !fullText.trim()) return;
    cancel();
    const sentences = splitSentences(fullText);
    queueRef.current = sentences.map((s) => s.trim()).filter(Boolean);
    sentenceIndexRef.current = 0;
    prefixRef.current = "";
    lastSpokenIndexRef.current = sentences.length - 1;
    processQueue();
  }, [fullText, cancel, processQueue]);

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
    speakAll();
  }, [enabled, fullText, sceneKey, speakAll, cancel]);

  useEffect(() => {
    return () => cancel();
  }, [cancel]);

  return { cancel, isSpeaking: speakingRef.current };
}

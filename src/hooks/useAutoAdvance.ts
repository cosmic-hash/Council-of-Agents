"use client";

import { useEffect, useRef } from "react";

interface UseAutoAdvanceOptions {
  enabled: boolean;
  typingComplete: boolean;
  waitingForUser: boolean;
  transitionSpeed: number;
  canAdvance: boolean;
  onAdvance: () => void;
}

export function useAutoAdvance({
  enabled,
  typingComplete,
  waitingForUser,
  transitionSpeed,
  canAdvance,
  onAdvance,
}: UseAutoAdvanceOptions) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onAdvanceRef = useRef(onAdvance);
  onAdvanceRef.current = onAdvance;

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (!enabled || !typingComplete || !waitingForUser || !canAdvance) return;

    timeoutRef.current = setTimeout(() => {
      onAdvanceRef.current();
    }, transitionSpeed);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [enabled, typingComplete, waitingForUser, canAdvance, transitionSpeed]);

  const cancel = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  return { cancel };
}

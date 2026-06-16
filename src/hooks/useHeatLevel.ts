"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AgentId } from "@/lib/types";
import { computeHeatDelta } from "@/lib/heat";

export function useHeatLevel() {
  const [heatLevel, setHeatLevel] = useState(0);
  const [isVerdict, setIsVerdict] = useState(false);
  const targetRef = useRef(0);
  const animRef = useRef<number | null>(null);

  const animate = useCallback(() => {
    setHeatLevel((current) => {
      const target = targetRef.current;
      const diff = target - current;
      if (Math.abs(diff) < 0.5) return target;
      return current + diff * 0.08;
    });
    animRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    animRef.current = requestAnimationFrame(animate);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [animate]);

  const updateHeat = useCallback(
    (agentId: AgentId, phase: "opening" | "rebuttal" | "verdict", sentiment: number) => {
      if (phase === "verdict") {
        setIsVerdict(true);
        targetRef.current = Math.max(0, targetRef.current - 30);
        return;
      }
      const delta = computeHeatDelta(agentId, phase, sentiment);
      targetRef.current = Math.max(0, Math.min(100, targetRef.current + delta));
    },
    []
  );

  const setHeat = useCallback((level: number) => {
    targetRef.current = Math.max(0, Math.min(100, level));
  }, []);

  const resetHeat = useCallback(() => {
    targetRef.current = 0;
    setIsVerdict(false);
    setHeatLevel(0);
  }, []);

  return { heatLevel, isVerdict, updateHeat, setHeat, resetHeat };
}

"use client";

import { useEffect, useState } from "react";
import { MAX_WPM, MIN_WPM, SPEED_PRESETS } from "@/lib/constants";

interface SpeedSliderProps {
  value: number;
  modeDefault: number;
  onChange: (wpm: number) => void;
}

export function SpeedSlider({ value, modeDefault, onChange }: SpeedSliderProps) {
  const [dragValue, setDragValue] = useState(value);

  useEffect(() => {
    setDragValue(value);
  }, [value]);

  const presets = [
    { label: "Slow", wpm: SPEED_PRESETS.slow },
    { label: "Normal", wpm: modeDefault },
    { label: "Fast", wpm: SPEED_PRESETS.fast },
    { label: "Turbo", wpm: SPEED_PRESETS.turbo },
  ];

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm">🐢</span>
      <input
        type="range"
        min={MIN_WPM}
        max={MAX_WPM}
        value={dragValue}
        onChange={(e) => setDragValue(Number(e.target.value))}
        onMouseUp={() => onChange(dragValue)}
        onTouchEnd={() => onChange(dragValue)}
        className="h-1 w-24 cursor-pointer appearance-none rounded-full bg-surface-border accent-violet-500"
        title="Hold Shift+Space to advance one sentence at a time"
      />
      <span className="text-sm">🐇</span>
      <span className="font-mono text-[10px] text-foreground-muted">{value} wpm</span>
      <div className="hidden items-center gap-1 sm:flex">
        {presets.map((p) => (
          <button
            key={p.label}
            onClick={() => {
              setDragValue(p.wpm);
              onChange(p.wpm);
            }}
            className={`rounded px-1.5 py-0.5 font-mono text-[9px] transition-colors ${
              value === p.wpm
                ? "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300"
                : "text-foreground-muted hover:text-foreground"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}

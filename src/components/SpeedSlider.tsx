"use client";

interface SpeedSliderProps {
  value: number;
  modeDefault: number;
  onChange: (wpm: number) => void;
}

export function SpeedSlider({ value, modeDefault, onChange }: SpeedSliderProps) {
  const presets = [20, modeDefault, 80];
  const min = 15;
  const max = 90;

  const snapToPreset = (v: number) => {
    const closest = presets.reduce((prev, curr) =>
      Math.abs(curr - v) < Math.abs(prev - v) ? curr : prev
    );
    return closest;
  };

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm">🐢</span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(snapToPreset(Number(e.target.value)))}
        className="h-1 w-24 cursor-pointer appearance-none rounded-full bg-white/10 accent-violet-500"
        title="Hold Shift+Space to advance one sentence at a time"
      />
      <span className="text-sm">🐇</span>
      <span className="font-mono text-[10px] text-gray-600">{value} wpm</span>
    </div>
  );
}

"use client";

interface SpeakingBarsProps {
  color: string;
  active: boolean;
}

export function SpeakingBars({ color, active }: SpeakingBarsProps) {
  if (!active) return null;

  return (
    <div className="flex h-8 items-end justify-center gap-1">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="speaking-bar w-1 rounded-sm"
          style={{
            backgroundColor: color,
            height: "20px",
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}
    </div>
  );
}

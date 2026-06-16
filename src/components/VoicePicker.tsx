"use client";

import { PIPER_VOICE_KEY } from "@/lib/constants";
import { DEFAULT_PIPER_VOICE, PIPER_VOICES } from "@/lib/piperVoices";

interface VoicePickerProps {
  enabled: boolean;
  voiceId: string;
  onChange: (voiceId: string) => void;
}

export function VoicePicker({ enabled, voiceId, onChange }: VoicePickerProps) {
  if (!enabled) return null;

  const value = voiceId || DEFAULT_PIPER_VOICE;

  return (
    <select
      value={value}
      onChange={(e) => {
        const id = e.target.value;
        onChange(id);
        localStorage.setItem(PIPER_VOICE_KEY, id);
      }}
      className="max-w-[6.5rem] truncate rounded-full border border-surface-border bg-surface px-2 py-1 font-mono text-[9px] text-foreground"
      title="Neural voice · runs locally"
      aria-label="Neural voice · runs locally"
    >
      {PIPER_VOICES.map((v) => (
        <option key={v.id} value={v.id}>
          {v.label}
        </option>
      ))}
    </select>
  );
}

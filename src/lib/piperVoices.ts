export interface PiperVoiceOption {
  id: string;
  label: string;
  description?: string;
}

export const PIPER_VOICES: PiperVoiceOption[] = [
  { id: "en_US-lessac-high", label: "Lessac (US)", description: "Warm, natural male" },
  { id: "en_US-amy-medium", label: "Amy (US)", description: "Clear female" },
  { id: "en_US-libritts_r-medium", label: "LibriTTS (US)", description: "Expressive neutral" },
  { id: "en_US-hfc_female-medium", label: "HFC Female (US)", description: "Soft female" },
  { id: "en_GB-cori-high", label: "Cori (UK)", description: "British female" },
  { id: "en_GB-alan-medium", label: "Alan (UK)", description: "British male" },
];

export const DEFAULT_PIPER_VOICE = "en_US-lessac-high";

export function getPiperVoiceLabel(voiceId: string): string {
  return PIPER_VOICES.find((v) => v.id === voiceId)?.label ?? voiceId;
}

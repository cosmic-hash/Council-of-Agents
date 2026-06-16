const PREFERRED_VOICE_PATTERNS = [
  /Neural/i,
  /Enhanced/i,
  /Premium/i,
  /Natural/i,
  /Samantha/i,
  /Daniel/i,
  /Karen/i,
  /Microsoft (Aria|Jenny|Guy|Zira)/i,
  /Google UK English Female/i,
  /Google US English/i,
];

const ROBOTIC_VOICE_PATTERNS = [
  /Fred/i,
  /Ralph/i,
  /Bad News/i,
  /Bells/i,
  /Boing/i,
  /Whisper/i,
  /Zarvox/i,
];

export function isRoboticVoice(name: string): boolean {
  return ROBOTIC_VOICE_PATTERNS.some((p) => p.test(name));
}

export function voicePreferenceScore(name: string): number {
  if (isRoboticVoice(name)) return -100;
  for (let i = 0; i < PREFERRED_VOICE_PATTERNS.length; i++) {
    if (PREFERRED_VOICE_PATTERNS[i].test(name)) return 100 - i;
  }
  return 0;
}

export function pickVoice(
  voices: SpeechSynthesisVoice[],
  voiceURI?: string | null
): SpeechSynthesisVoice | null {
  if (voices.length === 0) return null;

  if (voiceURI) {
    const selected = voices.find((v) => v.voiceURI === voiceURI);
    if (selected) return selected;
  }

  const english = voices.filter((v) => v.lang.startsWith("en") && !isRoboticVoice(v.name));
  const sorted = [...english].sort(
    (a, b) => voicePreferenceScore(b.name) - voicePreferenceScore(a.name)
  );

  if (sorted.length > 0) return sorted[0];

  return (
    voices.find((v) => v.lang.startsWith("en-US") && !isRoboticVoice(v.name)) ??
    voices.find((v) => v.lang.startsWith("en")) ??
    voices[0] ??
    null
  );
}

export function getEnglishVoices(): SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !window.speechSynthesis) return [];
  return window.speechSynthesis
    .getVoices()
    .filter((v) => v.lang.startsWith("en"))
    .sort((a, b) => voicePreferenceScore(b.name) - voicePreferenceScore(a.name));
}

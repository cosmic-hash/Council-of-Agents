const PIPER_MODULE_URL = "/vendor/piper/piper-tts-web.js";

type ProgressCallback = (progress: {
  url: string;
  total: number;
  loaded: number;
}) => void;

type PiperModule = typeof import("@mintplex-labs/piper-tts-web");

let session: InstanceType<PiperModule["TtsSession"]> | null = null;
let sessionVoiceId: string | null = null;
let loadPromise: Promise<InstanceType<PiperModule["TtsSession"]>> | null = null;

async function getPiperModule(): Promise<PiperModule> {
  if (typeof window === "undefined") {
    throw new Error("Piper TTS is only available in the browser");
  }
  return import(/* webpackIgnore: true */ PIPER_MODULE_URL);
}

async function getSession(
  voiceId: string,
  onProgress?: ProgressCallback
): Promise<InstanceType<PiperModule["TtsSession"]>> {
  if (session && sessionVoiceId === voiceId && session.ready) {
    return session;
  }

  if (loadPromise && sessionVoiceId === voiceId) {
    return loadPromise;
  }

  sessionVoiceId = voiceId;
  loadPromise = (async () => {
    const piper = await getPiperModule();
    const next = await piper.TtsSession.create({
      voiceId: voiceId as Parameters<typeof piper.TtsSession.create>[0]["voiceId"],
      progress: onProgress,
    });
    session = next;
    return next;
  })();

  try {
    return await loadPromise;
  } catch (err) {
    session = null;
    sessionVoiceId = null;
    loadPromise = null;
    throw err;
  }
}

export async function synthesizeSentence(
  text: string,
  voiceId: string,
  onProgress?: ProgressCallback
): Promise<Blob> {
  const trimmed = text.trim();
  if (!trimmed) {
    return new Blob([], { type: "audio/wav" });
  }
  const s = await getSession(voiceId, onProgress);
  return s.predict(trimmed);
}

export function resetPiperSession(): void {
  session = null;
  sessionVoiceId = null;
  loadPromise = null;
}

export async function warmupPiperVoice(
  voiceId: string,
  onProgress?: ProgressCallback
): Promise<void> {
  await getSession(voiceId, onProgress);
}

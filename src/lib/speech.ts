"use client";

// Browser Text-to-Speech / Speech-to-Text helpers (Web Speech API).

export function ttsSupported() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function pickEnglishVoice(): SpeechSynthesisVoice | undefined {
  if (!ttsSupported()) return undefined;
  const voices = window.speechSynthesis.getVoices();
  const pref = ["en-US", "en-GB", "en-AU"];
  for (const lang of pref) {
    const natural = voices.find((v) => v.lang === lang && /natural|neural|online/i.test(v.name));
    if (natural) return natural;
  }
  return voices.find((v) => v.lang.startsWith("en-US")) ?? voices.find((v) => v.lang.startsWith("en"));
}

export function speak(text: string, opts: { rate?: number; onEnd?: () => void; lang?: string } = {}) {
  if (!ttsSupported()) return false;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = opts.lang ?? "en-US";
  const v = u.lang.startsWith("en") ? pickEnglishVoice() : undefined;
  if (v) u.voice = v;
  u.rate = opts.rate ?? 1;
  if (opts.onEnd) u.onend = opts.onEnd;
  window.speechSynthesis.speak(u);
  return true;
}

export function stopSpeaking() {
  if (ttsSupported()) window.speechSynthesis.cancel();
}

// --- Speech recognition ---
type SRResultList = { length: number; [i: number]: { isFinal: boolean; 0: { transcript: string; confidence: number } } };
export type SREvent = { resultIndex: number; results: SRResultList };
export type SpeechRec = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: SREvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};

export function getRecognition(): SpeechRec | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => SpeechRec; webkitSpeechRecognition?: new () => SpeechRec };
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  return Ctor ? new Ctor() : null;
}

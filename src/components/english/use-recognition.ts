"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useClientValue } from "./use-client-value";
import { getRecognition, type SpeechRec } from "@/lib/speech";

/** Browser speech-to-text. Returns transcript, average ASR confidence (0-1, as reported by the browser) and controls. */
export function useRecognition(onFinal?: (text: string) => void) {
  const recRef = useRef<SpeechRec | null>(null);
  const supported = useClientValue(() => getRecognition() !== null, false);
  const finalRef = useRef("");
  const onFinalRef = useRef(onFinal);
  useEffect(() => { onFinalRef.current = onFinal; }, [onFinal]);
  const [listening, setListening] = useState(false);
  const [finalText, setFinalText] = useState("");
  const [interim, setInterim] = useState("");
  const [confidences, setConfidences] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(() => {
    const rec = getRecognition();
    if (!rec) return;
    setError(null);
    setFinalText("");
    finalRef.current = "";
    setInterim("");
    setConfidences([]);
    rec.lang = "en-US";
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e) => {
      let interimText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) {
          finalRef.current = (finalRef.current ? finalRef.current + " " : "") + r[0].transcript.trim();
          setFinalText(finalRef.current);
          onFinalRef.current?.(finalRef.current);
          if (typeof r[0].confidence === "number" && r[0].confidence > 0) setConfidences((c) => [...c, r[0].confidence]);
        } else interimText += r[0].transcript;
      }
      setInterim(interimText);
    };
    rec.onerror = (e) => setError(e.error === "not-allowed" ? "麥克風權限被拒絕，請允許後重試或改用手動輸入。" : `語音辨識錯誤：${e.error}`);
    rec.onend = () => { setListening(false); setInterim(""); };
    recRef.current = rec;
    rec.start();
    setListening(true);
  }, []);

  const stop = useCallback(() => recRef.current?.stop(), []);
  const confidence = confidences.length ? confidences.reduce((a, b) => a + b, 0) / confidences.length : null;
  const setTranscript = useCallback((t: string) => { finalRef.current = t; setFinalText(t); }, []);
  return { supported, listening, transcript: finalText, interim, confidence, error, start, stop, setTranscript };
}

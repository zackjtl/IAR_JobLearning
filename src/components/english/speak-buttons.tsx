"use client";

import { useState } from "react";
import { useClientValue } from "./use-client-value";
import { Volume2, Snail, Square } from "lucide-react";
import { Button } from "@/components/ui";
import { speak, stopSpeaking, ttsSupported } from "@/lib/speech";

export function SpeakButtons({ text, size = "sm" }: { text: string; size?: "sm" | "md" }) {
  const ok = useClientValue(ttsSupported, false);
  const [playing, setPlaying] = useState(false);
  if (!ok) return <span className="text-[12px] text-faint">此瀏覽器不支援語音播放</span>;
  const play = (rate: number) => {
    setPlaying(true);
    speak(text, { rate, onEnd: () => setPlaying(false) });
  };
  return (
    <span className="inline-flex gap-1.5">
      <Button size={size} variant="outline" onClick={() => play(1)} aria-label="播放（正常速度）"><Volume2 size={14} />播放</Button>
      <Button size={size} variant="outline" onClick={() => play(0.7)} aria-label="慢速播放"><Snail size={14} />慢速</Button>
      {playing && <Button size={size} variant="ghost" onClick={() => { stopSpeaking(); setPlaying(false); }} aria-label="停止"><Square size={13} /></Button>}
    </span>
  );
}

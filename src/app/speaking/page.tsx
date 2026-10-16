import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { ENGLISH_QS } from "@/content/english";
import { LESSON_CONTENT } from "@/content/lessons";
import { LESSON_BY_ID } from "@/content/catalog";
import { SpeakingClient } from "./speaking-client";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "口說與聽力練習" };

export default async function Page(props: PageProps<"/speaking">) {
  const sp = await props.searchParams;
  const qid = typeof sp.q === "string" ? sp.q : undefined;
  const seen = new Set<string>();
  const terms: { en: string; zh: string; lesson: string }[] = [];
  for (const [id, c] of Object.entries(LESSON_CONTENT)) {
    for (const t of c.terms) {
      const k = t.en.toLowerCase();
      if (seen.has(k)) continue;
      seen.add(k);
      terms.push({ en: t.en, zh: t.zh, lesson: LESSON_BY_ID[id]?.title ?? id });
    }
  }
  return (
    <>
      <PageHeader
        title="口說與聽力練習"
        subtitle="使用瀏覽器的語音播放（TTS）與語音辨識（Speech-to-Text）。不支援語音辨識的瀏覽器可改用手動輸入。語音資料由瀏覽器處理，本站只儲存文字結果。"
      />
      <SpeakingClient questions={ENGLISH_QS.map((q) => ({ id: q.id, cat: q.cat, en: q.en, zh: q.zh, keywords: q.keywords, answerSimple: q.answerSimple, keyPhrases: q.keyPhrases, intent: q.intent }))} initialQ={qid} terms={terms} />
    </>
  );
}

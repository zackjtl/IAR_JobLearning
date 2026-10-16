import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { ENGLISH_CATS, ENGLISH_QS, type EnglishCat } from "@/content/english";
import { prisma } from "@/lib/db";
import { EnglishClient } from "./english-client";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "英文面試題庫" };

export default async function Page(props: PageProps<"/english">) {
  const sp = await props.searchParams;
  const cat = (typeof sp.cat === "string" && ENGLISH_CATS.some((c) => c.id === sp.cat) ? sp.cat : "recruiter") as EnglishCat;
  const acts = await prisma.activity.findMany({ where: { type: { in: ["english", "speaking"] } }, select: { refId: true, score: true }, orderBy: { createdAt: "asc" } });
  const practiced: Record<string, number | null> = {};
  for (const a of acts) practiced[a.refId] = a.score;
  const counts = Object.fromEntries(ENGLISH_CATS.map((c) => [c.id, { total: ENGLISH_QS.filter((q) => q.cat === c.id).length, done: ENGLISH_QS.filter((q) => q.cat === c.id && q.id in practiced).length }]));
  return (
    <>
      <PageHeader
        title="英文面試題庫"
        subtitle="每題包含中文翻譯、問題意圖、簡單版與進階版回答、關鍵句型與常見追問。回答以你的真實背景撰寫；[方括號] 內是需要你用自己的經歷替換的部分。"
      />
      <EnglishClient cat={cat} cats={ENGLISH_CATS} counts={counts} questions={ENGLISH_QS.filter((q) => q.cat === cat)} practiced={practiced} />
    </>
  );
}

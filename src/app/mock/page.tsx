import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { MOCK_MODES, type MockMode } from "@/content/mock";
import { aiProvider } from "@/lib/ai";
import { prisma, parseJson } from "@/lib/db";
import { MockClient } from "./mock-client";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "模擬面試" };

export default async function Page(props: PageProps<"/mock">) {
  const sp = await props.searchParams;
  const mode = (typeof sp.mode === "string" && MOCK_MODES.some((m) => m.id === sp.mode) ? sp.mode : "recruiter") as MockMode;
  const history = await prisma.mockSession.findMany({ orderBy: { createdAt: "desc" }, take: 10 });
  return (
    <>
      <PageHeader
        title="模擬面試"
        subtitle={aiProvider() ? "AI 會依你的回答動態追問，並在每題後給回饋。" : "目前未連接 AI：使用題庫 + 關鍵詞觸發的追問，以及規則式評估。設定 AI API key 後可啟用動態追問。"}
      />
      <MockClient
        initialMode={mode}
        modes={MOCK_MODES}
        ai={!!aiProvider()}
        history={history.map((h) => ({ id: h.id, mode: h.mode, status: h.status, createdAt: h.createdAt.toISOString(), avg: parseJson<{ avg?: number } | null>(h.summaryJson, null)?.avg ?? null }))}
      />
    </>
  );
}

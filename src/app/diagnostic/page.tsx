import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { latestDiagnostic } from "@/lib/progress";
import { DiagnosticClient } from "./diagnostic-client";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "診斷測驗" };

export default async function Page() {
  const prev = await latestDiagnostic();
  return (
    <>
      <PageHeader title="初始診斷測驗" subtitle="依實際作答建立能力模型，而不是預設分數。涵蓋 8 個能力面向。" />
      <DiagnosticClient previous={prev ? { createdAt: prev.createdAt.toISOString(), scores: prev.scores } : null} />
    </>
  );
}

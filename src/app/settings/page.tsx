import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { getSettings } from "@/lib/progress";
import { aiModel, aiProvider } from "@/lib/ai";
import { authEnabled } from "@/lib/auth";
import { SettingsClient } from "./settings-client";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "設定" };

export default async function Page() {
  const s = await getSettings();
  const p = aiProvider();
  return (
    <>
      <PageHeader title="設定" subtitle="學習節奏、AI 狀態與資料管理" />
      <SettingsClient
        dailyMinutes={s.dailyMinutes}
        planStartDate={s.planStartDate ? s.planStartDate.toISOString().slice(0, 10) : ""}
        ai={p ? { provider: p, model: aiModel(p) } : null}
        auth={authEnabled()}
      />
    </>
  );
}

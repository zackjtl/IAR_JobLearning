"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, LogOut } from "lucide-react";
import { Badge, Button, Callout, Card, CardBody, CardHeader, Input, Segmented } from "@/components/ui";
import { api } from "@/lib/utils";

export function SettingsClient(props: { dailyMinutes: number; planStartDate: string; ai: { provider: string; model: string } | null; auth: boolean }) {
  const router = useRouter();
  const [mins, setMins] = useState(String(props.dailyMinutes) as "30" | "60" | "90");
  const [start, setStart] = useState(props.planStartDate);
  const [saved, setSaved] = useState("");
  const [confirm, setConfirm] = useState("");
  const [resetMsg, setResetMsg] = useState("");

  async function save(patch: Record<string, unknown>) {
    await api("/api/settings", { method: "POST", json: patch });
    setSaved("已儲存");
    router.refresh();
    setTimeout(() => setSaved(""), 1500);
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card>
        <CardHeader title="每日學習模式" subtitle="影響儀表板的每日目標與「今日任務」的份量" action={saved && <Badge tone="ok">{saved}</Badge>} />
        <CardBody className="space-y-4">
          <Segmented
            value={mins}
            onChange={(v) => {
              setMins(v);
              save({ dailyMinutes: Number(v) });
            }}
            options={[
              { value: "30", label: "30 分鐘" },
              { value: "60", label: "60 分鐘" },
              { value: "90", label: "90 分鐘" },
            ]}
          />
          <div>
            <label className="mb-1 block text-[13px] text-muted">14 天計畫開始日（建議節奏，不代表面試日期）</label>
            <div className="flex gap-2">
              <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="max-w-[200px]" />
              <Button variant="outline" onClick={() => save({ planStartDate: start || null })}>儲存</Button>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="AI 功能狀態" subtitle="API Key 只存在伺服器環境變數，不會傳到瀏覽器" />
        <CardBody className="space-y-3 text-[13.5px]">
          {props.ai ? (
            <div className="flex items-center gap-2">
              <Badge tone="ok">已啟用</Badge> Provider：<code>{props.ai.provider}</code> · Model：<code>{props.ai.model}</code>
            </div>
          ) : (
            <Callout tone="neutral" title="未設定 AI（離線模式）">
              靜態課程、題庫、Quiz、Labs、規則式模擬面試與評估都能正常使用。若要啟用 AI 動態追問與回饋，請設定環境變數
              <code className="mx-1">ANTHROPIC_API_KEY</code>或<code className="mx-1">OPENAI_API_KEY</code>（Vercel：Project → Settings → Environment Variables）。
            </Callout>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="資料管理" subtitle="資料儲存在 Supabase Postgres" />
        <CardBody className="space-y-4">
          <a href="/api/export" className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline">
            <Download size={15} /> 匯出全部學習資料（JSON）
          </a>
          <div className="rounded-md border border-bad/40 p-3">
            <div className="mb-1 text-[13.5px] font-medium text-bad">重設學習進度</div>
            <p className="mb-2 text-[12.5px] text-muted">刪除診斷、Quiz 紀錄、課程進度、複習卡、練習與模擬面試紀錄（保留筆記與書籤）。請輸入 RESET 確認。</p>
            <div className="flex gap-2">
              <Input value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="RESET" className="max-w-[140px]" />
              <Button
                variant="danger"
                disabled={confirm !== "RESET"}
                onClick={async () => {
                  await api("/api/reset", { method: "POST", json: { confirm } });
                  setResetMsg("已重設");
                  setConfirm("");
                  router.refresh();
                }}
              >
                重設
              </Button>
              {resetMsg && <Badge tone="ok">{resetMsg}</Badge>}
            </div>
          </div>
        </CardBody>
      </Card>

      {props.auth && (
        <Card>
          <CardHeader title="登入" subtitle="此網站以密碼保護（APP_PASSWORD）" />
          <CardBody>
            <Button
              variant="outline"
              onClick={async () => {
                await fetch("/api/auth/logout", { method: "POST" });
                window.location.href = "/login";
              }}
            >
              <LogOut size={15} /> 登出
            </Button>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

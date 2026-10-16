import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, CircleDashed, AlertTriangle } from "lucide-react";
import { Badge, Callout, Card, CardBody, CardHeader, PageHeader } from "@/components/ui";
import { JD_ITEMS, JD_META, EXTENSION_TOPICS, type Fit, type JdCategory } from "@/content/jd";
import { LESSON_BY_ID } from "@/content/catalog";
import { lessonProgressMap } from "@/lib/progress";
import { ENABLED_ROUTES } from "@/components/layout/enabled";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "JD 需求對照" };

const FIT: Record<Fit, { label: string; tone: "ok" | "warn" | "bad"; icon: typeof CheckCircle2 }> = {
  strong: { label: "已具備", tone: "ok", icon: CheckCircle2 },
  partial: { label: "部分具備", tone: "warn", icon: CircleDashed },
  gap: { label: "主要落差", tone: "bad", icon: AlertTriangle },
};

const ENGLISH_CAT: Record<string, string> = {
  recruiter: "獵頭初談", intro: "自我介紹", career: "職涯背景", technical: "技術經驗", toolchain: "Compiler/Toolchain", fae: "FAE 情境", behavioral: "行為面試", salary: "薪資談判", ask: "反問面試官",
};
const MOCK_LABEL = { recruiter: "獵頭面談", technical: "技術主管", customer: "客戶情境" };
const LAB_LABEL: Record<string, string> = {
  optimization: "最佳化比較", "memory-layout": "記憶體配置", sections: "Section Explorer", "stack-heap": "Stack/Heap", "rtos-sim": "RTOS 排程模擬", "asm-walkthrough": "組語逐步執行", "debug-cases": "除錯案例",
};

export default async function JdPage(props: PageProps<"/jd">) {
  const sp = await props.searchParams;
  const fitFilter = (typeof sp.fit === "string" ? sp.fit : "") as Fit | "";
  const progress = await lessonProgressMap();
  const items = JD_ITEMS.filter((i) => !fitFilter || i.fit === fitFilter);
  const cats = Array.from(new Set(JD_ITEMS.map((i) => i.category))) as JdCategory[];
  const count = (f: Fit) => JD_ITEMS.filter((i) => i.fit === f).length;
  const has = (r: string) => ENABLED_ROUTES.includes(r);

  return (
    <>
      <PageHeader
        title="JD Requirement Mapping"
        subtitle="從 IAR FAE Taiwan.pdf 萃取每項要求，對應到你的背景、課程、練習與模擬面試。「具備程度」僅依你提供的背景初步判斷，請以診斷與練習結果持續修正。"
      />

      <div className="mb-5 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader title={JD_META.title} subtitle={`${JD_META.company} · ${JD_META.location}`} />
          <CardBody className="space-y-1.5 text-[13.5px]">
            <div><span className="text-muted">負責區域：</span>{JD_META.region}</div>
            <div><span className="text-muted">團隊：</span>{JD_META.team}</div>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
              {JD_META.facts.map((f) => <li key={f}>{f}</li>)}
            </ul>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="差距總覽" subtitle={`共 ${JD_ITEMS.length} 項要求`} />
          <CardBody>
            <div className="grid grid-cols-3 gap-2">
              {(["strong", "partial", "gap"] as Fit[]).map((f) => {
                const F = FIT[f];
                return (
                  <Link
                    key={f}
                    href={fitFilter === f ? "/jd" : `/jd?fit=${f}`}
                    className={cn("rounded-md border p-3 text-center", fitFilter === f ? "border-accent bg-accent-soft" : "border-border hover:bg-surface-2")}
                  >
                    <div className="text-2xl font-semibold tabular-nums">{count(f)}</div>
                    <Badge tone={F.tone} className="mt-1">{F.label}</Badge>
                  </Link>
                );
              })}
            </div>
            <p className="mt-3 text-[12.5px] text-muted">
              最大落差集中在「FAE/售前經歷」與「客戶互動」。策略：誠實說明，以嵌入式深度、管理與跨團隊經驗、具體學習計畫補位 —— 不捏造經歷。
            </p>
          </CardBody>
        </Card>
      </div>

      {cats.map((cat) => {
        const list = items.filter((i) => i.category === cat);
        if (list.length === 0) return null;
        return (
          <section key={cat} className="mb-6">
            <h2 className="mb-2.5 text-[13px] font-semibold uppercase tracking-wider text-faint">{cat}</h2>
            <div className="space-y-2.5">
              {list.map((i) => {
                const F = FIT[i.fit];
                return (
                  <Card key={i.id} className="p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge tone={i.kind === "加分條件" ? "accent" : "neutral"}>{i.kind}</Badge>
                          <span className="text-[14px] font-medium">{i.zh}</span>
                        </div>
                        <p className="mt-1 text-[12.5px] italic text-faint">“{i.quote}”</p>
                      </div>
                      <Badge tone={F.tone}>
                        <F.icon size={12} /> {F.label}
                      </Badge>
                    </div>
                    <p className="mt-2 text-[13px] text-muted">{i.fitNote}</p>
                    <div className="mt-2.5 flex flex-wrap gap-1.5 text-[12px]">
                      {i.lessons.map((l) => {
                        const meta = LESSON_BY_ID[l];
                        const done = progress[l]?.status === "completed";
                        const label = `${done ? "✓ " : ""}課程：${meta?.title ?? l}`;
                        return has("/learn") ? (
                          <Link key={l} href={`/learn/${l}`} className={cn("rounded border px-2 py-0.5 hover:border-accent", done ? "border-ok text-ok" : "border-border")}>{label}</Link>
                        ) : (
                          <span key={l} className="rounded border border-border px-2 py-0.5 text-faint">{label}</span>
                        );
                      })}
                      {i.english.slice(0, 4).map((e) =>
                        has("/english") ? (
                          <Link key={e} href={`/english?cat=${e}`} className="rounded border border-border px-2 py-0.5 hover:border-accent">英文：{ENGLISH_CAT[e]}</Link>
                        ) : (
                          <span key={e} className="rounded border border-border px-2 py-0.5 text-faint">英文：{ENGLISH_CAT[e]}</span>
                        ),
                      )}
                      {i.mock.map((m) =>
                        has("/mock") ? (
                          <Link key={m} href={`/mock?mode=${m}`} className="rounded border border-border px-2 py-0.5 hover:border-accent">模擬：{MOCK_LABEL[m]}</Link>
                        ) : (
                          <span key={m} className="rounded border border-border px-2 py-0.5 text-faint">模擬：{MOCK_LABEL[m]}</span>
                        ),
                      )}
                      {i.labs.map((l) =>
                        has("/labs") ? (
                          <Link key={l} href={`/labs/${l}`} className="rounded border border-border px-2 py-0.5 hover:border-accent">Lab：{LAB_LABEL[l]}</Link>
                        ) : (
                          <span key={l} className="rounded border border-border px-2 py-0.5 text-faint">Lab：{LAB_LABEL[l]}</span>
                        ),
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>
        );
      })}

      {!fitFilter && (
        <>
          <section className="mb-6">
            <h2 className="mb-2.5 text-[13px] font-semibold uppercase tracking-wider text-faint">延伸補強（JD 未明確要求）</h2>
            <Card>
              <CardBody className="pt-4">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-border text-left text-faint">
                      <th className="py-1.5 pr-3 font-medium">主題</th>
                      <th className="py-1.5 pr-3 font-medium">為什麼仍值得學</th>
                      <th className="py-1.5 font-medium">課程</th>
                    </tr>
                  </thead>
                  <tbody>
                    {EXTENSION_TOPICS.map((t) => (
                      <tr key={t.topic} className="border-b border-border last:border-0 align-top">
                        <td className="py-2 pr-3 font-medium whitespace-nowrap">
                          <Badge tone="accent" className="mr-1.5">延伸補強</Badge>
                          {t.topic}
                        </td>
                        <td className="py-2 pr-3 text-muted">{t.why}</td>
                        <td className="py-2 text-muted">{t.lessons.map((l) => LESSON_BY_ID[l]?.title).join("、")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardBody>
            </Card>
          </section>

          <section>
            <h2 className="mb-2.5 text-[13px] font-semibold uppercase tracking-wider text-faint">HR 面談參考（獵頭提供，非 JD 內容）</h2>
            <Card>
              <CardBody className="space-y-1.5 pt-4 text-[13.5px]">
                <div>年度總薪酬預算：<strong>最高約 TWD 4,000,000</strong>（預算上限，不是保證薪資）</div>
                <div>結構：Base / Bonus = 70 / 30（以上限推算約為 Base 2.8M + Bonus 1.2M，實際依 offer）</div>
                <div>Bonus：每季發放，通過 6 個月試用期後開始</div>
                <div>遠端工作：尚未確認 → 建議在面談中詢問</div>
                <Callout tone="warn" className="mt-3">
                  注意：前 6 個月沒有 Bonus，第一年實領可能明顯低於「總薪酬」數字；且 Bonus 與區域營收目標連動的程度需要確認。這些都是 HR 面談時合理且專業的問題。
                </Callout>
              </CardBody>
            </Card>
          </section>
        </>
      )}
    </>
  );
}

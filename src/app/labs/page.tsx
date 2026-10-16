import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Badge, Card, CardBody, PageHeader } from "@/components/ui";
import { LABS } from "@/content/labs";
import { SKILL_LABEL } from "@/content/skills";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "互動實驗室" };

export default async function LabsPage() {
  const acts = await prisma.activity.findMany({ where: { type: "lab" }, select: { refId: true, score: true }, orderBy: { createdAt: "asc" } });
  const best: Record<string, number> = {};
  for (const a of acts) best[a.refId] = Math.max(best[a.refId] ?? 0, a.score ?? 0);
  return (
    <>
      <PageHeader
        title="Technical Labs"
        subtitle="動手觀察編譯器、linker、記憶體、RTOS 與 fault 的真實行為。編譯相關資料是離線用真實 arm-none-eabi-gcc 產生後記錄的，網站本身不執行編譯器；模擬器會清楚標示簡化之處。"
      />
      <div className="grid gap-4 md:grid-cols-2">
        {LABS.map((l) => (
          <Link key={l.id} href={`/labs/${l.id}`} className="group">
            <Card className="h-full transition-colors group-hover:border-accent">
              <CardBody className="flex h-full flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-[16px] font-semibold">{l.title}</div>
                    <div className="text-[12.5px] text-muted">{l.en}</div>
                  </div>
                  {l.id in best && (
                    <Badge tone={best[l.id] >= 80 ? "ok" : "warn"}>
                      <CheckCircle2 size={12} />最佳 {best[l.id]}
                    </Badge>
                  )}
                </div>
                <p className="flex-1 text-[13.5px] text-muted">{l.desc}</p>
                <div className="flex items-center gap-2 text-[12px] text-faint">
                  <Badge tone="neutral">{SKILL_LABEL[l.skill]}</Badge>
                  <span>約 {l.minutes} 分鐘</span>
                  <ArrowRight size={14} className="ml-auto text-accent opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}

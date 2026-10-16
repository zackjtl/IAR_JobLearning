import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Info } from "lucide-react";
import { Callout, Card, CardBody, CardHeader, PageHeader } from "@/components/ui";
import { LAB_BY_ID, type LabId } from "@/content/labs";
import { LESSON_BY_ID } from "@/content/catalog";
import { LabCheckpoint } from "@/components/labs/checkpoint";
import { OptimizationLab } from "@/components/labs/optimization-lab";
import { MemoryLab } from "@/components/labs/memory-lab";
import { SectionsLab } from "@/components/labs/sections-lab";
import { StackHeapLab } from "@/components/labs/stack-heap-lab";
import { RtosLab } from "@/components/labs/rtos-lab";
import { AsmLab } from "@/components/labs/asm-lab";
import { DebugLab } from "@/components/labs/debug-lab";
import { NotesPanel } from "@/components/learn/notes-panel";
import { BookmarkButton } from "@/components/learn/bookmark-button";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/labs/[lab]">): Promise<Metadata> {
  const { lab } = await params;
  return { title: LAB_BY_ID[lab]?.title ?? "Lab" };
}

const VIEW: Record<LabId, () => React.ReactNode> = {
  optimization: () => <OptimizationLab />,
  "memory-layout": () => <MemoryLab />,
  sections: () => <SectionsLab />,
  "stack-heap": () => <StackHeapLab />,
  "rtos-sim": () => <RtosLab />,
  "asm-walkthrough": () => <AsmLab />,
  "debug-cases": () => <DebugLab />,
};

export default async function LabPage({ params }: PageProps<"/labs/[lab]">) {
  const { lab } = await params;
  const meta = LAB_BY_ID[lab];
  if (!meta) notFound();
  const bm = await prisma.bookmark.findUnique({ where: { refType_refId: { refType: "lab", refId: meta.id } } });
  return (
    <>
      <div className="mb-2 text-[13px] text-muted">
        <Link href="/labs" className="hover:text-fg">互動實驗室</Link> / {meta.en}
      </div>
      <PageHeader title={meta.title} subtitle={meta.desc} actions={<BookmarkButton refType="lab" refId={meta.id} title={`Lab：${meta.title}`} href={`/labs/${meta.id}`} initial={!!bm} />} />
      <Callout tone="neutral" className="mb-5" title={<span className="inline-flex items-center gap-1.5"><Info size={15} />資料來源</span>}>
        {meta.dataNote}
      </Callout>
      <div className="space-y-6">
        {VIEW[meta.id]()}
        <div className="grid gap-4 lg:grid-cols-2">
          <LabCheckpoint labId={meta.id} title={meta.title} skill={meta.skill} minutes={meta.minutes} questions={meta.checkpoint} />
          <div className="space-y-4">
            <Card>
              <CardHeader title="相關課程" />
              <CardBody>
                <ul className="space-y-1.5 text-[13.5px]">
                  {meta.lessons.filter((id) => LESSON_BY_ID[id]).map((id) => (
                    <li key={id}><Link className="text-accent hover:underline" href={`/learn/${id}`}>{LESSON_BY_ID[id].title}</Link></li>
                  ))}
                </ul>
              </CardBody>
            </Card>
            <Card>
              <CardHeader title="我的筆記" />
              <CardBody>
                <NotesPanel refType="lab" refId={meta.id} placeholder="記下觀察到的現象、可以拿來回答面試題的例子…" />
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}

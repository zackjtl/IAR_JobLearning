import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight, Clock, MessageSquareQuote, Mic2 } from "lucide-react";
import { Badge, Callout, Card } from "@/components/ui";
import { Md } from "@/components/md";
import { Mermaid } from "@/components/mermaid";
import { CodeBlock } from "@/components/learn/code-block";
import { QuizBlock } from "@/components/learn/quiz-block";
import { NotesPanel } from "@/components/learn/notes-panel";
import { BookmarkButton } from "@/components/learn/bookmark-button";
import { CompleteButton, VisitTracker } from "@/components/learn/lesson-actions";
import { LESSONS, LESSON_BY_ID, TRACKS } from "@/content/catalog";
import { LESSON_CONTENT } from "@/content/lessons";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: PageProps<"/learn/[lesson]">): Promise<Metadata> {
  const { lesson } = await props.params;
  return { title: LESSON_BY_ID[lesson]?.title ?? "課程" };
}

const SECTIONS = [
  ["objectives", "學習目標"],
  ["concept", "概念說明"],
  ["terms", "英文專有名詞"],
  ["diagram", "架構 / 流程圖"],
  ["code", "程式範例"],
  ["analysis", "原理分析"],
  ["cases", "工程案例"],
  ["customer", "客戶可能的問題"],
  ["interview", "常見面試問題"],
  ["quiz", "Quiz"],
  ["reading", "延伸閱讀"],
  ["notes", "我的筆記"],
] as const;

function Section({ id, n, title, children }: { id: string; n: number; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-6">
      <h2 className="mb-3 flex items-baseline gap-2 text-lg font-semibold">
        <span className="font-mono text-[13px] text-faint">{String(n).padStart(2, "0")}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

export default async function LessonPage(props: PageProps<"/learn/[lesson]">) {
  const { lesson: id } = await props.params;
  const meta = LESSON_BY_ID[id];
  const c = LESSON_CONTENT[id];
  if (!meta || !c) notFound();
  const track = TRACKS.find((t) => t.id === meta.track)!;
  const [progress, bm] = await Promise.all([
    prisma.lessonProgress.findUnique({ where: { lessonId: id } }),
    prisma.bookmark.findUnique({ where: { refType_refId: { refType: "lesson", refId: id } } }),
  ]);
  const available = LESSONS.filter((l) => LESSON_CONTENT[l.id]);
  const idx = available.findIndex((l) => l.id === id);
  const prev = available[idx - 1];
  const next = available[idx + 1];

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_200px]">
      <VisitTracker lessonId={id} />
      <article className="min-w-0 space-y-10">
        <header>
          <Link href="/learn" className="text-[13px] text-muted hover:text-accent">
            {track.title}
          </Link>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{meta.title}</h1>
          <div className="mt-1 text-[14px] text-muted">{meta.en}</div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge>{meta.level}</Badge>
            <Badge>
              <Clock size={11} /> 約 {meta.minutes} 分鐘
            </Badge>
            {meta.jdExplicit ? <Badge tone="accent">JD 相關</Badge> : <Badge tone="warn">延伸補強</Badge>}
            {progress?.bestScore ? <Badge tone={progress.bestScore >= 80 ? "ok" : "warn"}>Quiz 最佳 {progress.bestScore}</Badge> : null}
            <span className="flex-1" />
            <BookmarkButton refType="lesson" refId={id} title={meta.title} href={`/learn/${id}`} initial={!!bm} />
            <CompleteButton lessonId={id} completed={progress?.status === "completed"} />
          </div>
          {c.toVerify && c.toVerify.length > 0 && (
            <Callout tone="warn" className="mt-4" title="待查證">
              以下細節依版本/架構而異，請以 IAR 或相關官方文件確認後再對客戶引用：
              <ul className="mt-1 list-disc pl-5">
                {c.toVerify.map((v) => (
                  <li key={v}>{v}</li>
                ))}
              </ul>
            </Callout>
          )}
        </header>

        <Section id="objectives" n={1} title="學習目標 Learning Objectives">
          <ul className="space-y-1.5">
            {c.objectives.map((o) => (
              <li key={o} className="flex gap-2 text-[14.5px]">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                {o}
              </li>
            ))}
          </ul>
        </Section>

        <Section id="concept" n={2} title="概念說明">
          <Md text={c.concept} />
        </Section>

        <Section id="terms" n={3} title="英文專有名詞">
          <Card className="overflow-hidden">
            <table className="w-full text-[13.5px]">
              <thead className="bg-surface-2 text-left text-[12px] text-faint">
                <tr>
                  <th className="px-4 py-2 font-medium">English</th>
                  <th className="px-4 py-2 font-medium">中文</th>
                  <th className="px-4 py-2 font-medium">說明</th>
                </tr>
              </thead>
              <tbody>
                {c.terms.map((t) => (
                  <tr key={t.en} className="border-t border-border">
                    <td className="px-4 py-2 font-medium">{t.en}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{t.zh}</td>
                    <td className="px-4 py-2 text-muted">{t.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </Section>

        <Section id="diagram" n={4} title={`架構 / 流程圖：${c.diagram.title}`}>
          <Card className="p-4">
            <Mermaid chart={c.diagram.mermaid} />
            {c.diagram.caption && <p className="mt-2 text-center text-[12.5px] text-muted">{c.diagram.caption}</p>}
          </Card>
        </Section>

        <Section id="code" n={5} title="程式範例">
          <div className="space-y-4">
            {c.code.map((s) => (
              <div key={s.title}>
                <CodeBlock code={s.code} lang={s.lang} title={s.title} />
                {s.note && <p className="mt-1.5 text-[13px] text-muted">{s.note}</p>}
              </div>
            ))}
          </div>
        </Section>

        <Section id="analysis" n={6} title="原理分析">
          <Md text={c.analysis} />
        </Section>

        <Section id="cases" n={7} title="實際工程案例">
          <div className="space-y-3">
            {c.cases.map((cs) => (
              <Card key={cs.title} className="p-4">
                <div className="mb-1 font-medium">{cs.title}</div>
                <p className="text-[14px] leading-relaxed text-muted">{cs.body}</p>
              </Card>
            ))}
          </div>
        </Section>

        <Section id="customer" n={8} title="IAR FAE 可能遇到的客戶問題">
          <div className="space-y-2.5">
            {c.customerQs.map((q) => (
              <details key={q.q} className="group rounded-lg border border-border bg-surface px-4 py-3">
                <summary className="cursor-pointer list-none">
                  <div className="flex gap-2">
                    <MessageSquareQuote size={16} className="mt-0.5 shrink-0 text-accent" />
                    <div>
                      <div className="text-[14px] font-medium">“{q.q}”</div>
                      <div className="text-[13px] text-muted">{q.zh}</div>
                    </div>
                  </div>
                </summary>
                <div className="mt-2 border-t border-border pt-2 text-[13.5px] leading-relaxed">
                  <span className="mr-1 font-medium text-accent">建議回應：</span>
                  {q.answer}
                </div>
              </details>
            ))}
          </div>
        </Section>

        <Section id="interview" n={9} title="常見面試問題">
          <div className="space-y-2.5">
            {c.interviewQs.map((q) => (
              <Card key={q.q} className="p-4">
                <div className="flex gap-2">
                  <Mic2 size={16} className="mt-0.5 shrink-0 text-accent" />
                  <div>
                    <div className="text-[14px] font-medium">{q.q}</div>
                    <div className="text-[13px] text-muted">{q.zh}</div>
                    <div className="mt-2 text-[12px] font-medium text-faint">回答要點</div>
                    <ul className="mt-0.5 list-disc pl-5 text-[13.5px]">
                      {q.points.map((p) => (
                        <li key={p}>{p}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Section>

        <Section id="quiz" n={10} title={`Quiz（${c.quiz.length} 題）`}>
          <Card className="p-5">
            <QuizBlock lessonId={id} questions={c.quiz} bestScore={progress?.bestScore ?? 0} />
          </Card>
        </Section>

        <Section id="reading" n={11} title="延伸閱讀">
          <ul className="space-y-2">
            {c.reading.map((r) => (
              <li key={r.title} className="text-[14px]">
                {r.url ? (
                  <a href={r.url} target="_blank" rel="noreferrer" className="font-medium text-accent hover:underline">
                    {r.title}
                  </a>
                ) : (
                  <span className="font-medium">{r.title}</span>
                )}
                <span className="text-muted"> — {r.note}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section id="notes" n={12} title="我的筆記">
          <NotesPanel refType="lesson" refId={id} />
        </Section>

        <nav className="flex justify-between border-t border-border pt-5 text-[14px]">
          {prev ? (
            <Link href={`/learn/${prev.id}`} className="flex items-center gap-1 text-muted hover:text-accent">
              <ChevronLeft size={16} /> {prev.title}
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link href={`/learn/${next.id}`} className="flex items-center gap-1 text-muted hover:text-accent">
              {next.title} <ChevronRight size={16} />
            </Link>
          )}
        </nav>
      </article>

      <aside className="hidden xl:block">
        <div className="sticky top-8 space-y-0.5 text-[13px]">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-faint">本課內容</div>
          {SECTIONS.map(([sid, label], i) => (
            <a key={sid} href={`#${sid}`} className="block rounded px-2 py-1 text-muted hover:bg-surface-2 hover:text-fg">
              <span className="mr-1.5 font-mono text-[11px] text-faint">{String(i + 1).padStart(2, "0")}</span>
              {label}
            </a>
          ))}
        </div>
      </aside>
    </div>
  );
}

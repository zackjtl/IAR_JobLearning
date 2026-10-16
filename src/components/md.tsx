import * as React from "react";

// Minimal markdown: paragraphs, "- " lists, "1. " lists, "#### " headings, **bold**, `code`, ```code blocks```.
function inline(text: string, keyBase: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const t = m[0];
    if (t.startsWith("**")) out.push(<strong key={`${keyBase}-${i++}`}>{t.slice(2, -2)}</strong>);
    else out.push(<code key={`${keyBase}-${i++}`}>{t.slice(1, -1)}</code>);
    last = m.index + t.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function Md({ text, className }: { text: string; className?: string }) {
  const lines = text.replace(/\r/g, "").trim().split("\n");
  const blocks: React.ReactNode[] = [];
  let i = 0;
  let k = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith("```")) {
      const buf: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) buf.push(lines[i++]);
      i++;
      blocks.push(<pre key={k++} className="code-block my-2">{buf.join("\n")}</pre>);
      continue;
    }
    if (line.trim().startsWith("|")) {
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        const cells = lines[i].trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
        if (!cells.every((c) => /^:?-{2,}:?$/.test(c))) rows.push(cells);
        i++;
      }
      const [head, ...body] = rows;
      blocks.push(
        <div key={k++} className="my-3 overflow-x-auto rounded-md border border-border">
          <table className="w-full text-[13.5px]">
            <thead className="bg-surface-2 text-left">
              <tr>{head.map((c, j) => <th key={j} className="px-3 py-1.5 font-medium">{inline(c, `th${k}-${j}`)}</th>)}</tr>
            </thead>
            <tbody>
              {body.map((r, ri) => (
                <tr key={ri} className="border-t border-border">
                  {r.map((c, j) => <td key={j} className="px-3 py-1.5">{inline(c, `td${k}-${ri}-${j}`)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }
    if (/^\s*-\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*-\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*-\s+/, ""));
      blocks.push(<ul key={k++}>{items.map((t, j) => <li key={j}>{inline(t, `${k}-${j}`)}</li>)}</ul>);
      continue;
    }
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*\d+\.\s+/, ""));
      blocks.push(<ol key={k++}>{items.map((t, j) => <li key={j}>{inline(t, `${k}-${j}`)}</li>)}</ol>);
      continue;
    }
    if (line.startsWith("#### ")) {
      blocks.push(<h4 key={k++}>{inline(line.slice(5), `h${k}`)}</h4>);
      i++;
      continue;
    }
    if (line.trim() === "") {
      i++;
      continue;
    }
    const para: string[] = [];
    while (i < lines.length && lines[i].trim() !== "" && !/^\s*(-|\d+\.)\s+/.test(lines[i]) && !lines[i].startsWith("```") && !lines[i].startsWith("#### ") && !lines[i].trim().startsWith("|")) para.push(lines[i++]);
    blocks.push(<p key={k++}>{inline(para.join(" "), `p${k}`)}</p>);
  }
  return <div className={className ?? "prose-lesson"}>{blocks}</div>;
}

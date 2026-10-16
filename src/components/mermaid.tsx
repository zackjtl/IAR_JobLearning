"use client";

import { useEffect, useId, useRef, useState } from "react";

export function Mermaid({ chart }: { chart: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const [err, setErr] = useState("");
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const mermaid = (await import("mermaid")).default;
      const dark = document.documentElement.classList.contains("dark");
      mermaid.initialize({
        startOnLoad: false,
        theme: dark ? "dark" : "neutral",
        securityLevel: "strict",
        fontFamily: '"Segoe UI","Noto Sans TC","Microsoft JhengHei",sans-serif',
        flowchart: { htmlLabels: true, curve: "basis" },
      });
      try {
        const { svg } = await mermaid.render(`m${id}`, chart);
        if (!cancelled && ref.current) ref.current.innerHTML = svg;
      } catch (e) {
        if (!cancelled) setErr(String(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [chart, id]);
  return (
    <div>
      <div ref={ref} className="mermaid-wrap flex justify-center overflow-x-auto py-2" />
      {err && <pre className="code-block text-bad">{chart}</pre>}
    </div>
  );
}

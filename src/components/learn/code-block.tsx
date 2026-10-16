"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CodeBlock({ code, lang, title }: { code: string; lang: string; title?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="flex items-center justify-between border-b border-border bg-surface-2 px-3 py-1.5">
        <span className="text-[12.5px] font-medium">{title}</span>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] uppercase text-faint">{lang}</span>
          <button
            aria-label="複製程式碼"
            className="text-faint hover:text-fg cursor-pointer"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(code);
                setCopied(true);
                setTimeout(() => setCopied(false), 1200);
              } catch {}
            }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        </div>
      </div>
      <pre className="code-block !rounded-none !border-0">{code}</pre>
    </div>
  );
}

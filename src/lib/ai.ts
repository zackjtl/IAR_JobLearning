import "server-only";

export type AiProvider = "anthropic" | "openai";

export function aiProvider(): AiProvider | null {
  const pref = process.env.AI_PROVIDER?.toLowerCase();
  if (pref === "openai" && process.env.OPENAI_API_KEY) return "openai";
  if (pref === "anthropic" && process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (process.env.OPENAI_API_KEY) return "openai";
  return null;
}

export function aiModel(p: AiProvider) {
  return p === "anthropic" ? process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5" : process.env.OPENAI_MODEL || "gpt-4.1-mini";
}

export type ChatMsg = { role: "user" | "assistant"; content: string };

/** Single chat completion. Returns plain text. Throws on API errors. */
export async function aiChat(system: string, messages: ChatMsg[], opts: { maxTokens?: number; temperature?: number } = {}): Promise<string> {
  const p = aiProvider();
  if (!p) throw new Error("AI provider not configured");
  const maxTokens = opts.maxTokens ?? 1200;
  if (p === "anthropic") {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({ model: aiModel(p), max_tokens: maxTokens, temperature: opts.temperature ?? 0.5, system, messages }),
    });
    if (!r.ok) throw new Error(`Anthropic API ${r.status}: ${(await r.text()).slice(0, 300)}`);
    const j = (await r.json()) as { content: { type: string; text?: string }[] };
    return j.content.filter((c) => c.type === "text").map((c) => c.text).join("");
  }
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({ model: aiModel(p), max_tokens: maxTokens, temperature: opts.temperature ?? 0.5, messages: [{ role: "system", content: system }, ...messages] }),
  });
  if (!r.ok) throw new Error(`OpenAI API ${r.status}: ${(await r.text()).slice(0, 300)}`);
  const j = (await r.json()) as { choices: { message: { content: string } }[] };
  return j.choices[0]?.message.content ?? "";
}

/** Ask for JSON and parse it robustly (strips ```json fences). */
export async function aiJson<T>(system: string, messages: ChatMsg[], opts: { maxTokens?: number; temperature?: number } = {}): Promise<T> {
  const text = await aiChat(system + "\n\nRespond with a single valid JSON object only. No markdown fences, no commentary.", messages, opts);
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  return JSON.parse(cleaned.slice(start, end + 1)) as T;
}

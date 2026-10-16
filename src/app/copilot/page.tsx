import type { Metadata } from "next";
import { aiProvider } from "@/lib/ai";
import { CopilotClient } from "./copilot-client";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Interview Copilot" };

export default function Page() {
  return <CopilotClient ai={!!aiProvider()} />;
}

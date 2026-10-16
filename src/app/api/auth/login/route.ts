import { NextResponse } from "next/server";
import { SESSION_COOKIE, authEnabled, expectedToken, safeEqual } from "@/lib/auth";

export async function POST(req: Request) {
  if (!authEnabled()) return NextResponse.json({ ok: true });
  const { password } = (await req.json().catch(() => ({}))) as { password?: string };
  // small fixed delay to slow brute force
  await new Promise((r) => setTimeout(r, 600));
  if (!password || !safeEqual(password, process.env.APP_PASSWORD ?? "")) {
    return NextResponse.json({ ok: false, error: "密碼錯誤" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, await expectedToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}

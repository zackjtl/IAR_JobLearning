// Simple single-user password gate. Works in both Node and Edge runtimes (Web Crypto).
export const SESSION_COOKIE = "academy_session";

export function authEnabled() {
  return !!process.env.APP_PASSWORD;
}

async function hmacHex(key: string, msg: string) {
  const enc = new TextEncoder();
  const k = await crypto.subtle.importKey("raw", enc.encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", k, enc.encode(msg));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Session token = HMAC(secret, password). Changing APP_PASSWORD or AUTH_SECRET invalidates all sessions. */
export async function expectedToken() {
  const pw = process.env.APP_PASSWORD ?? "";
  const secret = process.env.AUTH_SECRET ?? `iar-academy:${pw}`;
  return hmacHex(secret, `session-v1:${pw}`);
}

export function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

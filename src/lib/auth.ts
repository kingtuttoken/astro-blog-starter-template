export type UserRole = "customer" | "affiliate" | "crypto" | "admin" | "owner";
export type AuthUser = {
  id: number;
  email: string;
  name: string | null;
  avatar_url: string | null;
  role: UserRole;
  affiliate_code: string | null;
};

export const SESSION_COOKIE = "bkt_session";
export const STATE_COOKIE = "bkt_oauth_state";
export const ROLE_COOKIE = "bkt_oauth_role";

export function getEnv(locals: any): CloudflareEnv {
  return locals.runtime.env as CloudflareEnv;
}

export async function sha256(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function randomToken(): string {
  return `${crypto.randomUUID()}-${crypto.randomUUID()}`;
}

export function sanitizeRole(role: string | null): UserRole {
  if (role === "affiliate") return "affiliate";
  if (role === "crypto") return "crypto";
  return "customer";
}

export function isAdminEmail(env: CloudflareEnv, email: string): boolean {
  const list = (env.ADMIN_EMAILS || "")
    .split(",")
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}

export async function createSession(env: CloudflareEnv, userId: number): Promise<{ token: string; maxAge: number }> {
  const token = randomToken();
  const tokenHash = await sha256(token);
  const maxAge = 60 * 60 * 24 * 30;
  const expiresAt = new Date(Date.now() + maxAge * 1000).toISOString();
  await env.DB.prepare("DELETE FROM sessions WHERE expires_at <= datetime('now')").run();
  await env.DB.prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)")
    .bind(tokenHash, userId, expiresAt)
    .run();
  return { token, maxAge };
}

export async function getCurrentUser(Astro: any): Promise<AuthUser | null> {
  const env = getEnv(Astro.locals);
  const token = Astro.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const tokenHash = await sha256(token);
  const row = await env.DB.prepare(`
    SELECT u.id, u.email, u.name, u.avatar_url, u.role, u.affiliate_code
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ? AND s.expires_at > datetime('now')
    LIMIT 1
  `).bind(tokenHash).first<AuthUser>();
  return row || null;
}

export async function deleteCurrentSession(Astro: any): Promise<void> {
  const env = getEnv(Astro.locals);
  const token = Astro.cookies.get(SESSION_COOKIE)?.value;
  if (token) {
    const tokenHash = await sha256(token);
    await env.DB.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(tokenHash).run();
  }
  Astro.cookies.delete(SESSION_COOKIE, { path: "/" });
}

export function affiliateCode(id: number): string {
  return `BKT-${String(id).padStart(6, "0")}`;
}

import type { APIRoute } from "astro";
import { affiliateCode, createSession, getEnv, isAdminEmail, ROLE_COOKIE, sanitizeRole, SESSION_COOKIE, STATE_COOKIE } from "../../../lib/auth";
import { sendDiscordWebhook } from "../../../lib/discord";

export const prerender = false;

type GoogleUser = { sub:string; email:string; email_verified?:boolean; name?:string; picture?:string };

export const GET: APIRoute = async ({ request, locals, cookies }) => {
  const env = getEnv(locals);
  const u = new URL(request.url);
  const code = u.searchParams.get("code");
  const state = u.searchParams.get("state");
  const expected = cookies.get(STATE_COOKIE)?.value;
  const desiredRole = sanitizeRole(cookies.get(ROLE_COOKIE)?.value || "customer");
  cookies.delete(STATE_COOKIE, { path: "/" }); cookies.delete(ROLE_COOKIE, { path: "/" });
  if (!code || !state || !expected || state !== expected) return new Response("Invalid or expired Google login state.", { status: 400 });

  const site = env.PUBLIC_SITE_URL || u.origin;
  const redirectUri = `${site.replace(/\/$/, "")}/auth/google/callback`;
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ code, client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET, redirect_uri: redirectUri, grant_type: "authorization_code" })
  });
  if (!tokenRes.ok) return new Response("Google token exchange failed.", { status: 502 });
  const token: any = await tokenRes.json();
  const infoRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", { headers: { authorization: `Bearer ${token.access_token}` } });
  if (!infoRes.ok) return new Response("Google profile lookup failed.", { status: 502 });
  const profile = await infoRes.json() as GoogleUser;
  if (!profile.email || profile.email_verified === false) return new Response("A verified Google email is required.", { status: 403 });

  const existing: any = await env.DB.prepare("SELECT id, role, affiliate_code FROM users WHERE google_sub = ? OR email = ? LIMIT 1").bind(profile.sub, profile.email.toLowerCase()).first();
  let userId: number;
  let role: any;
  let created = false;
  if (existing) {
    userId = existing.id;
    role = isAdminEmail(env, profile.email) ? "owner" : existing.role;
    if (role === "customer" && desiredRole === "affiliate") role = "affiliate";
    await env.DB.prepare("UPDATE users SET google_sub=?, email=?, name=?, avatar_url=?, role=?, updated_at=CURRENT_TIMESTAMP, last_login_at=CURRENT_TIMESTAMP WHERE id=?")
      .bind(profile.sub, profile.email.toLowerCase(), profile.name || null, profile.picture || null, role, userId).run();
  } else {
    role = isAdminEmail(env, profile.email) ? "owner" : desiredRole;
    const result: any = await env.DB.prepare("INSERT INTO users (google_sub,email,name,avatar_url,role,last_login_at) VALUES (?,?,?,?,?,CURRENT_TIMESTAMP)")
      .bind(profile.sub, profile.email.toLowerCase(), profile.name || null, profile.picture || null, role).run();
    userId = Number(result.meta.last_row_id);
    const codeValue = role === "affiliate" ? affiliateCode(userId) : null;
    if (codeValue) await env.DB.prepare("UPDATE users SET affiliate_code=? WHERE id=?").bind(codeValue,userId).run();
    created = true;
  }

  await env.DB.prepare("INSERT INTO audit_events (user_id,event_type,detail) VALUES (?,?,?)")
    .bind(userId, created ? "user.created" : "user.login", JSON.stringify({ role })).run();

  if (created) {
    await sendDiscordWebhook(env, role === "affiliate" ? "👑 New Affiliate Joined" : "👤 New Customer Joined", "A new BoyKingTut.com account was created.", [
      { name: "Role", value: String(role), inline: true },
      { name: "User ID", value: `BKT-${userId}`, inline: true },
      { name: "Email", value: profile.email, inline: false }
    ]);
  }

  const session = await createSession(env, userId);
  cookies.set(SESSION_COOKIE, session.token, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: session.maxAge });
  return Response.redirect(`${site.replace(/\/$/, "")}/dashboard`, 302);
};

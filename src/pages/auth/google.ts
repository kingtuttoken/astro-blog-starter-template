import type { APIRoute } from "astro";
import { getEnv, randomToken, ROLE_COOKIE, sanitizeRole, STATE_COOKIE } from "../../lib/auth";

export const prerender = false;

export const GET: APIRoute = async ({ request, locals, cookies }) => {
  const env = getEnv(locals);
  if (!env.GOOGLE_CLIENT_ID) return new Response("GOOGLE_CLIENT_ID is not configured", { status: 500 });
  const url = new URL(request.url);
  const role = sanitizeRole(url.searchParams.get("role"));
  const state = randomToken();
  const site = env.PUBLIC_SITE_URL || url.origin;
  const redirectUri = `${site.replace(/\/$/, "")}/auth/google/callback`;
  cookies.set(STATE_COOKIE, state, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 600 });
  cookies.set(ROLE_COOKIE, role, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 600 });
  const google = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  google.searchParams.set("client_id", env.GOOGLE_CLIENT_ID);
  google.searchParams.set("redirect_uri", redirectUri);
  google.searchParams.set("response_type", "code");
  google.searchParams.set("scope", "openid email profile");
  google.searchParams.set("state", state);
  google.searchParams.set("prompt", "select_account");
  return Response.redirect(google.toString(), 302);
};

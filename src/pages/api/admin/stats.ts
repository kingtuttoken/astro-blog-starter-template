import type { APIRoute } from "astro";
import { getCurrentUser, getEnv } from "../../../lib/auth";
export const prerender = false;
export const GET: APIRoute = async (ctx) => {
  const user = await getCurrentUser(ctx); if (!user || !["admin","owner"].includes(user.role)) return new Response("Forbidden", {status:403});
  const env=getEnv(ctx.locals);
  const total:any=await env.DB.prepare("SELECT COUNT(*) count FROM users").first();
  const affiliates:any=await env.DB.prepare("SELECT COUNT(*) count FROM users WHERE role='affiliate'").first();
  const today:any=await env.DB.prepare("SELECT COUNT(*) count FROM users WHERE date(created_at)=date('now')").first();
  return new Response(JSON.stringify({users:total?.count||0,affiliates:affiliates?.count||0,newToday:today?.count||0}),{headers:{"content-type":"application/json"}});
};

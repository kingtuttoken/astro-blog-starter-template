import type { APIRoute } from "astro";
import { deleteCurrentSession } from "../../lib/auth";
export const prerender = false;
export const GET: APIRoute = async (ctx) => { await deleteCurrentSession(ctx); return Response.redirect(new URL("/", ctx.request.url), 302); };

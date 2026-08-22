/// <reference types="astro/client" />

type UserRole = "customer" | "affiliate" | "crypto" | "admin" | "owner";

interface CloudflareEnv {
  DB: D1Database;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  SESSION_SECRET: string;
  ADMIN_EMAILS?: string;
  DISCORD_SIGNUP_WEBHOOK?: string;
  DISCORD_BOT_TOKEN?: string;
  DISCORD_GUILD_ID?: string;
  PUBLIC_SITE_URL?: string;
  DISCORD_INVITE_URL?: string;
  SOLANA_RECEIVING_WALLET?: string;
  SOLANA_RPC_URL?: string;
}

declare namespace App {
  interface Locals {
    runtime: { env: CloudflareEnv };
  }
}

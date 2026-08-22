export async function sendDiscordWebhook(env: CloudflareEnv, title: string, description: string, fields: {name:string; value:string; inline?:boolean}[] = []) {
  const url = env.DISCORD_SIGNUP_WEBHOOK;
  if (!url) return { ok: false, skipped: true };
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        username: "BoyKingTut.com",
        embeds: [{
          title,
          description,
          color: 0xE7B94F,
          fields,
          timestamp: new Date().toISOString(),
          footer: { text: "BoyKingTut Blockchain System" }
        }]
      })
    });
    return { ok: res.ok, skipped: false };
  } catch {
    return { ok: false, skipped: false };
  }
}

/**
 * Server-side helper for Cloudflare/Astro routes.
 * Never expose the webhook URL to browser code.
 *
 * Usage later:
 * await sendDiscordEvent(Astro.locals.runtime.env.DISCORD_SIGNUP_WEBHOOK, {...})
 */
export async function sendDiscordEvent(
  webhookUrl: string,
  payload: Record<string, unknown>,
) {
  if (!webhookUrl) throw new Error("Missing DISCORD_SIGNUP_WEBHOOK");

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Discord webhook failed: ${response.status}`);
  }
}

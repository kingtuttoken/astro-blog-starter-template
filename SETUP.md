# BoyKingTut.com — Cloudflare Setup

This package is a full Astro 7 + Cloudflare Workers project with responsive homepage images, Google Login, Cloudflare D1 user/session storage, Affiliate/Customer roles, Owner/Admin access and private Discord signup notifications.

## 1. Upload the project
Replace the files in your GitHub `astro-blog-starter-template` repository with this project. Keep a backup of your current repo first.

## 2. Install dependencies
Cloudflare's build should run:

```bash
npm install
npm run build
```

Deploy command:

```bash
npx wrangler deploy
```

## 3. Create the D1 database
Cloudflare Dashboard → Storage & Databases → D1 SQL Database → Create.
Name it:

`boykingtut-db`

Copy its Database ID and replace this in `wrangler.jsonc`:

`REPLACE_WITH_YOUR_D1_DATABASE_ID`

Then apply the included migration:

```bash
npx wrangler d1 migrations apply boykingtut-db --remote
```

Cloudflare D1 uses the `DB` binding in this project.

## 4. Google Login
Open Google Cloud Console → APIs & Services → Credentials.
Create an **OAuth 2.0 Client ID** for a Web application.

Authorized JavaScript origin:

`https://boykingtut.com`

Authorized redirect URI:

`https://boykingtut.com/auth/google/callback`

For testing on your workers.dev URL, add that domain and its `/auth/google/callback` redirect as well.

## 5. Cloudflare Secrets
Cloudflare → Workers & Pages → `astro-blog-starter-template` → Settings → Variables and Secrets.
Add these as **Secrets**:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `SESSION_SECRET` (long random value)
- `ADMIN_EMAILS` (comma-separated Google email addresses allowed to become Owner)
- `DISCORD_SIGNUP_WEBHOOK` (optional, but enables new customer/affiliate Discord notices)
- `SOLANA_RPC_URL` (for the later live payment verifier)

Public vars already in `wrangler.jsonc`:

- `PUBLIC_SITE_URL=https://boykingtut.com`
- `DISCORD_INVITE_URL=https://discord.gg/HA73BUfJ67`
- `SOLANA_RECEIVING_WALLET=4j4Rz7WHPHLdWm36db7d3LWexd3XtdPC4BxBiQ3jYmxS`

**Important:** regenerate the Discord webhook that was previously exposed in chat. Put the replacement only in Cloudflare Secrets.

## 6. Owner/Admin activation
Put the Google account email you want as owner into the `ADMIN_EMAILS` secret. Then visit:

`https://boykingtut.com/auth/google?role=customer`

Sign in with that Google account. The callback detects the email in `ADMIN_EMAILS` and stores the account with role `owner` in D1. The dashboard will show an Owner Admin button.

Owner admin URL:

`https://boykingtut.com/admin`

## 7. Affiliate signup
Affiliate link:

`https://boykingtut.com/auth/google?role=affiliate`

A new affiliate is saved in D1 and receives a generated code such as `BKT-000123`. If the Discord webhook secret is configured, a new-affiliate message is sent automatically.

## 8. Customer signup
Customer link:

`https://boykingtut.com/auth/google?role=customer`

New customers are saved to D1 and can also trigger the Discord webhook.

## 9. Current security behavior
- OAuth client secret never appears in browser code.
- Sessions are random tokens; only SHA-256 hashes are stored in D1.
- Session cookies are HttpOnly, Secure and SameSite=Lax.
- OAuth uses a short-lived state cookie for CSRF protection.
- Admin access is checked server-side on every admin request.
- Discord webhook stays server-side.

## 10. Solana checkout
The site already displays your public receiving address configuration and the product/pricing structure, but **live CoinGecko quoting and finalized on-chain payment verification are not activated in this package yet**. They should be wired only after the login/database deploy is confirmed working, so a payment can be attached to a real user/order record.

No seed phrase or private wallet key should ever be put in this project.

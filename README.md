# Freedom Wheels

Tools, resources, and community for South African entrepreneurs.

A subscription platform that curates the software, books, and equipment freelancers and side-hustlers actually need — with a revenue share paid back to active members from external affiliate commissions.

## ⚠️ Business model — please read

Freedom Wheels is a **subscription SaaS**, not an investment product.

- Members pay a monthly subscription (R99 / R299 / R499) for access to curated buying guides, tool reviews, software discounts, and community.
- The platform earns **external affiliate commissions** from partners (Amazon Associates, Hostinger, Namecheap, Canva, ConvertKit) when members buy through our links.
- Each month, a portion of those commissions is distributed to active members proportional to tier.

It is **not** an investment scheme, **not** a Ponzi, **not** an MLM. Members do not earn commissions by recruiting other members. Revenue share comes exclusively from external affiliate revenue paid by third parties.

See [`/legal`](src/lib/legal-content.ts) for full Terms, Privacy, and Refund policies.

## Tech stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 4 + shadcn/ui
- **Database:** Prisma ORM (SQLite for dev, swap to PostgreSQL for prod)
- **Payments:** PayFast (South African payment processor) with subscription tokenisation
- **Email:** Resend (with dev-mode console fallback)
- **Auth:** Magic-link (no passwords) via signed httpOnly cookies

## Quick start

```bash
# Install dependencies
bun install

# Set up env vars (see below)
cp .env.example .env.local
# edit .env.local with your values

# Push database schema
bun run db:push

# Seed affiliate partners
curl http://localhost:3000/api/seed

# Start dev server
bun run dev
```

## Environment variables

Required for the app to function:

```bash
# Database
DATABASE_URL=file:./db/custom.db

# PayFast (live credentials from dashboard)
PAYFAST_MERCHANT_ID=your_live_merchant_id
PAYFAST_MERCHANT_KEY=your_live_merchant_key
PAYFAST_PASSPHRASE=your_dashboard_passphrase
PAYFAST_SANDBOX=false
NEXT_PUBLIC_BASE_URL=https://www.freedomwheels.online

# Admin API (generate with: openssl rand -hex 32)
ADMIN_API_KEY=your_generated_admin_key

# Email (optional — falls back to console.log in dev)
EMAIL_ENABLED=false
RESEND_API_KEY=re_your_resend_key
EMAIL_FROM=Freedom Wheels <noreply@freedomwheels.online>

# PayFast API (for subscription cancellation — get from PayFast dashboard)
PAYFAST_API_KEY=your_payfast_api_key
PAYFAST_API_PASSPHRASE=your_payfast_api_passphrase
```

## Routes

| Route | Description |
|---|---|
| `/` | Landing page (hero, pricing, FAQ, founder, footer with all links) |
| `/guides` | Public buying guides listing (grouped by category) |
| `/guides/[slug]` | Individual guide page (member-only guides lock for non-members) |
| `/member` | Member login + dashboard (magic-link auth, distributions, payouts, affiliate links, cancel subscription) |
| `/transparency` | Public monthly transparency reports (revenue, distributions, partner breakdown) |
| `/admin` | Founder operations dashboard (run distributions, publish reports, record commissions) |
| `/admin/guides` | Founder guide management (create, edit, delete, publish) |

## API routes

### Public
- `GET /api/affiliates` — list of affiliate partners
- `GET /api/guides` — list of published guides
- `GET /api/guides/[slug]` — single guide (locks member-only content for non-members)
- `GET /api/seed` — dev-only seeder for affiliate partners

### Auth
- `POST /api/auth/magic-link` — request magic link
- `POST /api/auth/verify` — verify magic link token, set session cookie
- `GET /api/auth/me` — check auth status
- `POST /api/auth/logout` — clear session

### PayFast
- `POST /api/payfast/checkout` — create payment, redirect to PayFast (with subscription tokenisation)
- `POST /api/payfast/notify` — PayFast ITN webhook (signature + amount verification, handles initial + recurring payments)
- `GET /api/payfast/success` — user-facing success page
- `GET /api/payfast/cancel` — user-facing cancel page

### Member (authenticated)
- `GET /api/member/dashboard` — full dashboard data
- `POST /api/member/click` — record affiliate link click
- `POST /api/member/payout` — request payout (min R10, validates pending balance)
- `POST /api/member/cancel-subscription` — cancel PayFast subscription (best-effort API + local cancelAtPeriodEnd)

### Admin (X-Admin-Key header)
- `GET /api/admin/guides` — list all guides (including drafts)
- `POST /api/admin/guides` — create guide
- `PATCH /api/admin/guides/[id]` — update guide
- `DELETE /api/admin/guides/[id]` — delete guide
- `POST /api/admin/distribute` — run monthly distribution
- `POST /api/admin/transparency` — publish transparency report
- `POST /api/admin/notify-distributions` — send distribution notification emails
- `POST /api/admin/record-commission` — record external affiliate commission

## Monthly operating procedure

End of each month:

1. Log into `/admin`
2. Record affiliate commissions received that month (Amazon payout, Hostinger payout, etc.) via "Record affiliate commission"
3. Click "Run distribution" — calculates pool, distributes to active members
4. Click "Publish transparency report" — makes monthly breakdown public at `/transparency`
5. Click "Send distribution notification emails" — emails members about their distribution

## Deployment

This app is designed to deploy on Render (or similar Node.js host):

1. Push this repo to GitHub
2. Connect the repo to Render
3. Set all env vars in Render dashboard
4. Build command: `bun run build`
5. Start command: `bun run start`
6. Run `bun run db:push` once after first deploy (Render one-off command)
7. Hit `/api/seed` once to populate affiliate partners

## Compliance posture

- **POPIA compliant** (Privacy Policy includes Information Officer contact, data subject rights)
- **FIC Act compliant** (AML obligations noted in Privacy Policy)
- **Consumer Protection Act compliant** (7-day money-back guarantee, clear refund policy)
- **Not an investment product** (external affiliate revenue only, no promised returns, no pooling of user funds)
- **Not an MLM** (members don't earn from recruiting — only from external affiliate revenue shared pro-rata by tier)

## Founder

**Maphalle Malatji** — South African software developer
Email: maphalle@freedomwheels.online

## License

Proprietary. All rights reserved. See [legal terms](src/lib/legal-content.ts) for full Terms of Service.

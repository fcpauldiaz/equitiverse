# EquitiVerse

Equity position tracker for EdgebyRS Equities subscribers: track RS positions, view delayed market prices, and receive email performance digests.

Built with **TanStack Start**, **Turso/SQLite**, **Drizzle ORM**, and **Finnhub** (delayed quotes).

## Quick Start

```bash
pnpm install
cp .env.example .env
pnpm run db:push
pnpm run db:seed -- admin@edgebyrs.com your-secure-password
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**Default dev admin** (from `.env`): `admin@edgebyrs.com` / `admin123456`

## Features

- **Admin**: publish/close equity positions, invite subscribers, refresh quotes, send digests
- **Subscribers**: EquitiVerse dashboard with portfolio summary, ticker marquee, performance table
- **Email**: invite + weekly/daily digest via Resend (optional)
- **Cron**: `POST /api/cron/refresh-quotes` and `POST /api/cron/send-digest?frequency=weekly` with `x-cron-secret` header

## Environment

See [`.env.example`](.env.example) for all variables. Required for full functionality:

| Variable | Purpose |
|----------|---------|
| `TURSO_DATABASE_URL` | `file:local.db` locally, Turso URL in production |
| `FINNHUB_API_KEY` | Delayed stock quotes |
| `RESEND_API_KEY` | Email invites and digests |
| `CRON_SECRET` | Protect cron API routes |

## Testing

```bash
pnpm run test:e2e
```

Playwright starts a dev server on port **3100**, runs `db:push` + `db:seed`, and executes login flow tests in `e2e/login.spec.ts`. Requires `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` in `.env` (remote Turso; local `file:` URLs are not supported in the browser login path).

Optional overrides: `PLAYWRIGHT_ADMIN_EMAIL`, `PLAYWRIGHT_ADMIN_PASSWORD`, `PLAYWRIGHT_PORT`.

## Spec Kit

This project uses [GitHub Spec Kit](https://github.com/github/spec-kit) for spec-driven development:

- Constitution: `.specify/memory/constitution.md`
- Feature spec: `specs/001-portfolio-tracker/spec.md`

## Design

UI follows the [EdgebyRS](https://www.edgebyrs.com/) visual language under the **EquitiVerse** product brand — Montserrat, dark `#131517`, gradient CTAs, white elevated cards.

## Deploy

Build with the included `Dockerfile` (Coolify, etc.):

```bash
pnpm run build
pnpm start
```

On container start, `drizzle-kit push` runs automatically against `TURSO_DATABASE_URL` before the server boots. Set `SKIP_DB_PUSH=true` to skip (e.g. local debugging). `db:seed` is still manual:

```bash
pnpm run db:seed
```

Quotes are cached in the `quote_cache` SQLite table (60s during market hours, 15m off hours) to stay within Finnhub's free tier.

Configure platform cron to hit `/api/cron/refresh-quotes` (every 5–10 min during market hours) and `/api/cron/send-digest?frequency=weekly`.

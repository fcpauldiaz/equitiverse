# RS Portfolio Tracker / EquitiVerse Constitution

## Core Principles

### I. Data Integrity
Drizzle schema is the source of truth. All market performance calculations run server-side. Delayed market data must display a visible disclaimer in UI and emails.

### II. Access Control
Only admins may create, edit, or close positions and manage subscribers. Subscribers have read-only access to portfolio data and may update their own digest preferences.

### III. Type Safety
No `any` types. Use Zod for input validation on all server functions and API routes.

### IV. Brand Consistency
UI must follow EquitiVerse design tokens (EdgebyRS visual language) defined in `src/styles/design-tokens.css`. Do not use generic default themes.

### V. Email Compliance
All digest emails include one-click unsubscribe. Invite emails use signed, expiring tokens.

## Security Requirements
- Passwords hashed with bcrypt (cost factor 12)
- Session tokens are cryptographically random, HTTP-only cookies
- Cron routes require `CRON_SECRET` header
- Never commit secrets or `.env` files

## Development Standards
- Server functions wrap all database access
- Market data fetched via provider abstraction; cache in `quote_cache`
- Local dev uses `file:local.db`; production uses Turso

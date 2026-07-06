import { config as loadEnv } from 'dotenv'

loadEnv()

export const adminEmail =
  process.env.PLAYWRIGHT_ADMIN_EMAIL ??
  process.env.ADMIN_EMAIL ??
  'admin@edgebyrs.com'

export const adminPassword =
  process.env.PLAYWRIGHT_ADMIN_PASSWORD ??
  process.env.ADMIN_PASSWORD ??
  'test-password-12'

export const appPort = Number(process.env.PLAYWRIGHT_PORT ?? 3100)

export const baseUrl =
  process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${appPort}`

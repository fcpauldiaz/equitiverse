import { config as loadEnv } from 'dotenv'

loadEnv()

import { defineConfig, devices } from '@playwright/test'

import { adminEmail, adminPassword, baseUrl } from './e2e/test-env'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: baseUrl,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'pnpm run test:e2e:server',
    url: baseUrl,
    reuseExistingServer: process.env.PLAYWRIGHT_REUSE_SERVER === '1',
    timeout: 120_000,
    env: {
      ...process.env,
      ADMIN_EMAIL: adminEmail,
      ADMIN_PASSWORD: adminPassword,
      BETTER_AUTH_URL: baseUrl,
    },
  },
})

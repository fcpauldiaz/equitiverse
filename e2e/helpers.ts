import type { Page } from '@playwright/test'

export async function gotoHydrated(page: Page, path: string) {
  await page.goto(path, { waitUntil: 'load' })
  await page.locator('form[data-ready]').waitFor()
}

export async function submitLogin(page: Page) {
  const responsePromise = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' &&
      response.request().headers()['x-tsr-serverfn'] === 'true',
    { timeout: 15_000 },
  )

  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await responsePromise
}

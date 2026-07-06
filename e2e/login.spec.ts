import { expect, test } from '@playwright/test'

import { gotoHydrated, submitLogin } from './helpers'
import { adminEmail, adminPassword } from './test-env'

test.describe('Login', () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies()
  })

  test('renders the sign in form', async ({ page }) => {
    await gotoHydrated(page, '/login')

    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Sign in', exact: true }),
    ).toBeVisible()
  })

  test('shows auth required message from search param', async ({ page }) => {
    await gotoHydrated(page, '/login?reason=auth_required')

    await expect(page.getByRole('alert')).toHaveText(
      'Sign in to access your portfolio.',
    )
  })

  test('shows error for invalid credentials', async ({ page }) => {
    await gotoHydrated(page, '/login')

    await page.getByLabel('Email').fill(adminEmail)
    await page.getByLabel('Password').fill('wrong-password-1')
    await submitLogin(page)

    await expect(page.getByRole('alert')).toHaveText(
      'Invalid email or password',
      { timeout: 10_000 },
    )
    await expect(page).toHaveURL(/\/login/)
  })

  test('signs in with valid credentials', async ({ page }) => {
    await gotoHydrated(page, '/login')

    await page.getByLabel('Email').fill(adminEmail)
    await page.getByLabel('Password').fill(adminPassword)
    await submitLogin(page)

    await expect(page).toHaveURL('/dashboard', { timeout: 10_000 })
    await expect(page.getByRole('heading', { name: 'Performance' })).toBeVisible()
  })

  test('redirects authenticated users away from login', async ({ page }) => {
    await gotoHydrated(page, '/login')
    await page.getByLabel('Email').fill(adminEmail)
    await page.getByLabel('Password').fill(adminPassword)
    await submitLogin(page)
    await expect(page).toHaveURL('/dashboard', { timeout: 10_000 })

    await page.goto('/login')
    await expect(page).toHaveURL('/dashboard', { timeout: 10_000 })
  })
})

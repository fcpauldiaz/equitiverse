import { expect, test } from '@playwright/test'

import { gotoHydrated } from './helpers'

test.describe('Forgot password', () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies()
  })

  test('renders the forgot password form', async ({ page }) => {
    await gotoHydrated(page, '/forgot-password')

    await expect(
      page.getByRole('heading', { name: 'Forgot password' }),
    ).toBeVisible()
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Send reset link' }),
    ).toBeVisible()
  })

  test('shows success message after submitting email', async ({ page }) => {
    await gotoHydrated(page, '/forgot-password')

    await page.getByLabel('Email').fill('user@example.com')
    await page.getByRole('button', { name: 'Send reset link' }).click()

    await expect(page.getByRole('alert')).toHaveText(
      'If an account exists for that email, we sent a password reset link.',
      { timeout: 10_000 },
    )
  })

  test('shows invalid state for bad reset token', async ({ page }) => {
    await page.goto('/reset-password/invalid-token', { waitUntil: 'load' })

    await expect(
      page.getByRole('heading', { name: 'Invalid reset link' }),
    ).toBeVisible()
    await expect(page.getByText('invalid or has expired')).toBeVisible()
  })

  test('login page links to forgot password', async ({ page }) => {
    await gotoHydrated(page, '/login')

    await expect(page.getByRole('link', { name: 'Forgot password?' })).toHaveAttribute(
      'href',
      '/forgot-password',
    )
  })
})

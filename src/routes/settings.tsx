import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { useState } from 'react'

import { AppShell } from '#/components/layout/AppShell'
import { SectionTitle } from '#/components/ui/SectionTitle'
import {
  getSessionFn,
  getSettingsFn,
  logoutFn,
  updateDigestPreferenceFn,
} from '#/server/functions'
import type { DigestFrequency } from '#/lib/types'

export const Route = createFileRoute('/settings')({
  loader: async () => {
    const user = await getSessionFn()

    if (!user) {
      throw redirect({ to: '/login', search: { reason: 'auth_required' } })
    }

    const settings = await getSettingsFn()
    return { user, settings }
  },
  component: SettingsPage,
})

function SettingsPage() {
  const { user, settings } = Route.useLoaderData()
  const router = useRouter()
  const [digestFrequency, setDigestFrequency] = useState<DigestFrequency>(
    settings.digestFrequency,
  )
  const [message, setMessage] = useState<string | null>(null)

  async function savePreferences(unsubscribe = false) {
    await updateDigestPreferenceFn({
      data: {
        digestFrequency: unsubscribe ? 'none' : digestFrequency,
        unsubscribe,
      },
    })
    setMessage(
      unsubscribe ? 'You are unsubscribed from digests.' : 'Preferences saved.',
    )
    await router.invalidate()
  }

  async function handleLogout() {
    await logoutFn()
    await router.invalidate()
    await router.navigate({ to: '/login' })
  }

  return (
    <AppShell user={user}>
      <section className="page-shell page-shell-narrow">
        <SectionTitle label="Account" title="Settings" />

        <div className="rs-card content-stack">
          <p className="text-sm text-rs-text-light">{user.email}</p>

          <label>
            <span className="field-label">Email digest frequency</span>
            <select
              value={digestFrequency}
              onChange={(e) =>
                setDigestFrequency(e.target.value as DigestFrequency)
              }
              className="field-select"
            >
              <option value="weekly">Weekly</option>
              <option value="daily">Daily</option>
              <option value="none">None</option>
            </select>
          </label>

          {settings.unsubscribedAt ? (
            <p className="text-sm text-rs-text-light">
              You are currently unsubscribed from email digests.
            </p>
          ) : null}

          {message ? (
            <p className="rounded-lg bg-rs-green-soft px-3 py-2 text-sm text-rs-green">
              {message}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => savePreferences(false)}
                className="btn-primary"
              >
                Save preferences
              </button>
              <button
                type="button"
                onClick={() => savePreferences(true)}
                className="btn-gradient-outline btn-secondary-light"
              >
                <span>Unsubscribe</span>
              </button>
              <button type="button" onClick={handleLogout} className="btn-ghost">
                Sign out
              </button>
            </div>
        </div>
      </section>
    </AppShell>
  )
}

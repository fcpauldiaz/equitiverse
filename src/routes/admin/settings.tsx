import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { useState } from 'react'

import { AppShell } from '#/components/layout/AppShell'
import { SectionTitle } from '#/components/ui/SectionTitle'
import { StatCard } from '#/components/ui/StatCard'
import {
  getSessionFn,
  getSettingsFn,
  refreshQuotesFn,
  sendDigestNowFn,
} from '#/server/functions'

export const Route = createFileRoute('/admin/settings')({
  loader: async () => {
    const user = await getSessionFn()

    if (!user) {
      throw redirect({ to: '/login' })
    }

    if (user.role !== 'admin') {
      throw redirect({ to: '/dashboard' })
    }

    const settings = await getSettingsFn()
    return { user, settings }
  },
  component: AdminSettingsPage,
})

function AdminSettingsPage() {
  const { user, settings } = Route.useLoaderData()
  const router = useRouter()
  const [message, setMessage] = useState<string | null>(null)

  async function handleRefreshQuotes() {
    const result = await refreshQuotesFn()
    setMessage(
      'error' in result && result.error
        ? result.error
        : `Updated ${result.updated} quotes${result.failed.length ? ` (${result.failed.length} failed)` : ''}.`,
    )
    await router.invalidate()
  }

  async function handleSendDigest(frequency: 'daily' | 'weekly' | 'manual') {
    const result = await sendDigestNowFn({ data: { frequency } })
    setMessage(`Digest sent to ${result.sent} subscribers.`)
  }

  return (
    <AppShell user={user}>
      <section className="page-shell">
        <SectionTitle
          label="Admin"
          title="Operations"
          description="Market data refresh and email digest controls."
        />

        <div className="stat-grid">
          <StatCard
            label="Finnhub"
            value={settings.finnhubConfigured ? 'Connected' : 'Missing key'}
          />
          <StatCard
            label="Resend"
            value={settings.resendConfigured ? 'Connected' : 'Missing key'}
          />
          <StatCard
            label="Open positions"
            value={String(settings.openCalloutCount)}
          />
          <StatCard label="Avg return" value={settings.avgReturnLabel} />
        </div>

        <div className="rs-card content-stack">
          <p className="text-sm text-rs-text-light">
            Last quote refresh:{' '}
            {settings.lastQuoteAt
              ? new Date(settings.lastQuoteAt).toLocaleString()
              : 'Never'}
          </p>

          {message ? (
            <p className="rounded-lg bg-rs-green-soft px-3 py-2 text-sm text-rs-green">
              {message}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleRefreshQuotes}
              className="btn-primary"
            >
              Refresh quotes
            </button>
            <button
              type="button"
              onClick={() => handleSendDigest('weekly')}
              className="btn-gradient-outline btn-secondary-light"
            >
              <span>Send weekly digest</span>
            </button>
            <button
              type="button"
              onClick={() => handleSendDigest('daily')}
              className="btn-gradient-outline btn-secondary-light"
            >
              <span>Send daily digest</span>
            </button>
          </div>
        </div>
      </section>
    </AppShell>
  )
}

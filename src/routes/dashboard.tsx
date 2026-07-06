import { createFileRoute, redirect } from '@tanstack/react-router'

import { AppShell } from '#/components/layout/AppShell'
import { CalloutTable } from '#/components/ui/CalloutTable'
import { PriceTicker } from '#/components/ui/PriceTicker'
import { SectionTitle } from '#/components/ui/SectionTitle'
import { StatCard } from '#/components/ui/StatCard'
import { useLivePortfolio } from '#/hooks/useLivePortfolio'
import { formatReturnPct } from '#/lib/performance'
import { getDashboardFn, getSessionFn } from '#/server/functions'

export const Route = createFileRoute('/dashboard')({
  loader: async () => {
    const user = await getSessionFn()

    if (!user) {
      throw redirect({ to: '/login', search: { reason: 'auth_required' } })
    }

    const dashboard = await getDashboardFn()

    return { user, ...dashboard }
  },
  component: DashboardPage,
})

function DashboardPage() {
  const initial = Route.useLoaderData()
  const { callouts, quotes, summary } = useLivePortfolio({
    callouts: initial.callouts,
    quotes: initial.quotes,
    summary: initial.summary,
  })

  return (
    <AppShell
      user={initial.user}
      showTicker
      ticker={
        <PriceTicker
          quotes={quotes}
          openPositionCount={summary.openCount}
          marketDataConfigured={initial.marketDataConfigured}
        />
      }
    >
      <section className="page-shell">
        <SectionTitle
          label="Portfolio"
          title="Performance"
          description="Entry price, current quote, and return for every RS equity position."
        />

        <div className="stat-grid">
          <StatCard label="Open" value={String(summary.openCount)} />
          <StatCard label="Closed" value={String(summary.closedCount)} />
          <StatCard
            label="Average return"
            value={formatReturnPct(summary.avgReturnPct)}
            tone={
              summary.avgReturnPct === null
                ? 'default'
                : summary.avgReturnPct >= 0
                  ? 'positive'
                  : 'negative'
            }
          />
          <StatCard
            label="Best performer"
            value={
              summary.bestPerformer
                ? `${summary.bestPerformer.ticker} ${formatReturnPct(summary.bestPerformer.returnPct)}`
                : '—'
            }
            tone="positive"
          />
        </div>

        <CalloutTable callouts={callouts} />
      </section>
    </AppShell>
  )
}

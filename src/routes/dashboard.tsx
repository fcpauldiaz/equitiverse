import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, redirect } from '@tanstack/react-router'

import { AppShell } from '#/components/layout/AppShell'
import { CalloutTable } from '#/components/ui/CalloutTable'
import { PriceTicker } from '#/components/ui/PriceTicker'
import { SectionTitle } from '#/components/ui/SectionTitle'
import { StatCard } from '#/components/ui/StatCard'
import { QUOTE_POLL_INTERVAL_MS } from '#/lib/market-data'
import { formatReturnPct } from '#/lib/performance'
import { dashboardQueryOptions } from '#/lib/queries/dashboard'
import { getSessionFn } from '#/server/functions'

export const Route = createFileRoute('/dashboard')({
  loader: async ({ context }) => {
    const user = await getSessionFn()

    if (!user) {
      throw redirect({ to: '/login', search: { reason: 'auth_required' } })
    }

    await context.queryClient.ensureQueryData(dashboardQueryOptions())

    return { user }
  },
  component: DashboardPage,
})

function DashboardPage() {
  const { user } = Route.useLoaderData()
  const { data } = useSuspenseQuery({
    ...dashboardQueryOptions(),
    refetchInterval: QUOTE_POLL_INTERVAL_MS,
  })
  const { callouts, quotes, summary, marketDataConfigured } = data

  return (
    <AppShell
      user={user}
      showTicker
      ticker={
        <PriceTicker
          quotes={quotes}
          openPositionCount={summary.openCount}
          marketDataConfigured={marketDataConfigured}
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

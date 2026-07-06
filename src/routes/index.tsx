import { createFileRoute, Link } from '@tanstack/react-router'

import { AppShell } from '#/components/layout/AppShell'
import { getSessionFn } from '#/server/functions'

export const Route = createFileRoute('/')({
  loader: () => getSessionFn(),
  component: HomePage,
})

const features = [
  {
    title: 'Global Equity Positions',
    body: 'USA, Europe, and Asia positions with entry thesis and performance tracking.',
  },
  {
    title: 'Delayed Market Prices',
    body: 'Current quotes refresh during market hours so subscribers see up-to-date returns.',
  },
  {
    title: 'Email Digests',
    body: 'Weekly or daily summaries delivered to your inbox with one-click unsubscribe.',
  },
] as const

function HomePage() {
  const user = Route.useLoaderData()

  return (
    <AppShell user={user}>
      <section className="page-shell page-shell-hero">
        <div className="max-w-3xl">
          <div className="common-title">
            <span className="common-title-label">Welcome</span>
            <span className="common-title-line" />
          </div>

          <h1 className="gradient-text text-4xl font-bold md:text-6xl">
            EquitiVerse
          </h1>

          <p className="mt-6 text-lg text-rs-text-light md:text-xl">
            Track equity positions, measure performance with delayed market
            prices, and stay aligned with the EdgebyRS Equities research
            framework.
          </p>

          <div className="mt-10">
            <Link to={user ? '/dashboard' : '/login'} className="btn-gradient">
              {user ? 'Member Area' : 'Join Now'}
            </Link>
          </div>
        </div>

        <div className="feature-grid">
          {features.map((item) => (
            <div key={item.title} className="rs-card">
              <h3 className="gradient-text-blue text-lg font-bold">{item.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-rs-text-light">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  )
}

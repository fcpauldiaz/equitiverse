import { createFileRoute, Link } from '@tanstack/react-router'
import {
  Activity,
  BarChart3,
  Bell,
  LayoutDashboard,
  Mail,
  Shield,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { AppShell } from '#/components/layout/AppShell'
import { SectionTitle } from '#/components/ui/SectionTitle'
import { getSessionFn } from '#/server/functions'

export const Route = createFileRoute('/')({
  loader: () => getSessionFn(),
  component: HomePage,
})

type Feature = {
  title: string
  body: string
  icon: LucideIcon
}

const features: Feature[] = [
  {
    title: 'Performance Dashboard',
    body: 'View every open and closed position with entry price, current quote, return %, and status in one place.',
    icon: LayoutDashboard,
  },
  {
    title: 'Portfolio Analytics',
    body: 'Track open and closed counts, average return, and best performer across the full RS equity book.',
    icon: BarChart3,
  },
  {
    title: 'Delayed Market Prices',
    body: 'Quotes refresh during market hours so subscribers always see up-to-date performance on active positions.',
    icon: Activity,
  },
  {
    title: 'New Position Alerts',
    body: 'Get an email the moment a new position is published — ticker, entry, thesis, and a link to the dashboard.',
    icon: Bell,
  },
  {
    title: 'Email Digests',
    body: 'Choose daily or weekly portfolio summaries delivered to your inbox, with one-click unsubscribe.',
    icon: Mail,
  },
  {
    title: 'Invite-Only Access',
    body: 'A private subscriber community. Admins invite members via secure links — no public sign-up.',
    icon: Shield,
  },
]

function FeatureCard({ title, body, icon: Icon }: Feature) {
  return (
    <div className="rs-card">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-rs-blue/10 text-rs-blue">
        <Icon className="h-5 w-5" aria-hidden />
      </div>
      <h3 className="gradient-text-blue mt-5 text-lg font-bold">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-rs-text-light">{body}</p>
    </div>
  )
}

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

        <div className="mt-[var(--space-block)]">
          <SectionTitle
            label="Platform"
            title="Everything in one place"
            description="EquitiVerse gives EdgebyRS subscribers real-time visibility into the equity book — from live performance to email updates."
          />

          <div className="feature-grid">
            {features.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>
        </div>
      </section>
    </AppShell>
  )
}

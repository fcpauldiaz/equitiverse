import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { useState } from 'react'

import { AppShell } from '#/components/layout/AppShell'
import { CalloutTable } from '#/components/ui/CalloutTable'
import { SectionTitle } from '#/components/ui/SectionTitle'
import {
  closeCalloutFn,
  createCalloutFn,
  deleteCalloutFn,
  getCalloutsAdminFn,
  getSessionFn,
} from '#/server/functions'

export const Route = createFileRoute('/admin/positions')({
  loader: async () => {
    const user = await getSessionFn()

    if (!user) {
      throw redirect({ to: '/login' })
    }

    if (user.role !== 'admin') {
      throw redirect({ to: '/dashboard' })
    }

    const portfolio = await getCalloutsAdminFn()
    return { user, ...portfolio }
  },
  component: AdminPositionsPage,
})

function AdminPositionsPage() {
  const { user, callouts } = Route.useLoaderData()
  const router = useRouter()

  const [ticker, setTicker] = useState('')
  const [entryPrice, setEntryPrice] = useState('')
  const [entryDate, setEntryDate] = useState(
    new Date().toISOString().slice(0, 10),
  )
  const [thesis, setThesis] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault()

    const result = await createCalloutFn({
      data: {
        ticker,
        entryPrice: Number(entryPrice),
        entryDate,
        thesis: thesis || undefined,
      },
    })

    setTicker('')
    setEntryPrice('')
    setThesis('')
    setMessage(
      result.notificationsSent > 0
        ? `Position published. Notifications sent to ${result.notificationsSent} subscribers.`
        : 'Position published. No notification emails sent.',
    )
    await router.invalidate()
  }

  async function handleClose(id: string) {
    const exitPrice = window.prompt('Exit price?')

    if (!exitPrice) return

    await closeCalloutFn({
      data: {
        id,
        exitPrice: Number(exitPrice),
        exitDate: new Date().toISOString().slice(0, 10),
      },
    })

    await router.invalidate()
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this position?')) return
    await deleteCalloutFn({ data: { id } })
    await router.invalidate()
  }

  return (
    <AppShell user={user}>
      <section className="page-shell">
        <SectionTitle
          label="Admin"
          title="Equity positions"
          description="Publish and manage positions for EquitiVerse subscribers."
        />

        <form
          onSubmit={handleCreate}
          className="rs-card content-stack-tight mb-[var(--space-section)] md:grid md:grid-cols-2"
        >
          <label>
            <span className="field-label">Ticker</span>
            <input
              required
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              className="field-input uppercase"
            />
          </label>
          <label>
            <span className="field-label">Entry price</span>
            <input
              required
              type="number"
              step="0.01"
              min="0"
              value={entryPrice}
              onChange={(e) => setEntryPrice(e.target.value)}
              className="field-input"
            />
          </label>
          <label>
            <span className="field-label">Entry date</span>
            <input
              required
              type="date"
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              className="field-input"
            />
          </label>
          <label className="md:col-span-2">
            <span className="field-label">Thesis (optional)</span>
            <textarea
              value={thesis}
              onChange={(e) => setThesis(e.target.value)}
              rows={3}
              className="field-textarea"
            />
          </label>
          <div className="md:col-span-2">
            {message ? (
              <p className="mb-3 rounded-lg bg-rs-green-soft px-3 py-2 text-sm text-rs-green">
                {message}
              </p>
            ) : null}
            <button type="submit" className="btn-primary">
              Publish position
            </button>
          </div>
        </form>

        <CalloutTable callouts={callouts} />

        {callouts.some((c) => c.status === 'open') ? (
          <div className="mt-[var(--space-stack-md)] flex flex-wrap gap-3">
            {callouts
              .filter((c) => c.status === 'open')
              .map((position) => (
                <div key={position.id} className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleClose(position.id)}
                    className="btn-gradient-outline btn-secondary-light text-sm"
                  >
                    <span>Close {position.ticker}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(position.id)}
                    className="btn-ghost px-4 py-2 text-sm text-rs-red"
                  >
                    Delete
                  </button>
                </div>
              ))}
          </div>
        ) : null}
      </section>
    </AppShell>
  )
}

import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { useState } from 'react'

import { AppShell } from '#/components/layout/AppShell'
import { SectionTitle } from '#/components/ui/SectionTitle'
import {
  disableSubscriberFn,
  getSessionFn,
  getSubscribersFn,
  inviteSubscriberFn,
} from '#/server/functions'

export const Route = createFileRoute('/admin/subscribers')({
  loader: async () => {
    const user = await getSessionFn()

    if (!user) {
      throw redirect({ to: '/login' })
    }

    if (user.role !== 'admin') {
      throw redirect({ to: '/dashboard' })
    }

    const subscribers = await getSubscribersFn()
    return { user, subscribers }
  },
  component: AdminSubscribersPage,
})

function AdminSubscribersPage() {
  const { user, subscribers } = Route.useLoaderData()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function handleInvite(event: React.FormEvent) {
    event.preventDefault()

    const result = await inviteSubscriberFn({ data: { email } })
    setInviteUrl(result.inviteUrl)
    setMessage(
      result.emailSent
        ? `Invite sent to ${email}.`
        : 'Invite created. Configure RESEND_API_KEY to send email.',
    )
    setEmail('')
    await router.invalidate()
  }

  async function handleDisable(userId: string) {
    if (!window.confirm('Disable this subscriber?')) return
    await disableSubscriberFn({ data: { userId } })
    await router.invalidate()
  }

  return (
    <AppShell user={user}>
      <section className="page-shell">
        <SectionTitle
          label="Admin"
          title="Subscribers"
          description="Invite and manage EquitiVerse subscribers."
        />

        <form
          onSubmit={handleInvite}
          className="rs-card content-stack-tight mb-[var(--space-stack-md)] md:flex md:flex-row md:items-end md:gap-[var(--space-stack-md)]"
        >
          <label className="flex-1">
            <span className="field-label">Email address</span>
            <input
              type="email"
              required
              placeholder="subscriber@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="field-input"
            />
          </label>
          <button type="submit" className="btn-primary md:mb-0">
            Send invite
          </button>
        </form>

        {message ? (
          <p className="mb-4 rounded-lg bg-rs-green-soft px-3 py-2 text-sm text-rs-green">
            {message}
          </p>
        ) : null}
        {inviteUrl ? (
          <p className="mb-6 break-all text-sm text-rs-text-light">
            Invite link: {inviteUrl}
          </p>
        ) : null}

        <div className="rs-card rs-card-flush">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="font-semibold">Email</th>
                  <th className="font-semibold">Digest</th>
                  <th className="font-semibold">Status</th>
                  <th className="font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map((subscriber) => (
                  <tr key={subscriber.id}>
                    <td>{subscriber.email}</td>
                    <td className="capitalize text-rs-text-light">
                      {subscriber.digestFrequency}
                    </td>
                    <td>
                      <span className="badge badge-closed">
                        {subscriber.disabledAt
                          ? 'Disabled'
                          : subscriber.unsubscribedAt
                            ? 'Unsubscribed'
                            : 'Active'}
                      </span>
                    </td>
                    <td>
                      {!subscriber.disabledAt ? (
                        <button
                          type="button"
                          onClick={() => handleDisable(subscriber.id)}
                          className="btn-ghost px-2 py-1 text-rs-red"
                        >
                          Disable
                        </button>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </AppShell>
  )
}

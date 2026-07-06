import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { useRef, useState } from 'react'

import { AppShell } from '#/components/layout/AppShell'
import { SectionTitle } from '#/components/ui/SectionTitle'
import { formatSubscribersCsv } from '#/lib/subscriber-csv'
import {
  disableSubscriberFn,
  getSessionFn,
  getSubscribersFn,
  inviteSubscriberFn,
  inviteSubscribersCsvFn,
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
  const csvInputRef = useRef<HTMLInputElement>(null)
  const [email, setEmail] = useState('')
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [csvSummary, setCsvSummary] = useState<string | null>(null)
  const [uploadingCsv, setUploadingCsv] = useState(false)

  async function handleInvite(event: React.FormEvent) {
    event.preventDefault()

    const result = await inviteSubscriberFn({ data: { email } })
    setInviteUrl(result.inviteUrl)
    setCsvSummary(null)
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

  function handleDownloadCsv() {
    const csv = formatSubscribersCsv(subscribers.map((subscriber) => subscriber.email))
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'subscribers.csv'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  async function handleCsvUpload(event: React.FormEvent) {
    event.preventDefault()

    const file = csvInputRef.current?.files?.[0]

    if (!file) {
      setMessage('Choose a CSV file to upload.')
      return
    }

    setUploadingCsv(true)
    setMessage(null)
    setCsvSummary(null)
    setInviteUrl(null)

    try {
      const csv = await file.text()
      const result = await inviteSubscribersCsvFn({ data: { csv } })

      const parts = [
        `${result.invited} invite${result.invited === 1 ? '' : 's'} created`,
        `${result.emailsSent} email${result.emailsSent === 1 ? '' : 's'} sent`,
      ]

      if (result.skipped.length > 0) {
        parts.push(`${result.skipped.length} skipped`)
      }

      if (result.invalid.length > 0) {
        parts.push(`${result.invalid.length} invalid`)
      }

      setMessage(parts.join(' · '))

      if (result.skipped.length > 0 || result.invalid.length > 0) {
        const details: string[] = []

        for (const row of result.skipped) {
          details.push(
            `${row.email}: ${row.reason === 'disabled' ? 'disabled account' : 'already registered'}`,
          )
        }

        for (const invalidEmail of result.invalid) {
          details.push(`${invalidEmail}: invalid email`)
        }

        setCsvSummary(details.join('\n'))
      }

      if (csvInputRef.current) {
        csvInputRef.current.value = ''
      }

      await router.invalidate()
    } finally {
      setUploadingCsv(false)
    }
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

        <form
          onSubmit={handleCsvUpload}
          className="rs-card content-stack mb-[var(--space-stack-md)]"
        >
          <div>
            <h3 className="text-lg font-semibold text-rs-dark">Bulk invite from CSV</h3>
            <p className="mt-2 text-sm text-rs-text-light">
              Upload a CSV with one email per line or comma-separated values. An
              optional header row named <code className="text-rs-text">email</code> is
              supported. New addresses receive invite links; existing subscribers are
              skipped.
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <label className="min-w-[220px] flex-1">
              <span className="field-label">CSV file</span>
              <input
                ref={csvInputRef}
                type="file"
                accept=".csv,text/csv"
                className="field-input file:mr-3 file:rounded-md file:border-0 file:bg-rs-blue-soft file:px-3 file:py-2 file:text-sm file:font-medium file:text-rs-blue"
              />
            </label>
            <button
              type="button"
              onClick={handleDownloadCsv}
              className="btn-gradient-outline btn-secondary-light"
            >
              <span>Download CSV</span>
            </button>
            <button
              type="submit"
              disabled={uploadingCsv}
              className="btn-primary"
            >
              {uploadingCsv ? 'Uploading…' : 'Upload CSV'}
            </button>
          </div>
        </form>

        {message ? (
          <p className="mb-4 rounded-lg bg-rs-green-soft px-3 py-2 text-sm text-rs-green">
            {message}
          </p>
        ) : null}
        {csvSummary ? (
          <pre className="mb-4 whitespace-pre-wrap rounded-lg bg-rs-bg px-3 py-2 text-xs text-rs-text-light">
            {csvSummary}
          </pre>
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

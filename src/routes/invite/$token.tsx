import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { useState } from 'react'

import { AppShell } from '#/components/layout/AppShell'
import { AuthAlert } from '#/components/ui/AuthAlert'
import { Logo } from '#/components/ui/Logo'
import { getAuthErrorMessage } from '#/lib/auth-form'
import { getInviteInfoFn, getSessionFn, registerFn } from '#/server/functions'

export const Route = createFileRoute('/invite/$token')({
  loader: async ({ params }) => {
    const user = await getSessionFn()

    if (user) {
      throw redirect({ to: '/dashboard' })
    }

    const invite = await getInviteInfoFn({ data: { token: params.token } })
    return invite
  },
  component: InvitePage,
})

function InvitePage() {
  const invite = Route.useLoaderData()
  const { token } = Route.useParams()
  const router = useRouter()
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (!invite.valid) {
    return (
      <AppShell user={null}>
        <div className="auth-shell">
          <div className="auth-card rs-card text-center">
            <h1 className="text-xl font-bold text-rs-dark">Invalid invitation</h1>
            <p className="mt-2 text-sm text-rs-text-light">
              This invite link is invalid or has expired.
            </p>
          </div>
        </div>
      </AppShell>
    )
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const result = await registerFn({
        data: {
          email: invite.email,
          password,
          name: name || undefined,
          inviteToken: token,
        },
      })

      if (result && 'error' in result && result.error) {
        setError(result.error)
        return
      }

      if (!result || !('user' in result) || !result.user) {
        setError('Account creation failed. Please try again.')
        return
      }

      const session = await getSessionFn()
      if (!session) {
        setError(
          'Account created, but your session could not be started. Please sign in.',
        )
        return
      }

      await router.invalidate()
      await router.navigate({ to: '/dashboard' })
    } catch (submitError) {
      setError(getAuthErrorMessage(submitError))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppShell user={null}>
      <div className="auth-shell">
        <div className="auth-card rs-card">
          <Logo linked={false} className="text-xl" />
          <h1 className="mt-5 text-xl font-bold text-rs-dark">Accept invitation</h1>
          <p className="mt-1 text-sm text-rs-text-light">
            Create your account for{' '}
            <span className="font-medium text-rs-dark">{invite.email}</span>
          </p>

          <form
            onSubmit={handleSubmit}
            className="content-stack mt-7"
            aria-busy={loading}
          >
            <label>
              <span className="field-label">Name (optional)</span>
              <input
                type="text"
                autoComplete="name"
                disabled={loading}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="field-input"
              />
            </label>

            <label>
              <span className="field-label">Password</span>
              <input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                disabled={loading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="field-input"
              />
            </label>

            {error ? <AuthAlert message={error} /> : null}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Creating account…' : 'Join EquitiVerse'}
            </button>
          </form>
        </div>
      </div>
    </AppShell>
  )
}

import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { z } from 'zod'

import { AppShell } from '#/components/layout/AppShell'
import { AuthAlert } from '#/components/ui/AuthAlert'
import { Logo } from '#/components/ui/Logo'
import { getAuthErrorMessage, getLoginReasonMessage } from '#/lib/auth-form'
import { getSessionFn, loginFn } from '#/server/functions'

const loginSearchSchema = z.object({
  reason: z.enum(['auth_required', 'session_failed']).optional(),
})

export const Route = createFileRoute('/login')({
  validateSearch: loginSearchSchema,
  loader: async () => {
    const user = await getSessionFn()

    if (user) {
      throw redirect({ to: '/dashboard' })
    }

    return { user: null }
  },
  component: LoginPage,
})

function LoginPage() {
  const router = useRouter()
  const { reason } = Route.useSearch()
  const reasonMessage = getLoginReasonMessage(reason)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setReady(true)
  }, [])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const result = await loginFn({ data: { email, password } })

      if (result && 'error' in result && result.error) {
        setError(result.error)
        return
      }

      if (!result || !('user' in result) || !result.user) {
        setError('Sign in failed. Check your email and password.')
        return
      }

      const session = await getSessionFn()
      if (!session) {
        setError(
          'Signed in, but your session could not be started. Please try again.',
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
          <h1 className="mt-5 text-xl font-bold text-rs-dark">Sign in</h1>
          <p className="mt-1 text-sm text-rs-text-light">
            Access your equity position dashboard.
          </p>

          <form
            data-ready={ready ? '' : undefined}
            onSubmit={handleSubmit}
            className="content-stack mt-7"
            aria-busy={loading}
          >
            {reasonMessage && !error ? (
              <AuthAlert message={reasonMessage} tone="info" />
            ) : null}

            <label>
              <span className="field-label">Email</span>
              <input
                type="email"
                required
                autoComplete="email"
                disabled={loading}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="field-input"
              />
            </label>

            <label>
              <span className="field-label">Password</span>
              <input
                type="password"
                required
                minLength={8}
                autoComplete="current-password"
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
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </AppShell>
  )
}

import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { useState } from 'react'

import { AppShell } from '#/components/layout/AppShell'
import { AuthAlert } from '#/components/ui/AuthAlert'
import { Logo } from '#/components/ui/Logo'
import { getAuthErrorMessage } from '#/lib/auth-form'
import { useHydrated } from '#/lib/hydration'
import { getSessionFn, requestPasswordResetFn } from '#/server/functions'

export const Route = createFileRoute('/forgot-password')({
  loader: async () => {
    const user = await getSessionFn()

    if (user) {
      throw redirect({ to: '/dashboard' })
    }

    return { user: null }
  },
  component: ForgotPasswordPage,
})

function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const ready = useHydrated()

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await requestPasswordResetFn({ data: { email } })
      setSubmitted(true)
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
          <h1 className="mt-5 text-xl font-bold text-rs-dark">Forgot password</h1>
          <p className="mt-1 text-sm text-rs-text-light">
            Enter your email and we&apos;ll send you a reset link.
          </p>

          {submitted ? (
            <div className="content-stack mt-7">
              <AuthAlert
                message="If an account exists for that email, we sent a password reset link."
                tone="info"
              />
              <Link to="/login" className="text-sm text-rs-blue hover:underline">
                Back to sign in
              </Link>
            </div>
          ) : (
            <form
              data-ready={ready ? '' : undefined}
              onSubmit={handleSubmit}
              className="content-stack mt-7"
              aria-busy={loading}
            >
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

              {error ? <AuthAlert message={error} /> : null}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? 'Sending…' : 'Send reset link'}
              </button>

              <Link to="/login" className="text-sm text-rs-blue hover:underline">
                Back to sign in
              </Link>
            </form>
          )}
        </div>
      </div>
    </AppShell>
  )
}

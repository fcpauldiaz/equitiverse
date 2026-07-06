import { createFileRoute, Link, redirect, useRouter } from '@tanstack/react-router'
import { useState } from 'react'

import { AppShell } from '#/components/layout/AppShell'
import { AuthAlert } from '#/components/ui/AuthAlert'
import { Logo } from '#/components/ui/Logo'
import { getAuthErrorMessage } from '#/lib/auth-form'
import {
  getPasswordResetInfoFn,
  getSessionFn,
  resetPasswordFn,
} from '#/server/functions'

export const Route = createFileRoute('/reset-password/$token')({
  loader: async ({ params }) => {
    const user = await getSessionFn()

    if (user) {
      throw redirect({ to: '/dashboard' })
    }

    const resetInfo = await getPasswordResetInfoFn({
      data: { token: params.token },
    })
    return resetInfo
  },
  component: ResetPasswordPage,
})

function ResetPasswordPage() {
  const resetInfo = Route.useLoaderData()
  const { token } = Route.useParams()
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (!resetInfo.valid) {
    return (
      <AppShell user={null}>
        <div className="auth-shell">
          <div className="auth-card rs-card text-center">
            <h1 className="text-xl font-bold text-rs-dark">Invalid reset link</h1>
            <p className="mt-2 text-sm text-rs-text-light">
              This password reset link is invalid or has expired.
            </p>
            <Link
              to="/forgot-password"
              className="mt-4 inline-block text-sm text-rs-blue hover:underline"
            >
              Request a new link
            </Link>
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
      const result = await resetPasswordFn({
        data: { token, password },
      })

      if (result && 'error' in result && result.error) {
        setError(result.error)
        return
      }

      if (!result || !('success' in result) || !result.success) {
        setError('Password reset failed. Please try again.')
        return
      }

      await router.navigate({ to: '/login' })
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
          <h1 className="mt-5 text-xl font-bold text-rs-dark">Reset password</h1>
          <p className="mt-1 text-sm text-rs-text-light">
            Choose a new password for{' '}
            <span className="font-medium text-rs-dark">{resetInfo.email}</span>
          </p>

          <form
            onSubmit={handleSubmit}
            className="content-stack mt-7"
            aria-busy={loading}
          >
            <label>
              <span className="field-label">New password</span>
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
              {loading ? 'Resetting…' : 'Reset password'}
            </button>
          </form>
        </div>
      </div>
    </AppShell>
  )
}

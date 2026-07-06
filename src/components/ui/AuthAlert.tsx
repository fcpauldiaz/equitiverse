type AuthAlertProps = {
  message: string
  tone?: 'error' | 'info'
}

export function AuthAlert({ message, tone = 'error' }: AuthAlertProps) {
  const toneClass =
    tone === 'info'
      ? 'border-rs-blue/20 bg-rs-blue-soft text-rs-blue'
      : 'border-rs-red/20 bg-rs-red-soft text-rs-red'

  return (
    <p
      role="alert"
      aria-live="polite"
      className={`rounded-xl border px-4 py-3 text-sm ${toneClass}`}
    >
      {message}
    </p>
  )
}

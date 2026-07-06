import { Link } from '@tanstack/react-router'

type LogoProps = {
  variant?: 'default' | 'inverse'
  linked?: boolean
  className?: string
}

export function Logo({
  variant = 'default',
  linked = true,
  className = '',
}: LogoProps) {
  const content = (
    <span
      className={`inline-flex items-baseline text-xl font-bold tracking-tight ${className}`}
    >
      <span className={variant === 'inverse' ? 'text-white' : 'text-rs-dark'}>
        Equiti
      </span>
      <span className={variant === 'inverse' ? 'text-rs-blue' : 'gradient-text-blue'}>
        Verse
      </span>
    </span>
  )

  if (!linked) {
    return content
  }

  return (
    <Link to="/" className="no-underline">
      {content}
    </Link>
  )
}

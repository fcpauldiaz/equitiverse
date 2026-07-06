import { Link } from '@tanstack/react-router'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'

import { Logo } from '#/components/ui/Logo'
import type { SessionUser } from '#/lib/types'

type AppHeaderProps = {
  user: SessionUser | null
}

const subscriberLinks = [
  { to: '/dashboard', label: 'Portfolio' },
  { to: '/settings', label: 'Settings' },
] as const

const adminLinks = [
  { to: '/admin/positions', label: 'Positions' },
  { to: '/admin/subscribers', label: 'Subscribers' },
  { to: '/admin/settings', label: 'Admin' },
] as const

export function AppHeader({ user }: AppHeaderProps) {
  const [open, setOpen] = useState(false)

  const links =
    user?.role === 'admin' ? [...subscriberLinks, ...adminLinks] : subscriberLinks

  return (
    <header className="sticky top-0 z-40 border-b border-rs-border bg-white">
      <div className="mx-auto flex max-w-[1194px] items-center gap-4 shell-gutter py-[var(--space-header-y)] md:py-[var(--space-header-y-md)]">
        <Logo />

        <nav className="ml-auto hidden items-center md:flex">
          {user
            ? links.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="nav-link"
                  activeProps={{ 'data-status': 'active' }}
                >
                  {link.label}
                </Link>
              ))
            : (
                <Link
                  to="/login"
                  className="nav-link"
                  activeProps={{ 'data-status': 'active' }}
                >
                  Sign in
                </Link>
              )}
        </nav>

        <div className="hidden md:block">
          {user ? (
            <Link to="/dashboard" className="btn-gradient text-sm">
              Member Area
            </Link>
          ) : (
            <Link to="/login" className="btn-gradient text-sm">
              Member Area
            </Link>
          )}
        </div>

        <button
          type="button"
          className="ml-auto inline-flex items-center justify-center rounded-lg border-none bg-transparent p-2 text-rs-text-light transition hover:text-rs-text md:hidden"
          aria-expanded={open}
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open ? (
        <div className="border-t border-rs-border bg-white shell-gutter py-3 md:hidden">
          <nav className="flex flex-col gap-1">
            {user
              ? links.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="nav-link rounded-lg px-3 py-2.5"
                    activeProps={{ 'data-status': 'active' }}
                    onClick={() => setOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))
              : (
                  <Link
                    to="/login"
                    className="btn-gradient w-full"
                    onClick={() => setOpen(false)}
                  >
                    Member Area
                  </Link>
                )}
          </nav>
        </div>
      ) : null}
    </header>
  )
}

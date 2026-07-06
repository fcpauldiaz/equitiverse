import type { ReactNode } from 'react'

import { AppFooter } from '#/components/layout/AppFooter'
import { AppHeader } from '#/components/layout/AppHeader'
import type { SessionUser } from '#/lib/types'

type AppShellProps = {
  user: SessionUser | null
  children: ReactNode
  showTicker?: boolean
  ticker?: ReactNode
}

export function AppShell({
  user,
  children,
  showTicker = false,
  ticker,
}: AppShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader user={user} />
      {showTicker ? ticker : null}
      <main className="flex-1">{children}</main>
      <AppFooter />
    </div>
  )
}

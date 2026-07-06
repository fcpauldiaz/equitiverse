import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'

import { isUsMarketHours } from '#/lib/market-data'
import { runQuoteRefreshCron } from '#/server/functions'

function verifyCronSecret(request: Request): boolean {
  const secret = process.env.CRON_SECRET

  if (!secret) {
    return process.env.NODE_ENV !== 'production'
  }

  return request.headers.get('x-cron-secret') === secret
}

export const Route = createFileRoute('/api/cron/refresh-quotes')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!verifyCronSecret(request)) {
          return json({ error: 'Unauthorized' }, { status: 401 })
        }

        if (!isUsMarketHours() && process.env.NODE_ENV === 'production') {
          return json({ skipped: true, reason: 'Outside US market hours' })
        }

        const result = await runQuoteRefreshCron()
        return json(result)
      },
    },
  },
})

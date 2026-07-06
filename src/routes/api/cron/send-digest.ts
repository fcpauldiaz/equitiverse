import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'

import { runDigestCron } from '#/server/functions'

function verifyCronSecret(request: Request): boolean {
  const secret = process.env.CRON_SECRET

  if (!secret) {
    return process.env.NODE_ENV !== 'production'
  }

  return request.headers.get('x-cron-secret') === secret
}

export const Route = createFileRoute('/api/cron/send-digest')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!verifyCronSecret(request)) {
          return json({ error: 'Unauthorized' }, { status: 401 })
        }

        const url = new URL(request.url)
        const frequency =
          url.searchParams.get('frequency') === 'daily' ? 'daily' : 'weekly'

        const result = await runDigestCron(frequency)
        return json({ frequency, ...result })
      },
    },
  },
})

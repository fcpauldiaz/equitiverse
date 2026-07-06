import { isUsMarketHours } from '#/lib/market-data'
import { runDigestCron, runQuoteRefreshCron } from '#/server/functions'

function verifyCronSecret(request: Request): boolean {
  const secret = process.env.CRON_SECRET

  if (!secret) {
    return process.env.NODE_ENV !== 'production'
  }

  return request.headers.get('x-cron-secret') === secret
}

export async function handleApiRequest(
  request: Request,
): Promise<Response | null> {
  const url = new URL(request.url)
  const { pathname } = url

  if (pathname === '/api/health' && request.method === 'GET') {
    return Response.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
    })
  }

  if (pathname === '/api/cron/refresh-quotes' && request.method === 'POST') {
    if (!verifyCronSecret(request)) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!isUsMarketHours() && process.env.NODE_ENV === 'production') {
      return Response.json({ skipped: true, reason: 'Outside US market hours' })
    }

    return Response.json(await runQuoteRefreshCron())
  }

  if (pathname === '/api/cron/send-digest' && request.method === 'POST') {
    if (!verifyCronSecret(request)) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const frequency =
      url.searchParams.get('frequency') === 'daily' ? 'daily' : 'weekly'
    const result = await runDigestCron(frequency)

    return Response.json({ frequency, ...result })
  }

  return null
}

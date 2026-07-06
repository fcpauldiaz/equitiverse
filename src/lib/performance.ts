import type { Callout, QuoteCacheEntry } from '#/db/schema'
import { QUOTE_STALE_AFTER_MS } from '#/lib/market-data'
import type { CalloutWithPerformance, PortfolioSummary } from '#/lib/types'

export function calculateReturnPct(
  entryPrice: number,
  currentOrExitPrice: number,
): number {
  return ((currentOrExitPrice - entryPrice) / entryPrice) * 100
}

export function enrichCallout(
  callout: Callout,
  quote: QuoteCacheEntry | undefined,
  staleAfterMs = QUOTE_STALE_AFTER_MS,
): CalloutWithPerformance {
  const now = Date.now()
  const quoteFetchedAt = quote ? new Date(quote.fetchedAt) : null
  const isStale =
    quoteFetchedAt !== null ? now - quoteFetchedAt.getTime() > staleAfterMs : true

  let currentPrice: number | null = null
  let returnPct: number | null = null

  if (callout.status === 'closed' && callout.exitPrice != null) {
    returnPct = calculateReturnPct(callout.entryPrice, callout.exitPrice)
  } else if (quote) {
    currentPrice = quote.price
    returnPct = calculateReturnPct(callout.entryPrice, quote.price)
  }

  return {
    id: callout.id,
    ticker: callout.ticker,
    entryPrice: callout.entryPrice,
    entryDate: new Date(callout.entryDate),
    exitPrice: callout.exitPrice,
    exitDate: callout.exitDate ? new Date(callout.exitDate) : null,
    status: callout.status,
    thesis: callout.thesis,
    currentPrice,
    returnPct,
    quoteFetchedAt,
    isStale,
  }
}

export function summarizePortfolio(
  callouts: CalloutWithPerformance[],
): PortfolioSummary {
  const withReturns = callouts.filter((c) => c.returnPct !== null)
  const openCount = callouts.filter((c) => c.status === 'open').length
  const closedCount = callouts.filter((c) => c.status === 'closed').length

  if (withReturns.length === 0) {
    return {
      openCount,
      closedCount,
      avgReturnPct: null,
      bestPerformer: null,
      worstPerformer: null,
    }
  }

  const avgReturnPct =
    withReturns.reduce((sum, c) => sum + (c.returnPct ?? 0), 0) /
    withReturns.length

  const sorted = [...withReturns].sort(
    (a, b) => (b.returnPct ?? 0) - (a.returnPct ?? 0),
  )
  const best = sorted[0]
  const worst = sorted[sorted.length - 1]

  return {
    openCount,
    closedCount,
    avgReturnPct,
    bestPerformer:
      best && best.returnPct !== null
        ? { ticker: best.ticker, returnPct: best.returnPct }
        : null,
    worstPerformer:
      worst && worst.returnPct !== null
        ? { ticker: worst.ticker, returnPct: worst.returnPct }
        : null,
  }
}

export function formatReturnPct(value: number | null): string {
  if (value === null) return '—'
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

export function formatPrice(value: number | null): string {
  if (value === null) return '—'
  return `$${value.toFixed(2)}`
}

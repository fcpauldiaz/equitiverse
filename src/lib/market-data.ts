import { eq, inArray } from 'drizzle-orm'

import { db } from '#/db'
import { callouts, quoteCache } from '#/db/schema'
import type { TickerQuote } from '#/lib/types'

type FinnhubQuoteResponse = {
  c: number
  d: number
  dp: number
}

export type MarketDataProvider = {
  fetchQuote: (ticker: string) => Promise<TickerQuote | null>
}

export function createFinnhubProvider(apiKey: string): MarketDataProvider {
  return {
    async fetchQuote(ticker: string): Promise<TickerQuote | null> {
      const url = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(ticker)}&token=${apiKey}`
      const response = await fetch(url)

      if (!response.ok) {
        return null
      }

      const data = (await response.json()) as FinnhubQuoteResponse

      if (!data.c || data.c <= 0) {
        return null
      }

      return {
        ticker: ticker.toUpperCase(),
        price: data.c,
        changePct: data.dp ?? null,
      }
    },
  }
}

export async function refreshQuotesForOpenCallouts(
  provider: MarketDataProvider,
): Promise<{ updated: number; failed: string[] }> {
  const openCallouts = await db
    .select({ ticker: callouts.ticker })
    .from(callouts)
    .where(eq(callouts.status, 'open'))

  const uniqueTickers = [...new Set(openCallouts.map((c) => c.ticker.toUpperCase()))]
  const failed: string[] = []
  let updated = 0

  for (const ticker of uniqueTickers) {
    const quote = await provider.fetchQuote(ticker)

    if (!quote) {
      failed.push(ticker)
      continue
    }

    await db
      .insert(quoteCache)
      .values({
        ticker: quote.ticker,
        price: quote.price,
        changePct: quote.changePct,
        fetchedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: quoteCache.ticker,
        set: {
          price: quote.price,
          changePct: quote.changePct,
          fetchedAt: new Date(),
        },
      })

    updated += 1
  }

  return { updated, failed }
}

export async function getQuotesForTickers(tickers: string[]) {
  if (tickers.length === 0) return []

  return db
    .select()
    .from(quoteCache)
    .where(inArray(quoteCache.ticker, tickers.map((t) => t.toUpperCase())))
}

export function isUsMarketHours(date = new Date()): boolean {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  })

  const parts = formatter.formatToParts(date)
  const weekday = parts.find((p) => p.type === 'weekday')?.value
  const hour = Number(parts.find((p) => p.type === 'hour')?.value)
  const minute = Number(parts.find((p) => p.type === 'minute')?.value)

  if (weekday === 'Sat' || weekday === 'Sun') {
    return false
  }

  const totalMinutes = hour * 60 + minute
  return totalMinutes >= 9 * 60 + 30 && totalMinutes < 16 * 60
}

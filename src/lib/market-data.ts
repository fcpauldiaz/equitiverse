import { eq, inArray } from 'drizzle-orm'

import { db } from '#/db'
import { callouts, quoteCache } from '#/db/schema'
import type { QuoteCacheEntry } from '#/db/schema'
import type { TickerQuote } from '#/lib/types'

export const QUOTE_POLL_INTERVAL_MS = 15_000
export const QUOTE_CACHE_TTL_MARKET_MS = 60_000
export const QUOTE_CACHE_TTL_OFF_MARKET_MS = 900_000
export const QUOTE_STALE_AFTER_MS = 24 * 60 * 60 * 1000

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

export function getMarketDataProvider(): MarketDataProvider | null {
  const apiKey = process.env.FINNHUB_API_KEY
  if (!apiKey) return null
  return createFinnhubProvider(apiKey)
}

async function persistQuote(
  quote: TickerQuote,
  fetchedAt = new Date(),
): Promise<QuoteCacheEntry> {
  await db
    .insert(quoteCache)
    .values({
      ticker: quote.ticker,
      price: quote.price,
      changePct: quote.changePct,
      fetchedAt,
    })
    .onConflictDoUpdate({
      target: quoteCache.ticker,
      set: {
        price: quote.price,
        changePct: quote.changePct,
        fetchedAt,
      },
    })

  return {
    ticker: quote.ticker,
    price: quote.price,
    changePct: quote.changePct,
    fetchedAt,
  }
}

async function getFreshCachedQuotes(
  tickers: string[],
  ttlMs: number,
): Promise<{ fresh: QuoteCacheEntry[]; stale: string[] }> {
  if (tickers.length === 0) {
    return { fresh: [], stale: [] }
  }

  const cached = await db
    .select()
    .from(quoteCache)
    .where(inArray(quoteCache.ticker, tickers))

  const cachedByTicker = new Map(cached.map((entry) => [entry.ticker, entry]))
  const now = Date.now()
  const fresh: QuoteCacheEntry[] = []
  const stale: string[] = []

  for (const ticker of tickers) {
    const entry = cachedByTicker.get(ticker)
    if (entry && now - entry.fetchedAt.getTime() < ttlMs) {
      fresh.push(entry)
    } else {
      stale.push(ticker)
    }
  }

  return { fresh, stale }
}

export async function fetchLiveQuotes(
  tickers: string[],
  provider: MarketDataProvider,
): Promise<{ quotes: TickerQuote[]; failed: string[] }> {
  const uniqueTickers = [...new Set(tickers.map((ticker) => ticker.toUpperCase()))]

  if (uniqueTickers.length === 0) {
    return { quotes: [], failed: [] }
  }

  const ttlMs = getQuoteCacheTtlMs()
  const { fresh, stale } = await getFreshCachedQuotes(uniqueTickers, ttlMs)
  const quotes: TickerQuote[] = fresh.map((entry) => ({
    ticker: entry.ticker,
    price: entry.price,
    changePct: entry.changePct,
  }))
  const failed: string[] = []

  if (stale.length === 0) {
    return { quotes, failed }
  }

  const results = await Promise.all(
    stale.map(async (ticker) => ({
      ticker,
      quote: await provider.fetchQuote(ticker),
    })),
  )

  for (const { ticker, quote } of results) {
    if (!quote) {
      failed.push(ticker)
      continue
    }

    const entry = await persistQuote(quote)
    quotes.push({
      ticker: entry.ticker,
      price: entry.price,
      changePct: entry.changePct,
    })
  }

  return { quotes, failed }
}

export async function refreshQuotesForOpenCallouts(
  provider: MarketDataProvider,
): Promise<{ updated: number; failed: string[] }> {
  const openCallouts = await db
    .select({ ticker: callouts.ticker })
    .from(callouts)
    .where(eq(callouts.status, 'open'))

  const uniqueTickers = openCallouts.map((callout) => callout.ticker)
  const { quotes, failed } = await fetchLiveQuotes(uniqueTickers, provider)

  return { updated: quotes.length, failed }
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

export function getQuoteCacheTtlMs(date = new Date()): number {
  return isUsMarketHours(date)
    ? QUOTE_CACHE_TTL_MARKET_MS
    : QUOTE_CACHE_TTL_OFF_MARKET_MS
}

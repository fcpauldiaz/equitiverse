import { createServerFn } from '@tanstack/react-start'
import { desc, eq, isNull } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { z } from 'zod'

import { db } from '#/db'
import {
  callouts,
  digestLogs,
  quoteCache,
  subscriberPreferences,
  users,
} from '#/db/schema'
import {
  createInviteToken,
  destroySession,
  getCurrentUser,
  loginUser,
  registerSubscriber,
  requireAdmin,
  requireUser,
  validateInviteToken,
} from '#/lib/auth'
import { sendDigestBatch, sendInviteEmail } from '#/lib/email'
import {
  createFinnhubProvider,
  fetchLiveQuotes,
  getMarketDataProvider,
  getQuotesForTickers,
  refreshQuotesForOpenCallouts,
} from '#/lib/market-data'
import {
  enrichCallout,
  formatReturnPct,
  summarizePortfolio,
} from '#/lib/performance'
import type { CalloutWithPerformance, TickerQuote } from '#/lib/types'

async function loadPortfolioData(): Promise<{
  callouts: CalloutWithPerformance[]
  quotes: TickerQuote[]
  marketDataConfigured: boolean
}> {
  const allCallouts = await db
    .select()
    .from(callouts)
    .orderBy(desc(callouts.entryDate))

  const openTickers = [
    ...new Set(
      allCallouts
        .filter((callout) => callout.status === 'open')
        .map((callout) => callout.ticker.toUpperCase()),
    ),
  ]

  const provider = getMarketDataProvider()

  if (provider && openTickers.length > 0) {
    await fetchLiveQuotes(openTickers, provider)
  }

  const cachedQuotes =
    openTickers.length > 0
      ? await getQuotesForTickers(openTickers)
      : []

  const quoteMap = new Map(cachedQuotes.map((quote) => [quote.ticker, quote]))

  const enriched = allCallouts.map((callout) =>
    enrichCallout(callout, quoteMap.get(callout.ticker.toUpperCase()), 60_000),
  )

  const tickerQuotes: TickerQuote[] = openTickers.flatMap((ticker) => {
    const quote = quoteMap.get(ticker)
    if (!quote) return []

    return [
      {
        ticker: quote.ticker,
        price: quote.price,
        changePct: quote.changePct,
      },
    ]
  })

  return {
    callouts: enriched,
    quotes: tickerQuotes,
    marketDataConfigured: Boolean(provider),
  }
}

export const getSessionFn = createServerFn({ method: 'GET' }).handler(
  async () => getCurrentUser(),
)

export const loginFn = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      email: z.string().email(),
      password: z.string().min(8),
    }),
  )
  .handler(async ({ data }) => {
    try {
      return { user: await loginUser(data.email, data.password) }
    } catch {
      return { error: 'Invalid email or password' }
    }
  })

export const logoutFn = createServerFn({ method: 'POST' }).handler(async () => {
  await destroySession()
  return { success: true }
})

export const registerFn = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      email: z.string().email(),
      password: z.string().min(8),
      name: z.string().optional(),
      inviteToken: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    try {
      return {
        user: await registerSubscriber({
          email: data.email,
          password: data.password,
          name: data.name,
          inviteToken: data.inviteToken,
        }),
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Registration failed'

      if (message === 'EMAIL_EXISTS') {
        return { error: 'An account with this email already exists' }
      }

      if (message === 'INVALID_INVITE') {
        return { error: 'Invalid or expired invitation' }
      }

      return { error: 'Registration failed' }
    }
  })

export const getDashboardFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    await requireUser()
    const data = await loadPortfolioData()

    return {
      callouts: data.callouts,
      quotes: data.quotes,
      summary: summarizePortfolio(data.callouts),
      marketDataConfigured: data.marketDataConfigured,
    }
  },
)

export const getCalloutsAdminFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    await requireAdmin()
    return loadPortfolioData()
  },
)

const calloutInputSchema = z.object({
  ticker: z.string().min(1).max(10),
  entryPrice: z.number().positive(),
  entryDate: z.string(),
  thesis: z.string().optional(),
})

export const createCalloutFn = createServerFn({ method: 'POST' })
  .validator(calloutInputSchema)
  .handler(async ({ data }) => {
    const admin = await requireAdmin()

    const id = nanoid()
    const ticker = data.ticker.toUpperCase()

    await db.insert(callouts).values({
      id,
      ticker,
      entryPrice: data.entryPrice,
      entryDate: new Date(data.entryDate),
      thesis: data.thesis ?? null,
      status: 'open',
      createdBy: admin.id,
    })

    const provider = getMarketDataProvider()
    if (provider) {
      await fetchLiveQuotes([ticker], provider)
    }

    return { id }
  })

export const closeCalloutFn = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      id: z.string(),
      exitPrice: z.number().positive(),
      exitDate: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    await requireAdmin()

    await db
      .update(callouts)
      .set({
        status: 'closed',
        exitPrice: data.exitPrice,
        exitDate: new Date(data.exitDate),
        updatedAt: new Date(),
      })
      .where(eq(callouts.id, data.id))

    return { success: true }
  })

export const deleteCalloutFn = createServerFn({ method: 'POST' })
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    await requireAdmin()
    await db.delete(callouts).where(eq(callouts.id, data.id))
    return { success: true }
  })

export const getSubscribersFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    await requireAdmin()

    const rows = await db
      .select({
        user: users,
        preferences: subscriberPreferences,
      })
      .from(users)
      .leftJoin(
        subscriberPreferences,
        eq(users.id, subscriberPreferences.userId),
      )
      .where(eq(users.role, 'subscriber'))
      .orderBy(desc(users.createdAt))

    return rows.map((row) => ({
      id: row.user.id,
      email: row.user.email,
      name: row.user.name,
      disabledAt: row.user.disabledAt,
      digestFrequency: row.preferences?.digestFrequency ?? 'weekly',
      unsubscribedAt: row.preferences?.unsubscribedAt ?? null,
    }))
  },
)

export const inviteSubscriberFn = createServerFn({ method: 'POST' })
  .validator(z.object({ email: z.string().email() }))
  .handler(async ({ data }) => {
    const admin = await requireAdmin()
    const token = await createInviteToken(data.email, admin.id)
    const sent = await sendInviteEmail({ email: data.email, token })

    return {
      token,
      inviteUrl: `${process.env.BETTER_AUTH_URL ?? 'http://localhost:3000'}/invite/${token}`,
      emailSent: sent,
    }
  })

export const disableSubscriberFn = createServerFn({ method: 'POST' })
  .validator(z.object({ userId: z.string() }))
  .handler(async ({ data }) => {
    await requireAdmin()

    await db
      .update(users)
      .set({ disabledAt: new Date(), updatedAt: new Date() })
      .where(eq(users.id, data.userId))

    return { success: true }
  })

export const updateDigestPreferenceFn = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      digestFrequency: z.enum(['daily', 'weekly', 'none']),
      unsubscribe: z.boolean().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const user = await requireUser()

    await db
      .insert(subscriberPreferences)
      .values({
        userId: user.id,
        digestFrequency: data.digestFrequency,
        unsubscribedAt: data.unsubscribe ? new Date() : null,
      })
      .onConflictDoUpdate({
        target: subscriberPreferences.userId,
        set: {
          digestFrequency: data.digestFrequency,
          unsubscribedAt: data.unsubscribe ? new Date() : null,
        },
      })

    return { success: true }
  })

export const refreshQuotesFn = createServerFn({ method: 'POST' }).handler(
  async () => {
    await requireAdmin()

    const apiKey = process.env.FINNHUB_API_KEY

    if (!apiKey) {
      return { error: 'FINNHUB_API_KEY not configured', updated: 0, failed: [] }
    }

    const provider = createFinnhubProvider(apiKey)
    const result = await refreshQuotesForOpenCallouts(provider)

    return result
  },
)

export const sendDigestNowFn = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      frequency: z.enum(['daily', 'weekly', 'manual']).default('manual'),
    }),
  )
  .handler(async ({ data }) => {
    await requireAdmin()

    const portfolio = await loadPortfolioData()
    const recipients = await db
      .select({
        userId: users.id,
        email: users.email,
        digestFrequency: subscriberPreferences.digestFrequency,
        unsubscribedAt: subscriberPreferences.unsubscribedAt,
        disabledAt: users.disabledAt,
      })
      .from(users)
      .innerJoin(
        subscriberPreferences,
        eq(users.id, subscriberPreferences.userId),
      )
      .where(eq(users.role, 'subscriber'))

    const activeRecipients = recipients.filter(
      (r) => !r.unsubscribedAt && !r.disabledAt && r.digestFrequency !== 'none',
    )

    const filtered =
      data.frequency === 'manual'
        ? activeRecipients
        : activeRecipients.filter((r) => r.digestFrequency === data.frequency)

    const sent = await sendDigestBatch({
      recipients: filtered.map((r) => ({
        email: r.email,
        userId: r.userId,
      })),
      summary: summarizePortfolio(portfolio.callouts),
      callouts: portfolio.callouts,
      frequency: data.frequency,
    })

    await db.insert(digestLogs).values({
      id: nanoid(),
      recipientCount: sent,
      type: data.frequency,
    })

    return { sent }
  })

export const getInviteInfoFn = createServerFn({ method: 'GET' })
  .validator(z.object({ token: z.string() }))
  .handler(async ({ data }) => {
    const invite = await validateInviteToken(data.token)

    if (!invite) {
      return { valid: false as const }
    }

    return { valid: true as const, email: invite.email }
  })

export const getSettingsFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const user = await requireUser()

    const [prefs] = await db
      .select()
      .from(subscriberPreferences)
      .where(eq(subscriberPreferences.userId, user.id))
      .limit(1)

    const openCallouts = await db
      .select({ id: callouts.id })
      .from(callouts)
      .where(eq(callouts.status, 'open'))

    const [latestQuote] = await db
      .select()
      .from(quoteCache)
      .orderBy(desc(quoteCache.fetchedAt))
      .limit(1)

    return {
      digestFrequency: prefs?.digestFrequency ?? 'weekly',
      unsubscribedAt: prefs?.unsubscribedAt ?? null,
      finnhubConfigured: Boolean(process.env.FINNHUB_API_KEY),
      resendConfigured: Boolean(process.env.RESEND_API_KEY),
      openCalloutCount: openCallouts.length,
      lastQuoteAt: latestQuote?.fetchedAt ?? null,
      avgReturnLabel: formatReturnPct(
        summarizePortfolio(
          (await loadPortfolioData()).callouts,
        ).avgReturnPct,
      ),
    }
  },
)

export async function runDigestCron(frequency: 'daily' | 'weekly') {
  const portfolio = await loadPortfolioData()

  const recipients = await db
    .select({
      userId: users.id,
      email: users.email,
      digestFrequency: subscriberPreferences.digestFrequency,
      unsubscribedAt: subscriberPreferences.unsubscribedAt,
      disabledAt: users.disabledAt,
    })
    .from(users)
    .innerJoin(
      subscriberPreferences,
      eq(users.id, subscriberPreferences.userId),
    )
    .where(eq(users.role, 'subscriber'))

  const active = recipients.filter(
    (r) =>
      !r.unsubscribedAt &&
      !r.disabledAt &&
      r.digestFrequency === frequency,
  )

  const sent = await sendDigestBatch({
    recipients: active.map((r) => ({ email: r.email, userId: r.userId })),
    summary: summarizePortfolio(portfolio.callouts),
    callouts: portfolio.callouts,
    frequency,
  })

  await db.insert(digestLogs).values({
    id: nanoid(),
    recipientCount: sent,
    type: frequency,
  })

  return { sent }
}

export async function runQuoteRefreshCron() {
  const apiKey = process.env.FINNHUB_API_KEY

  if (!apiKey) {
    return { updated: 0, failed: [], error: 'FINNHUB_API_KEY not configured' }
  }

  const provider = createFinnhubProvider(apiKey)
  return refreshQuotesForOpenCallouts(provider)
}

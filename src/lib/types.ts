export type UserRole = 'admin' | 'subscriber'

export type CalloutStatus = 'open' | 'closed'

export type DigestFrequency = 'daily' | 'weekly' | 'none'

export type SessionUser = {
  id: string
  email: string
  name: string | null
  role: UserRole
}

export type CalloutWithPerformance = {
  id: string
  ticker: string
  entryPrice: number
  entryDate: Date
  exitPrice: number | null
  exitDate: Date | null
  status: CalloutStatus
  thesis: string | null
  currentPrice: number | null
  returnPct: number | null
  quoteFetchedAt: Date | null
  isStale: boolean
}

export type PortfolioSummary = {
  openCount: number
  closedCount: number
  avgReturnPct: number | null
  bestPerformer: { ticker: string; returnPct: number } | null
  worstPerformer: { ticker: string; returnPct: number } | null
}

export type TickerQuote = {
  ticker: string
  price: number
  changePct: number | null
}

export type NewPositionNotification = {
  ticker: string
  entryPrice: number
  entryDate: Date
  thesis: string | null
  currentPrice: number | null
  returnPct: number | null
}

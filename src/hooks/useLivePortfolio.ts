import { useEffect, useState } from 'react'

import { QUOTE_POLL_INTERVAL_MS } from '#/lib/market-data'
import type {
  CalloutWithPerformance,
  PortfolioSummary,
  TickerQuote,
} from '#/lib/types'
import { getDashboardFn } from '#/server/functions'

type LivePortfolioData = {
  callouts: CalloutWithPerformance[]
  quotes: TickerQuote[]
  summary: PortfolioSummary
}

export function useLivePortfolio(initial: LivePortfolioData): LivePortfolioData {
  const [data, setData] = useState(initial)

  useEffect(() => {
    setData(initial)
  }, [initial])

  useEffect(() => {
    let active = true

    async function refresh() {
      try {
        const fresh = await getDashboardFn()
        if (active) {
          setData(fresh)
        }
      } catch {
        // Keep showing the last successful snapshot.
      }
    }

    const intervalId = window.setInterval(refresh, QUOTE_POLL_INTERVAL_MS)

    return () => {
      active = false
      window.clearInterval(intervalId)
    }
  }, [])

  return data
}

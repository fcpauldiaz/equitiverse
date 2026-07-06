import { queryOptions } from '@tanstack/react-query'

import { QUOTE_POLL_INTERVAL_MS } from '#/lib/market-data'
import { getDashboardFn } from '#/server/functions'

export const dashboardQueryOptions = () =>
  queryOptions({
    queryKey: ['dashboard'],
    queryFn: () => getDashboardFn(),
    staleTime: QUOTE_POLL_INTERVAL_MS,
  })

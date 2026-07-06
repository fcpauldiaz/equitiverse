import { TrendingUp } from 'lucide-react'

import type { CalloutWithPerformance } from '#/lib/types'
import { formatPrice, formatReturnPct } from '#/lib/performance'

type CalloutTableProps = {
  callouts: CalloutWithPerformance[]
}

export function CalloutTable({ callouts }: CalloutTableProps) {
  if (callouts.length === 0) {
    return (
      <div className="rs-card rs-card-spacious flex flex-col items-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rs-blue-soft text-rs-blue">
          <TrendingUp size={22} aria-hidden />
        </div>
        <h3 className="text-lg font-semibold text-rs-dark">No positions yet</h3>
        <p className="mt-2 max-w-sm text-sm text-rs-text-light">
          When RS publishes a new equity position, it will appear here with
          entry price, current quote, and return.
        </p>
      </div>
    )
  }

  return (
    <div className="rs-card rs-card-flush">
      <div className="overflow-x-auto">
        <table className="data-table min-w-[760px]">
          <thead>
            <tr>
              <th className="font-semibold">Ticker</th>
              <th className="font-semibold">Entry</th>
              <th className="font-semibold">Entry date</th>
              <th className="font-semibold">Current / exit</th>
              <th className="font-semibold">Return</th>
              <th className="font-semibold">Status</th>
              <th className="font-semibold">Thesis</th>
            </tr>
          </thead>
          <tbody>
            {callouts.map((callout) => {
              const currentOrExit =
                callout.status === 'closed'
                  ? callout.exitPrice
                  : callout.currentPrice

              return (
                <tr key={callout.id}>
                  <td className="font-semibold text-rs-blue">{callout.ticker}</td>
                  <td className="tabular-nums">
                    {formatPrice(callout.entryPrice)}
                  </td>
                  <td className="text-rs-text-light">
                    {callout.entryDate.toLocaleDateString()}
                  </td>
                  <td className="tabular-nums">
                    <span>{formatPrice(currentOrExit)}</span>
                    {callout.status === 'open' && callout.isStale ? (
                      <span className="badge badge-stale ml-2">Stale</span>
                    ) : null}
                  </td>
                  <td
                    className={`font-semibold tabular-nums ${
                      (callout.returnPct ?? 0) >= 0
                        ? 'text-rs-green'
                        : 'text-rs-red'
                    }`}
                  >
                    {formatReturnPct(callout.returnPct)}
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        callout.status === 'open'
                          ? 'badge-open'
                          : 'badge-closed'
                      }`}
                    >
                      {callout.status}
                    </span>
                  </td>
                  <td className="max-w-xs text-rs-text-light">
                    {callout.thesis ?? '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

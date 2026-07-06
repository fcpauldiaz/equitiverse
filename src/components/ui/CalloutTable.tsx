import { TrendingUp } from 'lucide-react'

import type { CalloutWithPerformance } from '#/lib/types'
import { formatPrice, formatReturnPct } from '#/lib/performance'

type CalloutTableProps = {
  callouts: CalloutWithPerformance[]
  onEdit?: (callout: CalloutWithPerformance) => void
  onClose?: (id: string) => void
  onDelete?: (id: string) => void
}

export function CalloutTable({
  callouts,
  onEdit,
  onClose,
  onDelete,
}: CalloutTableProps) {
  const showActions = Boolean(onEdit || onClose || onDelete)

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
        <table
          className={`data-table ${showActions ? 'min-w-[980px]' : 'min-w-[760px]'}`}
        >
          <thead>
            <tr>
              <th className="font-semibold">Ticker</th>
              <th className="font-semibold">Entry</th>
              <th className="font-semibold">Entry date</th>
              <th className="font-semibold">Current / exit</th>
              <th className="font-semibold">Return</th>
              <th className="font-semibold">Status</th>
              <th className="font-semibold">Thesis</th>
              {showActions ? (
                <th className="font-semibold">Actions</th>
              ) : null}
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
                  {showActions ? (
                    <td>
                      <div className="flex flex-wrap gap-2">
                        {onEdit ? (
                          <button
                            type="button"
                            onClick={() => onEdit(callout)}
                            className="inline-flex cursor-pointer items-center rounded-lg border-none bg-transparent px-2 py-1 text-xs font-medium text-rs-blue transition hover:text-rs-blue/80"
                          >
                            Edit
                          </button>
                        ) : null}
                        {callout.status === 'open' && onClose ? (
                          <button
                            type="button"
                            onClick={() => onClose(callout.id)}
                            className="btn-gradient-outline btn-secondary-light text-xs"
                          >
                            <span>Close</span>
                          </button>
                        ) : null}
                        {onDelete ? (
                          <button
                            type="button"
                            onClick={() => onDelete(callout.id)}
                            className="inline-flex cursor-pointer items-center rounded-lg border-none bg-transparent px-2 py-1 text-xs font-medium text-rs-red transition hover:text-rs-red/80"
                          >
                            Delete
                          </button>
                        ) : null}
                      </div>
                    </td>
                  ) : null}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

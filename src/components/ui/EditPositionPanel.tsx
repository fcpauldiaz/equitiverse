import { useState } from 'react'

import type { CalloutWithPerformance } from '#/lib/types'
import { updateCalloutFn } from '#/server/functions'

type EditPositionPanelProps = {
  callout: CalloutWithPerformance
  onCancel: () => void
  onSaved: () => void
}

function formatDateInput(date: Date | null): string {
  if (!date) return ''
  return date.toISOString().slice(0, 10)
}

export function EditPositionPanel({
  callout,
  onCancel,
  onSaved,
}: EditPositionPanelProps) {
  const [ticker, setTicker] = useState(callout.ticker)
  const [entryPrice, setEntryPrice] = useState(String(callout.entryPrice))
  const [entryDate, setEntryDate] = useState(formatDateInput(callout.entryDate))
  const [thesis, setThesis] = useState(callout.thesis ?? '')
  const [exitPrice, setExitPrice] = useState(
    callout.exitPrice != null ? String(callout.exitPrice) : '',
  )
  const [exitDate, setExitDate] = useState(formatDateInput(callout.exitDate))
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError(null)

    const result = await updateCalloutFn({
      data: {
        id: callout.id,
        ticker,
        entryPrice: Number(entryPrice),
        entryDate,
        thesis: thesis || undefined,
        exitPrice:
          callout.status === 'closed' ? Number(exitPrice) : undefined,
        exitDate: callout.status === 'closed' ? exitDate : undefined,
      },
    })

    setSaving(false)

    if ('error' in result && result.error) {
      setError(result.error)
      return
    }

    onSaved()
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rs-card content-stack-tight mb-[var(--space-stack-md)] md:grid md:grid-cols-2"
    >
      <div className="md:col-span-2">
        <h3 className="text-lg font-semibold text-rs-dark">
          Edit {callout.ticker}
        </h3>
      </div>

      <label>
        <span className="field-label">Ticker</span>
        <input
          required
          value={ticker}
          onChange={(e) => setTicker(e.target.value.toUpperCase())}
          className="field-input uppercase"
        />
      </label>
      <label>
        <span className="field-label">Entry price</span>
        <input
          required
          type="number"
          step="0.01"
          min="0"
          value={entryPrice}
          onChange={(e) => setEntryPrice(e.target.value)}
          className="field-input"
        />
      </label>
      <label>
        <span className="field-label">Entry date</span>
        <input
          required
          type="date"
          value={entryDate}
          onChange={(e) => setEntryDate(e.target.value)}
          className="field-input"
        />
      </label>
      {callout.status === 'closed' ? (
        <>
          <label>
            <span className="field-label">Exit price</span>
            <input
              required
              type="number"
              step="0.01"
              min="0"
              value={exitPrice}
              onChange={(e) => setExitPrice(e.target.value)}
              className="field-input"
            />
          </label>
          <label>
            <span className="field-label">Exit date</span>
            <input
              required
              type="date"
              value={exitDate}
              onChange={(e) => setExitDate(e.target.value)}
              className="field-input"
            />
          </label>
        </>
      ) : null}
      <label className="md:col-span-2">
        <span className="field-label">Thesis (optional)</span>
        <textarea
          value={thesis}
          onChange={(e) => setThesis(e.target.value)}
          rows={3}
          className="field-textarea"
        />
      </label>

      {error ? (
        <p className="md:col-span-2 rounded-lg bg-rs-red/10 px-3 py-2 text-sm text-rs-red">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3 md:col-span-2">
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? 'Saving…' : 'Save changes'}
        </button>
        <button type="button" onClick={onCancel} className="btn-ghost">
          Cancel
        </button>
      </div>
    </form>
  )
}

import type { TickerQuote } from '#/lib/types'
import { formatPrice } from '#/lib/performance'

type PriceTickerProps = {
  quotes: TickerQuote[]
}

export function PriceTicker({ quotes }: PriceTickerProps) {
  if (quotes.length === 0) {
    return (
      <div className="marquee-bar px-4 py-3 text-center text-sm text-white/60">
        Quotes will appear here once market data is configured.
      </div>
    )
  }

  const items = [...quotes, ...quotes]

  return (
    <div className="marquee-bar overflow-hidden py-3" aria-label="Live quote ticker">
      <div className="ticker-track flex w-max gap-8 whitespace-nowrap">
        {items.map((quote, index) => (
          <div
            key={`${quote.ticker}-${index}`}
            className="flex items-center gap-3 px-4 text-sm uppercase text-white"
          >
            <span className="font-semibold text-rs-blue">{quote.ticker}</span>
            <span className="tabular-nums text-white/90">
              {formatPrice(quote.price)}
            </span>
            {quote.changePct !== null ? (
              <span
                className={`tabular-nums ${
                  quote.changePct >= 0 ? 'text-rs-green' : 'text-rs-red'
                }`}
              >
                {quote.changePct >= 0 ? '+' : ''}
                {quote.changePct.toFixed(2)}%
              </span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}

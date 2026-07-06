type StatCardProps = {
  label: string
  value: string
  tone?: 'default' | 'positive' | 'negative'
}

export function StatCard({ label, value, tone = 'default' }: StatCardProps) {
  const valueClass =
    tone === 'positive'
      ? 'text-rs-green'
      : tone === 'negative'
        ? 'text-rs-red'
        : 'gradient-text-blue'

  return (
    <div className="rs-card">
      <p className="text-sm font-medium text-rs-text-light">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${valueClass}`}>{value}</p>
    </div>
  )
}

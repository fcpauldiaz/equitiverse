import type { ReactNode } from 'react'

type SectionTitleProps = {
  label: string
  title: string
  description?: string
  action?: ReactNode
}

export function SectionTitle({
  label,
  title,
  description,
  action,
}: SectionTitleProps) {
  return (
    <div className="section-header flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        <div className="common-title">
          <span className="common-title-label">{label}</span>
          <span className="common-title-line" />
        </div>
        <h2 className="text-3xl font-bold text-rs-text md:text-4xl">{title}</h2>
        {description ? (
          <p className="mt-3 max-w-2xl text-base text-rs-text-light">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  )
}

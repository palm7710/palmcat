import type { ReactNode } from 'react'

type SectionLabelProps = {
  children: ReactNode
  detail: ReactNode
}

export function SectionLabel({ children, detail }: SectionLabelProps) {
  return (
    <div className="section-label">
      {children}
      <span>{detail}</span>
    </div>
  )
}

'use client'

import StatNumber from '@/components/ui/stat-number'
import AnimatedPanel from './animated-panel'
import { fmt } from '@/lib/utils/format'

const FORMATTERS = {
  currency: fmt,
  int: (v: number) => String(Math.round(v)),
} as const

export default function MiniStat({
  label,
  value,
  kind = 'currency',
  color = 'var(--app-ink-primary)',
  delay = 0,
}: {
  label: string
  value: number
  kind?: keyof typeof FORMATTERS
  color?: string
  delay?: number
}) {
  return (
    <AnimatedPanel delay={delay} className="rounded-2xl p-4" style={{ background: 'var(--app-bg-surface)' }}>
      <p className="text-[11px] uppercase tracking-wide mb-1.5" style={{ color: 'var(--app-ink-tertiary)' }}>{label}</p>
      <StatNumber value={value} format={FORMATTERS[kind]} className="text-base font-medium" style={{ color }} />
    </AnimatedPanel>
  )
}

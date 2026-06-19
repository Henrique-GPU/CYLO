'use client'

import { motion } from 'framer-motion'
import StatNumber from '@/components/ui/stat-number'
import { fmt } from '@/lib/utils/format'

export default function FinanceiroHero({
  lucro,
  receita,
  comissoes,
  margemPct,
  mes,
}: {
  lucro: number
  receita: number
  comissoes: number
  margemPct: string
  mes: string
}) {
  return (
    <div className="mb-7">
      <motion.p
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-sm capitalize"
        style={{ color: 'var(--app-ink-secondary)' }}
      >
        Lucro líquido · {mes}
      </motion.p>

      <StatNumber
        value={lucro}
        format={fmt}
        className="font-semibold tracking-tight text-[34px] sm:text-[44px] lg:text-[56px]"
        style={{ lineHeight: 1, color: 'var(--app-profit)' }}
      />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="flex items-center gap-6 mt-5 flex-wrap"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm" style={{ color: 'var(--app-ink-secondary)' }}>Receita bruta</span>
          <span className="text-base font-medium" style={{ color: 'var(--app-ink-primary)' }}>{fmt(receita)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm" style={{ color: 'var(--app-ink-secondary)' }}>Comissões</span>
          <span className="text-base font-medium" style={{ color: '#f59e0b' }}>{fmt(comissoes)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm" style={{ color: 'var(--app-ink-secondary)' }}>Margem</span>
          <span className="text-base font-medium" style={{ color: 'var(--app-ink-primary)' }}>{margemPct}%</span>
        </div>
      </motion.div>
    </div>
  )
}

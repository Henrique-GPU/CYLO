'use client'

import { motion } from 'framer-motion'
import StatNumber from '@/components/ui/stat-number'
import { fmt } from '@/lib/utils/format'

function saudacao() {
  const h = new Date().getHours()
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'
}

export default function GreetingHero({
  nome,
  faturamento,
  faturamentoVar,
  lucro,
  periodoLabel,
  metaPct,
  metaValor,
  periodoSelector,
}: {
  nome: string
  faturamento: number
  faturamentoVar: number | null
  lucro: number
  periodoLabel: string
  metaPct: number | null
  metaValor: number | null
  periodoSelector: React.ReactNode
}) {
  const primeiroNome = nome.split(' ')[0]

  return (
    <div className="mb-7">
      <div className="flex items-start justify-between gap-3 flex-wrap mb-1">
        <motion.p
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-sm"
          style={{ color: 'var(--app-ink-secondary)' }}
        >
          {saudacao()}, {primeiroNome}
        </motion.p>
        {periodoSelector}
      </div>

      <div className="flex items-end gap-3 flex-wrap">
        <StatNumber
          value={faturamento}
          format={fmt}
          className="font-semibold tracking-tight"
          style={{ fontSize: 56, lineHeight: 1, color: 'var(--app-ink-primary)' }}
        />
        {faturamentoVar !== null && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-sm font-medium pb-2"
            style={{ color: faturamentoVar >= 0 ? 'var(--app-profit)' : 'var(--app-alert)' }}
          >
            {faturamentoVar >= 0 ? '▲' : '▼'} {Math.abs(faturamentoVar)}%
          </motion.span>
        )}
      </div>
      <p className="text-sm mt-1" style={{ color: 'var(--app-ink-secondary)' }}>
        faturado {periodoLabel}
      </p>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="flex items-center gap-6 mt-5 flex-wrap"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm" style={{ color: 'var(--app-ink-secondary)' }}>Lucro previsto</span>
          <span className="text-base font-medium" style={{ color: 'var(--app-profit)' }}>{fmt(lucro)}</span>
        </div>

        {metaPct !== null && metaValor !== null && (
          <div className="flex items-center gap-2.5 min-w-[160px]">
            <span className="text-sm" style={{ color: 'var(--app-ink-secondary)' }}>Meta do mês</span>
            <div className="w-20 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'var(--app-profit)' }}
                initial={{ width: 0 }}
                animate={{ width: `${metaPct}%` }}
                transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
              />
            </div>
            <span className="text-sm font-medium" style={{ color: 'var(--app-ink-primary)' }}>{metaPct.toFixed(0)}%</span>
          </div>
        )}
      </motion.div>
    </div>
  )
}

'use client'

import { motion } from 'framer-motion'

export default function InsightBanner({ alertas }: { alertas: string[] }) {
  if (alertas.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      className="rounded-2xl p-4 mb-3.5"
      style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.16)' }}
    >
      <div className="flex flex-col gap-1.5">
        {alertas.map((a, i) => (
          <motion.p
            key={a}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.2 + i * 0.08 }}
            className="text-[13px]"
            style={{ color: 'var(--app-ink-primary)' }}
          >
            {a}
          </motion.p>
        ))}
      </div>
    </motion.div>
  )
}

'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronUp, X } from 'lucide-react'
import { fmt } from '@/lib/utils/format'
import ResumoPanel, { type ResumoPanelProps } from './resumo-panel'

export default function ResumoMobileBar(props: ResumoPanelProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="lg:hidden">
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-16 left-0 right-0 z-40 flex items-center justify-between px-5 py-3.5"
        style={{ background: 'var(--app-bg-elevated)', borderTop: '1px solid var(--app-hairline)' }}
      >
        <div className="text-left">
          <p className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--app-ink-tertiary)' }}>Cliente paga</p>
          <motion.p
            key={Math.round(props.clientePaga * 100)}
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 1 }}
            className="text-lg font-semibold"
            style={{ color: 'var(--app-ink-primary)' }}
          >
            {fmt(props.clientePaga)}
          </motion.p>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-medium text-[#4f7eff]">
          Ver resumo <ChevronUp size={14} />
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40"
              style={{ background: 'rgba(0,0,0,0.5)' }}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 32 }}
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl p-5 max-h-[85vh] overflow-y-auto"
              style={{ background: 'var(--app-bg-elevated)' }}
            >
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium" style={{ color: 'var(--app-ink-primary)' }}>Resumo da negociação</p>
                <button onClick={() => setOpen(false)} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10" style={{ color: 'var(--app-ink-secondary)' }}>
                  <X size={16} />
                </button>
              </div>
              <ResumoPanel {...props} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

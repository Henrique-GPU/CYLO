'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { MeshBackground } from './mesh-background'

function Counter({ to, suffix = '', prefix = '' }: { to: number; suffix?: string; prefix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!inView) return
    const duration = 1200
    const start = performance.now()
    function tick(now: number) {
      const progress = Math.min((now - start) / duration, 1)
      setValue(Math.round(to * (1 - Math.pow(1 - progress, 3))))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [inView, to])

  return (
    <span ref={ref}>
      {prefix}{value.toLocaleString('pt-BR')}{suffix}
    </span>
  )
}

const METRICS = [
  { to: 10, suffix: '+', label: 'Lojas ativas' },
  { to: 300, prefix: 'R$ ', suffix: 'k+', label: 'Em vendas controladas' },
  { to: 100, suffix: '%', label: 'Rastreio por IMEI' },
  { to: 15, suffix: ' dias', label: 'Grátis para testar' },
]

export default function MetricsSection() {
  return (
    <section className="relative bg-[#0a0c12] px-5 py-24 sm:py-28 overflow-hidden">
      <MeshBackground variant="dark" />
      <div className="relative max-w-5xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-6 text-center">
        {METRICS.map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
          >
            <p className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              <Counter to={m.to} prefix={m.prefix} suffix={m.suffix} />
            </p>
            <p className="text-xs sm:text-sm text-white/40 mt-2 uppercase tracking-wider">{m.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

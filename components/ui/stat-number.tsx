'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'

export default function StatNumber({
  value,
  format,
  className = '',
  style,
  duration = 900,
}: {
  value: number
  format: (v: number) => string
  className?: string
  style?: React.CSSProperties
  duration?: number
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (!inView) return
    const start = performance.now()
    function tick(now: number) {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(value * eased)
      if (progress < 1) requestAnimationFrame(tick)
      else setDisplay(value)
    }
    requestAnimationFrame(tick)
  }, [inView, value, duration])

  return (
    <motion.span
      ref={ref}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={className}
      style={style}
    >
      {format(display)}
    </motion.span>
  )
}

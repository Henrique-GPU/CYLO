'use client'

import { motion } from 'framer-motion'

export default function AnimatedPanel({
  delay = 0,
  className = '',
  style,
  hover = true,
  children,
}: {
  delay?: number
  className?: string
  style?: React.CSSProperties
  hover?: boolean
  children: React.ReactNode
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: 'easeOut' }}
      whileHover={hover ? { y: -2 } : undefined}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  )
}

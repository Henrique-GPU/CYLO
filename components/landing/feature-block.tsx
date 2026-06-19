'use client'

import { motion } from 'framer-motion'

export default function FeatureBlock({
  eyebrow,
  title,
  description,
  mockup,
  reverse = false,
}: {
  eyebrow: string
  title: string
  description: string
  mockup: React.ReactNode
  reverse?: boolean
}) {
  return (
    <section className="relative bg-white px-5 py-20 sm:py-28">
      <div
        className={`max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-10 lg:gap-16 items-center ${
          reverse ? 'lg:[&>*:first-child]:order-2' : ''
        }`}
      >
        <motion.div
          initial={{ opacity: 0, x: reverse ? 24 : -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-xs font-bold text-[#4f7eff] uppercase tracking-[0.15em] mb-4">{eyebrow}</p>
          <h3 className="text-3xl sm:text-4xl font-black tracking-tight leading-[1.1] mb-5 text-[#0f172a]">
            {title}
          </h3>
          <p className="text-gray-400 text-lg leading-relaxed">{description}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {mockup}
        </motion.div>
      </div>
    </section>
  )
}

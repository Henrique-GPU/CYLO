'use client'

import { motion } from 'framer-motion'
import { MeshBackground } from './mesh-background'

export default function RevealSection() {
  return (
    <section className="relative bg-[#0a0c12] px-5 py-32 sm:py-40 overflow-hidden">
      <MeshBackground variant="dark" />
      <div className="relative max-w-2xl mx-auto text-center">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-xs font-bold text-[#7c9bff] uppercase tracking-[0.2em] mb-6"
        >
          Isso muda agora
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, scale: 0.92 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-[1.05]"
        >
          Toda a sua loja,<br />numa tela só.
        </motion.h2>
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-12 inline-block"
        >
          <div className="w-2 h-2 rounded-full bg-[#4f7eff] mx-auto shadow-[0_0_40px_12px_rgba(79,126,255,0.6)]" />
        </motion.div>
      </div>
    </section>
  )
}

'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { MeshBackground } from './mesh-background'

export default function CtaFinal() {
  return (
    <section className="relative bg-[#0a0c12] px-5 py-28 sm:py-36 overflow-hidden">
      <MeshBackground variant="dark" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative max-w-xl mx-auto text-center"
      >
        <h2 className="text-4xl sm:text-5xl font-black text-white mb-4 tracking-tight leading-[1.05]">
          Pare de controlar<br />sua loja no escuro.
        </h2>
        <p className="text-white/40 text-base mb-9">Sua concorrência já está se organizando.</p>
        <Link
          href="/cadastro"
          className="inline-flex items-center gap-2 bg-[#4f7eff] hover:bg-[#3d6eef] text-white font-black px-9 py-[18px] rounded-2xl text-base transition-all shadow-lg shadow-[#4f7eff]/30 hover:shadow-xl hover:shadow-[#4f7eff]/40 hover:scale-[1.02]"
        >
          Criar conta grátis →
        </Link>
        <p className="text-white/30 text-sm mt-5">15 dias grátis · sem cartão · começa em 1 minuto</p>
      </motion.div>
    </section>
  )
}

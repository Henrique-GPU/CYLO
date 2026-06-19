'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Check } from 'lucide-react'

const FEATURES = [
  'Estoque por IMEI ilimitado',
  'Vendas com cálculo de comissão automático',
  'Orçamentos e recibos profissionais',
  'Dashboard em tempo real',
  'Funciona no celular e no computador',
]

export default function PricingSection() {
  return (
    <section className="relative bg-white px-5 py-24 sm:py-32">
      <div className="max-w-md mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl sm:text-4xl font-black text-center mb-12 tracking-tight text-[#0f172a]"
        >
          Um plano simples, sem pegadinha
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          whileHover={{ scale: 1.015, y: -4 }}
          className="relative group"
        >
          <div className="absolute -inset-1 rounded-[32px] bg-gradient-to-br from-[#4f7eff]/30 via-[#4f7eff]/10 to-transparent blur-xl opacity-60 group-hover:opacity-100 transition-opacity duration-500" />

          <div className="relative bg-white border border-gray-100 rounded-[28px] p-9 shadow-2xl shadow-[#4f7eff]/10">
            <div className="inline-flex items-center gap-2 bg-[#4f7eff]/8 rounded-full px-4 py-1.5 mb-7">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4f7eff] animate-pulse" />
              <span className="text-xs font-bold text-[#4f7eff] uppercase tracking-wider">15 dias grátis para começar</span>
            </div>

            <div className="flex items-end gap-1 mb-1">
              <span className="text-5xl font-black text-[#0f172a] tracking-tight">R$ 59,90</span>
              <span className="text-gray-400 text-sm mb-2">/mês</span>
            </div>
            <p className="text-gray-400 text-sm mb-8">Sem fidelidade. Cancela quando quiser.</p>

            <ul className="text-sm text-gray-600 space-y-3.5 mb-9">
              {FEATURES.map(f => (
                <li key={f} className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#4f7eff]/10 text-[#4f7eff] flex-shrink-0">
                    <Check size={12} strokeWidth={3} />
                  </span>
                  {f}
                </li>
              ))}
            </ul>

            <Link
              href="/cadastro"
              className="block w-full bg-[#4f7eff] hover:bg-[#3d6eef] text-white font-bold py-4 rounded-2xl text-base transition-all text-center shadow-lg shadow-[#4f7eff]/25 hover:shadow-xl hover:shadow-[#4f7eff]/30"
            >
              Começar meus 15 dias grátis
            </Link>
            <p className="text-xs text-gray-400 mt-3 text-center">Sem cartão de crédito</p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

'use client'

import { motion } from 'framer-motion'

const ITEMS = [
  { icon: '📝', text: 'Planilha desatualizada, ninguém sabe quem editou por último.' },
  { icon: '💬', text: 'Venda fechada no WhatsApp, sem nenhum registro formal.' },
  { icon: '📄', text: 'Anotação em papel de quanto cada vendedor vendeu no mês.' },
]

export default function PainSection() {
  return (
    <section className="relative bg-white px-5 py-28 sm:py-36 overflow-hidden">
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        <div>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl sm:text-4xl font-black tracking-tight leading-[1.1] mb-5 text-[#0f172a]"
          >
            É assim que a maioria das lojas ainda controla o negócio.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-gray-400 text-lg leading-relaxed"
          >
            Estoque na cabeça, vendas no WhatsApp, comissão no papel. Funciona — até a loja crescer.
          </motion.p>
        </div>

        <div className="space-y-3">
          {ITEMS.map((item, i) => (
            <motion.div
              key={item.text}
              initial={{ opacity: 0, x: 24, filter: 'blur(4px)' }}
              whileInView={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              className="flex items-center gap-4 bg-gray-50 border border-gray-100 rounded-2xl p-5 grayscale-[0.3]"
            >
              <span className="text-2xl flex-shrink-0">{item.icon}</span>
              <p className="text-sm text-gray-500 leading-relaxed">{item.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

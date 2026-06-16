'use client'
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const FAQS = [
  {
    q: 'Preciso colocar cartão pra testar?',
    a: 'Não. O teste de 15 dias é completamente livre, sem cartão de crédito.',
  },
  {
    q: 'Meus dados ficam salvos se eu virar cliente?',
    a: 'Sim. Tudo que você cadastrar no período de teste continua lá quando assinar o plano.',
  },
  {
    q: 'Funciona no celular?',
    a: 'Sim, funciona direto no navegador do celular e do computador, sem precisar instalar nada.',
  },
  {
    q: 'Serve pra quem vende acessório ou Android também?',
    a: 'Sim, mas foi desenhado pensando em loja de iPhone. Quem vende Android vai usar, mas vai sentir que o produto é para quem vende iPhone.',
  },
  {
    q: 'É difícil de configurar?',
    a: 'Não. Sua loja já vem com um catálogo de modelos de iPhone pronto pra você começar a cadastrar aparelhos na hora.',
  },
]

export default function FAQAccordion() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <div className="space-y-2">
      {FAQS.map((faq, i) => (
        <div key={i} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors gap-4"
          >
            <span className="font-semibold text-[#0f172a] text-sm leading-snug">{faq.q}</span>
            <ChevronDown
              size={16}
              className={`text-gray-400 flex-shrink-0 transition-transform duration-200 ${open === i ? 'rotate-180' : ''}`}
            />
          </button>
          {open === i && (
            <div className="px-6 pb-5 text-sm text-gray-500 leading-relaxed border-t border-gray-100 pt-4">
              {faq.a}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

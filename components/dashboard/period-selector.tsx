'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'

const PERIODOS = [
  { v: 'hoje', label: 'Hoje' },
  { v: '7d', label: '7 dias' },
  { v: '30d', label: '30 dias' },
  { v: 'mes', label: 'Mês' },
] as const

export default function PeriodSelector({ atual }: { atual: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function selecionar(v: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('periodo', v)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-1 bg-[#14151c] border border-white/[0.06] rounded-xl p-1 overflow-x-auto">
      {PERIODOS.map(p => (
        <button
          key={p.v}
          onClick={() => selecionar(p.v)}
          className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors ${
            atual === p.v ? 'bg-[#1f2937] text-[#e8e8ec]' : 'text-[#8a8b94] hover:text-[#e8e8ec]'
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  )
}

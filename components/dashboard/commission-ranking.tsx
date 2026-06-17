import { fmt } from '@/lib/utils/format'

interface VendedorRank {
  id: string
  nome: string
  iniciais?: string | null
  qtd: number
  fat: number
  com: number
}

const POSICAO_COR: Record<number, string> = {
  1: '#f59e0b',
  2: '#cbd5e1',
  3: '#d97706',
}

function ini(nome: string) {
  return nome.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

export default function CommissionRanking({ ranking, mes }: { ranking: VendedorRank[]; mes: string }) {
  const totalComissao = ranking.reduce((s, r) => s + r.com, 0)
  const topComissao = ranking[0]?.com ?? 0

  return (
    <div className="bg-[#14151c] border border-white/[0.06] rounded-[10px] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06]">
        <p className="text-sm font-semibold text-[#e8e8ec]">Comissão dos vendedores</p>
        <p className="text-[11px] text-[#8a8b94] capitalize">{mes}</p>
      </div>

      {ranking.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <p className="text-sm text-[#6b6c75]">Nenhuma comissão no período ainda.</p>
        </div>
      ) : (
        <>
          <div className="divide-y divide-white/[0.06]">
            {ranking.map((r, i) => {
              const pos = i + 1
              const corPos = POSICAO_COR[pos] ?? '#6b6c75'
              const bgPos = POSICAO_COR[pos] ? `${POSICAO_COR[pos]}26` : 'rgba(255,255,255,0.08)'
              const pct = topComissao > 0 ? Math.max(4, (r.com / topComissao) * 100) : 0
              return (
                <div key={r.id} className="flex items-center gap-3 px-5 py-3">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                    style={{ background: bgPos, color: corPos }}
                  >
                    {pos}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-[#e8e8ec] truncate">{r.iniciais ?? ini(r.nome)} · {r.nome}</p>
                    <p className="text-[10px] text-[#8a8b94]">{r.qtd} venda(s) · {fmt(r.fat)} faturado</p>
                  </div>
                  <div className="hidden sm:block flex-shrink-0" style={{ width: 120 }}>
                    <div className="h-1.5 rounded-full bg-[#1f2230] overflow-hidden">
                      <div className="h-full rounded-full bg-[#34d399]" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <p className="text-xs font-semibold text-[#34d399] flex-shrink-0 text-right" style={{ width: 64 }}>
                    {fmt(r.com)}
                  </p>
                </div>
              )
            })}
          </div>
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-white/[0.06]">
            <p className="text-[11px] font-semibold text-[#8a8b94] uppercase tracking-wide">Total a pagar em comissões</p>
            <p className="text-sm font-bold" style={{ color: '#f59e0b' }}>{fmt(totalComissao)}</p>
          </div>
        </>
      )}
    </div>
  )
}

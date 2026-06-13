'use client'
import { useState } from 'react'
import { fmt } from '@/lib/utils/format'
import { formatDate } from '@/lib/utils/date'
import Doc2 from '@/components/doc/doc2'

export default function MinhaAreaVendas({ vendas, loja }: { vendas: any[]; loja: any }) {
  const [selected, setSelected] = useState<any | null>(null)

  if (!vendas.length) {
    return (
      <div className="bg-white/3 border border-white/8 rounded-2xl flex flex-col items-center justify-center py-12">
        <p className="text-white/30 text-sm">Nenhuma venda convertida este mês.</p>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left text-xs text-white/30 font-medium px-5 py-3">Data</th>
              <th className="text-left text-xs text-white/30 font-medium px-5 py-3">Cliente</th>
              <th className="text-left text-xs text-white/30 font-medium px-5 py-3">Aparelho</th>
              <th className="text-right text-xs text-white/30 font-medium px-5 py-3">Valor</th>
              <th className="text-right text-xs text-white/30 font-medium px-5 py-3">Comissão</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {vendas.map((v: any) => (
              <tr key={v.id} className="border-b border-white/5 last:border-0 hover:bg-white/3">
                <td className="px-5 py-3 text-sm text-white/50">{formatDate(v.data_venda)}</td>
                <td className="px-5 py-3 text-sm text-white">{v.cliente_nome}</td>
                <td className="px-5 py-3 text-sm text-white/50">{v.aparelhos?.modelo ?? '—'}</td>
                <td className="px-5 py-3 text-sm text-white font-medium text-right">{fmt(v.valor_total)}</td>
                <td className="px-5 py-3 text-sm text-emerald-400 text-right">{fmt(v.comissao)}</td>
                <td className="px-5 py-3">
                  <button
                    onClick={() => setSelected(v)}
                    className="text-xs text-[var(--color-primary)] hover:opacity-80 transition-opacity"
                  >
                    Recibo
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <Doc2 tipo="recibo" venda={selected} loja={loja} onClose={() => setSelected(null)} />
      )}
    </>
  )
}

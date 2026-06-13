'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { fmt } from '@/lib/utils/format'
import { formatDate } from '@/lib/utils/date'
import { FileText, Edit2, CheckCircle } from 'lucide-react'
import Doc2 from '@/components/doc/doc2'

export default function OrcamentosClient({ orcamentos, loja }: { orcamentos: any[]; loja: any }) {
  const router = useRouter()
  const [selected, setSelected] = useState<any | null>(null)

  if (!orcamentos.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <FileText size={40} className="text-white/10 mb-3" />
        <p className="text-white/40 text-sm">Nenhum orçamento em aberto</p>
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
              <th className="text-left text-xs text-white/30 font-medium px-5 py-3">Vendedor</th>
              <th className="text-right text-xs text-white/30 font-medium px-5 py-3">Valor</th>
              <th className="text-left text-xs text-white/30 font-medium px-5 py-3 w-36">Ações</th>
            </tr>
          </thead>
          <tbody>
            {orcamentos.map((o: any) => (
              <tr key={o.id} className="border-b border-white/5 last:border-0 hover:bg-white/3">
                <td className="px-5 py-3 text-sm text-white/50">{formatDate(o.data_venda)}</td>
                <td className="px-5 py-3 text-sm text-white">{o.cliente_nome}</td>
                <td className="px-5 py-3 text-sm text-white/50">{o.aparelhos?.modelo ?? '—'}</td>
                <td className="px-5 py-3 text-xs text-white/40">{o.vendedor_nome ?? '—'}</td>
                <td className="px-5 py-3 text-sm text-white font-medium text-right">{fmt(o.valor_total)}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelected(o)}
                      className="text-xs text-[#4f7eff] hover:opacity-80 transition-opacity">
                      Ver
                    </button>
                    <button
                      onClick={() => router.push(`/nova-venda?editar=${o.id}`)}
                      className="flex items-center gap-1 text-xs text-yellow-400 hover:opacity-80 transition-opacity">
                      <Edit2 size={11} />Editar
                    </button>
                    <button
                      onClick={() => router.push(`/nova-venda?editar=${o.id}&converter=1`)}
                      className="flex items-center gap-1 text-xs text-emerald-400 hover:opacity-80 transition-opacity">
                      <CheckCircle size={11} />Fechar Venda
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <Doc2 tipo="orcamento" venda={selected} loja={loja} onClose={() => setSelected(null)} />
      )}
    </>
  )
}

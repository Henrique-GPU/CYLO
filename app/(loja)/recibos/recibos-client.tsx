'use client'
import { useState } from 'react'
import { fmt } from '@/lib/utils/format'
import { formatDate } from '@/lib/utils/date'
import { FileCheck } from 'lucide-react'
import Doc2 from '@/components/doc/doc2'

export default function RecibosClient({ recibos, loja }: { recibos: any[]; loja: any }) {
  const [selected, setSelected] = useState<any | null>(null)

  if (!recibos.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <FileCheck size={40} className="text-white/10 mb-3" />
        <p className="text-white/40 text-sm">Nenhum recibo emitido</p>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white/3 border border-white/8 rounded-2xl overflow-x-auto">
        <table className="w-full min-w-[560px]">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left text-xs text-white/30 font-medium px-5 py-3">Data</th>
              <th className="text-left text-xs text-white/30 font-medium px-5 py-3">Cliente</th>
              <th className="text-left text-xs text-white/30 font-medium px-5 py-3">Aparelho</th>
              <th className="text-left text-xs text-white/30 font-medium px-5 py-3">Garantia</th>
              <th className="text-right text-xs text-white/30 font-medium px-5 py-3">Valor</th>
              <th className="text-left text-xs text-white/30 font-medium px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {recibos.map((r: any) => (
              <tr key={r.id} className="border-b border-white/5 last:border-0 hover:bg-white/3">
                <td className="px-5 py-3 text-sm text-white/50">{formatDate(r.data_venda)}</td>
                <td className="px-5 py-3 text-sm text-white">{r.cliente_nome}</td>
                <td className="px-5 py-3 text-sm text-white/50">{r.aparelhos?.modelo ?? '—'}</td>
                <td className="px-5 py-3 text-sm text-white/40">{r.garantia ? `${r.garantia}d` : '—'}</td>
                <td className="px-5 py-3 text-sm text-white font-medium text-right">{fmt(r.valor_total)}</td>
                <td className="px-5 py-3">
                  <button
                    onClick={() => setSelected(r)}
                    className="text-xs text-[var(--color-primary)] hover:opacity-80 transition-opacity"
                  >
                    Ver recibo
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

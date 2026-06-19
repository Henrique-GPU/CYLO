'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { fmt } from '@/lib/utils/format'
import { formatDate } from '@/lib/utils/date'
import { Receipt, X, Trash2, Edit2 } from 'lucide-react'
import Doc2 from '@/components/doc/doc2'
import { createClient } from '@/lib/supabase/client'

const STATUS_COLOR: Record<string, string> = {
  convertido: 'bg-emerald-500/10 text-emerald-400',
  orcamento: 'bg-amber-500/10 text-amber-400',
  cancelado: 'bg-red-500/10 text-red-400',
}
const STATUS_LABEL: Record<string, string> = {
  convertido: 'Convertido', orcamento: 'Orçamento', cancelado: 'Cancelado',
}

function custoPendente(v: any) {
  return v.aparelhos && (v.aparelhos.custo === 0 || v.aparelhos.custo === null)
}

export default function VendasClient({
  vendas: initialVendas, loja, perfil,
}: {
  vendas: any[]
  loja: any
  perfil: string
}) {
  const router = useRouter()
  const [vendas, setVendas] = useState<any[]>(initialVendas)
  const [selected, setSelected] = useState<any | null>(null)
  const [editCusto, setEditCusto] = useState<{ aparelhoId: string; vendaId: string } | null>(null)
  const [custoEdit, setCustoEdit] = useState('')
  const [salvandoCusto, setSalvandoCusto] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [deletando, setDeletando] = useState(false)

  async function salvarCusto() {
    if (!editCusto) return
    const val = parseFloat(custoEdit)
    if (!val || val <= 0) return
    setSalvandoCusto(true)
    const supabase = createClient()
    const { error } = await supabase.from('aparelhos').update({ custo: val }).eq('id', editCusto.aparelhoId)
    if (!error) {
      setVendas(prev => prev.map(v =>
        v.aparelhos?.id === editCusto.aparelhoId
          ? { ...v, aparelhos: { ...v.aparelhos, custo: val } }
          : v
      ))
    }
    setSalvandoCusto(false)
    setEditCusto(null)
    setCustoEdit('')
  }

  async function deletarVenda(id: string) {
    setDeletando(true)
    const supabase = createClient()
    await supabase.from('venda_acessorios').delete().eq('venda_id', id)
    const venda = vendas.find(v => v.id === id)
    if (venda?.aparelhos?.id && venda.status === 'convertido') {
      await supabase.from('aparelhos').update({ status: 'disponivel' }).eq('id', venda.aparelhos.id)
    }
    await supabase.from('vendas').delete().eq('id', id)
    setVendas(prev => prev.filter(v => v.id !== id))
    setDeletando(false)
    setConfirmDelete(null)
  }

  if (!vendas.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Receipt size={40} className="text-white/10 mb-3" />
        <p className="text-white/40 text-sm">Nenhuma venda registrada</p>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white/3 border border-white/8 rounded-2xl overflow-x-auto">
        <table className="w-full min-w-[720px]">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left text-xs text-white/30 font-medium px-5 py-3">Data</th>
              <th className="text-left text-xs text-white/30 font-medium px-5 py-3">Cliente</th>
              <th className="text-left text-xs text-white/30 font-medium px-5 py-3">Aparelho</th>
              <th className="text-left text-xs text-white/30 font-medium px-5 py-3">Troca</th>
              <th className="text-left text-xs text-white/30 font-medium px-5 py-3">Status</th>
              <th className="text-right text-xs text-white/30 font-medium px-5 py-3">Valor</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {vendas.map((v: any) => (
              <tr key={v.id} className="border-b border-white/5 last:border-0 hover:bg-white/3">
                <td className="px-5 py-3 text-sm text-white/50">{formatDate(v.data_venda)}</td>
                <td className="px-5 py-3 text-sm text-white">{v.cliente_nome}</td>
                <td className="px-5 py-3 text-sm text-white/50">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span>{v.aparelhos?.modelo ?? '—'}</span>
                    {custoPendente(v) && v.status === 'convertido' && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/15 text-yellow-400 font-medium">
                        Custo Pendente
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-5 py-3 text-sm text-white/40">{v.com_troca ? v.troca_modelo : '—'}</td>
                <td className="px-5 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-md ${STATUS_COLOR[v.status]}`}>
                    {STATUS_LABEL[v.status]}
                  </span>
                </td>
                <td className="px-5 py-3 text-sm text-white font-medium text-right">{fmt(v.valor_total)}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2 justify-end">
                    {perfil === 'loja_admin' && custoPendente(v) && v.status === 'convertido' && v.aparelhos?.id && (
                      <button
                        onClick={() => { setEditCusto({ aparelhoId: v.aparelhos.id, vendaId: v.id }); setCustoEdit('') }}
                        className="text-[11px] px-2 py-0.5 rounded bg-yellow-500/15 text-yellow-400 hover:bg-yellow-500/25 transition-colors whitespace-nowrap">
                        + Custo
                      </button>
                    )}
                    {/* Vendedor pode editar orçamentos, não vendas convertidas */}
                    {v.status === 'orcamento' && (
                      <button
                        onClick={() => router.push(`/nova-venda?editar=${v.id}`)}
                        className="text-xs text-yellow-400 hover:opacity-80 transition-opacity flex items-center gap-1">
                        <Edit2 size={11} />Editar
                      </button>
                    )}
                    <button
                      onClick={() => setSelected(v)}
                      className="text-xs text-[var(--color-primary)] hover:opacity-80 transition-opacity whitespace-nowrap">
                      {v.status === 'convertido' ? 'Recibo' : 'Ver'}
                    </button>
                    {/* Apenas admin pode deletar */}
                    {perfil === 'loja_admin' && (
                      <button
                        onClick={() => setConfirmDelete(v.id)}
                        className="text-white/20 hover:text-red-400 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Confirmar delete */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-6 w-full max-w-xs mx-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-black text-white">Apagar venda?</h3>
              <button onClick={() => setConfirmDelete(null)} className="text-white/30 hover:text-white/60">
                <X size={14} />
              </button>
            </div>
            <p className="text-xs text-white/40 mb-5">
              Esta ação é irreversível. O aparelho voltará para o estoque como disponível.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2 border border-white/15 text-white/60 text-xs rounded-xl hover:bg-white/5">
                Cancelar
              </button>
              <button
                onClick={() => deletarVenda(confirmDelete)}
                disabled={deletando}
                className="flex-1 py-2 bg-red-500 hover:opacity-90 text-white text-xs font-bold rounded-xl disabled:opacity-30 transition-opacity">
                {deletando ? 'Apagando...' : 'Apagar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Atualizar custo modal */}
      {editCusto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-6 w-full max-w-xs mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black text-white">Informar Custo</h3>
              <button onClick={() => setEditCusto(null)} className="text-white/30 hover:text-white/60">
                <X size={14} />
              </button>
            </div>
            <p className="text-xs text-white/40 mb-4">
              Informe o custo do aparelho para recalcular o lucro desta venda nos relatórios.
            </p>
            <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-1.5">
              Custo (R$)
            </label>
            <input
              type="number"
              value={custoEdit}
              onChange={e => setCustoEdit(e.target.value)}
              placeholder="Ex: 2800"
              autoFocus
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-[#4f7eff] mb-4"
            />
            <div className="flex gap-2">
              <button onClick={() => setEditCusto(null)}
                className="flex-1 py-2 border border-white/15 text-white/60 text-xs rounded-xl hover:bg-white/5">
                Cancelar
              </button>
              <button
                onClick={salvarCusto}
                disabled={salvandoCusto || !custoEdit || parseFloat(custoEdit) <= 0}
                className="flex-1 py-2 bg-yellow-500 hover:opacity-90 text-black text-xs font-bold rounded-xl disabled:opacity-30 transition-opacity">
                {salvandoCusto ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {selected && (
        <Doc2
          tipo={selected.status === 'convertido' ? 'recibo' : 'orcamento'}
          venda={selected}
          loja={loja}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  )
}

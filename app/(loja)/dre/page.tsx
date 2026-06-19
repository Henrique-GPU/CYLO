import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { fmt } from '@/lib/utils/format'
import { TrendingUp } from 'lucide-react'

export default async function DREPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usuario } = await supabase
    .from('usuarios').select('loja_id, perfil').eq('id', user.id)
    .single<{ loja_id: string; perfil: string }>()

  if (!usuario?.loja_id) redirect('/dashboard')
  if (usuario.perfil === 'vendedor') redirect('/minha-area')

  const { data: aparelhos } = await supabase
    .from('aparelhos')
    .select('id, tipo, modelo, capacidade, cor, imei, status, preco, custo, data_entrada')
    .eq('loja_id', usuario.loja_id)
    .order('data_entrada', { ascending: false })

  const aps = (aparelhos ?? []) as any[]

  const totalInvestido = aps.reduce((s: number, a: any) => s + (a.custo ?? 0), 0)
  const totalVenda = aps.filter((a: any) => a.status === 'vendido').reduce((s: number, a: any) => s + (a.preco ?? 0), 0)
  const lucroTotal = aps.filter((a: any) => a.status === 'vendido').reduce((s: number, a: any) => s + (a.preco - a.custo), 0)

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">DRE / Custos</h1>
        <p className="text-sm text-white/40 mt-0.5">Custo, venda e lucro real por aparelho — exclusivo admin</p>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white/5 border border-white/8 rounded-2xl p-4">
          <p className="text-xs text-white/40 mb-1">Total Investido</p>
          <p className="text-xl font-black text-red-400">{fmt(totalInvestido)}</p>
        </div>
        <div className="bg-white/5 border border-white/8 rounded-2xl p-4">
          <p className="text-xs text-white/40 mb-1">Vendas (recuperado)</p>
          <p className="text-xl font-black text-white">{fmt(totalVenda)}</p>
        </div>
        <div className="bg-white/5 border border-white/8 rounded-2xl p-4">
          <p className="text-xs text-white/40 mb-1">Lucro Total</p>
          <p className="text-xl font-black" style={{ color: lucroTotal >= 0 ? '#34d399' : '#f87171' }}>{fmt(lucroTotal)}</p>
        </div>
      </div>

      {!aps.length ? (
        <div className="flex flex-col items-center justify-center py-20">
          <TrendingUp size={40} className="text-white/10 mb-3" />
          <p className="text-white/40 text-sm">Nenhum aparelho cadastrado</p>
        </div>
      ) : (
        <div className="bg-white/3 border border-white/8 rounded-2xl overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-xs text-white/30 font-medium px-5 py-3">Aparelho</th>
                <th className="text-center text-xs text-white/30 font-medium px-5 py-3">Tipo</th>
                <th className="text-right text-xs text-white/30 font-medium px-5 py-3">Custo</th>
                <th className="text-right text-xs text-white/30 font-medium px-5 py-3">Venda</th>
                <th className="text-right text-xs text-white/30 font-medium px-5 py-3">Lucro</th>
                <th className="text-left text-xs text-white/30 font-medium px-5 py-3">Margem</th>
                <th className="text-center text-xs text-white/30 font-medium px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {aps.map((a: any) => {
                const custo = a.custo ?? 0
                const venda = a.preco ?? 0
                const lucro = venda - custo
                const mg = venda > 0 ? (lucro / venda * 100).toFixed(0) : '0'
                const mgN = parseInt(mg)
                const mgColor = mgN > 25 ? '#34d399' : mgN > 15 ? '#fbbf24' : '#f87171'
                const STATUS_COLOR: Record<string, string> = {
                  disponivel: 'bg-emerald-500/10 text-emerald-400',
                  reservado: 'bg-amber-500/10 text-amber-400',
                  vendido: 'bg-white/5 text-white/30',
                  manutencao: 'bg-red-500/10 text-red-400',
                  negociacao: 'bg-blue-500/10 text-blue-400',
                }
                return (
                  <tr key={a.id} className="border-b border-white/5 last:border-0 hover:bg-white/3">
                    <td className="px-5 py-3">
                      <p className="text-sm font-semibold text-white">{a.modelo}</p>
                      <p className="text-[10px] text-white/30">{a.capacidade}{a.cor ? ` · ${a.cor}` : ''}</p>
                      {a.imei && <p className="text-[10px] font-mono text-white/20">IMEI: {a.imei}</p>}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-md ${a.tipo === 'novo' ? 'bg-blue-500/10 text-blue-400' : 'bg-amber-500/10 text-amber-400'}`}>
                        {a.tipo === 'novo' ? 'Novo' : 'Usado'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm font-mono text-red-400 text-right">{fmt(custo)}</td>
                    <td className="px-5 py-3 text-sm font-mono text-white font-bold text-right">{venda > 0 ? fmt(venda) : '—'}</td>
                    <td className="px-5 py-3 text-sm font-mono text-right font-bold" style={{ color: lucro >= 0 ? '#34d399' : '#f87171' }}>
                      {venda > 0 ? fmt(Math.max(0, lucro)) : '—'}
                    </td>
                    <td className="px-5 py-3">
                      {venda > 0 ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold" style={{ color: mgColor }}>{mg}%</span>
                          <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden min-w-[40px]">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${Math.min(100, Math.max(0, mgN))}%`, background: mgColor }}
                            />
                          </div>
                        </div>
                      ) : <span className="text-xs text-white/20">—</span>}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-md ${STATUS_COLOR[a.status] ?? ''}`}>
                        {a.status}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

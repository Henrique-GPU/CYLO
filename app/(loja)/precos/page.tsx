import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { fmt } from '@/lib/utils/format'
import { Tag } from 'lucide-react'

export default async function PrecosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usuario } = await supabase
    .from('usuarios').select('loja_id').eq('id', user.id)
    .single<{ loja_id: string }>()

  if (!usuario?.loja_id) redirect('/dashboard')

  const { data: precos } = await supabase
    .from('tabela_precos').select('*').eq('loja_id', usuario.loja_id).order('serie', { ascending: false })

  const series = [...new Set((precos ?? []).map((p: any) => p.serie))].sort((a, b) => Number(b) - Number(a))

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">Tabela de Preços</h1>
        <p className="text-sm text-white/40 mt-0.5">Referência para vendedores</p>
      </div>

      {!precos?.length ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Tag size={40} className="text-white/10 mb-3" />
          <p className="text-white/40 text-sm">Nenhum preço cadastrado</p>
        </div>
      ) : (
        <div className="space-y-6">
          {series.map(serie => (
            <div key={serie}>
              <h2 className="text-xs font-semibold text-white/40 mb-3 uppercase tracking-widest">iPhone {serie}</h2>
              <div className="bg-white/3 border border-white/8 rounded-2xl overflow-x-auto">
                <table className="w-full min-w-[640px]">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left text-xs text-white/30 font-medium px-5 py-3">Modelo</th>
                      <th className="text-right text-xs text-white/30 font-medium px-5 py-3">Lacrado</th>
                      <th className="text-right text-xs text-white/30 font-medium px-5 py-3">Excelente</th>
                      <th className="text-right text-xs text-white/30 font-medium px-5 py-3">Bom</th>
                      <th className="text-right text-xs text-white/30 font-medium px-5 py-3">Regular</th>
                      <th className="text-right text-xs text-white/30 font-medium px-5 py-3">Compra sugerida</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(precos ?? []).filter((p: any) => p.serie === serie).map((p: any) => (
                      <tr key={p.id} className="border-b border-white/5 last:border-0">
                        <td className="px-5 py-3 text-sm text-white">{p.modelo}</td>
                        <td className="px-5 py-3 text-sm text-white text-right">{p.preco_lacrado ? fmt(p.preco_lacrado) : '—'}</td>
                        <td className="px-5 py-3 text-sm text-emerald-400 text-right">{p.preco_excelente ? fmt(p.preco_excelente) : '—'}</td>
                        <td className="px-5 py-3 text-sm text-white/70 text-right">{p.preco_bom ? fmt(p.preco_bom) : '—'}</td>
                        <td className="px-5 py-3 text-sm text-white/50 text-right">{p.preco_regular ? fmt(p.preco_regular) : '—'}</td>
                        <td className="px-5 py-3 text-sm text-amber-400 text-right">{p.valor_sugerido_compra ? fmt(p.valor_sugerido_compra) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

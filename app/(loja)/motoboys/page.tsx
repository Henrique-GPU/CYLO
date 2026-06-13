import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { fmt } from '@/lib/utils/format'
import { Truck } from 'lucide-react'
import Link from 'next/link'

export default async function MotoboysPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usuario } = await supabase
    .from('usuarios').select('loja_id, perfil').eq('id', user.id)
    .single<{ loja_id: string; perfil: string }>()

  if (!usuario?.loja_id) redirect('/dashboard')
  if (usuario.perfil === 'vendedor') redirect('/minha-area')

  const { data: motoboys } = await supabase
    .from('motoboys')
    .select('*')
    .eq('loja_id', usuario.loja_id)
    .order('nome')

  const totalPago = (motoboys ?? []).reduce((s: number, m: any) => s + (m.total_pago ?? 0), 0)
  const totalCorridas = (motoboys ?? []).reduce((s: number, m: any) => s + (m.corridas ?? 0), 0)

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white">Motoboys & Entregas</h1>
          <p className="text-sm text-white/40 mt-0.5">{(motoboys ?? []).length} cadastrados · {totalCorridas} corridas</p>
        </div>
        <Link href="/motoboys/novo" className="flex items-center gap-2 px-4 py-2 bg-[#4f7eff] hover:opacity-90 text-white text-sm font-medium rounded-xl transition-opacity">
          + Motoboy
        </Link>
      </div>

      {!motoboys?.length ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Truck size={40} className="text-white/10 mb-3" />
          <p className="text-white/40 text-sm">Nenhum motoboy cadastrado</p>
        </div>
      ) : (
        <>
          <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left text-xs text-white/30 font-medium px-5 py-3">Nome</th>
                  <th className="text-left text-xs text-white/30 font-medium px-5 py-3">Telefone</th>
                  <th className="text-center text-xs text-white/30 font-medium px-5 py-3">Corridas</th>
                  <th className="text-right text-xs text-white/30 font-medium px-5 py-3">Total Pago</th>
                  <th className="text-right text-xs text-white/30 font-medium px-5 py-3">Média/Corrida</th>
                </tr>
              </thead>
              <tbody>
                {motoboys.map((m: any) => (
                  <tr key={m.id} className="border-b border-white/5 last:border-0 hover:bg-white/3">
                    <td className="px-5 py-3 text-sm font-semibold text-white">{m.nome}</td>
                    <td className="px-5 py-3 text-sm text-white/50">{m.telefone ?? '—'}</td>
                    <td className="px-5 py-3 text-sm text-white text-center font-bold">{m.corridas ?? 0}</td>
                    <td className="px-5 py-3 text-sm font-mono text-red-400 text-right">{fmt(m.total_pago ?? 0)}</td>
                    <td className="px-5 py-3 text-sm font-mono text-white/60 text-right">
                      {m.corridas > 0 ? fmt((m.total_pago ?? 0) / m.corridas) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center justify-between px-5 py-3 border-t border-white/5 bg-white/2">
              <span className="text-xs text-white/30">Total gasto com motoboys</span>
              <span className="text-sm font-mono font-bold text-red-400">{fmt(totalPago)}</span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

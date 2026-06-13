import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { fmt } from '@/lib/utils/format'
import { Headphones, Plus } from 'lucide-react'
import Link from 'next/link'

export default async function AcessoriosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usuario } = await supabase
    .from('usuarios').select('loja_id').eq('id', user.id)
    .single<{ loja_id: string }>()

  if (!usuario?.loja_id) redirect('/dashboard')

  const { data: acessorios } = await supabase
    .from('acessorios_catalogo').select('*').eq('loja_id', usuario.loja_id).order('nome')

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white">Acessórios</h1>
          <p className="text-sm text-white/40 mt-0.5">{acessorios?.length ?? 0} itens no catálogo</p>
        </div>
        <Link href="/acessorios/novo" className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] hover:opacity-90 text-white text-sm font-medium rounded-xl transition-opacity">
          <Plus size={15} />Novo acessório
        </Link>
      </div>

      {!acessorios?.length ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Headphones size={40} className="text-white/10 mb-3" />
          <p className="text-white/40 text-sm">Nenhum acessório cadastrado</p>
        </div>
      ) : (
        <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-xs text-white/30 font-medium px-5 py-3">Nome</th>
                <th className="text-right text-xs text-white/30 font-medium px-5 py-3">Custo</th>
                <th className="text-right text-xs text-white/30 font-medium px-5 py-3">Preço</th>
                <th className="text-right text-xs text-white/30 font-medium px-5 py-3">Margem</th>
                <th className="text-center text-xs text-white/30 font-medium px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {acessorios.map((a: any) => {
                const margem = a.preco > 0 ? (((a.preco - a.custo) / a.preco) * 100).toFixed(0) : null
                return (
                  <tr key={a.id} className="border-b border-white/5 last:border-0 hover:bg-white/3">
                    <td className="px-5 py-3 text-sm text-white">{a.nome}</td>
                    <td className="px-5 py-3 text-sm text-white/50 text-right">{fmt(a.custo)}</td>
                    <td className="px-5 py-3 text-sm text-white text-right">{fmt(a.preco)}</td>
                    <td className="px-5 py-3 text-sm text-emerald-400 text-right">{margem ? `${margem}%` : '—'}</td>
                    <td className="px-5 py-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-md ${a.ativo ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-white/30'}`}>
                        {a.ativo ? 'Ativo' : 'Inativo'}
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

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { fmt } from '@/lib/utils/format'
import { Users, Plus } from 'lucide-react'
import Link from 'next/link'
import FuncionariosActions from './funcionarios-actions'

export default async function FuncionariosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usuario } = await supabase
    .from('usuarios').select('loja_id, perfil').eq('id', user.id)
    .single<{ loja_id: string; perfil: string }>()

  if (!usuario?.loja_id) redirect('/dashboard')
  const isAdmin = usuario.perfil === 'loja_admin'

  const { data: funcionarios } = await supabase
    .from('usuarios').select('*')
    .eq('loja_id', usuario.loja_id)
    .neq('id', user.id)
    .order('nome')

  const totalVendedores = (funcionarios ?? []).filter((f: any) => f.perfil === 'vendedor').length
  const limiteAtingido = totalVendedores >= 3

  const inicio = new Date()
  const inicioMes = new Date(inicio.getFullYear(), inicio.getMonth(), 1).toISOString().split('T')[0]

  const { data: vendasMes } = await supabase
    .from('vendas').select('vendedor_id, valor_total, comissao')
    .eq('loja_id', usuario.loja_id)
    .eq('status', 'convertido')
    .gte('data_venda', inicioMes)

  const stats = (funcionarios ?? []).map((f: any) => {
    const vendas = (vendasMes ?? []).filter((v: any) => v.vendedor_id === f.id)
    return {
      ...f,
      faturamento: vendas.reduce((s, v: any) => s + (v.valor_total ?? 0), 0),
      comissao: vendas.reduce((s, v: any) => s + (v.comissao ?? 0), 0),
      totalVendas: vendas.length,
    }
  })

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white">Funcionários</h1>
          <p className="text-sm text-white/40 mt-0.5">
            {funcionarios?.length ?? 0} na equipe
            {isAdmin && <span className="text-white/25"> · {totalVendedores}/3 vendedores</span>}
          </p>
        </div>
        {isAdmin && !limiteAtingido && (
          <Link
            href="/funcionarios/novo"
            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] hover:opacity-90 text-white text-sm font-medium rounded-xl transition-opacity"
          >
            <Plus size={15} />Novo funcionário
          </Link>
        )}
      </div>

      {!stats.length ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Users size={40} className="text-white/10 mb-3" />
          <p className="text-white/40 text-sm">Nenhum funcionário cadastrado</p>
          {isAdmin && (
            <Link href="/funcionarios/novo" className="mt-4 text-sm text-[var(--color-primary)] hover:opacity-80">
              + Adicionar primeiro funcionário
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-3">
          {stats.map((f: any) => (
            <div key={f.id} className="bg-white/5 border border-white/8 rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                    f.status === 'bloqueado' ? 'bg-red-500/20 text-red-400' : 'bg-[var(--color-primary)]/20 text-[var(--color-primary)]'
                  }`}>
                    {f.iniciais ?? f.nome.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white">{f.nome}</p>
                      {f.status === 'bloqueado' && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-red-500/10 text-red-400 rounded">bloqueado</span>
                      )}
                    </div>
                    <p className="text-xs text-white/40">
                      {f.perfil === 'loja_admin' ? 'Admin' : 'Vendedor'} · {f.comissao_pct}% comissão
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-white/30 mb-0.5">Vendas</p>
                    <p className="text-sm font-semibold text-white">{f.totalVendas}</p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-white/30 mb-0.5">Faturamento</p>
                    <p className="text-sm font-semibold text-white">{fmt(f.faturamento)}</p>
                  </div>
                  <div className="text-right hidden md:block">
                    <p className="text-xs text-white/30 mb-0.5">Comissão</p>
                    <p className="text-sm font-semibold text-emerald-400">{fmt(f.comissao)}</p>
                  </div>
                  {f.meta_mensal && isAdmin && (
                    <div className="text-right hidden lg:block">
                      <p className="text-xs text-white/30 mb-0.5">Meta</p>
                      <p className="text-sm font-semibold text-white/60">{fmt(f.meta_mensal)}</p>
                    </div>
                  )}
                  {isAdmin && <FuncionariosActions funcId={f.id} status={f.status} email={f.email} />}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { fmt } from '@/lib/utils/format'
import { mesAtual } from '@/lib/utils/date'
import KpiCard from '@/components/dashboard/kpi-card'

export default async function FinanceiroPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usuario } = await supabase
    .from('usuarios').select('loja_id').eq('id', user.id)
    .single<{ loja_id: string }>()

  if (!usuario?.loja_id) redirect('/dashboard')

  const inicioMes = new Date()
  const inicioMesStr = new Date(inicioMes.getFullYear(), inicioMes.getMonth(), 1).toISOString().split('T')[0]

  const { data: vendas } = await supabase
    .from('vendas').select('valor_total, valor_aparelho, valor_acessorios, comissao, lucro, pgto_pix, pgto_dinheiro, pgto_debito, pgto_credito, pgto_transferencia')
    .eq('loja_id', usuario.loja_id)
    .eq('status', 'convertido')
    .gte('data_venda', inicioMesStr)

  const v = vendas ?? []
  const receita = v.reduce((s, x: any) => s + (x.valor_total ?? 0), 0)
  const lucro = v.reduce((s, x: any) => s + (x.lucro ?? 0), 0)
  const comissoes = v.reduce((s, x: any) => s + (x.comissao ?? 0), 0)
  const margemPct = receita > 0 ? ((lucro / receita) * 100).toFixed(1) : '0'

  const porForma = {
    pix: v.reduce((s, x: any) => s + (x.pgto_pix ?? 0), 0),
    dinheiro: v.reduce((s, x: any) => s + (x.pgto_dinheiro ?? 0), 0),
    debito: v.reduce((s, x: any) => s + (x.pgto_debito ?? 0), 0),
    credito: v.reduce((s, x: any) => s + (x.pgto_credito ?? 0), 0),
    transferencia: v.reduce((s, x: any) => s + (x.pgto_transferencia ?? 0), 0),
  }

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">Financeiro</h1>
        <p className="text-sm text-white/40 mt-0.5">{mesAtual()} · {v.length} vendas</p>
      </div>

      {/* DRE simplificado */}
      <div className="bg-white/5 border border-white/8 rounded-2xl p-6 mb-6">
        <h2 className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-4">DRE — {mesAtual()}</h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-white/5">
            <span className="text-sm text-white/70">Receita bruta</span>
            <span className="text-sm font-semibold text-white">{fmt(receita)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-white/5">
            <span className="text-sm text-white/70">Comissões pagas</span>
            <span className="text-sm text-red-400">− {fmt(comissoes)}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm font-semibold text-white">Lucro líquido</span>
            <span className="text-lg font-bold text-emerald-400">{fmt(lucro)}</span>
          </div>
        </div>
        <p className="text-xs text-white/30 mt-3">Margem: {margemPct}%</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Receita" value={fmt(receita)} />
        <KpiCard label="Lucro" value={fmt(lucro)} />
        <KpiCard label="Comissões" value={fmt(comissoes)} />
        <KpiCard label="Margem" value={`${margemPct}%`} />
      </div>

      {/* Por forma de pagamento */}
      <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
        <h2 className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-4">Por forma de pagamento</h2>
        <div className="space-y-2">
          {Object.entries({ PIX: porForma.pix, Dinheiro: porForma.dinheiro, Débito: porForma.debito, Crédito: porForma.credito, Transferência: porForma.transferencia })
            .filter(([, v]) => v > 0)
            .sort(([, a], [, b]) => b - a)
            .map(([label, valor]) => (
              <div key={label} className="flex items-center gap-3">
                <span className="text-sm text-white/50 w-28">{label}</span>
                <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-[var(--color-primary)] rounded-full" style={{ width: `${receita > 0 ? (valor / receita) * 100 : 0}%` }} />
                </div>
                <span className="text-sm text-white w-28 text-right">{fmt(valor)}</span>
              </div>
            ))}
          {Object.values(porForma).every(v => v === 0) && (
            <p className="text-sm text-white/30">Nenhuma venda no período</p>
          )}
        </div>
      </div>
    </div>
  )
}

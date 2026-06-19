import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { fmt } from '@/lib/utils/format'
import { mesAtual } from '@/lib/utils/date'
import FinanceiroHero from '@/components/financeiro/financeiro-hero'
import AnimatedPanel from '@/components/dashboard/animated-panel'

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
    <div className="p-5 sm:p-8" style={{ background: 'var(--app-bg-base)' }}>
      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-8 items-start">
        <FinanceiroHero lucro={lucro} receita={receita} comissoes={comissoes} margemPct={margemPct} mes={mesAtual()} />

        <AnimatedPanel delay={0.1} hover={false} className="rounded-2xl p-5" style={{ background: 'var(--app-bg-surface)' }}>
          <p className="text-[11px] font-medium uppercase tracking-widest mb-4" style={{ color: 'var(--app-ink-tertiary)' }}>Por forma de pagamento</p>
          <div className="space-y-3">
            {Object.entries({ PIX: porForma.pix, Dinheiro: porForma.dinheiro, Débito: porForma.debito, Crédito: porForma.credito, Transferência: porForma.transferencia })
              .filter(([, valor]) => valor > 0)
              .sort(([, a], [, b]) => b - a)
              .map(([label, valor]) => (
                <div key={label} className="flex items-center gap-2 sm:gap-3">
                  <span className="text-xs sm:text-sm w-16 sm:w-24 flex-shrink-0 truncate" style={{ color: 'var(--app-ink-secondary)' }}>{label}</span>
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <div className="h-full rounded-full" style={{ width: `${receita > 0 ? (valor / receita) * 100 : 0}%`, background: '#4f7eff' }} />
                  </div>
                  <span className="text-xs sm:text-sm w-20 sm:w-24 flex-shrink-0 text-right" style={{ color: 'var(--app-ink-primary)' }}>{fmt(valor)}</span>
                </div>
              ))}
            {Object.values(porForma).every(valor => valor === 0) && (
              <p className="text-sm" style={{ color: 'var(--app-ink-tertiary)' }}>Nenhuma venda no período</p>
            )}
          </div>
        </AnimatedPanel>
      </div>
    </div>
  )
}

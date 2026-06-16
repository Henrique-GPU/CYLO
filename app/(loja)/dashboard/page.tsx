import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { fmt } from '@/lib/utils/format'
import Link from 'next/link'
import { LojaCardActions } from '@/app/(loja)/lojas/loja-card-actions'

// ── helpers ────────────────────────────────────────────────────────
function daysDiff(dateStr: string) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
}
function daysUntil(dateStr: string | null) {
  if (!dateStr) return null
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000)
}
function daysSince(dateStr: string | null) {
  if (!dateStr) return null
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
}
function fdBR(dateStr: string | null) {
  if (!dateStr) return '–'
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}
function mesNome() {
  return new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}
function ini(nome: string) {
  return nome.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

// ── sub-components ─────────────────────────────────────────────────
function KpiBox({
  icon, label, value, sub, valueColor,
}: { icon: string; label: string; value: string; sub?: string; valueColor?: string }) {
  return (
    <div className="bg-white/5 border border-white/8 rounded-2xl p-4 flex flex-col gap-1">
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-base">{icon}</span>
        <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-[22px] font-black tracking-tight leading-none" style={valueColor ? { color: valueColor } : { color: '#e8eaf0' }}>
        {value}
      </div>
      {sub && <div className="text-[10px] text-white/30 mt-0.5">{sub}</div>}
    </div>
  )
}

function SaasBadge({ status }: { status: string }) {
  const cls: Record<string, string> = {
    ativo: 'bg-emerald-500/15 text-emerald-400',
    trial: 'bg-yellow-500/15 text-yellow-400',
    vencido: 'bg-red-500/15 text-red-400',
    bloqueado: 'bg-purple-500/15 text-purple-400',
  }
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${cls[status] ?? 'bg-white/10 text-white/50'}`}>
      {status}
    </span>
  )
}

// ── CEO Dashboard ──────────────────────────────────────────────────
async function CEODashboard() {
  const supabase = await createClient()
  const { data: lojas } = await supabase
    .from('lojas')
    .select('id, nome, responsavel, cor_primaria, status_saas, valor_mensal, data_fim_trial, proximo_vencimento, ultimo_acesso, criada_em, whatsapp, telefone')
    .order('criada_em', { ascending: false })

  const total = lojas?.length ?? 0
  const ativos = lojas?.filter(l => l.status_saas === 'ativo').length ?? 0
  const trials = lojas?.filter(l => l.status_saas === 'trial').length ?? 0
  const vencidos = lojas?.filter(l => l.status_saas === 'vencido').length ?? 0
  const bloqueados = lojas?.filter(l => l.status_saas === 'bloqueado').length ?? 0
  const mrr = lojas?.filter(l => l.status_saas === 'ativo').reduce((s, l) => s + (l.valor_mensal ?? 0), 0) ?? 0

  const trialVence3 = lojas?.filter(l => {
    if (l.status_saas !== 'trial' || !l.data_fim_trial) return false
    const d = daysUntil(l.data_fim_trial)
    return d !== null && d <= 3 && d >= 0
  }) ?? []
  const inativos = lojas?.filter(l => {
    if (!l.ultimo_acesso) return true
    const d = daysSince(l.ultimo_acesso.split('T')[0])
    return d !== null && d > 15
  }) ?? []

  const alertas = []
  if (trialVence3.length) alertas.push(`⏰ ${trialVence3.length} trial(s) vence(m) nos próximos 3 dias`)
  if (vencidos) alertas.push(`🚨 ${vencidos} cliente(s) com acesso vencido`)
  if (inativos.length) alertas.push(`😴 ${inativos.length} loja(s) sem acesso há mais de 15 dias`)
  if (bloqueados) alertas.push(`🔒 ${bloqueados} loja(s) bloqueada(s)`)

  const kpis = [
    { v: String(total), l: 'Clientes Totais', c: undefined },
    { v: String(ativos), l: 'Ativos', c: '#34d399' },
    { v: String(trials), l: 'Em Trial', c: '#fbbf24' },
    { v: String(vencidos), l: 'Vencidos', c: '#f87171' },
    { v: String(bloqueados), l: 'Bloqueados', c: '#a78bfa' },
    { v: fmt(mrr), l: 'MRR Previsto', c: '#34d399' },
    { v: String(trialVence3.length), l: 'Trial → 3 dias', c: trialVence3.length > 0 ? '#fbbf24' : undefined },
    { v: String(inativos.length), l: 'Inativos +15d', c: inativos.length > 0 ? '#f87171' : undefined },
  ]

  return (
    <div className="p-6 max-w-[1300px]">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-black tracking-tight text-white">Cylo</h1>
          <p className="text-[11px] text-white/30 mt-0.5">Painel do CEO · Gestão da Plataforma</p>
        </div>
        <Link
          href="/lojas/novo"
          className="flex items-center gap-1.5 px-4 py-2 bg-[#4f7eff] hover:opacity-90 text-white text-sm font-semibold rounded-xl transition-opacity"
        >
          + Nova Loja
        </Link>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-4 lg:grid-cols-8 gap-2.5 mb-5">
        {kpis.map(({ v, l, c }) => (
          <div key={l} className="bg-white/5 border border-white/8 rounded-xl p-3 text-center">
            <div className="text-[18px] font-black tracking-tight" style={c ? { color: c } : { color: '#e8eaf0' }}>{v}</div>
            <div className="text-[9px] font-semibold text-white/30 uppercase tracking-wider mt-0.5">{l}</div>
          </div>
        ))}
      </div>

      {/* Alertas */}
      {alertas.length > 0 && (
        <div className="bg-yellow-500/6 border border-yellow-500/18 rounded-2xl p-4 mb-5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-yellow-400 mb-2.5">⚡ Alertas da Plataforma</p>
          <div className="flex flex-col gap-1.5">
            {alertas.map((a, i) => (
              <p key={i} className="text-xs text-white/50">{a}</p>
            ))}
          </div>
        </div>
      )}

      {/* Lojas grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3.5">
        {(lojas ?? []).map((l: any) => {
          const du = daysUntil(l.status_saas === 'trial' ? l.data_fim_trial : l.proximo_vencimento)
          const ds = daysSince(l.ultimo_acesso ? l.ultimo_acesso.split('T')[0] : null)
          const acessoColor = ds === null ? '#4a5070' : ds === 0 ? '#34d399' : ds <= 3 ? '#34d399' : ds <= 15 ? '#fbbf24' : '#f87171'
          const acessoLabel = ds === null ? 'Nunca' : ds === 0 ? 'Hoje' : `${ds}d atrás`
          const waNum = (l.whatsapp ?? l.telefone ?? '').replace(/\D/g, '')
          const waMsg = l.status_saas === 'trial'
            ? `Olá ${l.responsavel ?? l.nome}! Seu trial do Cylo vence em ${du !== null ? `${du} dia(s)` : 'breve'}. Para continuar com tudo funcionando, assine por apenas R$ ${(l.valor_mensal ?? 59.9).toFixed(2).replace('.', ',')}/mês. Me chama se tiver dúvida! 🚀`
            : `Olá ${l.responsavel ?? l.nome}! Sua assinatura do Cylo está vencendo. Renove por R$ ${(l.valor_mensal ?? 59.9).toFixed(2).replace('.', ',')}/mês para continuar gerenciando sua loja sem interrupção. Qualquer coisa estou aqui! 💬`
          const waLink = waNum ? `https://wa.me/55${waNum}?text=${encodeURIComponent(waMsg)}` : null
          return (
            <div key={l.id} className="bg-white/5 border border-white/8 rounded-2xl overflow-hidden">
              <div className="h-1" style={{ background: l.cor_primaria ?? '#4f7eff' }} />
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <p className="text-sm font-bold text-white">{l.nome}</p>
                    <p className="text-[11px] text-white/40 mt-0.5">{l.responsavel ?? '–'}</p>
                  </div>
                  <SaasBadge status={l.status_saas} />
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] mb-3">
                  <div>
                    <span className="text-white/30">Mensalidade</span>
                    <p className="text-white font-semibold">{fmt(l.valor_mensal ?? 0)}</p>
                  </div>
                  {l.status_saas === 'trial' ? (
                    <div>
                      <span className="text-white/30">Trial até</span>
                      <p className="font-semibold" style={{ color: du !== null && du <= 3 ? '#f87171' : '#fbbf24' }}>
                        {fdBR(l.data_fim_trial)}{du !== null ? ` (${du}d)` : ''}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <span className="text-white/30">Próx. vencimento</span>
                      <p className="text-white font-semibold">{fdBR(l.proximo_vencimento)}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-white/30">Último acesso</span>
                    <p className="font-semibold" style={{ color: acessoColor }}>{acessoLabel}</p>
                  </div>
                  <div>
                    <span className="text-white/30">Cliente desde</span>
                    <p className="text-white/60">{fdBR(l.criada_em?.split('T')[0] ?? null)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1">
                    <LojaCardActions lojaId={l.id} status={l.status_saas} />
                  </div>
                  {waLink && (
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Contatar no WhatsApp"
                      className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-400 transition-colors flex-shrink-0"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.558 4.118 1.535 5.846L.057 23.857a.5.5 0 0 0 .609.61l6.102-1.492A11.944 11.944 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.944 9.944 0 0 1-5.072-1.383l-.362-.216-3.753.917.949-3.663-.236-.374A9.944 9.944 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Admin Dashboard ────────────────────────────────────────────────
async function AdminDashboard({ lojaId }: { lojaId: string }) {
  const supabase = await createClient()

  const hoje = new Date()
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0]
  const inicioMesAnt = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1).toISOString().split('T')[0]
  const fimMesAnt = new Date(hoje.getFullYear(), hoje.getMonth(), 0).toISOString().split('T')[0]

  const [vendasRes, vendasAntRes, aparelhosRes, vendedoresRes] = await Promise.all([
    supabase.from('vendas')
      .select('id, cliente_nome, valor_total, lucro, comissao, data_venda, aparelho_id, vendedor_id')
      .eq('loja_id', lojaId).eq('status', 'convertido')
      .gte('data_venda', inicioMes).order('data_venda', { ascending: false }),
    supabase.from('vendas')
      .select('valor_total, lucro, comissao')
      .eq('loja_id', lojaId).eq('status', 'convertido')
      .gte('data_venda', inicioMesAnt).lte('data_venda', fimMesAnt),
    supabase.from('aparelhos')
      .select('id, tipo, status, custo, data_entrada, modelo, capacidade, cor')
      .eq('loja_id', lojaId),
    supabase.from('usuarios')
      .select('id, nome, iniciais, comissao_pct, meta_mensal')
      .eq('loja_id', lojaId).eq('perfil', 'vendedor').eq('status', 'ativo'),
  ])

  const vs = (vendasRes.data ?? []) as any[]
  const vsL = (vendasAntRes.data ?? []) as any[]
  const aps_all = (aparelhosRes.data ?? []) as any[]
  const vends = (vendedoresRes.data ?? []) as any[]

  const aps = aps_all.filter((a: any) => a.status !== 'vendido')
  const vendidosCount = aps_all.filter((a: any) => a.status === 'vendido').length

  // Financial
  const fat = vs.reduce((s, v) => s + (v.valor_total ?? 0), 0)
  const fatL = vsL.reduce((s, v) => s + (v.valor_total ?? 0), 0)
  const luc = vs.reduce((s, v) => s + (v.lucro ?? 0), 0)
  const com = vs.reduce((s, v) => s + (v.comissao ?? 0), 0)
  const nVend = vs.length
  const ticket = nVend > 0 ? fat / nVend : 0
  const mg = fat > 0 ? (luc / fat * 100).toFixed(1) : '0'
  const entrada = fat - com
  const fatDiff = fatL > 0 ? Math.round((fat - fatL) / fatL * 100) : null

  // Stock
  const disps = aps.filter((a: any) => ['disponivel', 'negociacao', 'em_analise'].includes(a.status))
  const novos = disps.filter((a: any) => a.tipo === 'novo')
  const usados = disps.filter((a: any) => a.tipo === 'usado')
  const investN = novos.reduce((s: number, a: any) => s + (a.custo ?? 0), 0)
  const investU = usados.reduce((s: number, a: any) => s + (a.custo ?? 0), 0)
  const invest = investN + investU
  const negoc = aps.filter((a: any) => a.status === 'negociacao').length
  const p30 = disps.filter((a: any) => a.data_entrada && daysDiff(a.data_entrada) > 30).length
  const p60 = disps.filter((a: any) => a.data_entrada && daysDiff(a.data_entrada) > 60).length
  const p90 = disps.filter((a: any) => a.data_entrada && daysDiff(a.data_entrada) > 90).length
  const giro = aps_all.length > 0 ? (vendidosCount / aps_all.length * 100) : 0

  // Top modelos
  const mc: Record<string, number> = {}
  vs.forEach((v: any) => {
    const ap = aps_all.find((a: any) => a.id === v.aparelho_id)
    if (ap) mc[ap.modelo] = (mc[ap.modelo] ?? 0) + 1
  })
  const topModelos = Object.entries(mc).sort((a, b) => b[1] - a[1]).slice(0, 5)

  // Vendedores ranking
  const rank = vends.map((u: any) => ({
    ...u,
    qtd: vs.filter((v: any) => v.vendedor_id === u.id).length,
    fat: vs.filter((v: any) => v.vendedor_id === u.id).reduce((s: number, v: any) => s + (v.valor_total ?? 0), 0),
    com: vs.filter((v: any) => v.vendedor_id === u.id).reduce((s: number, v: any) => s + (v.comissao ?? 0), 0),
  })).sort((a: any, b: any) => b.fat - a.fat)

  const best = rank[0] ?? null

  // Saúde score
  let score = 100
  if (p90 > 0) score -= p90 * 8
  if (p60 > 0) score -= p60 * 4
  if (p30 > 0) score -= p30 * 2
  if (giro < 40) score -= 20
  else if (giro > 70) score += 10
  if (fat === 0) score -= 30
  else if (fatDiff !== null) {
    if (fatDiff < 0) score += fatDiff
    else score += Math.min(10, fatDiff / 2)
  }
  score = Math.max(0, Math.min(100, score))
  const saude = score >= 65
    ? { label: 'Loja Saudável', icon: '🟢', color: '#34d399', bg: 'rgba(52,211,153,.08)', border: 'rgba(52,211,153,.2)', msg: 'Estoque girando bem e vendas ativas.' }
    : score >= 35
    ? { label: 'Atenção', icon: '🟡', color: '#fbbf24', bg: 'rgba(251,191,36,.08)', border: 'rgba(251,191,36,.2)', msg: 'Existem pontos que merecem atenção na operação.' }
    : { label: 'Situação Crítica', icon: '🔴', color: '#f87171', bg: 'rgba(248,113,113,.08)', border: 'rgba(248,113,113,.25)', msg: 'Há aparelhos críticos no estoque e/ou queda nas vendas.' }

  // Alertas
  const alertas: string[] = []
  if (p90 > 0) alertas.push(`🚨 ${p90} aparelho(s) parado(s) há mais de 90 dias`)
  if (fatDiff !== null && fatDiff < -5) alertas.push(`📉 Vendas caíram ${Math.abs(fatDiff)}% em relação ao mês anterior`)
  if (nVend === 0) alertas.push('⚠️ Nenhuma venda registrada este mês')
  if (usados.length < 5) alertas.push(`📦 Estoque de usados abaixo de 5 (${usados.length} disponíveis)`)
  if (novos.length < 3) alertas.push(`📱 Estoque de novos abaixo de 3 (${novos.length} disponíveis)`)

  const ultVendas = vs.slice(0, 5)

  return (
    <div className="p-6 max-w-[1400px]">

      {/* LINHA 1: Saúde + 4 KPIs */}
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-3.5 mb-3.5">
        <div className="rounded-2xl p-5 flex flex-col justify-between min-h-[120px]"
          style={{ background: saude.bg, border: `1px solid ${saude.border}` }}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/30 mb-2">Saúde da Operação</p>
            <p className="text-xl font-black tracking-tight" style={{ color: saude.color }}>
              {saude.icon} {saude.label}
            </p>
            <p className="text-[11px] text-white/40 mt-1.5 leading-relaxed">{saude.msg}</p>
          </div>
          <p className="text-[9px] text-white/20 mt-3 pt-2.5" style={{ borderTop: `1px solid ${saude.border}` }}>
            Baseado em estoque, giro e vendas.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          <KpiBox
            icon="💰" label="Faturamento" value={fmt(fat)} valueColor="#34d399"
            sub={fatDiff !== null
              ? `${fatDiff >= 0 ? '▲' : '▼'} ${Math.abs(fatDiff)}% vs mês ant.`
              : `${nVend} venda(s)`}
          />
          <KpiBox
            icon="📈" label="Lucro Previsto" value={fmt(luc)} valueColor={luc > 0 ? '#34d399' : '#f87171'}
            sub={`Margem: ${mg}%`}
          />
          <KpiBox
            icon="💳" label="Ticket Médio" value={fmt(ticket)}
            sub={nVend > 0 ? `${nVend} vendas` : 'Sem vendas'}
          />
          <KpiBox
            icon="💵" label="Entrada em Caixa" value={fmt(entrada)}
            sub="Após comissões"
          />
        </div>
      </div>

      {/* LINHA 2: Estoque KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5 mb-3.5">
        <div className="col-span-2 lg:col-span-1 bg-white/5 border border-white/8 rounded-2xl p-4"
          style={{ background: 'linear-gradient(135deg,rgba(79,126,255,.1),rgba(79,126,255,.03))', borderColor: 'rgba(79,126,255,.2)' }}>
          <div className="flex items-center gap-1.5 mb-2">
            <span>📦</span>
            <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">Valor Investido em Estoque</span>
          </div>
          <div className="text-[22px] font-black tracking-tight text-[#4f7eff]">{fmt(invest)}</div>
          <div className="text-[10px] text-white/30 mt-0.5">
            {disps.length} disp. · {fmt(investN)} novos · {fmt(investU)} usados
          </div>
        </div>
        <KpiBox icon="📱" label="Novos" value={String(novos.length)} sub={fmt(investN) + ' investido'} />
        <KpiBox icon="🔄" label="Usados" value={String(usados.length)} sub={fmt(investU) + ' investido'} />
        <KpiBox icon="⚡" label="Negociação" value={String(negoc)} sub="Possíveis compradores" valueColor="#22d3ee" />
        <KpiBox icon="👨‍💼" label="Comissões" value={fmt(com)} sub="Mês atual" valueColor="#fbbf24" />
      </div>

      {/* Alertas */}
      {alertas.length > 0 && (
        <div className="rounded-2xl p-4 mb-3.5"
          style={{ background: 'rgba(251,191,36,.06)', border: '1px solid rgba(251,191,36,.18)' }}>
          <p className="text-[10px] font-bold uppercase tracking-wider text-yellow-400 mb-2.5">Alertas da Loja</p>
          <div className="flex flex-col gap-1.5">
            {alertas.map((a, i) => <p key={i} className="text-xs text-white/50">{a}</p>)}
          </div>
        </div>
      )}

      {/* LINHA 3: Últimas vendas + Melhor vendedor + Top modelos */}
      <div className="flex flex-col lg:flex-row gap-3.5 items-start">

        {/* Últimas vendas */}
        <div className="flex-[2] bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/5">
            <div>
              <p className="text-sm font-semibold text-white">Últimas Vendas</p>
              <p className="text-[10px] text-white/30">{mesNome()}</p>
            </div>
            <Link href="/vendas" className="text-[10px] text-white/40 hover:text-white transition-colors">
              Ver todas →
            </Link>
          </div>
          {ultVendas.length === 0 ? (
            <div className="flex flex-col items-center py-10">
              <p className="text-white/20 text-sm">Nenhuma venda este mês.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  {['Data', 'Cliente', 'Produto', 'Valor', 'Lucro'].map(h => (
                    <th key={h} className="text-left text-[10px] text-white/30 font-medium px-5 py-2.5">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ultVendas.map((v: any) => {
                  const ap = aps_all.find((a: any) => a.id === v.aparelho_id)
                  return (
                    <tr key={v.id} className="border-b border-white/5 last:border-0 hover:bg-white/3">
                      <td className="px-5 py-2.5 text-[11px] text-white/40">{v.data_venda}</td>
                      <td className="px-5 py-2.5 text-xs font-semibold text-white">{v.cliente_nome}</td>
                      <td className="px-5 py-2.5 text-[11px] text-white/50">{ap?.modelo ?? '–'}</td>
                      <td className="px-5 py-2.5 text-xs font-mono text-white">{fmt(v.valor_total)}</td>
                      <td className="px-5 py-2.5 text-xs font-mono text-emerald-400">{fmt(v.lucro)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Coluna direita */}
        <div className="flex-1 flex flex-col gap-3.5 min-w-[220px]">

          {/* Melhor vendedor */}
          <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/5">
              <p className="text-xs font-semibold text-white">🏆 Melhor Vendedor</p>
              <p className="text-[10px] text-white/30">{mesNome()}</p>
            </div>
            {!best || best.fat === 0 ? (
              <div className="px-4 py-5 text-center">
                <p className="text-xs text-white/30">Sem vendas no período.</p>
              </div>
            ) : (
              <div className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-[#4f7eff]/20 text-[#4f7eff] flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {best.iniciais ?? ini(best.nome)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{best.nome}</p>
                    <p className="text-[11px] text-emerald-400 font-semibold">{fmt(best.fat)} vendidos</p>
                    <p className="text-[10px] text-white/30">{best.qtd} venda(s) · com. {fmt(best.com)}</p>
                  </div>
                </div>
                {best.meta_mensal > 0 && (() => {
                  const pct = Math.min(100, best.fat / best.meta_mensal * 100)
                  const barColor = pct >= 100 ? '#34d399' : pct >= 70 ? '#4f7eff' : '#fbbf24'
                  return (
                    <div>
                      <p className="text-[10px] text-white/30 mb-1">{pct.toFixed(0)}% da meta ({fmt(best.meta_mensal)})</p>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: barColor }} />
                      </div>
                    </div>
                  )
                })()}
              </div>
            )}
          </div>

          {/* Top modelos */}
          <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/5">
              <p className="text-xs font-semibold text-white">📱 Top Modelos Vendidos</p>
            </div>
            {topModelos.length === 0 ? (
              <div className="px-4 py-5 text-center">
                <p className="text-xs text-white/30">Sem dados.</p>
              </div>
            ) : (
              <div>
                {topModelos.map(([modelo, qtd], i) => {
                  const pct = (qtd / topModelos[0][1] * 100).toFixed(0)
                  return (
                    <div key={modelo} className="flex items-center gap-2.5 px-4 py-2.5 border-b border-white/5 last:border-0">
                      <div className="w-4 h-4 rounded-full bg-[#4f7eff]/15 text-[#4f7eff] flex items-center justify-center text-[9px] font-bold">
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-[11px] font-semibold text-white">{modelo}</p>
                        <div className="h-0.5 bg-white/10 rounded-full mt-1 overflow-hidden">
                          <div className="h-full bg-[#4f7eff] rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      <span className="text-xs font-bold text-[#4f7eff]">{qtd}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* LINHA 4: Metas dos vendedores */}
      {rank.length > 0 && (
        <div className="mt-3.5 bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/5">
            <div>
              <p className="text-sm font-semibold text-white">Meta dos Vendedores</p>
              <p className="text-[10px] text-white/30">{mesNome()}</p>
            </div>
            <Link href="/funcionarios" className="text-[10px] text-white/40 hover:text-white transition-colors">
              Gerenciar →
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {rank.map((r: any) => {
              const meta = r.meta_mensal ?? 0
              const pct = meta > 0 ? Math.min(100, r.fat / meta * 100) : 0
              const barColor = pct >= 100 ? '#34d399' : pct >= 70 ? '#4f7eff' : pct >= 40 ? '#fbbf24' : '#f87171'
              return (
                <div key={r.id} className="p-4 border-r border-b border-white/5">
                  <div className="flex items-center gap-2 mb-2.5">
                    <div className="w-6 h-6 rounded-lg bg-[#4f7eff]/15 text-[#4f7eff] flex items-center justify-center text-[9px] font-bold">
                      {r.iniciais ?? ini(r.nome)}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white">{r.nome}</p>
                      <p className="text-[10px] text-white/30">{r.qtd} venda(s) · com. {fmt(r.com)}</p>
                    </div>
                    {pct >= 100 && (
                      <span className="ml-auto text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded-full font-bold">
                        🏆 Meta
                      </span>
                    )}
                  </div>
                  {meta > 0 ? (
                    <>
                      <div className="flex justify-between text-[10px] text-white/30 mb-1">
                        <span>{fmt(r.fat)}</span>
                        <span>{pct.toFixed(0)}% de {fmt(meta)}</span>
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: barColor }} />
                      </div>
                    </>
                  ) : (
                    <p className="text-[10px] text-white/20">Sem meta definida</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────
export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('nome, perfil, loja_id')
    .eq('id', user.id)
    .single<{ nome: string; perfil: string; loja_id: string | null }>()

  if (!usuario) redirect('/login')

  if (usuario.perfil === 'ceo') return <CEODashboard />
  if (usuario.perfil === 'vendedor') redirect('/minha-area')
  if (!usuario.loja_id) redirect('/login')

  return <AdminDashboard lojaId={usuario.loja_id} />
}

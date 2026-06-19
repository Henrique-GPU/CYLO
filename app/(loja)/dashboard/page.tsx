import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { fmt } from '@/lib/utils/format'
import Link from 'next/link'
import { LojaCardActions } from '@/app/(loja)/lojas/loja-card-actions'
import TrackConversion from '@/components/dashboard/track-conversion'
import PeriodSelector from '@/components/dashboard/period-selector'
import RevenueChart from '@/components/dashboard/revenue-chart'
import CommissionRanking from '@/components/dashboard/commission-ranking'
import GreetingHero from '@/components/dashboard/greeting-hero'
import InsightBanner from '@/components/dashboard/insight-banner'
import MiniStat from '@/components/dashboard/mini-stat'
import AnimatedPanel from '@/components/dashboard/animated-panel'

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
function toISO(d: Date) {
  return d.toISOString().split('T')[0]
}
function periodoRanges(periodo: string) {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const amanha = new Date(hoje)
  amanha.setDate(amanha.getDate() + 1)

  if (periodo === 'hoje') {
    const ontem = new Date(hoje); ontem.setDate(ontem.getDate() - 1)
    return { inicio: hoje, fim: amanha, inicioAnt: ontem, fimAnt: hoje, dias: 1 }
  }
  if (periodo === '7d') {
    const inicio = new Date(hoje); inicio.setDate(inicio.getDate() - 6)
    const inicioAnt = new Date(inicio); inicioAnt.setDate(inicioAnt.getDate() - 7)
    return { inicio, fim: amanha, inicioAnt, fimAnt: inicio, dias: 7 }
  }
  if (periodo === 'mes') {
    const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
    const fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1)
    const inicioAnt = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1)
    const dias = Math.round((fim.getTime() - inicio.getTime()) / 86400000)
    return { inicio, fim, inicioAnt, fimAnt: inicio, dias }
  }
  // 30d (default)
  const inicio = new Date(hoje); inicio.setDate(inicio.getDate() - 29)
  const inicioAnt = new Date(inicio); inicioAnt.setDate(inicioAnt.getDate() - 30)
  return { inicio, fim: amanha, inicioAnt, fimAnt: inicio, dias: 30 }
}
function serieDiaria(vendas: { data_venda: string; valor_total: number }[], inicio: Date, fim: Date) {
  const porDia: Record<string, number> = {}
  const cursor = new Date(inicio)
  while (cursor < fim) {
    porDia[toISO(cursor)] = 0
    cursor.setDate(cursor.getDate() + 1)
  }
  vendas.forEach(v => {
    const dia = v.data_venda.split('T')[0]
    if (dia in porDia) porDia[dia] += v.valor_total ?? 0
  })
  return Object.entries(porDia).map(([dia, total]) => ({
    dia: `${dia.split('-')[2]}/${dia.split('-')[1]}`,
    total,
  }))
}
function temVendaSuficiente(vendas: any[]) {
  return vendas.length >= 2
}

// ── sub-components ─────────────────────────────────────────────────
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
async function AdminDashboard({ lojaId, nome, searchParams }: { lojaId: string; nome: string; searchParams: Promise<{ periodo?: string }> }) {
  const supabase = await createClient()
  const { periodo: periodoParam } = await searchParams
  const periodo = periodoParam ?? '30d'
  const { inicio, fim, inicioAnt, fimAnt } = periodoRanges(periodo)

  const hoje = new Date()
  const inicioMes = toISO(new Date(hoje.getFullYear(), hoje.getMonth(), 1))
  const fimMes = toISO(new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1))

  const [vendasRes, vendasAntRes, vendasMesRes, aparelhosRes, vendedoresRes, lojaRes] = await Promise.all([
    supabase.from('vendas')
      .select('id, cliente_nome, valor_total, lucro, comissao, data_venda, aparelho_id, vendedor_id')
      .eq('loja_id', lojaId).eq('status', 'convertido')
      .gte('data_venda', toISO(inicio)).lt('data_venda', toISO(fim))
      .order('data_venda', { ascending: false }),
    supabase.from('vendas')
      .select('valor_total, lucro, comissao')
      .eq('loja_id', lojaId).eq('status', 'convertido')
      .gte('data_venda', toISO(inicioAnt)).lt('data_venda', toISO(fimAnt)),
    supabase.from('vendas')
      .select('valor_total')
      .eq('loja_id', lojaId).eq('status', 'convertido')
      .gte('data_venda', inicioMes).lt('data_venda', fimMes),
    supabase.from('aparelhos')
      .select('id, tipo, status, custo, data_entrada, modelo, capacidade, cor')
      .eq('loja_id', lojaId),
    supabase.from('usuarios')
      .select('id, nome, iniciais, comissao_pct, meta_mensal')
      .eq('loja_id', lojaId).eq('perfil', 'vendedor').eq('status', 'ativo'),
    supabase.from('lojas')
      .select('meta_mensal')
      .eq('id', lojaId)
      .single<{ meta_mensal: number | null }>(),
  ])

  const vs = (vendasRes.data ?? []) as any[]
  const vsL = (vendasAntRes.data ?? []) as any[]
  const vsMes = (vendasMesRes.data ?? []) as any[]
  const aps_all = (aparelhosRes.data ?? []) as any[]
  const vends = (vendedoresRes.data ?? []) as any[]
  const lojaMeta = lojaRes.data?.meta_mensal ?? null

  const aps = aps_all.filter((a: any) => a.status !== 'vendido')
  const vendidosCount = aps_all.filter((a: any) => a.status === 'vendido').length

  // Financial — período atual vs período anterior
  function calcVar(atual: number, anterior: number) {
    if (anterior <= 0) return null
    return Math.round((atual - anterior) / anterior * 100)
  }
  const fat = vs.reduce((s, v) => s + (v.valor_total ?? 0), 0)
  const fatL = vsL.reduce((s, v) => s + (v.valor_total ?? 0), 0)
  const luc = vs.reduce((s, v) => s + (v.lucro ?? 0), 0)
  const lucL = vsL.reduce((s, v) => s + (v.lucro ?? 0), 0)
  const com = vs.reduce((s, v) => s + (v.comissao ?? 0), 0)
  const nVend = vs.length
  const nVendL = vsL.length
  const ticket = nVend > 0 ? fat / nVend : 0
  const ticketL = nVendL > 0 ? fatL / nVendL : 0
  const mg = fat > 0 ? (luc / fat * 100).toFixed(1) : '0'
  const entrada = fat - com
  const entradaL = fatL - vsL.reduce((s, v) => s + (v.comissao ?? 0), 0)

  const fatVar = calcVar(fat, fatL)
  const lucVar = calcVar(luc, lucL)
  const ticketVar = calcVar(ticket, ticketL)
  const entradaVar = calcVar(entrada, entradaL)

  const fatMes = vsMes.reduce((s, v) => s + (v.valor_total ?? 0), 0)

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

  // Vendedores ranking (por comissão, no período selecionado)
  const rank = vends.map((u: any) => ({
    ...u,
    qtd: vs.filter((v: any) => v.vendedor_id === u.id).length,
    fat: vs.filter((v: any) => v.vendedor_id === u.id).reduce((s: number, v: any) => s + (v.valor_total ?? 0), 0),
    com: vs.filter((v: any) => v.vendedor_id === u.id).reduce((s: number, v: any) => s + (v.comissao ?? 0), 0),
  })).filter((r: any) => r.com > 0).sort((a: any, b: any) => b.com - a.com)

  const bestPorFat = [...vends.map((u: any) => ({
    ...u,
    qtd: vs.filter((v: any) => v.vendedor_id === u.id).length,
    fat: vs.filter((v: any) => v.vendedor_id === u.id).reduce((s: number, v: any) => s + (v.valor_total ?? 0), 0),
    com: vs.filter((v: any) => v.vendedor_id === u.id).reduce((s: number, v: any) => s + (v.comissao ?? 0), 0),
  }))].sort((a: any, b: any) => b.fat - a.fat)
  const best = bestPorFat[0] ?? null

  // Saúde score
  let score = 100
  if (p90 > 0) score -= p90 * 8
  if (p60 > 0) score -= p60 * 4
  if (p30 > 0) score -= p30 * 2
  if (giro < 40) score -= 20
  else if (giro > 70) score += 10
  if (fat === 0) score -= 30
  else if (fatVar !== null) {
    if (fatVar < 0) score += fatVar
    else score += Math.min(10, fatVar / 2)
  }
  score = Math.max(0, Math.min(100, score))
  const saude = score >= 65
    ? { label: 'Loja saudável', color: '#34d399', bg: 'rgba(52,211,153,0.07)', border: 'rgba(52,211,153,0.20)', msg: '— estoque girando bem e vendas ativas' }
    : score >= 35
    ? { label: 'Atenção', color: '#f59e0b', bg: 'rgba(245,158,11,0.07)', border: 'rgba(245,158,11,0.20)', msg: '— existem pontos que merecem atenção na operação' }
    : { label: 'Situação crítica', color: '#f87171', bg: 'rgba(248,113,113,0.07)', border: 'rgba(248,113,113,0.22)', msg: '— há aparelhos críticos no estoque e/ou queda nas vendas' }

  // Alertas
  const alertas: string[] = []
  if (p90 > 0) alertas.push(`${p90} aparelho(s) parado(s) há mais de 90 dias`)
  if (fatVar !== null && fatVar < -5) alertas.push(`Vendas caíram ${Math.abs(fatVar)}% em relação ao período anterior`)
  if (nVend === 0) alertas.push('Nenhuma venda registrada no período')
  if (usados.length < 5) alertas.push(`Estoque de usados abaixo de 5 (${usados.length} disponível)`)
  if (novos.length < 3) alertas.push(`Estoque de novos abaixo de 3 (${novos.length} disponível)`)

  const ultVendas = vs.slice(0, 5)
  const serie = serieDiaria(vs, inicio, fim)
  const periodoLabel: Record<string, string> = { hoje: 'hoje', '7d': 'últimos 7 dias', '30d': 'últimos 30 dias', mes: mesNome() }

  // Meta do mês
  const metaPct = lojaMeta ? Math.min(100, fatMes / lojaMeta * 100) : null
  const diasRestantesMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1).getDate() - hoje.getDate() +
    (new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate() - hoje.getDate())
  const diasNoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate()
  const diasFaltam = diasNoMes - hoje.getDate()

  return (
    <div className="p-5 sm:p-8 max-w-[1400px]" style={{ background: 'var(--app-bg-base)' }}>

      <GreetingHero
        nome={nome}
        faturamento={fat}
        faturamentoVar={fatVar}
        lucro={luc}
        periodoLabel={periodoLabel[periodo]}
        metaPct={lojaMeta ? metaPct : null}
        metaValor={lojaMeta}
        periodoSelector={<PeriodSelector atual={periodo} />}
      />

      {/* Faixa Saúde da operação */}
      <AnimatedPanel delay={0.05} hover={false} className="rounded-2xl px-4 py-3 mb-3.5 flex items-center gap-2"
        style={{ background: saude.bg, border: `1px solid ${saude.border}` }}>
        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: saude.color }} />
        <p className="text-[13px] font-medium" style={{ color: saude.color }}>{saude.label}</p>
        <p className="text-[12px]" style={{ color: 'var(--app-ink-secondary)' }}>{saude.msg}</p>
      </AnimatedPanel>

      <InsightBanner alertas={alertas} />

      {/* Métricas de apoio */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5 mb-3.5">
        <MiniStat label="Ticket médio" value={ticket} delay={0.1} />
        <MiniStat label="Entrada em caixa" value={entrada} color="#60a5fa" delay={0.13} />
        <MiniStat label="Valor em estoque" value={invest} color="#a78bfa" delay={0.16} />
        <MiniStat label="Comissões" value={com} color="#f59e0b" delay={0.19} />
        <MiniStat label="Em negociação" value={negoc} kind="int" delay={0.22} />
      </div>

      {/* Gráfico de faturamento — peça larga */}
      <AnimatedPanel delay={0.1} hover={false} className="rounded-2xl mb-3.5 p-5" style={{ background: 'var(--app-bg-surface)' }}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium" style={{ color: 'var(--app-ink-primary)' }}>Faturamento · {periodoLabel[periodo]}</p>
          {fatVar !== null && (
            <span className="text-[11px] font-semibold" style={{ color: fatVar >= 0 ? 'var(--app-profit)' : 'var(--app-alert)' }}>
              {fatVar >= 0 ? '▲' : '▼'} {Math.abs(fatVar)}% vs período ant.
            </span>
          )}
        </div>
        {temVendaSuficiente(vs) ? (
          <RevenueChart serie={serie} />
        ) : (
          <div className="flex items-center justify-center" style={{ height: 96 }}>
            <p className="text-[12px] text-center" style={{ color: 'var(--app-ink-tertiary)' }}>
              Ainda juntando dados — registre vendas para ver sua curva de faturamento.
            </p>
          </div>
        )}
      </AnimatedPanel>

      {/* Últimas vendas + Melhor vendedor + Top modelos — composição assimétrica */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] gap-3.5 mb-3.5">

        {/* Últimas vendas */}
        <AnimatedPanel delay={0.15} className="rounded-2xl overflow-hidden" style={{ background: 'var(--app-bg-surface)' }}>
          <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: '1px solid var(--app-hairline)' }}>
            <p className="text-sm font-medium" style={{ color: 'var(--app-ink-primary)' }}>Últimas vendas</p>
            <Link href="/vendas" className="text-[11px]" style={{ color: '#60a5fa' }}>Ver todas →</Link>
          </div>
          {ultVendas.length === 0 ? (
            <div className="flex flex-col items-center py-10">
              <p className="text-sm" style={{ color: 'var(--app-ink-tertiary)' }}>Nenhuma venda no período.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px]">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--app-hairline)' }}>
                    {['Data', 'Cliente', 'Valor', 'Lucro'].map(h => (
                      <th key={h} className="text-left text-[10px] font-medium px-5 py-2.5" style={{ color: 'var(--app-ink-tertiary)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ultVendas.map((v: any) => (
                    <tr key={v.id} className="last:border-0" style={{ borderBottom: '1px solid var(--app-hairline)' }}>
                      <td className="px-5 py-2.5 text-[11px]" style={{ color: 'var(--app-ink-secondary)' }}>{fdBR(v.data_venda?.split('T')[0])}</td>
                      <td className="px-5 py-2.5 text-xs font-medium" style={{ color: 'var(--app-ink-primary)' }}>{v.cliente_nome}</td>
                      <td className="px-5 py-2.5 text-xs font-mono" style={{ color: 'var(--app-ink-primary)' }}>{fmt(v.valor_total)}</td>
                      <td className="px-5 py-2.5 text-xs font-mono text-right" style={{ color: 'var(--app-profit)' }}>{fmt(v.lucro)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AnimatedPanel>

        {/* Coluna direita */}
        <div className="flex flex-col gap-3.5">

          {/* Melhor vendedor */}
          <AnimatedPanel delay={0.2} className="rounded-2xl overflow-hidden" style={{ background: 'var(--app-bg-surface)' }}>
            <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid var(--app-hairline)' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4zM7 4H4a2 2 0 0 0 0 4M17 4h3a2 2 0 0 1 0 4" />
              </svg>
              <p className="text-xs font-medium" style={{ color: 'var(--app-ink-primary)' }}>Melhor vendedor</p>
            </div>
            {!best || best.fat === 0 ? (
              <div className="px-4 py-5 text-center">
                <p className="text-xs" style={{ color: 'var(--app-ink-tertiary)' }}>Sem vendas no período.</p>
              </div>
            ) : (
              <div className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: 'rgba(96,165,250,0.15)', color: '#60a5fa' }}>
                    {best.iniciais ?? ini(best.nome)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--app-ink-primary)' }}>{best.nome}</p>
                    <p className="text-[11px]" style={{ color: 'var(--app-ink-secondary)' }}>{best.qtd} venda(s) · {fmt(best.fat)}</p>
                  </div>
                </div>
              </div>
            )}
          </AnimatedPanel>

          {/* Top modelos */}
          <AnimatedPanel delay={0.25} className="rounded-2xl overflow-hidden flex-1" style={{ background: 'var(--app-bg-surface)' }}>
            <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--app-hairline)' }}>
              <p className="text-xs font-medium" style={{ color: 'var(--app-ink-primary)' }}>Top modelos vendidos</p>
            </div>
            {topModelos.length === 0 ? (
              <div className="px-4 py-5 text-center">
                <p className="text-xs" style={{ color: 'var(--app-ink-tertiary)' }}>Sem dados no período.</p>
              </div>
            ) : (
              <div>
                {topModelos.map(([modelo, qtd], i) => {
                  const pct = (qtd / topModelos[0][1] * 100)
                  return (
                    <div key={modelo} className="flex items-center gap-2.5 px-4 py-2.5 last:border-0" style={{ borderBottom: '1px solid var(--app-hairline)' }}>
                      <div className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0"
                        style={{ background: 'rgba(96,165,250,0.15)', color: '#60a5fa' }}>
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium truncate" style={{ color: 'var(--app-ink-primary)' }}>{modelo}</p>
                        <div className="h-0.5 rounded-full mt-1 overflow-hidden" style={{ background: '#1f2230' }}>
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: '#60a5fa' }} />
                        </div>
                      </div>
                      <span className="text-xs font-bold flex-shrink-0" style={{ color: '#60a5fa' }}>{qtd}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </AnimatedPanel>
        </div>
      </div>

      {/* Mix do estoque + Meta do mês */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 mb-3.5">

        {/* Mix do estoque */}
        <AnimatedPanel delay={0.3} className="rounded-2xl p-5" style={{ background: 'var(--app-bg-surface)' }}>
          <p className="text-sm font-medium mb-4" style={{ color: 'var(--app-ink-primary)' }}>Mix do estoque</p>
          {(() => {
            const max = Math.max(investN, investU, 1)
            return (
              <div className="flex flex-col gap-3">
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span style={{ color: 'var(--app-ink-secondary)' }}>Novos · {novos.length}</span>
                    <span style={{ color: 'var(--app-ink-primary)' }}>{fmt(investN)}</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: '#1f2230' }}>
                    <div className="h-full rounded-full" style={{ width: `${(investN / max) * 100}%`, background: '#60a5fa' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span style={{ color: 'var(--app-ink-secondary)' }}>Usados · {usados.length}</span>
                    <span style={{ color: 'var(--app-ink-primary)' }}>{fmt(investU)}</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: '#1f2230' }}>
                    <div className="h-full rounded-full" style={{ width: `${(investU / max) * 100}%`, background: '#f59e0b' }} />
                  </div>
                </div>
              </div>
            )
          })()}
        </AnimatedPanel>

        {/* Meta do mês */}
        <AnimatedPanel delay={0.35} className="rounded-2xl p-5" style={{ background: 'var(--app-bg-surface)' }}>
          <p className="text-sm font-medium mb-4" style={{ color: 'var(--app-ink-primary)' }}>Meta do mês</p>
          {lojaMeta && metaPct !== null ? (
            <>
              <div className="flex justify-between text-[12px] mb-1.5">
                <span style={{ color: 'var(--app-ink-primary)' }}>{fmt(fatMes)} de {fmt(lojaMeta)}</span>
                <span style={{ color: 'var(--app-profit)' }}>{metaPct.toFixed(0)}%</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: '#1f2230' }}>
                <div className="h-full rounded-full" style={{ width: `${metaPct}%`, background: 'var(--app-profit)' }} />
              </div>
              <p className="text-[11px] mt-2" style={{ color: 'var(--app-ink-secondary)' }}>
                Faltam {fmt(Math.max(0, lojaMeta - fatMes))} · {diasFaltam} dia(s) restante(s)
              </p>
            </>
          ) : (
            <div className="flex flex-col items-start gap-2">
              <p className="text-xs" style={{ color: 'var(--app-ink-tertiary)' }}>Nenhuma meta definida para este mês.</p>
              <Link href="/configuracoes" className="text-[11px] font-medium" style={{ color: '#60a5fa' }}>
                Defina sua meta do mês →
              </Link>
            </div>
          )}
        </AnimatedPanel>
      </div>

      {/* Comissão dos vendedores */}
      <AnimatedPanel delay={0.4} hover={false}>
        <CommissionRanking ranking={rank} mes={periodoLabel[periodo]} />
      </AnimatedPanel>
    </div>
  )
}


// ── Main page ──────────────────────────────────────────────────────
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string; novo?: string }>
}) {
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

  return (
    <>
      <TrackConversion />
      <AdminDashboard lojaId={usuario.loja_id} nome={usuario.nome} searchParams={searchParams} />
    </>
  )
}

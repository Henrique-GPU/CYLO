import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

const VALOR_PLANO = 59.9

interface Loja { id: string; nome: string; responsavel: string | null; whatsapp: string | null }
interface Ass {
  loja_id: string
  status: 'trial' | 'ativa' | 'inadimplente' | 'cancelada'
  trial_ate: string
  inadimplente_desde: string | null
  pago_ate: string | null
  asaas_subscription_id: string | null
  atualizado_em: string
}
interface Evento { evento_id: string; tipo: string; recebido_em: string; loja_id?: string | null; detalhe?: string | null }

const dataHora = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
const dataBR = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : '—'
const dias = (iso: string) => Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000)
const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const TIPO_EVENTO: Record<string, { texto: string; cor: string }> = {
  PAYMENT_CONFIRMED: { texto: 'Pagamento confirmado', cor: 'text-emerald-400' },
  PAYMENT_RECEIVED: { texto: 'Pagamento recebido', cor: 'text-emerald-400' },
  PAYMENT_OVERDUE: { texto: 'Cobrança vencida', cor: 'text-red-400' },
  PAYMENT_REFUNDED: { texto: 'Pagamento estornado', cor: 'text-amber-400' },
  PAYMENT_CHARGEBACK_REQUESTED: { texto: 'Chargeback solicitado', cor: 'text-red-400' },
  PAYMENT_CREDIT_CARD_CAPTURE_REFUSED: { texto: 'Cartão recusado', cor: 'text-red-400' },
  PAYMENT_REPROVED_BY_RISK_ANALYSIS: { texto: 'Cartão reprovado na análise de risco', cor: 'text-red-400' },
  SUBSCRIPTION_DELETED: { texto: 'Assinatura cancelada', cor: 'text-white/60' },
  SUBSCRIPTION_INACTIVATED: { texto: 'Assinatura inativada', cor: 'text-white/60' },
  SUBSCRIPTION_CREATED: { texto: 'Assinatura criada', cor: 'text-[#4f7eff]' },
  PAYMENT_CREATED: { texto: 'Cobrança gerada', cor: 'text-white/40' },
}

// O cadastro grava o prefixo do e-mail como responsável; só usa o nome se parecer um nome (2+ palavras)
const saudacao = (loja: Loja) => {
  const partes = (loja.responsavel ?? '').trim().split(/\s+/)
  if (partes.length < 2 || /[0-9@._]/.test(partes[0])) return ''
  return ', ' + partes[0].charAt(0).toUpperCase() + partes[0].slice(1).toLowerCase()
}

function Whats({ loja, msg }: { loja: Loja; msg?: string }) {
  const n = (loja.whatsapp ?? '').replace(/\D/g, '')
  if (n.length < 10) return <span className="text-white/20 text-xs">sem WhatsApp</span>
  const num = n.startsWith('55') ? n : `55${n}`
  const href = `https://wa.me/${num}${msg ? `?text=${encodeURIComponent(msg)}` : ''}`
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-[#25d366] hover:underline text-xs font-medium whitespace-nowrap">
      {msg ? 'Avisar no WhatsApp' : 'WhatsApp'}
    </a>
  )
}

function Grupo({ titulo, cor, vazio, linhas }: {
  titulo: string; cor: string; vazio: string
  linhas: { loja: Loja; info: string; msg?: string }[]
}) {
  return (
    <div className="bg-white/4 border border-white/10 rounded-2xl overflow-hidden">
      <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
        <p className={`text-sm font-bold ${cor}`}>{titulo}</p>
        <span className="text-xs text-white/30">{linhas.length}</span>
      </div>
      {linhas.length === 0 ? (
        <p className="px-5 py-4 text-xs text-white/30">{vazio}</p>
      ) : (
        <div className="divide-y divide-white/5">
          {linhas.map(({ loja, info, msg }) => (
            <div key={loja.id} className="px-5 py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm text-white font-medium truncate">{loja.nome}</p>
                <p className="text-[11px] text-white/40 truncate">{loja.responsavel ?? '—'} · {info}</p>
              </div>
              <Whats loja={loja} msg={msg} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default async function CobrancasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: u } = await supabase.from('usuarios').select('perfil').eq('id', user.id).single<{ perfil: string }>()
  if (u?.perfil !== 'ceo') redirect('/dashboard')

  const admin = createAdminClient()
  const [{ data: lojasData }, { data: assData }] = await Promise.all([
    admin.from('lojas').select('id, nome, responsavel, whatsapp').order('nome'),
    admin.from('assinaturas').select('loja_id, status, trial_ate, inadimplente_desde, pago_ate, asaas_subscription_id, atualizado_em'),
  ])
  const lojas = (lojasData ?? []) as Loja[]
  const assinaturas = (assData ?? []) as Ass[]
  const porLoja = new Map(assinaturas.map(a => [a.loja_id, a]))
  const nomes = new Map(lojas.map(l => [l.id, l.nome]))

  // Atividade recente. Se a migration 005 ainda não foi aplicada, cai para as colunas básicas.
  let eventos: Evento[] = []
  const completo = await admin.from('asaas_webhook_eventos').select('evento_id, tipo, recebido_em, loja_id, detalhe').order('recebido_em', { ascending: false }).limit(40)
  if (!completo.error) eventos = (completo.data ?? []) as Evento[]
  else {
    const basico = await admin.from('asaas_webhook_eventos').select('evento_id, tipo, recebido_em').order('recebido_em', { ascending: false }).limit(40)
    eventos = (basico.data ?? []) as Evento[]
  }

  const grupos = {
    ativa: [] as { loja: Loja; info: string; ordem: number; msg?: string }[],
    trial: [] as { loja: Loja; info: string; ordem: number; msg?: string }[],
    inadimplente: [] as { loja: Loja; info: string; ordem: number; msg?: string }[],
    cancelada: [] as { loja: Loja; info: string; ordem: number; msg?: string }[],
  }
  for (const loja of lojas) {
    const a = porLoja.get(loja.id)
    if (!a) continue
    if (a.status === 'ativa') {
      grupos.ativa.push({ loja, info: `próxima cobrança ${dataBR(a.pago_ate)}${a.asaas_subscription_id ? '' : ' · manual (sem Asaas)'}`, ordem: 0 })
    } else if (a.status === 'trial') {
      const d = dias(a.trial_ate)
      grupos.trial.push({
        loja,
        info: d > 0 ? `teste termina em ${d} ${d === 1 ? 'dia' : 'dias'} (${dataBR(a.trial_ate)})` : `teste encerrado em ${dataBR(a.trial_ate)}`,
        ordem: d,
        msg: d > 0
          ? `Olá${saudacao(loja)}! Aqui é o Henrique, do CYLO. O teste grátis da ${loja.nome} termina em ${dataBR(a.trial_ate)}. A partir daí o CYLO passa a ter assinatura mensal de R$ 59,90, cobrada no cartão de crédito. Seus dados continuam todos salvos: é só assinar pela tela do app, no botão "Assinar". Qualquer dúvida é só me chamar aqui.`
          : `Olá${saudacao(loja)}! Aqui é o Henrique, do CYLO. O teste grátis da ${loja.nome} terminou, mas seus dados continuam todos salvos. Para voltar a usar é só assinar pela tela do app (R$ 59,90/mês no cartão de crédito). Qualquer dúvida é só me chamar aqui.`,
      })
    } else if (a.status === 'inadimplente' && a.inadimplente_desde) {
      const trava = new Date(new Date(a.inadimplente_desde).getTime() + 3 * 864e5).toISOString()
      grupos.inadimplente.push({
        loja,
        info: `cartão recusado desde ${dataBR(a.inadimplente_desde)} · ${dias(trava) > 0 ? `trava em ${dataBR(trava)}` : 'já travada'}`,
        ordem: 0,
        msg: `Olá${saudacao(loja)}! Aqui é o Henrique, do CYLO. Não conseguimos cobrar o cartão da assinatura da ${loja.nome}. Para não perder o acesso, é só atualizar o pagamento em cyloapp.com.br/assinar. Se precisar de ajuda, me chama aqui.`,
      })
    } else if (a.status === 'cancelada') {
      grupos.cancelada.push({
        loja,
        info: a.pago_ate && new Date(a.pago_ate) > new Date() ? `cancelou · acesso até ${dataBR(a.pago_ate)}` : 'cancelou · acesso encerrado',
        ordem: 0,
        msg: `Olá${saudacao(loja)}! Aqui é o Henrique, do CYLO. Vi que a assinatura da ${loja.nome} foi cancelada. Aconteceu algum problema? Posso ajudar em alguma coisa?`,
      })
    }
  }
  grupos.trial.sort((x, y) => x.ordem - y.ordem)

  const mrr = grupos.ativa.length * VALOR_PLANO
  const semAssinatura = lojas.filter(l => !porLoja.has(l.id))

  const cards = [
    { l: 'Assinando', v: String(grupos.ativa.length), c: 'text-emerald-400' },
    { l: 'Em teste', v: String(grupos.trial.length), c: 'text-amber-400' },
    { l: 'Cartão recusado', v: String(grupos.inadimplente.length), c: grupos.inadimplente.length ? 'text-red-400' : 'text-white' },
    { l: 'Cancelaram', v: String(grupos.cancelada.length), c: 'text-white/70' },
    { l: 'Receita mensal', v: brl(mrr), c: 'text-white' },
  ]

  return (
    <div className="p-4 sm:p-6 max-w-5xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Cobranças</h1>
        <p className="text-sm text-white/40 mt-0.5">Quem assina, quem está no teste, quem cancelou e quem teve o cartão recusado.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {cards.map(c => (
          <div key={c.l} className="bg-white/4 border border-white/10 rounded-2xl p-4">
            <p className="text-[10px] uppercase tracking-wider text-white/30 font-bold">{c.l}</p>
            <p className={`text-xl font-black mt-1 ${c.c}`}>{c.v}</p>
          </div>
        ))}
      </div>

      {semAssinatura.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl px-5 py-3 text-sm text-red-300">
          {semAssinatura.length} loja(s) sem registro de assinatura (ficam travadas): {semAssinatura.map(l => l.nome).join(', ')}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        <Grupo titulo="Cartão recusado" cor="text-red-400" vazio="Nenhuma cobrança com problema." linhas={grupos.inadimplente} />
        <Grupo titulo="Cancelaram" cor="text-white/70" vazio="Ninguém cancelou." linhas={grupos.cancelada} />
        <Grupo titulo="Assinando" cor="text-emerald-400" vazio="Ainda ninguém assinou." linhas={grupos.ativa} />
        <Grupo titulo="Em teste grátis" cor="text-amber-400" vazio="Nenhuma loja em teste." linhas={grupos.trial} />
      </div>

      <div className="bg-white/4 border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-white/5">
          <p className="text-sm font-bold text-white">Atividade recente</p>
        </div>
        {eventos.length === 0 ? (
          <p className="px-5 py-4 text-xs text-white/30">Nenhum evento recebido do Asaas ainda.</p>
        ) : (
          <div className="divide-y divide-white/5">
            {eventos.map(e => {
              const t = TIPO_EVENTO[e.tipo] ?? { texto: e.tipo, cor: 'text-white/50' }
              return (
                <div key={e.evento_id} className="px-5 py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className={`text-sm font-medium ${t.cor}`}>{t.texto}</p>
                    <p className="text-[11px] text-white/40 truncate">
                      {e.loja_id ? (nomes.get(e.loja_id) ?? 'loja removida') : 'loja não identificada'}
                      {e.detalhe ? ` · ${e.detalhe}` : ''}
                    </p>
                  </div>
                  <span className="text-[11px] text-white/30 whitespace-nowrap">{dataHora(e.recebido_em)}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

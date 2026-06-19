import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { fmt } from '@/lib/utils/format'
import { ArrowLeft, Phone, AtSign, Calendar, Edit2, CheckCircle } from 'lucide-react'
import PageFadeIn from '@/components/ui/page-fade-in'

function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR')
}

export default async function ClienteDetalhe({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usuario } = await supabase
    .from('usuarios').select('loja_id, perfil')
    .eq('id', user.id).single<{ loja_id: string; perfil: string }>()
  if (!usuario?.loja_id) redirect('/dashboard')

  const { id } = await params

  const [clienteRes, vendasRes] = await Promise.all([
    supabase.from('clientes')
      .select('id, nome, telefone, instagram, criado_em')
      .eq('id', id)
      .eq('loja_id', usuario.loja_id)
      .single<any>(),
    supabase.from('vendas')
      .select('id, data_venda, status, valor_total, com_troca, troca_modelo, troca_valor, troca_estado, vendedor_nome, aparelhos(modelo, capacidade, cor, tipo)')
      .eq('loja_id', usuario.loja_id)
      .eq('cliente_id', id)
      .order('criado_em', { ascending: false }),
  ])

  if (!clienteRes.data) notFound()

  const cliente = clienteRes.data
  const vendas = (vendasRes.data ?? []) as any[]

  const orcamentos = vendas.filter(v => v.status === 'orcamento')
  const convertidas = vendas.filter(v => v.status === 'convertido')
  const canceladas = vendas.filter(v => v.status === 'cancelado')
  const trocas = convertidas.filter(v => v.com_troca && v.troca_modelo)

  const totalGasto = convertidas.reduce((s, v) => s + (v.valor_total ?? 0), 0)

  return (
    <PageFadeIn>
      <div className="p-5 sm:p-6 max-w-4xl" style={{ background: 'var(--app-bg-base)' }}>
        {/* Back */}
        <Link href="/clientes" className="flex items-center gap-1.5 text-xs mb-5 transition-colors" style={{ color: 'var(--app-ink-tertiary)' }}>
          <ArrowLeft size={13} />Voltar para Clientes
        </Link>

        {/* Header do cliente */}
        <div className="rounded-2xl p-5 mb-4" style={{ background: 'var(--app-bg-surface)' }}>
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(79,126,255,.15)' }}>
              <span className="text-2xl font-semibold text-[#4f7eff]">{cliente.nome.charAt(0).toUpperCase()}</span>
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-semibold tracking-tight" style={{ color: 'var(--app-ink-primary)' }}>{cliente.nome}</h1>
              <div className="flex flex-wrap gap-3 mt-1.5">
                {cliente.telefone && (
                  <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--app-ink-secondary)' }}>
                    <Phone size={11} />{cliente.telefone}
                  </span>
                )}
                {cliente.instagram && (
                  <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--app-ink-secondary)' }}>
                    <AtSign size={11} />{cliente.instagram}
                  </span>
                )}
                <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--app-ink-tertiary)' }}>
                  <Calendar size={11} />Cliente desde {fmtDate(cliente.criado_em?.split('T')[0])}
                </span>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xl font-semibold text-[#4f7eff]">{fmt(totalGasto)}</p>
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--app-ink-tertiary)' }}>{convertidas.length} compra{convertidas.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>

        {/* Orçamentos ativos */}
        <Section title="Orçamentos" count={orcamentos.length} color="yellow" empty="Nenhum orçamento em aberto.">
          {orcamentos.map(v => (
            <VendaRow key={v.id} v={v} showActions perfil={usuario.perfil} />
          ))}
        </Section>

        {/* Compras */}
        <Section title="Compras" count={convertidas.length} color="green" empty="Nenhuma compra registrada.">
          {convertidas.map(v => (
            <VendaRow key={v.id} v={v} perfil={usuario.perfil} />
          ))}
        </Section>

        {/* Trocas recebidas */}
        {trocas.length > 0 && (
          <Section title="Trocas recebidas" count={trocas.length} color="blue" empty="">
            {trocas.map(v => (
              <div key={v.id} className="flex items-center justify-between py-2.5 last:border-0" style={{ borderBottom: '1px solid var(--app-hairline)' }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--app-ink-primary)' }}>{v.troca_modelo}</p>
                  <p className="text-xs" style={{ color: 'var(--app-ink-tertiary)' }}>
                    {v.troca_estado} · {fmtDate(v.data_venda)} · na venda do {v.aparelhos?.modelo ?? '—'}
                  </p>
                </div>
                <span className="text-sm font-mono font-semibold text-emerald-400">− {fmt(v.troca_valor ?? 0)}</span>
              </div>
            ))}
          </Section>
        )}

        {/* Cancelados */}
        {canceladas.length > 0 && (
          <Section title="Cancelados" count={canceladas.length} color="gray" empty="">
            {canceladas.map(v => (
              <VendaRow key={v.id} v={v} perfil={usuario.perfil} />
            ))}
          </Section>
        )}
      </div>
    </PageFadeIn>
  )
}

function Section({
  title, count, color, empty, children,
}: {
  title: string; count: number; color: 'yellow' | 'green' | 'blue' | 'gray'; empty: string; children: React.ReactNode
}) {
  const colorMap = {
    yellow: 'text-yellow-400 bg-yellow-500/15',
    green: 'text-emerald-400 bg-emerald-500/15',
    blue: 'text-blue-400 bg-blue-500/15',
    gray: 'bg-white/8',
  }
  return (
    <div className="rounded-2xl mb-3 overflow-hidden" style={{ background: 'var(--app-bg-surface)' }}>
      <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: '1px solid var(--app-hairline)' }}>
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--app-ink-primary)' }}>{title}</p>
        <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${colorMap[color]}`} style={color === 'gray' ? { color: 'var(--app-ink-tertiary)' } : undefined}>{count}</span>
      </div>
      <div className="px-4 py-1">
        {count === 0
          ? <p className="text-xs py-3 italic" style={{ color: 'var(--app-ink-tertiary)' }}>{empty}</p>
          : children}
      </div>
    </div>
  )
}

function VendaRow({ v, showActions, perfil }: { v: any; showActions?: boolean; perfil: string }) {
  const ap = v.aparelhos
  const nome = ap ? `${ap.modelo}${ap.capacidade ? ' ' + ap.capacidade : ''}${ap.cor ? ' · ' + ap.cor : ''}` : '—'
  return (
    <div className="flex items-center gap-3 py-2.5 last:border-0" style={{ borderBottom: '1px solid var(--app-hairline)' }}>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: 'var(--app-ink-primary)' }}>{nome}</p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-[10px]" style={{ color: 'var(--app-ink-tertiary)' }}>{v.data_venda ? new Date(v.data_venda + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}</span>
          {v.vendedor_nome && <span className="text-[10px]" style={{ color: 'var(--app-ink-tertiary)' }}>{v.vendedor_nome}</span>}
          {v.com_troca && v.troca_modelo && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400">+ troca</span>
          )}
        </div>
      </div>
      <span className="text-sm font-mono font-semibold text-[#4f7eff] flex-shrink-0">{fmt(v.valor_total)}</span>
      {showActions && (
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link href={`/nova-venda?editar=${v.id}`}
            className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg bg-yellow-500/15 text-yellow-400 hover:bg-yellow-500/25 transition-colors">
            <Edit2 size={9} />Editar
          </Link>
          <Link href={`/nova-venda?editar=${v.id}&converter=1`}
            className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-colors">
            <CheckCircle size={9} />Fechar
          </Link>
        </div>
      )}
    </div>
  )
}

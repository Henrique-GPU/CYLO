'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { fmt } from '@/lib/utils/format'
import Link from 'next/link'
import { Package, Plus } from 'lucide-react'
import { IPHONE_CATALOG } from '@/lib/catalog/iphone'
import AparelhoPanel from '@/components/estoque/aparelho-panel'

type Tab = 'cards' | 'novos' | 'usados'

const STATUS_LABEL: Record<string, string> = {
  disponivel: 'Disponível', reservado: 'Reservado', vendido: 'Vendido',
  manutencao: 'Manutenção', negociacao: 'Negociação', em_analise: 'Em Análise',
}
const STATUS_COLOR: Record<string, string> = {
  disponivel: 'bg-emerald-500/10 text-emerald-400',
  reservado: 'bg-amber-500/10 text-amber-400',
  vendido: 'bg-white/5 text-white/30',
  manutencao: 'bg-red-500/10 text-red-400',
  negociacao: 'bg-blue-500/10 text-blue-400',
  em_analise: 'bg-purple-500/10 text-purple-400',
}

function daysSince(date: string | null): number {
  if (!date) return 0
  return Math.floor((Date.now() - new Date(date).getTime()) / 86400000)
}

interface NovoGroup {
  modelo: string
  capacidade: string
  cor: string
  qty: number
  preco: number
  custo: number
}

export default function EstoqueClient({ aparelhos, isAdmin }: { aparelhos: any[]; isAdmin: boolean }) {
  const [tab, setTab] = useState<Tab>('cards')
  const [selecionado, setSelecionado] = useState<any | null>(null)

  const novos = aparelhos.filter(a => a.tipo === 'novo')
  const usados = aparelhos.filter(a => a.tipo === 'usado')

  // Group novos by (modelo, capacidade, cor) — performant, client-side
  const novosGrouped = useMemo<NovoGroup[]>(() => {
    const map = new Map<string, NovoGroup>()
    for (const a of novos) {
      const key = `${a.modelo}|${a.capacidade ?? ''}|${a.cor ?? ''}`
      if (!map.has(key)) {
        map.set(key, {
          modelo: a.modelo,
          capacidade: a.capacidade ?? '',
          cor: a.cor ?? '',
          qty: 0,
          preco: a.preco ?? 0,
          custo: a.custo ?? 0,
        })
      }
      const g = map.get(key)!
      g.qty++
      if (a.preco) g.preco = a.preco
      if (a.custo) g.custo = a.custo
    }
    return Array.from(map.values()).sort((a, b) => a.modelo.localeCompare(b.modelo))
  }, [novos])

  const tabList: { key: Tab; label: string; count: number }[] = [
    { key: 'cards', label: 'Aparelhos', count: aparelhos.length },
    { key: 'novos', label: 'Novos Lacrados', count: novos.length },
    { key: 'usados', label: 'Usados', count: usados.length },
  ]

  const empty = (
    <div className="flex flex-col items-center justify-center py-20">
      <Package size={40} className="text-white/10 mb-3" />
      <p className="text-sm" style={{ color: 'var(--app-ink-tertiary)' }}>Nenhum aparelho nesta aba</p>
    </div>
  )

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 mb-5 rounded-xl p-1 w-fit" style={{ background: 'var(--app-bg-surface)' }}>
        {tabList.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={tab === t.key
              ? { background: '#4f7eff', color: 'white' }
              : { color: 'var(--app-ink-secondary)' }}
          >
            {t.label}
            <span className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold"
              style={tab === t.key ? { background: 'rgba(255,255,255,0.2)' } : { background: 'rgba(255,255,255,0.06)' }}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── Tab: Cards (visão primária) ──────────────────────────────── */}
      {tab === 'cards' && (
        aparelhos.length === 0 ? empty : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {aparelhos.map((a: any, i: number) => {
              const isNew = a.tipo === 'novo'
              const dias = daysSince(a.data_entrada)
              const mg = isAdmin && a.preco > 0 ? (a.preco - a.custo) / a.preco * 100 : null
              return (
                <motion.button
                  key={a.id}
                  onClick={() => setSelecionado(a)}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: Math.min(i * 0.03, 0.4) }}
                  whileHover={{ y: -3 }}
                  className="text-left rounded-2xl p-4 transition-colors"
                  style={{ background: 'var(--app-bg-surface)' }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${isNew ? 'bg-blue-500/15 text-blue-400' : 'bg-amber-500/15 text-amber-400'}`}>
                      {isNew ? 'Lacrado' : 'Usado'}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-md ${STATUS_COLOR[a.status] ?? ''}`}>
                      {STATUS_LABEL[a.status]}
                    </span>
                  </div>
                  <p className="text-sm font-semibold leading-tight" style={{ color: 'var(--app-ink-primary)' }}>{a.modelo}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--app-ink-secondary)' }}>{a.capacidade}{a.cor ? ` · ${a.cor}` : ''}</p>

                  {!isNew && a.bateria_pct != null && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[9px]" style={{ color: 'var(--app-ink-tertiary)' }}>Bateria</span>
                        <span className="text-[9px] font-semibold" style={{ color: 'var(--app-ink-secondary)' }}>{a.bateria_pct}%</span>
                      </div>
                      <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                        <div className="h-full rounded-full" style={{
                          width: `${a.bateria_pct}%`,
                          background: a.bateria_pct >= 80 ? '#34d399' : a.bateria_pct >= 60 ? '#fbbf24' : '#f87171',
                        }} />
                      </div>
                    </div>
                  )}

                  {mg !== null && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="text-[10px] font-semibold" style={{ color: mg > 25 ? '#34d399' : mg > 15 ? '#fbbf24' : '#f87171' }}>
                        {mg.toFixed(0)}% margem
                      </span>
                    </div>
                  )}

                  <div className="mt-3 pt-3 flex items-center justify-between" style={{ borderTop: '1px solid var(--app-hairline)' }}>
                    <span className="text-base font-semibold text-[#4f7eff]">{fmt(a.preco)}</span>
                    <span className="text-[9px]" style={{ color: 'var(--app-ink-tertiary)' }}>{dias}d</span>
                  </div>
                  {a.imei && (
                    <p className="text-[9px] font-mono mt-1 truncate" style={{ color: 'var(--app-ink-tertiary)' }}>IMEI {a.imei}</p>
                  )}
                </motion.button>
              )
            })}
          </div>
        )
      )}

      {/* ── Tab: Novos agrupados ─────────────────────────────────────── */}
      {tab === 'novos' && (
        <div>
          {novosGrouped.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 rounded-2xl mb-4" style={{ background: 'var(--app-bg-surface)' }}>
              <Package size={36} className="text-white/10 mb-3" />
              <p className="text-sm mb-1" style={{ color: 'var(--app-ink-secondary)' }}>Nenhum lacrado em estoque</p>
              {isAdmin && (
                <Link href="/estoque/novo" className="text-xs text-[#4f7eff] hover:underline mt-1">
                  + Cadastrar primeiro aparelho
                </Link>
              )}
            </div>
          ) : (
            <div className="rounded-2xl overflow-hidden mb-4 overflow-x-auto" style={{ background: 'var(--app-bg-surface)' }}>
              <table className="w-full min-w-[480px]">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--app-hairline)' }}>
                    <th className="text-left text-xs font-medium px-5 py-3" style={{ color: 'var(--app-ink-tertiary)' }}>Modelo</th>
                    <th className="text-left text-xs font-medium px-4 py-3" style={{ color: 'var(--app-ink-tertiary)' }}>Cap.</th>
                    <th className="text-left text-xs font-medium px-4 py-3" style={{ color: 'var(--app-ink-tertiary)' }}>Cor</th>
                    <th className="text-center text-xs font-medium px-4 py-3" style={{ color: 'var(--app-ink-tertiary)' }}>Qtd</th>
                    {isAdmin && <th className="text-right text-xs font-medium px-4 py-3" style={{ color: 'var(--app-ink-tertiary)' }}>Custo</th>}
                    <th className="text-right text-xs font-medium px-4 py-3" style={{ color: 'var(--app-ink-tertiary)' }}>Preço</th>
                    {isAdmin && <th className="text-left text-xs font-medium px-4 py-3" style={{ color: 'var(--app-ink-tertiary)' }}>Margem</th>}
                    {isAdmin && <th className="text-center text-xs font-medium px-4 py-3" style={{ color: 'var(--app-ink-tertiary)' }}>+</th>}
                  </tr>
                </thead>
                <tbody>
                  {novosGrouped.map(g => {
                    const mg = g.preco > 0 ? (g.preco - g.custo) / g.preco * 100 : 0
                    const mgColor = mg > 25 ? '#34d399' : mg > 15 ? '#fbbf24' : '#f87171'
                    const addUrl = `/estoque/novo?modelo=${encodeURIComponent(g.modelo)}&capacidade=${encodeURIComponent(g.capacidade)}&cor=${encodeURIComponent(g.cor)}`
                    return (
                      <tr
                        key={`${g.modelo}|${g.capacidade}|${g.cor}`}
                        className="last:border-0 hover:bg-white/[0.03] transition-colors"
                        style={{ borderBottom: '1px solid var(--app-hairline)' }}
                      >
                        <td className="px-5 py-3 text-sm font-semibold" style={{ color: 'var(--app-ink-primary)' }}>{g.modelo}</td>
                        <td className="px-4 py-3 text-xs" style={{ color: 'var(--app-ink-secondary)' }}>{g.capacidade || '—'}</td>
                        <td className="px-4 py-3 text-xs" style={{ color: 'var(--app-ink-secondary)' }}>{g.cor || '—'}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-sm font-bold font-mono ${g.qty <= 2 ? 'text-yellow-400' : ''}`} style={g.qty > 2 ? { color: 'var(--app-ink-primary)' } : undefined}>
                            {g.qty}
                          </span>
                        </td>
                        {isAdmin && (
                          <td className="px-4 py-3 text-sm font-mono text-red-400 text-right">{fmt(g.custo)}</td>
                        )}
                        <td className="px-4 py-3 text-sm font-mono font-bold text-[#4f7eff] text-right">{fmt(g.preco)}</td>
                        {isAdmin && (
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2 min-w-[70px]">
                              <span className="text-xs font-bold" style={{ color: mgColor }}>{mg.toFixed(0)}%</span>
                              <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                                <div className="h-full rounded-full" style={{ width: `${Math.min(100, mg)}%`, background: mgColor }} />
                              </div>
                            </div>
                          </td>
                        )}
                        {isAdmin && (
                          <td className="px-4 py-3 text-center">
                            <Link
                              href={addUrl}
                              className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-[#4f7eff]/15 text-[#4f7eff] hover:bg-[#4f7eff]/30 transition-colors font-bold text-sm"
                              title={`Adicionar mais ${g.modelo} ${g.capacidade} ${g.cor}`}
                            >
                              <Plus size={12} />
                            </Link>
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {isAdmin && (
            <div className="rounded-2xl p-4" style={{ background: 'var(--app-bg-surface)' }}>
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--app-ink-tertiary)' }}>
                Catálogo — adicionar ao estoque
              </p>
              <div className="flex flex-wrap gap-1.5">
                {IPHONE_CATALOG.map(item => {
                  const hasStock = novosGrouped.some(g => g.modelo === item.modelo)
                  return (
                    <Link
                      key={item.modelo}
                      href={`/estoque/novo?modelo=${encodeURIComponent(item.modelo)}`}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all ${
                        hasStock
                          ? 'bg-blue-500/10 border-blue-500/25 text-blue-300 hover:bg-blue-500/20'
                          : 'border-white/8 hover:bg-white/8'
                      }`}
                      style={!hasStock ? { color: 'var(--app-ink-tertiary)' } : undefined}
                    >
                      {item.modelo}
                    </Link>
                  )
                })}
              </div>
              <p className="text-[10px] mt-2" style={{ color: 'var(--app-ink-tertiary)' }}>
                Azul = tem estoque · Clique para adicionar mais unidades
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Usados ──────────────────────────────────────────────── */}
      {tab === 'usados' && (
        usados.length === 0 ? empty : (
          <div className="rounded-2xl overflow-hidden overflow-x-auto" style={{ background: 'var(--app-bg-surface)' }}>
            <table className="w-full min-w-[600px]">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--app-hairline)' }}>
                  <th className="text-left text-xs font-medium px-5 py-3" style={{ color: 'var(--app-ink-tertiary)' }}>IMEI</th>
                  <th className="text-left text-xs font-medium px-5 py-3" style={{ color: 'var(--app-ink-tertiary)' }}>Modelo</th>
                  <th className="text-center text-xs font-medium px-5 py-3" style={{ color: 'var(--app-ink-tertiary)' }}>Bat.</th>
                  <th className="text-center text-xs font-medium px-5 py-3" style={{ color: 'var(--app-ink-tertiary)' }}>Estado</th>
                  <th className="text-left text-xs font-medium px-5 py-3" style={{ color: 'var(--app-ink-tertiary)' }}>Origem</th>
                  {isAdmin && <th className="text-right text-xs font-medium px-5 py-3" style={{ color: 'var(--app-ink-tertiary)' }}>Custo</th>}
                  <th className="text-right text-xs font-medium px-5 py-3" style={{ color: 'var(--app-ink-tertiary)' }}>Venda</th>
                  <th className="text-center text-xs font-medium px-5 py-3" style={{ color: 'var(--app-ink-tertiary)' }}>Status</th>
                  <th className="text-center text-xs font-medium px-5 py-3" style={{ color: 'var(--app-ink-tertiary)' }}>Dias</th>
                </tr>
              </thead>
              <tbody>
                {usados.map((a: any) => {
                  const dias = daysSince(a.data_entrada)
                  const diasColor = dias > 60 ? 'text-red-400' : dias > 30 ? 'text-yellow-400' : ''
                  const batColor = (a.bateria_pct ?? 100) >= 80 ? 'text-emerald-400' : (a.bateria_pct ?? 100) >= 60 ? 'text-yellow-400' : 'text-red-400'
                  return (
                    <tr
                      key={a.id}
                      onClick={() => setSelecionado(a)}
                      className="last:border-0 hover:bg-white/[0.03] transition-colors cursor-pointer"
                      style={{ borderBottom: '1px solid var(--app-hairline)' }}
                    >
                      <td className="px-5 py-3 text-xs font-mono" style={{ color: 'var(--app-ink-secondary)' }}>{a.imei ?? '—'}</td>
                      <td className="px-5 py-3">
                        <span className="text-sm font-semibold hover:text-[#4f7eff]" style={{ color: 'var(--app-ink-primary)' }}>
                          {a.modelo} {a.capacidade}
                        </span>
                        {a.cor && <p className="text-[10px]" style={{ color: 'var(--app-ink-tertiary)' }}>{a.cor}</p>}
                      </td>
                      <td className="px-5 py-3 text-center">
                        {a.bateria_pct != null
                          ? <span className={`text-xs font-bold font-mono ${batColor}`}>🔋 {a.bateria_pct}%</span>
                          : <span className="text-xs" style={{ color: 'var(--app-ink-tertiary)' }}>—</span>}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded-md capitalize ${
                          a.estado === 'excelente' ? 'bg-emerald-500/10 text-emerald-400'
                          : a.estado === 'bom' ? 'bg-blue-500/10 text-blue-400'
                          : a.estado === 'regular' ? 'bg-yellow-500/10 text-yellow-400'
                          : 'bg-red-500/10 text-red-400'
                        }`}>{a.estado ?? '—'}</span>
                      </td>
                      <td className="px-5 py-3 text-xs" style={{ color: 'var(--app-ink-secondary)' }}>{a.origem_aparelho ?? '—'}</td>
                      {isAdmin && <td className="px-5 py-3 text-sm font-mono text-red-400 text-right">{fmt(a.custo)}</td>}
                      <td className="px-5 py-3 text-sm font-mono font-bold text-[#4f7eff] text-right">{fmt(a.preco)}</td>
                      <td className="px-5 py-3 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded-md ${STATUS_COLOR[a.status] ?? ''}`}>
                          {STATUS_LABEL[a.status]}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className={`text-xs font-bold ${diasColor}`} style={!diasColor ? { color: 'var(--app-ink-secondary)' } : undefined}>{dias}d</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )
      )}

      <AparelhoPanel aparelho={selecionado} isAdmin={isAdmin} onClose={() => setSelecionado(null)} />
    </div>
  )
}

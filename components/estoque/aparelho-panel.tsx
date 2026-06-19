'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Package } from 'lucide-react'
import { fmt } from '@/lib/utils/format'
import Link from 'next/link'

const STATUS_LABEL: Record<string, string> = {
  disponivel: 'Disponível', reservado: 'Reservado', vendido: 'Vendido',
  manutencao: 'Manutenção', negociacao: 'Em Negociação', em_analise: 'Em Análise',
}
const STATUS_COLOR: Record<string, string> = {
  disponivel: 'bg-emerald-500/15 text-emerald-400',
  reservado: 'bg-amber-500/15 text-amber-400',
  vendido: 'bg-white/8 text-white/30',
  manutencao: 'bg-red-500/15 text-red-400',
  negociacao: 'bg-blue-500/15 text-blue-400',
  em_analise: 'bg-purple-500/15 text-purple-400',
}

function daysSince(date: string | null): number {
  if (!date) return 0
  return Math.floor((Date.now() - new Date(date).getTime()) / 86400000)
}

function Row({ label, value, highlight }: { label: string; value: React.ReactNode; highlight?: string }) {
  return (
    <div className="flex items-center justify-between py-2.5" style={{ borderBottom: '1px solid var(--app-hairline)' }}>
      <span className="text-xs" style={{ color: 'var(--app-ink-secondary)' }}>{label}</span>
      <span className={`text-sm font-medium ${highlight ?? ''}`} style={!highlight ? { color: 'var(--app-ink-primary)' } : undefined}>{value}</span>
    </div>
  )
}

export default function AparelhoPanel({
  aparelho,
  isAdmin,
  onClose,
}: {
  aparelho: any | null
  isAdmin: boolean
  onClose: () => void
}) {
  const ap = aparelho
  const dias = ap ? daysSince(ap.data_entrada) : 0
  const custo = ap?.custo ?? 0
  const preco = ap?.preco ?? 0
  const lucro = preco - custo
  const mg = ap && preco > 0 ? (lucro / preco * 100) : null
  const mgColor = mg !== null ? (mg > 25 ? '#34d399' : mg > 15 ? '#fbbf24' : '#f87171') : '#888'

  return (
    <AnimatePresence>
      {ap && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.5)' }}
          />
          <motion.div
            key="panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 280, damping: 30 }}
            className="fixed top-0 right-0 z-50 h-full w-full sm:w-[420px] overflow-y-auto"
            style={{ background: 'var(--app-bg-elevated)' }}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4" style={{ background: 'var(--app-bg-elevated)', borderBottom: '1px solid var(--app-hairline)' }}>
              <p className="text-sm font-medium" style={{ color: 'var(--app-ink-primary)' }}>Detalhe do aparelho</p>
              <button onClick={onClose} className="w-11 h-11 rounded-full flex items-center justify-center transition-colors hover:bg-white/10 active:bg-white/15" style={{ color: 'var(--app-ink-secondary)' }}>
                <X size={18} />
              </button>
            </div>

            <div className="p-5 pb-28">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(79,126,255,.12)' }}>
                  <Package size={24} className="text-[#4f7eff]" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold" style={{ color: 'var(--app-ink-primary)' }}>{ap.modelo}</h2>
                  <p className="text-sm mt-0.5" style={{ color: 'var(--app-ink-secondary)' }}>{ap.capacidade}{ap.cor ? ` · ${ap.cor}` : ''}</p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-md ${ap.tipo === 'novo' ? 'bg-blue-500/15 text-blue-400' : 'bg-amber-500/15 text-amber-400'}`}>
                      {ap.tipo === 'novo' ? 'Lacrado' : 'Usado'}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-md ${STATUS_COLOR[ap.status] ?? ''}`}>
                      {STATUS_LABEL[ap.status]}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--app-ink-tertiary)' }}>{dias}d no estoque</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl p-5 mb-4" style={{ background: 'var(--app-bg-surface)' }}>
                <p className="text-[11px] font-medium uppercase tracking-wider mb-1" style={{ color: 'var(--app-ink-tertiary)' }}>Identificação</p>
                {ap.imei && <Row label="IMEI" value={<span className="font-mono text-xs">{ap.imei}</span>} />}
                {ap.capacidade && <Row label="Capacidade" value={ap.capacidade} />}
                {ap.cor && <Row label="Cor" value={ap.cor} />}
                {ap.data_entrada && <Row label="Entrada em estoque" value={new Date(ap.data_entrada).toLocaleDateString('pt-BR')} />}
              </div>

              {ap.tipo === 'usado' && (
                <div className="rounded-2xl p-5 mb-4" style={{ background: 'var(--app-bg-surface)' }}>
                  <p className="text-[11px] font-medium uppercase tracking-wider mb-1" style={{ color: 'var(--app-ink-tertiary)' }}>Condição</p>
                  {ap.estado && <Row label="Estado" value={<span className="capitalize">{ap.estado}</span>} />}
                  {ap.bateria_pct != null && (
                    <div className="flex items-center justify-between py-2.5" style={{ borderBottom: '1px solid var(--app-hairline)' }}>
                      <span className="text-xs" style={{ color: 'var(--app-ink-secondary)' }}>Bateria</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                          <div className="h-full rounded-full" style={{
                            width: `${ap.bateria_pct}%`,
                            background: ap.bateria_pct >= 80 ? '#34d399' : ap.bateria_pct >= 60 ? '#fbbf24' : '#f87171',
                          }} />
                        </div>
                        <span className="text-sm font-medium" style={{ color: 'var(--app-ink-primary)' }}>{ap.bateria_pct}%</span>
                      </div>
                    </div>
                  )}
                  {ap.origem_aparelho && <Row label="Origem" value={ap.origem_aparelho} />}
                </div>
              )}

              {isAdmin ? (
                <div className="rounded-2xl p-5 mb-4" style={{ background: 'var(--app-bg-surface)' }}>
                  <p className="text-[11px] font-medium uppercase tracking-wider mb-1" style={{ color: 'var(--app-ink-tertiary)' }}>Financeiro</p>
                  <Row label="Custo" value={fmt(custo)} highlight="text-red-400" />
                  <Row label="Preço de venda" value={fmt(preco)} highlight="text-[#4f7eff]" />
                  {mg !== null && (
                    <div className="flex items-center justify-between py-2.5" style={{ borderBottom: '1px solid var(--app-hairline)' }}>
                      <span className="text-xs" style={{ color: 'var(--app-ink-secondary)' }}>Margem</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                          <div className="h-full rounded-full" style={{ width: `${Math.min(100, mg)}%`, background: mgColor }} />
                        </div>
                        <span className="text-sm font-semibold" style={{ color: mgColor }}>{mg.toFixed(1)}%</span>
                      </div>
                    </div>
                  )}
                  {preco > 0 && <Row label="Lucro estimado" value={fmt(lucro)} highlight={lucro >= 0 ? 'text-emerald-400' : 'text-red-400'} />}
                </div>
              ) : (
                <div className="rounded-2xl p-5 mb-4" style={{ background: 'var(--app-bg-surface)' }}>
                  <p className="text-[11px] font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--app-ink-tertiary)' }}>Preço</p>
                  <div className="text-3xl font-semibold text-[#4f7eff]">{fmt(preco)}</div>
                </div>
              )}
            </div>

            {ap.status === 'disponivel' && (
              <div className="sticky bottom-0 p-5" style={{ background: 'var(--app-bg-elevated)', borderTop: '1px solid var(--app-hairline)' }}>
                <Link
                  href="/nova-venda"
                  className="block w-full py-3.5 text-center bg-emerald-500 hover:opacity-90 text-white text-sm font-semibold rounded-xl transition-opacity"
                >
                  Vender este aparelho
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

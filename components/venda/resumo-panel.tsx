'use client'

import { motion } from 'framer-motion'
import { fmt } from '@/lib/utils/format'
import { Check } from 'lucide-react'

function StatusBadge({ status }: { status: string }) {
  const color = status === 'Convertido em Venda' ? '#34d399' : status === 'Perdido' ? '#f87171' : '#fbbf24'
  return (
    <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold" style={{ background: `${color}26`, color }}>
      {status}
    </span>
  )
}

export interface ResumoPanelProps {
  clienteNome: string
  aparelhoLabel: string | null
  preco: number
  comTroca: boolean
  valorTroca: number
  acTotal: number
  custoTotal: number
  clientePaga: number
  totalPago: number
  diffPgto: number
  garantia: string
  statusVenda: string
  comissao: number
  isEditMode: boolean
  salvando: boolean
  podeFechar: boolean
  onSalvarOrcamento: () => void
  onIniciarFechamento: () => void
  onVerOrcamento: () => void
}

export default function ResumoPanel({
  clienteNome, aparelhoLabel, preco, comTroca, valorTroca, acTotal, custoTotal,
  clientePaga, totalPago, diffPgto, garantia, statusVenda, comissao,
  isEditMode, salvando, podeFechar,
  onSalvarOrcamento, onIniciarFechamento, onVerOrcamento,
}: ResumoPanelProps) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--app-ink-tertiary)' }}>Resumo</p>

      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span style={{ color: 'var(--app-ink-tertiary)' }}>Cliente</span>
          <span style={{ color: clienteNome ? 'var(--app-ink-primary)' : 'var(--app-ink-tertiary)' }} className="font-medium">{clienteNome || '–'}</span>
        </div>
        <div className="flex justify-between">
          <span style={{ color: 'var(--app-ink-tertiary)' }}>Produto</span>
          <span style={{ color: 'var(--app-ink-primary)' }} className="text-right max-w-[150px] truncate">{aparelhoLabel ?? '–'}</span>
        </div>
        <div className="flex justify-between">
          <span style={{ color: 'var(--app-ink-tertiary)' }}>Preço</span>
          <span className="text-[#4f7eff] font-mono font-semibold">{fmt(preco)}</span>
        </div>
        {comTroca && valorTroca > 0 && (
          <div className="flex justify-between">
            <span style={{ color: 'var(--app-ink-tertiary)' }}>(−) Troca</span>
            <span className="text-emerald-400 font-mono">− {fmt(valorTroca)}</span>
          </div>
        )}
        {acTotal > 0 && (
          <div className="flex justify-between">
            <span style={{ color: 'var(--app-ink-tertiary)' }}>(+) Acessórios</span>
            <span className="text-[#4f7eff] font-mono">+ {fmt(acTotal)}</span>
          </div>
        )}
        {custoTotal > 0 && (
          <div className="flex justify-between">
            <span style={{ color: 'var(--app-ink-tertiary)' }}>Custos op.</span>
            <span className="text-red-400 font-mono">− {fmt(custoTotal)}</span>
          </div>
        )}
      </div>

      <div className="pt-3" style={{ borderTop: '1px solid var(--app-hairline)' }}>
        <span className="text-xs font-semibold" style={{ color: 'var(--app-ink-secondary)' }}>Cliente paga</span>
        <motion.p
          key={Math.round(clientePaga * 100)}
          initial={{ opacity: 0.4, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25 }}
          className="text-3xl font-semibold mt-0.5 tracking-tight"
          style={{ color: 'var(--app-ink-primary)' }}
        >
          {fmt(clientePaga)}
        </motion.p>
        {totalPago > 0 && (
          <p className={`text-xs mt-1 font-mono ${Math.abs(diffPgto) < 1 ? 'text-emerald-400' : 'text-yellow-400'}`}>
            Pgto: {fmt(totalPago)} {Math.abs(diffPgto) > 0.5 && `(diff: ${fmt(diffPgto)})`}
          </p>
        )}
      </div>

      <div className="pt-3 space-y-1.5 text-xs" style={{ borderTop: '1px solid var(--app-hairline)' }}>
        <div className="flex justify-between">
          <span style={{ color: 'var(--app-ink-tertiary)' }}>Garantia</span>
          <span className="text-right max-w-[120px] text-[10px]" style={{ color: 'var(--app-ink-secondary)' }}>{garantia}</span>
        </div>
        <div className="flex justify-between items-center">
          <span style={{ color: 'var(--app-ink-tertiary)' }}>Status</span>
          <StatusBadge status={statusVenda} />
        </div>
        <div className="flex justify-between">
          <span style={{ color: 'var(--app-ink-tertiary)' }}>Comissão</span>
          <span className="text-yellow-400 font-mono">{fmt(comissao)}</span>
        </div>
      </div>

      <div className="pt-3 space-y-2 mt-auto" style={{ borderTop: '1px solid var(--app-hairline)' }}>
        {isEditMode ? (
          <>
            <button onClick={onSalvarOrcamento} disabled={salvando || !podeFechar}
              className="w-full py-2 rounded-xl text-xs transition-colors disabled:opacity-30"
              style={{ border: '1px solid var(--app-hairline)', color: 'var(--app-ink-primary)' }}>
              💾 Salvar
            </button>
            <button onClick={onIniciarFechamento} disabled={salvando || !podeFechar}
              className="w-full py-2 bg-emerald-500 hover:opacity-90 text-white text-xs font-semibold rounded-xl disabled:opacity-30 transition-opacity flex items-center justify-center gap-1.5">
              <Check size={12} />Converter em venda
            </button>
          </>
        ) : (
          <>
            <button onClick={onVerOrcamento} disabled={!podeFechar}
              className="w-full py-2 rounded-xl text-xs transition-colors disabled:opacity-30"
              style={{ border: '1px solid var(--app-hairline)', color: 'var(--app-ink-primary)' }}>
              📄 Orçamento
            </button>
            <button onClick={onIniciarFechamento} disabled={salvando || !podeFechar}
              className="w-full py-2 bg-emerald-500 hover:opacity-90 text-white text-xs font-semibold rounded-xl disabled:opacity-30 transition-opacity flex items-center justify-center gap-1.5">
              <Check size={12} />{salvando ? 'Salvando...' : 'Fechar venda'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

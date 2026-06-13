'use client'

import { useState } from 'react'
import { fmt } from '@/lib/utils/format'
import { Calculator } from 'lucide-react'

const ESTADOS = ['excelente', 'bom', 'regular', 'ruim'] as const
const DEDUCAO: Record<string, number> = { excelente: 0, bom: 0.08, regular: 0.15, ruim: 0.25 }

export default function CalculadoraPage() {
  const [precoLacrado, setPrecoLacrado] = useState('')
  const [bateria, setBateria] = useState('')
  const [estado, setEstado] = useState<string>('bom')

  const preco = parseFloat(precoLacrado.replace(/\D/g, '')) / 100 || 0
  const bat = parseInt(bateria) || 100
  const dedEstado = DEDUCAO[estado] ?? 0
  const dedBateria = bat < 80 ? 0.05 : bat < 90 ? 0.02 : 0
  const valorTroca = preco * (1 - dedEstado - dedBateria)
  const valorCompra = valorTroca * 0.75

  return (
    <div className="p-8 max-w-lg">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">Calculadora de Troca</h1>
        <p className="text-sm text-white/40 mt-0.5">Quanto oferecer pelo aparelho usado</p>
      </div>

      <div className="bg-white/5 border border-white/8 rounded-2xl p-6 space-y-5">
        <div>
          <label className="block text-xs text-white/50 mb-2">Preço lacrado (R$)</label>
          <input
            type="number"
            value={precoLacrado}
            onChange={e => setPrecoLacrado(e.target.value)}
            placeholder="Ex: 5999"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-[var(--color-primary)]"
          />
        </div>

        <div>
          <label className="block text-xs text-white/50 mb-2">Estado do aparelho</label>
          <div className="grid grid-cols-4 gap-2">
            {ESTADOS.map(e => (
              <button
                key={e}
                onClick={() => setEstado(e)}
                className={[
                  'py-2 rounded-lg text-xs font-medium capitalize transition-colors',
                  estado === e
                    ? 'bg-[var(--color-primary)] text-white'
                    : 'bg-white/5 text-white/50 hover:text-white/80'
                ].join(' ')}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs text-white/50 mb-2">Bateria (%)</label>
          <input
            type="number"
            value={bateria}
            onChange={e => setBateria(e.target.value)}
            placeholder="Ex: 87"
            min={0} max={100}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-[var(--color-primary)]"
          />
        </div>
      </div>

      {preco > 0 && (
        <div className="mt-6 bg-white/5 border border-white/8 rounded-2xl p-6">
          <p className="text-xs text-white/40 uppercase tracking-widest mb-4">Resultado</p>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-white/60">Valor na troca (abater do novo)</span>
              <span className="text-lg font-bold text-white">{fmt(valorTroca)}</span>
            </div>
            <div className="flex justify-between border-t border-white/5 pt-3">
              <span className="text-sm text-white/60">Valor sugerido de compra</span>
              <span className="text-sm font-semibold text-amber-400">{fmt(valorCompra)}</span>
            </div>
          </div>
        </div>
      )}

      {preco === 0 && (
        <div className="mt-8 flex flex-col items-center text-center text-white/20">
          <Calculator size={36} className="mb-2" />
          <p className="text-sm">Preencha o preço lacrado para calcular</p>
        </div>
      )}
    </div>
  )
}

'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check } from 'lucide-react'
import { criarAcessorio } from './actions'

export default function NovoAcessorioForm() {
  const router = useRouter()
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [custo, setCusto] = useState('')
  const [preco, setPreco] = useState('')

  const custoN = parseFloat(custo) || 0
  const precoN = parseFloat(preco) || 0
  const margem = precoN > 0 ? ((precoN - custoN) / precoN * 100).toFixed(0) : null
  const margemN = margem ? parseInt(margem) : 0
  const margemColor = margemN > 30 ? '#34d399' : margemN > 15 ? '#fbbf24' : '#f87171'

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSalvando(true)
    setErro(null)
    const fd = new FormData(e.currentTarget)
    const res = await criarAcessorio(fd)
    setSalvando(false)
    if ('error' in res) { setErro(res.error ?? 'Erro'); return }
    router.push('/acessorios')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-white/3 border border-white/8 rounded-2xl p-5 space-y-3">
        <div>
          <label className="label">Nome do acessório *</label>
          <input name="nome" required placeholder="Ex: Capinha iPhone 15 Pro Max" className="inp" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Custo (R$)</label>
            <input
              name="custo" type="number" step="0.01" min="0"
              placeholder="0.00"
              value={custo}
              onChange={e => setCusto(e.target.value)}
              className="inp"
            />
          </div>
          <div>
            <label className="label">Preço de venda (R$)</label>
            <input
              name="preco" type="number" step="0.01" min="0"
              placeholder="0.00"
              value={preco}
              onChange={e => setPreco(e.target.value)}
              className="inp"
            />
          </div>
        </div>

        {margem !== null && precoN > 0 && (
          <div className="pt-1">
            <div className="flex justify-between text-xs text-white/40 mb-1.5">
              <span>Margem</span>
              <span style={{ color: margemColor }}>{margem}%</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${Math.min(100, margemN)}%`, background: margemColor }} />
            </div>
          </div>
        )}
      </div>

      {erro && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">{erro}</div>
      )}

      <div className="flex gap-3">
        <button type="button" onClick={() => router.back()}
          className="flex-1 py-2.5 border border-white/15 text-white/60 text-sm rounded-xl hover:bg-white/5 transition-colors">
          Cancelar
        </button>
        <button type="submit" disabled={salvando}
          className="flex-1 py-2.5 bg-[var(--color-primary)] hover:opacity-90 text-white text-sm font-semibold rounded-xl disabled:opacity-40 transition-opacity">
          {salvando ? 'Salvando...' : 'Adicionar ao catálogo'}
        </button>
      </div>

      <style jsx global>{`
        .inp { width:100%; background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.1); border-radius:.625rem; padding:.5rem .875rem; color:white; font-size:.8125rem; outline:none; }
        .inp:focus { border-color:var(--color-primary,#4f7eff); }
        .inp::placeholder { color:rgba(255,255,255,.2); }
        .label { display:block; font-size:.625rem; font-weight:600; color:rgba(255,255,255,.4); text-transform:uppercase; letter-spacing:.05em; margin-bottom:.375rem; }
      `}</style>
    </form>
  )
}

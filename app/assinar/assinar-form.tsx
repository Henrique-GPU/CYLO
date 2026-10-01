'use client'

import { useState } from 'react'
import { assinar } from './actions'
import { cpfCnpjValido, mascararCpfCnpj } from '@/lib/utils/cpf-cnpj'

export default function AssinarForm({ precisaCpf, rotulo }: { precisaCpf: boolean; rotulo: string }) {
  const [cpf, setCpf] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (loading) return
    setErro(null)
    if (precisaCpf && !cpfCnpjValido(cpf)) {
      setErro('Informe um CPF ou CNPJ válido.')
      return
    }
    setLoading(true)
    const res = await assinar(new FormData(e.currentTarget))
    // Em caso de sucesso a action redireciona para a fatura do Asaas
    if (res && 'error' in res) {
      setErro(res.error)
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {precisaCpf && (
        <div>
          <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-1.5">
            CPF ou CNPJ do titular
          </label>
          <input
            name="cpf_cnpj"
            value={cpf}
            onChange={e => setCpf(mascararCpfCnpj(e.target.value))}
            inputMode="numeric"
            required
            placeholder="000.000.000-00"
            autoComplete="off"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 outline-none focus:border-[#4f7eff] transition-colors"
          />
          <p className="text-[11px] text-white/25 mt-1.5">Exigido para emitir a cobrança. O cartão você digita na página segura do Asaas.</p>
        </div>
      )}

      {erro && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">{erro}</div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 bg-[#4f7eff] hover:bg-[#3d6eef] text-white font-bold rounded-xl transition-colors disabled:opacity-50 text-sm"
      >
        {loading ? 'Abrindo pagamento...' : rotulo}
      </button>
    </form>
  )
}

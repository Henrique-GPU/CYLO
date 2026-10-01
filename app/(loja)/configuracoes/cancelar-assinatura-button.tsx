'use client'

import { useState } from 'react'
import { cancelarAssinatura } from './assinatura-actions'

export default function CancelarAssinaturaButton({ acessoAte }: { acessoAte: string | null }) {
  const [confirmando, setConfirmando] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function confirmar() {
    setLoading(true)
    setErro(null)
    const res = await cancelarAssinatura()
    setLoading(false)
    if ('error' in res) setErro(res.error)
    else setConfirmando(false)
  }

  if (!confirmando) {
    return (
      <button
        type="button"
        onClick={() => setConfirmando(true)}
        className="mt-4 text-xs text-white/30 hover:text-red-400 transition-colors underline underline-offset-2"
      >
        Cancelar assinatura
      </button>
    )
  }

  return (
    <div className="mt-4 bg-red-500/5 border border-red-500/20 rounded-xl p-4">
      <p className="text-sm text-white font-semibold mb-1">Cancelar a assinatura?</p>
      <p className="text-xs text-white/50 mb-3">
        {acessoAte
          ? `Você continua com acesso até ${acessoAte}. Depois disso o app trava, mas seus dados ficam salvos e você pode assinar de novo quando quiser.`
          : 'Seu acesso será encerrado. Seus dados ficam salvos e você pode assinar de novo quando quiser.'}
      </p>
      {erro && <p className="text-xs text-red-400 mb-3">{erro}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={confirmar}
          disabled={loading}
          className="px-4 py-2 bg-red-500 hover:bg-red-400 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors"
        >
          {loading ? 'Cancelando...' : 'Sim, cancelar'}
        </button>
        <button
          type="button"
          onClick={() => setConfirmando(false)}
          disabled={loading}
          className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/70 text-xs font-semibold rounded-lg transition-colors"
        >
          Manter assinatura
        </button>
      </div>
    </div>
  )
}

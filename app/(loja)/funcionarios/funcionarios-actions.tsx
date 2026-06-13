'use client'
import { useState, useTransition } from 'react'
import { Copy, Check, KeyRound, X } from 'lucide-react'
import { bloquearFuncionario, ativarFuncionario, redefinirSenha } from './novo/actions'

export default function FuncionariosActions({
  funcId, status, email,
}: { funcId: string; status: string; email: string }) {
  const [pending, startTransition] = useTransition()
  const [novaSenha, setNovaSenha] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [copiado, setCopiado] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function handleReset() {
    setLoading(true); setErro(null)
    const res = await redefinirSenha(funcId)
    setLoading(false)
    if ('error' in res) { setErro(res.error ?? 'Erro'); return }
    setNovaSenha(res.senha ?? null)
  }

  function copiar() {
    if (!novaSenha) return
    navigator.clipboard.writeText(`Login: ${email}\nSenha: ${novaSenha}`)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex gap-1.5">
        <button
          disabled={loading || pending}
          onClick={handleReset}
          className="text-[10px] px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg transition-colors disabled:opacity-40 flex items-center gap-1"
        >
          <KeyRound size={10} />
          {loading ? '…' : 'Redefinir senha'}
        </button>
        {status !== 'bloqueado' ? (
          <button
            disabled={pending}
            onClick={() => startTransition(() => bloquearFuncionario(funcId))}
            className="text-[10px] px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors disabled:opacity-40"
          >
            Bloquear
          </button>
        ) : (
          <button
            disabled={pending}
            onClick={() => startTransition(() => ativarFuncionario(funcId))}
            className="text-[10px] px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-colors disabled:opacity-40"
          >
            Ativar
          </button>
        )}
      </div>

      {erro && <p className="text-[10px] text-red-400">{erro}</p>}

      {novaSenha && (
        <div className="bg-[#0e1018] border border-amber-500/30 rounded-xl px-3 py-2 flex items-center gap-2.5 max-w-xs">
          <div className="flex-1 min-w-0">
            <p className="text-[9px] text-amber-400/60 uppercase tracking-wider mb-0.5">Nova senha gerada</p>
            <p className="text-sm font-mono font-bold text-amber-400 tracking-wider">{novaSenha}</p>
            <p className="text-[9px] text-white/25 truncate mt-0.5">{email}</p>
          </div>
          <button onClick={copiar} className="text-white/30 hover:text-white transition-colors flex-shrink-0">
            {copiado ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
          </button>
          <button onClick={() => setNovaSenha(null)} className="text-white/20 hover:text-white/50 transition-colors flex-shrink-0">
            <X size={13} />
          </button>
        </div>
      )}
    </div>
  )
}

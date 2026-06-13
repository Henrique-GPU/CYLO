'use client'
import { useTransition } from 'react'
import Link from 'next/link'
import { bloquearLoja, ativarLoja, renovarLoja, converterTrial } from './actions'

export function LojaCardActions({ lojaId, status }: { lojaId: string; status: string }) {
  const [pending, startTransition] = useTransition()

  return (
    <div className="flex gap-1.5 flex-wrap">
      <Link
        href={`/lojas?editar=${lojaId}`}
        className="text-[10px] px-2.5 py-1 bg-white/8 hover:bg-white/12 text-white/60 hover:text-white rounded-lg transition-colors"
      >
        Editar
      </Link>
      {(status === 'ativo' || status === 'trial') && (
        <button
          disabled={pending}
          onClick={() => startTransition(() => bloquearLoja(lojaId))}
          className="text-[10px] px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors disabled:opacity-40"
        >
          Bloquear
        </button>
      )}
      {(status === 'bloqueado' || status === 'vencido') && (
        <button
          disabled={pending}
          onClick={() => startTransition(() => ativarLoja(lojaId))}
          className="text-[10px] px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-colors disabled:opacity-40"
        >
          Ativar
        </button>
      )}
      {status === 'trial' && (
        <button
          disabled={pending}
          onClick={() => startTransition(() => converterTrial(lojaId))}
          className="text-[10px] px-2.5 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors disabled:opacity-40"
        >
          → Converter
        </button>
      )}
      <button
        disabled={pending}
        onClick={() => startTransition(() => renovarLoja(lojaId))}
        className="text-[10px] px-2.5 py-1 bg-white/8 hover:bg-white/12 text-white/60 hover:text-white rounded-lg transition-colors disabled:opacity-40"
      >
        +30 dias
      </button>
    </div>
  )
}

'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { criarMotoboy } from './actions'

export default function MotoboyForm() {
  const router = useRouter()
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSalvando(true)
    setErro(null)
    const fd = new FormData(e.currentTarget)
    const res = await criarMotoboy(fd)
    setSalvando(false)
    if ('error' in res) { setErro(res.error ?? 'Erro'); return }
    router.push('/motoboys')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-white/3 border border-white/8 rounded-2xl p-5 space-y-3">
        <div>
          <label className="label">Nome *</label>
          <input name="nome" required placeholder="Ex: Carlos Motoboy" className="inp" />
        </div>
        <div>
          <label className="label">Telefone</label>
          <input name="telefone" placeholder="(xx) 99999-0000" className="inp" />
        </div>
        <div>
          <label className="label">PIX</label>
          <input name="pix" placeholder="CPF, e-mail ou telefone" className="inp" />
        </div>
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
          className="flex-1 py-2.5 bg-[#4f7eff] hover:opacity-90 text-white text-sm font-semibold rounded-xl disabled:opacity-40 transition-opacity">
          {salvando ? 'Salvando...' : 'Cadastrar motoboy'}
        </button>
      </div>

      <style jsx global>{`
        .inp { width:100%; background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.1); border-radius:.625rem; padding:.5rem .875rem; color:white; font-size:.8125rem; outline:none; }
        .inp:focus { border-color:#4f7eff; }
        .inp::placeholder { color:rgba(255,255,255,.2); }
        .label { display:block; font-size:.625rem; font-weight:600; color:rgba(255,255,255,.4); text-transform:uppercase; letter-spacing:.05em; margin-bottom:.375rem; }
      `}</style>
    </form>
  )
}

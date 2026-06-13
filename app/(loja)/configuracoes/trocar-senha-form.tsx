'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Check, KeyRound } from 'lucide-react'

export default function TrocarSenhaForm({ email }: { email: string }) {
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [showAtual, setShowAtual] = useState(false)
  const [showNova, setShowNova] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState(false)

  const forte = novaSenha.length >= 8
  const confere = novaSenha === confirmar && confirmar.length > 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!forte) { setErro('A nova senha precisa ter pelo menos 8 caracteres.'); return }
    if (!confere) { setErro('As senhas não coincidem.'); return }

    setLoading(true); setErro(null)

    const supabase = createClient()

    // Verifica senha atual
    const { error: erroVerif } = await supabase.auth.signInWithPassword({
      email,
      password: senhaAtual,
    })
    if (erroVerif) {
      setErro('Senha atual incorreta.')
      setLoading(false)
      return
    }

    // Atualiza senha
    const { error } = await supabase.auth.updateUser({ password: novaSenha })
    setLoading(false)
    if (error) { setErro(error.message); return }

    setSucesso(true)
    setSenhaAtual(''); setNovaSenha(''); setConfirmar('')
    setTimeout(() => setSucesso(false), 4000)
  }

  return (
    <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <KeyRound size={14} className="text-white/40" />
        <p className="text-sm font-semibold text-white">Alterar senha</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Senha atual */}
        <div>
          <label className="block text-[10px] font-semibold text-white/35 uppercase tracking-wider mb-1.5">
            Senha atual
          </label>
          <div className="relative">
            <input
              type={showAtual ? 'text' : 'password'}
              value={senhaAtual}
              onChange={e => setSenhaAtual(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#4f7eff] transition-colors pr-10"
            />
            <button type="button" onClick={() => setShowAtual(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50">
              {showAtual ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>

        {/* Nova senha */}
        <div>
          <label className="block text-[10px] font-semibold text-white/35 uppercase tracking-wider mb-1.5">
            Nova senha
          </label>
          <div className="relative">
            <input
              type={showNova ? 'text' : 'password'}
              value={novaSenha}
              onChange={e => setNovaSenha(e.target.value)}
              required
              placeholder="Mínimo 8 caracteres"
              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#4f7eff] transition-colors pr-10"
            />
            <button type="button" onClick={() => setShowNova(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50">
              {showNova ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          {/* Força da senha */}
          {novaSenha.length > 0 && (
            <div className="mt-1.5 flex items-center gap-2">
              <div className="flex gap-1 flex-1">
                {[4, 6, 8, 10].map(min => (
                  <div key={min} className={`h-1 flex-1 rounded-full transition-colors ${
                    novaSenha.length >= min ? 'bg-[#4f7eff]' : 'bg-white/10'
                  }`} />
                ))}
              </div>
              <span className="text-[9px] text-white/30">
                {novaSenha.length < 6 ? 'Fraca' : novaSenha.length < 8 ? 'Média' : 'Forte'}
              </span>
            </div>
          )}
        </div>

        {/* Confirmar */}
        <div>
          <label className="block text-[10px] font-semibold text-white/35 uppercase tracking-wider mb-1.5">
            Confirmar nova senha
          </label>
          <div className="relative">
            <input
              type="password"
              value={confirmar}
              onChange={e => setConfirmar(e.target.value)}
              required
              placeholder="Repita a nova senha"
              className={`w-full px-3 py-2.5 bg-white/5 border rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none transition-colors pr-8 ${
                confirmar.length > 0
                  ? confere ? 'border-emerald-500/50' : 'border-red-500/40'
                  : 'border-white/10 focus:border-[#4f7eff]'
              }`}
            />
            {confirmar.length > 0 && (
              <Check size={13} className={`absolute right-3 top-1/2 -translate-y-1/2 ${confere ? 'text-emerald-400' : 'text-red-400/50'}`} />
            )}
          </div>
        </div>

        {erro && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5 text-sm text-red-400">{erro}</div>
        )}
        {sucesso && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2.5 text-sm text-emerald-400 flex items-center gap-2">
            <Check size={14} />Senha alterada com sucesso!
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !senhaAtual || !forte || !confere}
          className="w-full py-2.5 bg-[#4f7eff] hover:opacity-90 text-white text-sm font-semibold rounded-xl transition-opacity disabled:opacity-30"
        >
          {loading ? 'Salvando…' : 'Alterar senha'}
        </button>
      </form>
    </div>
  )
}

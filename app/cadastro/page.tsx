'use client'

import { useState } from 'react'
import Link from 'next/link'
import { cadastrar } from './actions'

export default function CadastroPage() {
  const [erro, setErro] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErro(null)
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    const res = await cadastrar(fd)
    if (res && 'error' in res) {
      setErro(res.error)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#080a0f] flex items-center justify-center p-6 relative overflow-hidden">

      {/* Glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#4f7eff]/10 rounded-full blur-[130px]" />
        <div className="absolute bottom-0 left-0 w-[350px] h-[350px] bg-purple-600/8 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-sm">

        {/* Logo */}
        <div className="flex items-center gap-3 mb-10">
          <img src="/cylo-logo.svg" alt="CYLO" className="w-9 h-9" />
          <span className="text-white font-black text-xl tracking-tight">CYLO</span>
        </div>

        <div className="mb-7">
          <h1 className="text-2xl font-black text-white mb-1.5">Criar sua conta</h1>
          <p className="text-sm text-white/40">15 dias grátis · Sem cartão de crédito</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          <div>
            <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-1.5">
              Nome da loja
            </label>
            <input
              name="nome_loja"
              required
              placeholder="Ex: iPhone Store SP"
              autoComplete="organization"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 outline-none focus:border-[#4f7eff] transition-colors"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-1.5">
              WhatsApp
            </label>
            <input
              name="whatsapp"
              type="tel"
              required
              placeholder="(11) 99999-0000"
              autoComplete="tel"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 outline-none focus:border-[#4f7eff] transition-colors"
            />
            <p className="text-[11px] text-white/25 mt-1.5">Usamos só pra te ajudar no início, sem spam.</p>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-1.5">
              E-mail
            </label>
            <input
              name="email"
              type="email"
              required
              placeholder="seu@email.com"
              autoComplete="email"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 outline-none focus:border-[#4f7eff] transition-colors"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-1.5">
              Senha
            </label>
            <input
              name="senha"
              type="password"
              required
              minLength={8}
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 outline-none focus:border-[#4f7eff] transition-colors"
            />
          </div>

          {erro && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
              {erro}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#4f7eff] hover:bg-[#3d6eef] text-white font-bold rounded-xl transition-colors disabled:opacity-50 text-sm mt-2"
          >
            {loading ? 'Criando conta...' : 'Começar grátis →'}
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <p className="text-xs text-white/20">
            Sem cartão · Sem fidelidade · Cancela quando quiser
          </p>
          <p className="text-sm text-white/40 mt-3">
            Já tem conta?{' '}
            <Link href="/login" className="text-[#4f7eff] hover:underline font-medium">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

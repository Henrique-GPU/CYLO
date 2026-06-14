import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import EditarMinhaLojaForm from '@/app/(loja)/configuracoes/editar-loja-form'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/cadastro')

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('loja_id, perfil, nome')
    .eq('id', user.id)
    .single<{ loja_id: string; perfil: string; nome: string }>()

  if (!usuario?.loja_id || usuario.perfil !== 'loja_admin') redirect('/dashboard')

  const { data: loja } = await supabase
    .from('lojas')
    .select('*')
    .eq('id', usuario.loja_id)
    .single<any>()

  if (!loja) redirect('/dashboard')

  const primeiroNome = usuario.nome?.split(' ')[0] ?? 'bem-vindo'

  return (
    <div className="min-h-screen bg-[#080a0f] relative overflow-hidden">

      {/* Glows */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-[#4f7eff]/8 rounded-full blur-[120px]" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <img src="/cylo-logo.svg" alt="Cylo" className="w-7 h-7" />
          <span className="text-white font-black text-base tracking-tight">CYLO</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] text-white/30">Trial ativo · 14 dias</span>
        </div>
      </nav>

      <div className="relative z-10 max-w-xl mx-auto px-6 pt-12 pb-24">

        {/* Header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1 mb-5">
            <span className="text-emerald-400 text-xs font-bold">✓ Conta criada</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mb-3">
            Olá, {primeiroNome}!<br />
            <span className="text-[#4f7eff]">Vamos configurar sua loja.</span>
          </h1>
          <p className="text-white/40 text-sm leading-relaxed">
            São só 2 minutos. Quanto mais completo, mais profissional fica para seus clientes.
          </p>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-3 mb-8">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#4f7eff] flex items-center justify-center text-[10px] font-bold text-white">1</div>
            <span className="text-xs text-white font-semibold">Configure a loja</span>
          </div>
          <div className="flex-1 h-px bg-white/10" />
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-white/30">2</div>
            <span className="text-xs text-white/30">Pronto para usar</span>
          </div>
        </div>

        {/* Form */}
        <EditarMinhaLojaForm loja={loja} redirectAfterSave="/dashboard" />

        <p className="text-center text-[11px] text-white/20 mt-6">
          Você pode alterar tudo isso depois em Configurações.
        </p>
      </div>
    </div>
  )
}

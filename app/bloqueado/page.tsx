import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const FOUNDER_WA = '5511932652082'

export default async function BloqueadoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usuario } = await supabase
    .from('usuarios').select('loja_id, nome, perfil').eq('id', user.id)
    .single<{ loja_id: string; nome: string; perfil: string }>()

  if (usuario?.perfil === 'ceo') redirect('/dashboard')

  const { data: loja } = await supabase
    .from('lojas').select('nome, status_saas, data_fim_trial').eq('id', usuario?.loja_id ?? '').single<any>()

  const isBloqueado = loja?.status_saas === 'bloqueado'
  const primeiroNome = usuario?.nome?.split(' ')[0] ?? 'você'

  const waMsg = isBloqueado
    ? encodeURIComponent(`Olá! Minha conta ${loja?.nome ?? ''} no Cylo foi bloqueada e preciso regularizar o acesso.`)
    : encodeURIComponent(`Olá! O trial da minha loja ${loja?.nome ?? ''} no Cylo encerrou. Quero continuar usando e saber sobre os planos.`)

  const waLink = `https://wa.me/${FOUNDER_WA}?text=${waMsg}`

  return (
    <div className="min-h-screen bg-[#080a0f] flex flex-col items-center justify-center p-6 relative overflow-hidden">

      {/* Glow de fundo */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[600px] bg-[#4f7eff]/8 rounded-full blur-[140px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-600/6 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-md w-full text-center">

        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-12 opacity-40">
          <img src="/cylo-logo.svg" alt="Cylo" className="w-6 h-6" />
          <span className="text-white font-black text-sm tracking-tight">CYLO</span>
        </div>

        {/* Ícone */}
        <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-4xl mx-auto mb-8">
          {isBloqueado ? '🔒' : '⏳'}
        </div>

        {/* Título */}
        <h1 className="text-3xl font-black text-white mb-3 leading-tight">
          {isBloqueado
            ? 'Acesso suspenso'
            : <>Seu trial<br /><span className="text-[#4f7eff]">chegou ao fim</span></>}
        </h1>

        {/* Subtítulo de retenção */}
        <p className="text-white/50 text-base leading-relaxed mb-2">
          {isBloqueado
            ? `${primeiroNome}, sua conta foi suspensa. Entre em contato para regularizar e retomar o acesso em minutos.`
            : `${primeiroNome}, você já tem seu negócio estruturado no Cylo — estoque, vendas e clientes prontos. Não deixe esse progresso parar aqui.`}
        </p>

        {!isBloqueado && (
          <p className="text-white/30 text-sm mb-8">
            Continue de onde parou. Sem burocracia.
          </p>
        )}

        {/* Card de preço */}
        <div className="mt-6 bg-white/4 border border-white/10 rounded-2xl p-5 text-left">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Plano Cylo</span>
            <span className="text-[10px] bg-[#4f7eff]/15 text-[#4f7eff] font-bold px-2.5 py-1 rounded-full">Mensal</span>
          </div>
          <div className="flex items-end gap-1 mb-4">
            <span className="text-white/40 text-sm font-medium">R$</span>
            <span className="text-4xl font-black text-white leading-none">59</span>
            <span className="text-white/60 text-lg font-bold leading-none">,99</span>
            <span className="text-white/30 text-sm mb-0.5">/mês</span>
          </div>
          <div className="space-y-1.5">
            {['Estoque ilimitado por IMEI', 'Múltiplos vendedores', 'Recibos e orçamentos', 'Relatórios e DRE', 'Suporte direto via WhatsApp'].map(f => (
              <div key={f} className="flex items-center gap-2">
                <span className="text-emerald-400 text-xs">✓</span>
                <span className="text-white/50 text-xs">{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA principal — WhatsApp */}
        <div className="mt-4 space-y-3">
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-4 bg-[#25d366] hover:bg-[#1fb859] text-white font-black rounded-2xl transition-colors text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-[#25d366]/20"
          >
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.532 5.855L.073 23.927a.5.5 0 0 0 .612.612l6.072-1.459A11.938 11.938 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.927 0-3.732-.518-5.284-1.42l-.378-.223-3.924.943.943-3.924-.223-.378A9.938 9.938 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
            </svg>
            {isBloqueado ? 'Regularizar acesso via WhatsApp' : 'Quero continuar usando o Cylo'}
          </a>

          <p className="text-white/20 text-xs">
            Resposta em minutos · Sem burocracia
          </p>
        </div>

        {/* Divisor */}
        <div className="flex items-center gap-3 my-8">
          <div className="flex-1 h-px bg-white/6" />
          <span className="text-white/15 text-xs">ou</span>
          <div className="flex-1 h-px bg-white/6" />
        </div>

        {/* Ações secundárias */}
        <div className="space-y-2">
          <form action="/api/auth/signout" method="POST">
            <button type="submit" className="w-full py-3 text-white/25 hover:text-white/50 text-sm transition-colors">
              Sair da conta
            </button>
          </form>
        </div>

        {loja?.nome && (
          <p className="text-white/12 text-[10px] mt-8 uppercase tracking-widest">
            {loja.nome}
          </p>
        )}
      </div>
    </div>
  )
}

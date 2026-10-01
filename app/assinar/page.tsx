import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AssinarForm from './assinar-form'
import { waLink } from '@/lib/contato'

const BENEFICIOS = [
  'Estoque por IMEI, sem limite de aparelhos',
  'Comissões dos vendedores calculadas automaticamente',
  'Recibos e orçamentos prontos para enviar',
  'Relatórios e DRE da sua loja',
]

export default async function AssinarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('perfil, loja_id')
    .eq('id', user.id)
    .single<{ perfil: string; loja_id: string | null }>()

  // CEO não tem loja nem cobrança
  if (!usuario?.loja_id) redirect('/dashboard')

  const { data: ass } = await supabase
    .from('assinaturas')
    .select('status, trial_ate, asaas_customer_id, asaas_subscription_id')
    .eq('loja_id', usuario.loja_id)
    .single<{ status: string; trial_ate: string; asaas_customer_id: string | null; asaas_subscription_id: string | null }>()

  if (ass?.status === 'ativa') redirect('/dashboard')

  const { data: liberado } = await supabase.rpc('acesso_liberado', { p_loja: usuario.loja_id })
  const inadimplente = ass?.status === 'inadimplente' && !!ass.asaas_subscription_id
  const ehAdmin = usuario.perfil === 'loja_admin'

  return (
    <div className="min-h-screen bg-[#080a0f] flex items-center justify-center p-5 sm:p-6 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#4f7eff]/10 rounded-full blur-[130px]" />
        <div className="absolute bottom-0 left-0 w-[350px] h-[350px] bg-purple-600/8 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-md py-6">
        <div className="flex items-center gap-3 mb-8">
          <img src="/cylo-logo.svg" alt="CYLO" className="w-9 h-9" />
          <span className="text-white font-black text-xl tracking-tight">CYLO</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight mb-2">
          {liberado ? 'Assine o CYLO' : inadimplente ? 'Pagamento pendente' : 'Seu teste grátis terminou'}
        </h1>
        <p className="text-sm text-white/50 mb-6">
          {liberado
            ? 'Garanta a continuidade do seu acesso. Seus dados ficam todos salvos.'
            : inadimplente
              ? 'Não conseguimos cobrar seu cartão. Regularize para voltar a usar o CYLO.'
              : 'Seus dados continuam salvos. Assine para voltar a usar o CYLO de onde parou.'}
        </p>

        <div className="bg-white/4 border border-white/10 rounded-2xl p-5 mb-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Plano CYLO</span>
            <span className="text-[10px] bg-[#4f7eff]/15 text-[#4f7eff] font-bold px-2.5 py-1 rounded-full">Mensal</span>
          </div>
          <div className="flex items-end gap-1 mb-1">
            <span className="text-white/40 text-sm font-medium">R$</span>
            <span className="text-4xl font-black text-white leading-none">59</span>
            <span className="text-white/60 text-lg font-bold leading-none">,90</span>
            <span className="text-white/30 text-sm mb-0.5">/mês</span>
          </div>
          <p className="text-xs text-white/40 mb-4">Cobrança automática no cartão de crédito. Cancele quando quiser.</p>
          <div className="space-y-1.5">
            {BENEFICIOS.map(b => (
              <div key={b} className="flex items-start gap-2">
                <span className="text-emerald-400 text-xs mt-px">✓</span>
                <span className="text-white/60 text-xs leading-relaxed">{b}</span>
              </div>
            ))}
          </div>
        </div>

        {ehAdmin ? (
          <AssinarForm
            precisaCpf={!ass?.asaas_customer_id}
            rotulo={inadimplente ? 'Pagar fatura em aberto' : 'Assinar com cartão'}
          />
        ) : (
          <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white/60">
            Só o administrador da loja pode assinar. Peça a ele para concluir a assinatura.
          </div>
        )}

        <div className="mt-6 text-center space-y-3">
          <p className="text-[11px] text-white/25">Pagamento processado com segurança pelo Asaas. O CYLO não armazena dados do seu cartão.</p>
          <a
            href={waLink('Olá! Tenho uma dúvida sobre a assinatura do Cylo.')}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-xs text-[#25d366] hover:underline"
          >
            Dúvidas? Fale com a gente no WhatsApp
          </a>
          {liberado ? (
            <Link href="/dashboard" className="inline-block text-sm text-white/40 hover:text-white/70 transition-colors">
              Voltar ao app
            </Link>
          ) : (
            <form action="/api/auth/signout" method="POST">
              <button type="submit" className="text-sm text-white/30 hover:text-white/60 transition-colors">Sair da conta</button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

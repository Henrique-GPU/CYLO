import Sidebar from '@/components/layout/sidebar'
import BottomNav from '@/components/layout/bottom-nav'
import AssinaturaBanner from '@/components/layout/assinatura-banner'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Perfil } from '@/types'

export default async function LojaLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: usuarioData } = await supabase
    .from('usuarios')
    .select('perfil, loja_id, nome, iniciais')
    .eq('id', user!.id)
    .single<{ perfil: string; loja_id: string | null; nome: string; iniciais: string | null }>()

  const perfil = (usuarioData?.perfil ?? 'vendedor') as Perfil

  let loja = undefined
  if (perfil !== 'ceo' && usuarioData?.loja_id) {
    const { data } = await supabase
      .from('lojas')
      .select('nome, logo_url, cor_primaria, cor_secundaria, status_saas, proximo_vencimento, data_fim_trial')
      .eq('id', usuarioData.loja_id)
      .single<{
        nome: string; logo_url: string | null; cor_primaria: string; cor_secundaria: string
        status_saas: string; proximo_vencimento: string | null; data_fim_trial: string | null
      }>()
    loja = data ?? undefined
  }

  // Bloqueio por assinatura. CEO e usuários sem loja nunca são bloqueados.
  let assinatura: { status: 'trial' | 'ativa' | 'inadimplente' | 'cancelada'; trial_ate: string } | null = null
  if (perfil !== 'ceo' && usuarioData?.loja_id) {
    if (loja?.status_saas === 'bloqueado') redirect('/bloqueado') // bloqueio manual pelo CEO

    const { data: liberado } = await supabase.rpc('acesso_liberado', { p_loja: usuarioData.loja_id })
    if (!liberado) redirect('/assinar')

    const { data } = await supabase
      .from('assinaturas')
      .select('status, trial_ate')
      .eq('loja_id', usuarioData.loja_id)
      .single<{ status: 'trial' | 'ativa' | 'inadimplente' | 'cancelada'; trial_ate: string }>()
    assinatura = data

    // A sidebar lê status/dias no formato antigo: alimenta com a assinatura real
    if (loja && assinatura) {
      loja.status_saas = { trial: 'trial', ativa: 'ativo', inadimplente: 'vencido', cancelada: 'vencido' }[assinatura.status]
      loja.data_fim_trial = assinatura.trial_ate
    }
  }

  const usuario = usuarioData
    ? { nome: usuarioData.nome, iniciais: usuarioData.iniciais }
    : undefined

  return (
    <div className="flex h-screen bg-[#0e1018]">
      <Sidebar variant={perfil} loja={loja} usuario={usuario} />
      <main className="flex-1 overflow-y-auto pb-16 lg:pb-0">
        {assinatura && <AssinaturaBanner status={assinatura.status} trialAte={assinatura.trial_ate} />}
        {children}
      </main>
      <BottomNav variant={perfil} />
    </div>
  )
}

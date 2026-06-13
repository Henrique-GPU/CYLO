import Sidebar from '@/components/layout/sidebar'
import { createClient } from '@/lib/supabase/server'
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

  const usuario = usuarioData
    ? { nome: usuarioData.nome, iniciais: usuarioData.iniciais }
    : undefined

  return (
    <div className="flex h-screen bg-[#0e1018]">
      <Sidebar variant={perfil} loja={loja} usuario={usuario} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}

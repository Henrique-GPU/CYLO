import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import RelatoriosClient from './relatorios-client'

export default async function RelatoriosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usuario } = await supabase
    .from('usuarios').select('loja_id, perfil, nome')
    .eq('id', user.id)
    .single<{ loja_id: string; perfil: string; nome: string }>()

  if (!usuario?.loja_id) redirect('/dashboard')

  const [lojaRes, vendedoresRes] = await Promise.all([
    supabase.from('lojas')
      .select('nome, logo_url, cor_primaria, whatsapp, instagram, endereco')
      .eq('id', usuario.loja_id)
      .single<{ nome: string; logo_url: string | null; cor_primaria: string; whatsapp: string | null; instagram: string | null; endereco: string | null }>(),
    usuario.perfil === 'loja_admin'
      ? supabase.from('usuarios').select('id, nome')
          .eq('loja_id', usuario.loja_id).eq('perfil', 'vendedor').order('nome')
      : Promise.resolve({ data: [] as any[] }),
  ])

  return (
    <RelatoriosClient
      lojaId={usuario.loja_id}
      userId={user.id}
      perfil={usuario.perfil}
      nomeUsuario={usuario.nome}
      loja={lojaRes.data ?? { nome: '', logo_url: null, cor_primaria: '#4f7eff', whatsapp: null, instagram: null, endereco: null }}
      vendedores={vendedoresRes.data ?? []}
    />
  )
}

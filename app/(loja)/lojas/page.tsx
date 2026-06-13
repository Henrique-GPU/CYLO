import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import LojasView from './lojas-view'

export default async function LojasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usuario } = await supabase
    .from('usuarios').select('perfil').eq('id', user.id)
    .single<{ perfil: string }>()

  if (usuario?.perfil !== 'ceo') redirect('/dashboard')

  const [lojasRes, adminsRes] = await Promise.all([
    supabase.from('lojas').select('*').order('criada_em', { ascending: false }),
    supabase.from('usuarios').select('id, loja_id, nome, email, username').eq('perfil', 'loja_admin'),
  ])

  return (
    <Suspense>
      <LojasView
        lojas={lojasRes.data ?? []}
        admins={adminsRes.data ?? []}
      />
    </Suspense>
  )
}

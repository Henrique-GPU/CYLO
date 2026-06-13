import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ClientesClient from './clientes-client'

export default async function ClientesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usuario } = await supabase
    .from('usuarios').select('loja_id, perfil, nome')
    .eq('id', user.id)
    .single<{ loja_id: string; perfil: string; nome: string }>()

  if (!usuario?.loja_id) redirect('/dashboard')

  return (
    <ClientesClient
      lojaId={usuario.loja_id}
      userId={user.id}
      perfil={usuario.perfil}
    />
  )
}

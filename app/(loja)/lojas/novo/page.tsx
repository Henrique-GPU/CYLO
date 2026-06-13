import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NovaLojaForm from './nova-loja-form'

export default async function NovaLojaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usuario } = await supabase.from('usuarios').select('perfil').eq('id', user.id)
    .single<{ perfil: string }>()
  if (usuario?.perfil !== 'ceo') redirect('/dashboard')

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">Nova Loja</h1>
        <p className="text-sm text-white/40 mt-0.5">Cadastrar loja + criar acesso do admin</p>
      </div>
      <NovaLojaForm />
    </div>
  )
}

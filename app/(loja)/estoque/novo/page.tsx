import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NovoAparelhoForm from './novo-form'

export default async function NovoAparelhoPage({
  searchParams,
}: {
  searchParams: Promise<{ modelo?: string; capacidade?: string; cor?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usuario } = await supabase
    .from('usuarios').select('loja_id, perfil').eq('id', user.id)
    .single<{ loja_id: string; perfil: string }>()

  if (!usuario?.loja_id || usuario.perfil === 'vendedor') redirect('/estoque')

  const params = await searchParams

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">Cadastrar Aparelho</h1>
        <p className="text-sm text-white/40 mt-0.5">Novo ou usado — preencha os dados abaixo</p>
      </div>
      <NovoAparelhoForm
        lojaId={usuario.loja_id}
        initialModelo={params.modelo ?? ''}
        initialCapacidade={params.capacidade ?? ''}
        initialCor={params.cor ?? ''}
      />
    </div>
  )
}

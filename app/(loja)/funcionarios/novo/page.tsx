import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NovoFuncionarioForm from './form'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function NovoFuncionarioPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usuario } = await supabase
    .from('usuarios').select('perfil').eq('id', user.id)
    .single<{ perfil: string }>()

  if (usuario?.perfil !== 'loja_admin') redirect('/dashboard')

  return (
    <div className="p-8 max-w-xl">
      <Link href="/funcionarios" className="flex items-center gap-2 text-white/40 hover:text-white text-sm mb-6 transition-colors">
        <ArrowLeft size={14} />Voltar
      </Link>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">Novo funcionário</h1>
        <p className="text-sm text-white/40 mt-0.5">Cria acesso ao sistema</p>
      </div>
      <NovoFuncionarioForm />
    </div>
  )
}

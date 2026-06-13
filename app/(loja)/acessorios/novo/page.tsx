import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NovoAcessorioForm from './form'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function NovoAcessorioPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usuario } = await supabase
    .from('usuarios').select('perfil').eq('id', user.id).single<{ perfil: string }>()

  if (usuario?.perfil === 'vendedor') redirect('/minha-area')

  return (
    <div className="p-8 max-w-md">
      <Link href="/acessorios" className="flex items-center gap-2 text-white/40 hover:text-white text-sm mb-6 transition-colors">
        <ArrowLeft size={14} />Voltar
      </Link>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">Novo acessório</h1>
        <p className="text-sm text-white/40 mt-0.5">Adiciona ao catálogo da loja</p>
      </div>
      <NovoAcessorioForm />
    </div>
  )
}

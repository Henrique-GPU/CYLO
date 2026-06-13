import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import EditarLojaForm from './editar-form'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function EditarLojaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: ceo } = await supabase.from('usuarios').select('perfil').eq('id', user.id).single()
  if (ceo?.perfil !== 'ceo') redirect('/dashboard')

  const { data: loja } = await supabase.from('lojas').select('*').eq('id', id).single<any>()
  if (!loja) notFound()

  return (
    <div className="p-8 max-w-5xl">
      <Link href="/dashboard" className="flex items-center gap-2 text-white/40 hover:text-white text-sm mb-6 transition-colors">
        <ArrowLeft size={14} />Voltar ao painel
      </Link>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">Editar loja</h1>
        <p className="text-sm text-white/40 mt-0.5">{loja.nome}</p>
      </div>
      <EditarLojaForm loja={loja} />
    </div>
  )
}

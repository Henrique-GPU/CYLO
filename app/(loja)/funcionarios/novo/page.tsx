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
    .from('usuarios').select('perfil, loja_id').eq('id', user.id)
    .single<{ perfil: string; loja_id: string }>()

  if (usuario?.perfil !== 'loja_admin') redirect('/dashboard')

  const { count: totalVendedores } = await supabase
    .from('usuarios')
    .select('id', { count: 'exact', head: true })
    .eq('loja_id', usuario.loja_id)
    .eq('perfil', 'vendedor')

  const limiteAtingido = (totalVendedores ?? 0) >= 3

  return (
    <div className="p-8 max-w-xl">
      <Link href="/funcionarios" className="flex items-center gap-2 text-white/40 hover:text-white text-sm mb-6 transition-colors">
        <ArrowLeft size={14} />Voltar
      </Link>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">Novo funcionário</h1>
        <p className="text-sm text-white/40 mt-0.5">Cria acesso ao sistema</p>
      </div>
      {limiteAtingido ? (
        <div className="bg-white/3 border border-white/8 rounded-2xl p-8 text-center">
          <p className="text-sm font-semibold text-white mb-1.5">Limite de vendedores atingido</p>
          <p className="text-sm text-white/40 mb-6">Cada loja pode ter no máximo 3 vendedores cadastrados. Bloqueie ou remova um vendedor existente para liberar uma vaga.</p>
          <Link href="/funcionarios" className="inline-block py-2.5 px-5 bg-[#4f7eff] hover:opacity-90 text-white text-sm font-semibold rounded-xl transition-opacity">
            Ver equipe
          </Link>
        </div>
      ) : (
        <NovoFuncionarioForm />
      )}
    </div>
  )
}

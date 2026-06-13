import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import EstoqueClient from './estoque-client'
import { Plus } from 'lucide-react'
import Link from 'next/link'

export default async function EstoquePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('loja_id, perfil')
    .eq('id', user.id)
    .single<{ loja_id: string; perfil: string }>()

  if (!usuario?.loja_id) redirect('/dashboard')

  const { data: aparelhos } = await supabase
    .from('aparelhos')
    .select('*')
    .eq('loja_id', usuario.loja_id)
    .neq('status', 'vendido')
    .order('criado_em', { ascending: false })

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white">Estoque</h1>
          <p className="text-sm text-white/40 mt-0.5">
            {(aparelhos ?? []).filter((a: any) => a.status === 'disponivel').length} disponíveis ·{' '}
            {(aparelhos ?? []).length} total
          </p>
        </div>
        {usuario.perfil !== 'vendedor' && (
          <Link
            href="/estoque/novo"
            className="flex items-center gap-2 px-4 py-2 bg-[#4f7eff] hover:opacity-90 text-white text-sm font-semibold rounded-xl transition-opacity"
          >
            <Plus size={15} />Cadastrar aparelho
          </Link>
        )}
      </div>

      <EstoqueClient aparelhos={aparelhos ?? []} isAdmin={usuario.perfil !== 'vendedor'} />
    </div>
  )
}

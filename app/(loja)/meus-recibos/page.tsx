import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import RecibosClient from '@/app/(loja)/recibos/recibos-client'

export default async function MeusRecibosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usuario } = await supabase
    .from('usuarios').select('loja_id').eq('id', user.id)
    .single<{ loja_id: string }>()

  if (!usuario?.loja_id) redirect('/dashboard')

  const [recibosRes, lojaRes] = await Promise.all([
    supabase.from('vendas')
      .select('*, aparelhos(modelo, capacidade, cor, imei), venda_acessorios(nome, preco_unitario, custo_unitario, quantidade)')
      .eq('loja_id', usuario.loja_id)
      .eq('vendedor_id', user.id)
      .eq('status', 'convertido')
      .order('criado_em', { ascending: false })
      .limit(50),
    supabase.from('lojas').select('nome, logo_url, whatsapp, instagram, endereco, cor_primaria')
      .eq('id', usuario.loja_id).single<any>(),
  ])

  const recibos = recibosRes.data ?? []
  const loja = lojaRes.data ?? {}

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">Meus Recibos</h1>
        <p className="text-sm text-white/40 mt-0.5">{recibos.length} vendas</p>
      </div>
      <RecibosClient recibos={recibos} loja={loja} />
    </div>
  )
}

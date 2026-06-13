import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { fmt } from '@/lib/utils/format'
import VendasClient from './vendas-client'

export default async function VendasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usuario } = await supabase
    .from('usuarios').select('loja_id, perfil').eq('id', user.id)
    .single<{ loja_id: string; perfil: string }>()

  if (!usuario?.loja_id) redirect('/dashboard')

  let vendasQuery = supabase.from('vendas')
    .select('*, aparelhos(id, modelo, capacidade, cor, imei, custo), venda_acessorios(nome, preco_unitario, custo_unitario, quantidade)')
    .eq('loja_id', usuario.loja_id)
    .order('criado_em', { ascending: false })
    .limit(200)

  if (usuario.perfil === 'vendedor') {
    vendasQuery = vendasQuery.eq('vendedor_id', user.id)
  }

  const [vendasRes, lojaRes] = await Promise.all([
    vendasQuery,
    supabase.from('lojas').select('nome, logo_url, whatsapp, instagram, endereco, cor_primaria')
      .eq('id', usuario.loja_id).single<any>(),
  ])

  const vendas = vendasRes.data ?? []
  const loja = lojaRes.data ?? {}

  const totalMes = vendas.filter((v: any) => v.status === 'convertido').reduce((s, v: any) => s + (v.valor_total ?? 0), 0)

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white">Vendas</h1>
          <p className="text-sm text-white/40 mt-0.5">
            {vendas.length} registros · {fmt(totalMes)} convertido
          </p>
        </div>
      </div>
      <VendasClient vendas={vendas} loja={loja} perfil={usuario.perfil} />
    </div>
  )
}

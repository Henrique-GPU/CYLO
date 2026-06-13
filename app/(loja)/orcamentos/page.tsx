import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { fmt } from '@/lib/utils/format'
import OrcamentosClient from './orcamentos-client'

export default async function OrcamentosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usuario } = await supabase
    .from('usuarios').select('loja_id, perfil').eq('id', user.id)
    .single<{ loja_id: string; perfil: string }>()

  if (!usuario?.loja_id) redirect('/dashboard')

  let orcQuery = supabase.from('vendas')
    .select('*, aparelhos(modelo, capacidade, cor, imei), venda_acessorios(nome, preco_unitario, custo_unitario, quantidade)')
    .eq('loja_id', usuario.loja_id)
    .eq('status', 'orcamento')
    .order('criado_em', { ascending: false })

  if (usuario.perfil === 'vendedor') {
    orcQuery = orcQuery.eq('vendedor_id', user.id)
  }

  const [orcamentosRes, lojaRes] = await Promise.all([
    orcQuery,
    supabase.from('lojas').select('nome, logo_url, whatsapp, instagram, endereco, cor_primaria')
      .eq('id', usuario.loja_id).single<any>(),
  ])

  const orcamentos = orcamentosRes.data ?? []
  const loja = lojaRes.data ?? {}

  const totalEmAberto = orcamentos.reduce((s: number, o: any) => s + (o.valor_total ?? 0), 0)

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">Orçamentos</h1>
        <p className="text-sm text-white/40 mt-0.5">
          {orcamentos.length} em aberto · {fmt(totalEmAberto)} em potencial
        </p>
      </div>
      <OrcamentosClient orcamentos={orcamentos} loja={loja} />
    </div>
  )
}

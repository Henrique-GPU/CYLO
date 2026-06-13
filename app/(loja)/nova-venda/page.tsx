import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import VendaWizard from '@/components/venda/venda-wizard'

export default async function NovaVendaPage({
  searchParams,
}: {
  searchParams: Promise<{ editar?: string; converter?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usuario } = await supabase
    .from('usuarios').select('loja_id, nome, comissao_pct, perfil')
    .eq('id', user.id)
    .single<{ loja_id: string; nome: string; comissao_pct: number; perfil: string }>()

  if (!usuario?.loja_id) redirect('/dashboard')

  const params = await searchParams
  const editarId = params.editar ?? null
  const autoConverter = params.converter === '1'

  const [aparelhosRes, acessoriosRes, lojaRes, vendedoresRes, vendaEditRes] = await Promise.all([
    supabase.from('aparelhos')
      .select('id, modelo, capacidade, cor, tipo, preco, custo, bateria_pct, imei')
      .eq('loja_id', usuario.loja_id)
      .in('status', ['disponivel', ...(editarId ? ['reservado'] : [])])
      .order('modelo'),

    supabase.from('acessorios_catalogo')
      .select('id, nome, preco, custo')
      .eq('loja_id', usuario.loja_id).eq('ativo', true).order('nome'),

    supabase.from('lojas')
      .select('nome, logo_url, cor_primaria, whatsapp, instagram, endereco, garantia_padrao')
      .eq('id', usuario.loja_id)
      .single<any>(),

    // Inclui o próprio admin na lista + vendedores
    supabase.from('usuarios')
      .select('id, nome, comissao_pct, perfil')
      .eq('loja_id', usuario.loja_id)
      .in('perfil', ['loja_admin', 'vendedor'])
      .order('nome'),

    editarId
      ? supabase.from('vendas')
          .select('*, venda_acessorios(id, acessorio_id, nome, preco_unitario, custo_unitario, quantidade)')
          .eq('id', editarId)
          .eq('loja_id', usuario.loja_id)
          .eq('status', 'orcamento')
          .single<any>()
      : Promise.resolve({ data: null }),
  ])

  const loja = lojaRes.data
  const vendaInicial = vendaEditRes.data ?? null

  return (
    <VendaWizard
      vendedorId={user.id}
      vendedorNome={usuario.nome}
      lojaId={usuario.loja_id}
      comissaoPct={usuario.comissao_pct}
      perfil={usuario.perfil}
      aparelhos={aparelhosRes.data ?? []}
      acessorios={acessoriosRes.data ?? []}
      garantiaPadrao={loja?.garantia_padrao ?? '90 dias de garantia de funcionamento'}
      vendedores={vendedoresRes.data ?? []}
      loja={{
        nome: loja?.nome ?? '',
        logo_url: loja?.logo_url ?? null,
        cor_primaria: loja?.cor_primaria ?? '#4f7eff',
        whatsapp: loja?.whatsapp ?? null,
        instagram: loja?.instagram ?? null,
        endereco: loja?.endereco ?? null,
      }}
      vendaInicial={vendaInicial}
      autoConverter={autoConverter}
    />
  )
}

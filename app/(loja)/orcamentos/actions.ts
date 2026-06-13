'use server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function converterOrcamento(vendaId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: venda } = await supabase
    .from('vendas').select('loja_id, aparelho_id')
    .eq('id', vendaId).single<{ loja_id: string; aparelho_id: string | null }>()

  if (!venda) return { error: 'Venda não encontrada' }

  await supabase.from('vendas').update({
    status: 'convertido',
    data_venda: new Date().toISOString().split('T')[0],
  }).eq('id', vendaId)

  if (venda.aparelho_id) {
    await supabase.from('aparelhos').update({ status: 'vendido' }).eq('id', venda.aparelho_id)
  }

  revalidatePath('/orcamentos')
  revalidatePath('/vendas')
  return { ok: true }
}

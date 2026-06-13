'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export async function salvarTrocaNoEstoque(params: {
  lojaId: string
  modelo: string
  imei: string | null
  bateriaPct: number | null
  estado: string
  custo: number
  preco: number
  dataEntrada: string
  observacoes: string | null
}) {
  const supabase = createAdminClient()

  const { error } = await supabase.from('aparelhos').insert({
    loja_id: params.lojaId,
    modelo: params.modelo,
    imei: params.imei || null,
    bateria_pct: params.bateriaPct || null,
    estado: params.estado,
    custo: params.custo,
    preco: params.preco,
    tipo: 'usado',
    origem_aparelho: 'troca',
    status: 'disponivel',
    data_entrada: params.dataEntrada,
    observacoes: params.observacoes || null,
  })

  if (error) {
    console.error('[salvarTrocaNoEstoque]', error)
    return { ok: false, error: error.message }
  }

  return { ok: true }
}

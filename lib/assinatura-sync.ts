import 'server-only'
import type { createAdminClient } from '@/lib/supabase/admin'

type Admin = ReturnType<typeof createAdminClient>

const diaFim = (d: string) => `${d}T23:59:59-03:00`
const dataBR = (iso: string) => new Date(iso).toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })

// Ações manuais do CEO (ativar, renovar, trial, vencido) escrevem em lojas.status_saas.
// Aqui o mesmo resultado é refletido em `assinaturas`, que é o que libera o acesso.
// Lojas que já têm assinatura no Asaas são gerenciadas pelo webhook: não mexemos nelas.
export async function aplicarStatusManual(
  admin: Admin,
  lojaId: string,
  p: { status_saas?: string | null; data_fim_trial?: string | null; proximo_vencimento?: string | null },
) {
  const { data: atual } = await admin
    .from('assinaturas')
    .select('asaas_subscription_id, trial_ate')
    .eq('loja_id', lojaId)
    .maybeSingle<{ asaas_subscription_id: string | null; trial_ate: string }>()

  if (atual?.asaas_subscription_id) return
  if (!p.status_saas || p.status_saas === 'bloqueado') return // bloqueio manual é tratado pelo layout

  const agora = new Date()
  const umMes = new Date(agora)
  umMes.setMonth(umMes.getMonth() + 1)
  const trialPadrao = atual?.trial_ate ?? new Date(agora.getTime() + 7 * 864e5).toISOString()

  let campos: Record<string, unknown>
  if (p.status_saas === 'ativo') {
    campos = {
      status: 'ativa',
      inadimplente_desde: null,
      pago_ate: p.proximo_vencimento ? diaFim(p.proximo_vencimento) : umMes.toISOString(),
    }
  } else if (p.status_saas === 'trial') {
    campos = {
      status: 'trial',
      inadimplente_desde: null,
      pago_ate: null,
      trial_ate: p.data_fim_trial ? diaFim(p.data_fim_trial) : trialPadrao,
    }
  } else if (p.status_saas === 'vencido') {
    campos = { status: 'cancelada', pago_ate: agora.toISOString() } // trava na hora
  } else {
    return
  }

  const linha = { ...campos, atualizado_em: agora.toISOString() }
  if (atual) {
    await admin.from('assinaturas').update(linha).eq('loja_id', lojaId)
  } else {
    await admin.from('assinaturas').insert({ loja_id: lojaId, trial_ate: trialPadrao, ...linha })
  }
}

// O dashboard do CEO lê lojas.status_saas: o webhook mantém esse espelho em dia.
// Não sobrescreve o bloqueio manual do CEO.
export async function espelharNaLoja(
  admin: Admin,
  lojaId: string,
  ass: { status: 'trial' | 'ativa' | 'inadimplente' | 'cancelada'; pago_ate?: string | null },
) {
  let campos: Record<string, unknown> | null = null
  if (ass.status === 'ativa') {
    campos = { status_saas: 'ativo', ...(ass.pago_ate ? { proximo_vencimento: dataBR(ass.pago_ate) } : {}) }
  } else if (ass.status === 'inadimplente' || ass.status === 'cancelada') {
    campos = { status_saas: 'vencido' }
  }
  if (!campos) return
  await admin.from('lojas').update(campos).eq('id', lojaId).neq('status_saas', 'bloqueado')
}

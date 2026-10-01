'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { AsaasError, cancelarAssinaturaAsaas } from '@/lib/asaas'
import { espelharNaLoja } from '@/lib/assinatura-sync'

// Cancela a assinatura no Asaas. O acesso segue até pago_ate (fim do período já pago).
export async function cancelarAssinatura(): Promise<{ error: string } | { ok: true }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sessão expirada. Entre novamente.' }

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('loja_id, perfil')
    .eq('id', user.id)
    .single<{ loja_id: string | null; perfil: string }>()

  if (!usuario?.loja_id || usuario.perfil !== 'loja_admin')
    return { error: 'Só o administrador da loja pode cancelar a assinatura.' }

  const admin = createAdminClient()
  const { data: ass } = await admin
    .from('assinaturas')
    .select('status, asaas_subscription_id')
    .eq('loja_id', usuario.loja_id)
    .single<{ status: string; asaas_subscription_id: string | null }>()

  if (!ass?.asaas_subscription_id || (ass.status !== 'ativa' && ass.status !== 'inadimplente'))
    return { error: 'Não há assinatura ativa para cancelar.' }

  try {
    await cancelarAssinaturaAsaas(ass.asaas_subscription_id)
  } catch (e) {
    // 404: já foi removida no Asaas — segue para refletir o cancelamento aqui
    if (!(e instanceof AsaasError && e.status === 404)) {
      console.error('[cancelarAssinatura] erro Asaas:', e)
      return { error: 'Não conseguimos cancelar agora. Tente novamente em instantes.' }
    }
  }

  // O webhook SUBSCRIPTION_DELETED faz o mesmo (idempotente); aqui a tela já reflete na hora
  await admin
    .from('assinaturas')
    .update({ status: 'cancelada', atualizado_em: new Date().toISOString() })
    .eq('loja_id', usuario.loja_id)
  await espelharNaLoja(admin, usuario.loja_id, { status: 'cancelada' })

  revalidatePath('/configuracoes')
  return { ok: true }
}

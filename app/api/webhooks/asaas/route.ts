import { timingSafeEqual } from 'node:crypto'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

type StatusAssinatura = 'trial' | 'ativa' | 'inadimplente' | 'cancelada'

interface Assinatura {
  loja_id: string
  status: StatusAssinatura
  inadimplente_desde: string | null
  pago_ate: string | null
}

interface AsaasEvent {
  id?: string
  event?: string
  payment?: {
    id?: string
    status?: string
    subscription?: string | null
    externalReference?: string | null
    dueDate?: string
  }
  subscription?: {
    id?: string
    externalReference?: string | null
  }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function tokenValido(recebido: string | null): boolean {
  const esperado = process.env.ASAAS_WEBHOOK_TOKEN
  if (!esperado || !recebido) return false
  const a = Buffer.from(recebido)
  const b = Buffer.from(esperado)
  return a.length === b.length && timingSafeEqual(a, b)
}

// Vencimento da cobrança paga + 1 mês (YYYY-MM-DD -> ISO, fuso de Brasília)
function mesSeguinte(dueDate: string | undefined): string {
  const base = dueDate && /^\d{4}-\d{2}-\d{2}$/.test(dueDate) ? new Date(`${dueDate}T00:00:00-03:00`) : new Date()
  base.setMonth(base.getMonth() + 1)
  return base.toISOString()
}

export async function POST(req: Request) {
  // 1. Autenticação
  if (!tokenValido(req.headers.get('asaas-access-token'))) {
    return new Response('unauthorized', { status: 401 })
  }

  let body: AsaasEvent
  try {
    body = await req.json()
  } catch {
    return new Response('ok')
  }

  const tipo = body.event ?? 'DESCONHECIDO'
  const eventoId = body.id ?? `${tipo}:${body.payment?.id ?? body.subscription?.id ?? 'sem-id'}:${body.payment?.status ?? ''}`
  const admin = createAdminClient()

  // 2. Idempotência: o mesmo evento reenviado não faz nada
  const { error: erroEvento } = await admin.from('asaas_webhook_eventos').insert({ evento_id: eventoId, tipo })
  if (erroEvento) {
    if (erroEvento.code === '23505') {
      console.log(`[asaas-webhook] ${tipo} ${eventoId} duplicado, ignorado`)
      return new Response('ok')
    }
    console.error('[asaas-webhook] erro ao registrar evento:', erroEvento)
    return new Response('erro', { status: 500 }) // o Asaas reenvia
  }

  try {
    // 3. Localizar a loja: asaas_subscription_id, com externalReference como alternativa
    const subscriptionId = body.payment?.subscription ?? body.subscription?.id ?? null
    const externalRef = body.payment?.externalReference ?? body.subscription?.externalReference ?? null

    let ass: Assinatura | null = null
    if (subscriptionId) {
      const { data } = await admin
        .from('assinaturas')
        .select('loja_id, status, inadimplente_desde, pago_ate')
        .eq('asaas_subscription_id', subscriptionId)
        .maybeSingle<Assinatura>()
      ass = data
    }
    if (!ass && externalRef && UUID.test(externalRef)) {
      const { data } = await admin
        .from('assinaturas')
        .select('loja_id, status, inadimplente_desde, pago_ate')
        .eq('loja_id', externalRef)
        .maybeSingle<Assinatura>()
      ass = data
    }

    if (!ass) {
      console.log(`[asaas-webhook] ${tipo} ${eventoId}: loja não encontrada (sub=${subscriptionId}, ref=${externalRef})`)
      return new Response('ok')
    }

    console.log(`[asaas-webhook] ${tipo} ${eventoId} loja=${ass.loja_id} status=${ass.status}`)

    // 4. Regras de status
    const agora = new Date().toISOString()
    let patch: Record<string, unknown> | null = null

    switch (tipo) {
      case 'PAYMENT_CONFIRMED':
      case 'PAYMENT_RECEIVED': {
        const novoPagoAte = mesSeguinte(body.payment?.dueDate)
        // pago_ate só avança (CONFIRMED e RECEIVED chegam os dois para o mesmo pagamento)
        const pagoAte = ass.pago_ate && ass.pago_ate > novoPagoAte ? ass.pago_ate : novoPagoAte
        patch = ass.status === 'cancelada'
          ? { pago_ate: pagoAte } // assinatura cancelada não reativa por pagamento atrasado
          : { status: 'ativa', inadimplente_desde: null, pago_ate: pagoAte }
        break
      }
      case 'PAYMENT_OVERDUE':
        // Só quem já pagou entra em inadimplência; a 1ª fatura vencida de quem nunca pagou
        // não pode dar 3 dias extras além do trial.
        if (ass.status === 'ativa') patch = { status: 'inadimplente', inadimplente_desde: agora }
        break
      case 'PAYMENT_REFUNDED':
      case 'PAYMENT_CHARGEBACK_REQUESTED':
        if (ass.status === 'ativa' || ass.status === 'trial')
          patch = { status: 'inadimplente', inadimplente_desde: agora }
        break
      case 'SUBSCRIPTION_DELETED':
      case 'SUBSCRIPTION_INACTIVATED':
        // Quem nunca pagou segue no trial; quem pagou mantém acesso até pago_ate
        if (ass.status === 'ativa' || ass.status === 'inadimplente') patch = { status: 'cancelada' }
        break
      default:
        break // demais eventos: ignorar
    }

    if (patch) {
      const { error } = await admin
        .from('assinaturas')
        .update({ ...patch, atualizado_em: agora })
        .eq('loja_id', ass.loja_id)
      if (error) throw error
    }
  } catch (e) {
    // Libera o evento para o reenvio do Asaas ser processado de novo
    console.error(`[asaas-webhook] erro ao processar ${tipo} ${eventoId}:`, e)
    await admin.from('asaas_webhook_eventos').delete().eq('evento_id', eventoId)
    return new Response('erro', { status: 500 })
  }

  // 5. Responde rápido
  return new Response('ok')
}

import 'server-only'

export class AsaasError extends Error {
  constructor(public status: number, public descricoes: string[], raw: string) {
    super(`Asaas ${status}: ${raw}`)
  }
}

// Chaves do Asaas começam com $. O .env do Next expande $, então a chave pode vir sem ele.
function chaveApi(): string {
  const k = process.env.ASAAS_API_KEY ?? ''
  return k.startsWith('$') ? k : '$' + k
}

export async function asaas<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${process.env.ASAAS_API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      access_token: chaveApi(),
      'User-Agent': 'cylo',
      ...init.headers,
    },
    cache: 'no-store',
  })
  if (!res.ok) {
    const raw = await res.text()
    let descricoes: string[] = []
    try {
      descricoes = (JSON.parse(raw).errors ?? []).map((e: { description: string }) => e.description)
    } catch {}
    throw new AsaasError(res.status, descricoes, raw)
  }
  return res.json()
}

export const VALOR_PLANO = 59.9

interface Cobranca {
  id: string
  status: string
  invoiceUrl: string | null
  dueDate: string
}

// Data de hoje no fuso de Brasília (YYYY-MM-DD) — o Asaas rejeita vencimento no passado
function hojeBrasilia(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
}

export async function criarCliente(p: { nome: string; email: string; cpfCnpj: string; lojaId: string }) {
  return asaas<{ id: string }>('/customers', {
    method: 'POST',
    body: JSON.stringify({
      name: p.nome,
      email: p.email,
      cpfCnpj: p.cpfCnpj,
      externalReference: p.lojaId,
    }),
  })
}

// Assinatura só no cartão. O cartão é digitado na fatura hospedada do Asaas.
export async function criarAssinatura(p: { customerId: string; lojaId: string }) {
  const base = {
    customer: p.customerId,
    billingType: 'CREDIT_CARD',
    value: VALOR_PLANO,
    cycle: 'MONTHLY',
    nextDueDate: hojeBrasilia(),
    description: 'CYLO - Plano mensal',
    externalReference: p.lojaId,
  }

  // successUrl só é aceito quando há um site cadastrado na conta Asaas (https).
  // Se for recusado, cria sem retorno automático — o acesso é liberado pelo webhook.
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  if (appUrl.startsWith('https://')) {
    try {
      return await asaas<{ id: string }>('/subscriptions', {
        method: 'POST',
        body: JSON.stringify({
          ...base,
          callback: { successUrl: `${appUrl}/assinar/obrigado`, autoRedirect: true },
        }),
      })
    } catch (e) {
      if (!(e instanceof AsaasError) || e.status !== 400) throw e
      console.warn('[asaas] callback.successUrl recusado, criando sem retorno:', e.descricoes)
    }
  }
  return asaas<{ id: string }>('/subscriptions', { method: 'POST', body: JSON.stringify(base) })
}

export async function cancelarAssinaturaAsaas(subscriptionId: string) {
  return asaas<{ deleted: boolean; id: string }>(`/subscriptions/${subscriptionId}`, { method: 'DELETE' })
}

export async function excluirCliente(customerId: string) {
  return asaas(`/customers/${customerId}`, { method: 'DELETE' })
}

// Fatura (invoiceUrl) mais recente da assinatura num dado status.
// A 1ª cobrança pode demorar um instante para existir, por isso as tentativas.
export async function buscarFatura(
  subscriptionId: string,
  status: 'PENDING' | 'OVERDUE',
  tentativas = 4,
): Promise<string | null> {
  for (let i = 0; i < tentativas; i++) {
    const r = await asaas<{ data: Cobranca[] }>(`/subscriptions/${subscriptionId}/payments?status=${status}`)
    const fatura = r.data
      .filter(c => c.invoiceUrl)
      .sort((a, b) => b.dueDate.localeCompare(a.dueDate))[0]
    if (fatura?.invoiceUrl) return fatura.invoiceUrl
    if (i < tentativas - 1) await new Promise(res => setTimeout(res, 800))
  }
  return null
}

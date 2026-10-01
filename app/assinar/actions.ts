'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { cpfCnpjValido, soDigitos } from '@/lib/utils/cpf-cnpj'
import { AsaasError, buscarFatura, cancelarAssinaturaAsaas, criarAssinatura, criarCliente, excluirCliente } from '@/lib/asaas'

interface Assinatura {
  status: 'trial' | 'ativa' | 'inadimplente' | 'cancelada'
  asaas_customer_id: string | null
  asaas_subscription_id: string | null
}

const ERRO_GENERICO = 'Não conseguimos iniciar sua assinatura agora. Tente novamente em instantes.'

export async function assinar(formData: FormData): Promise<{ error: string } | never> {
  // 1. Usuário e loja da sessão
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('loja_id, perfil, email')
    .eq('id', user.id)
    .single<{ loja_id: string | null; perfil: string; email: string | null }>()

  if (!usuario?.loja_id) return { error: 'Esta conta não está ligada a uma loja.' }
  if (usuario.perfil !== 'loja_admin')
    return { error: 'Só o administrador da loja pode assinar. Peça a ele para concluir a assinatura.' }

  const lojaId = usuario.loja_id
  const admin = createAdminClient()

  const { data: ass } = await admin
    .from('assinaturas')
    .select('status, asaas_customer_id, asaas_subscription_id')
    .eq('loja_id', lojaId)
    .single<Assinatura>()
  if (!ass) return { error: ERRO_GENERICO }

  if (ass.status === 'ativa') redirect('/dashboard')

  let invoiceUrl: string | null = null
  try {
    // 4.2 Inadimplente: abre a fatura em aberto em vez de criar assinatura nova
    if (ass.status === 'inadimplente' && ass.asaas_subscription_id) {
      invoiceUrl = await buscarFatura(ass.asaas_subscription_id, 'OVERDUE', 1)
        ?? await buscarFatura(ass.asaas_subscription_id, 'PENDING', 1)
    }
    // Já iniciou a assinatura e não terminou de pagar: reabre a fatura pendente
    else if (ass.status === 'trial' && ass.asaas_subscription_id) {
      invoiceUrl = await buscarFatura(ass.asaas_subscription_id, 'PENDING', 1)
    }

    if (!invoiceUrl) {
      // 4.1 passo 2: cliente
      let customerId = ass.asaas_customer_id
      if (!customerId) {
        const cpfCnpj = soDigitos(String(formData.get('cpf_cnpj') ?? ''))
        if (!cpfCnpjValido(cpfCnpj)) return { error: 'Informe um CPF ou CNPJ válido.' }

        const { data: loja } = await admin.from('lojas').select('nome').eq('id', lojaId).single<{ nome: string }>()
        const email = usuario.email ?? user.email ?? ''
        const criado = await criarCliente({ nome: loja?.nome ?? email, email, cpfCnpj, lojaId })

        // Duplo clique: só um cliente é gravado; o excedente é removido do Asaas
        const { data: gravado } = await admin
          .from('assinaturas')
          .update({ asaas_customer_id: criado.id, atualizado_em: new Date().toISOString() })
          .eq('loja_id', lojaId)
          .is('asaas_customer_id', null)
          .select('asaas_customer_id')
        if (gravado?.length) {
          customerId = criado.id
        } else {
          await excluirCliente(criado.id).catch(() => {})
          const { data: atual } = await admin.from('assinaturas').select('asaas_customer_id').eq('loja_id', lojaId).single<{ asaas_customer_id: string | null }>()
          customerId = atual?.asaas_customer_id ?? null
        }
      }
      if (!customerId) return { error: ERRO_GENERICO }

      // 4.1 passo 3: assinatura (só cartão — o cartão é digitado no Asaas)
      const sub = await criarAssinatura({ customerId, lojaId })

      const antigo = ass.asaas_subscription_id
      let q = admin
        .from('assinaturas')
        .update({ asaas_subscription_id: sub.id, atualizado_em: new Date().toISOString() })
        .eq('loja_id', lojaId)
      q = antigo ? q.eq('asaas_subscription_id', antigo) : q.is('asaas_subscription_id', null)
      const { data: salvo } = await q.select('asaas_subscription_id')

      if (!salvo?.length) {
        // Outro clique já criou a assinatura: descarta esta e usa a que ficou
        await cancelarAssinaturaAsaas(sub.id).catch(() => {})
        const { data: atual } = await admin.from('assinaturas').select('asaas_subscription_id').eq('loja_id', lojaId).single<{ asaas_subscription_id: string | null }>()
        if (!atual?.asaas_subscription_id) return { error: ERRO_GENERICO }
        invoiceUrl = await buscarFatura(atual.asaas_subscription_id, 'PENDING')
      } else {
        // 4.1 passo 4: primeira cobrança
        invoiceUrl = await buscarFatura(sub.id, 'PENDING')
      }
    }
  } catch (e) {
    console.error('[assinar] erro Asaas:', e)
    if (e instanceof AsaasError && e.status === 400 && e.descricoes[0]) return { error: e.descricoes[0] }
    return { error: ERRO_GENERICO }
  }

  if (!invoiceUrl) return { error: 'Sua fatura ainda está sendo gerada. Aguarde alguns segundos e tente de novo.' }

  // 4.1 passo 5: o status NÃO muda aqui — quem libera o acesso é o webhook
  redirect(invoiceUrl)
}

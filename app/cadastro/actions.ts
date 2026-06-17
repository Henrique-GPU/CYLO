'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

function iniciais(nome: string): string {
  return nome.trim().split(/\s+/).slice(0, 2).map(p => p[0]).join('').toUpperCase()
}

export async function cadastrar(formData: FormData): Promise<{ error: string } | never> {
  const nomeLoja = (formData.get('nome_loja') as string)?.trim()
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const senha = formData.get('senha') as string
  const nomeAdmin = email?.split('@')[0] ?? nomeLoja

  if (!nomeLoja || !email || !senha)
    return { error: 'Preencha todos os campos obrigatórios.' }
  if (senha.length < 8)
    return { error: 'A senha deve ter no mínimo 8 caracteres.' }

  // Atribuição de marketing (UTM/gclid) salva no cadastro
  let attrib: Record<string, string> = {}
  try {
    const cookieStore = await cookies()
    const raw = cookieStore.get('cylo_attrib')?.value
    if (raw) attrib = JSON.parse(decodeURIComponent(raw))
  } catch {
    attrib = {}
  }

  const admin = createAdminClient()

  const agora = new Date()
  const fimTrial = new Date(agora)
  fimTrial.setDate(fimTrial.getDate() + 15)

  // 1. Criar loja em trial
  const { data: loja, error: erroLoja } = await admin
    .from('lojas')
    .insert({
      nome: nomeLoja,
      responsavel: nomeAdmin,
      cor_primaria: '#4f7eff',
      cor_secundaria: '#0e1018',
      status_saas: 'trial',
      valor_mensal: 59.90,
      data_inicio_trial: agora.toISOString().split('T')[0],
      data_fim_trial: fimTrial.toISOString().split('T')[0],
      proximo_vencimento: fimTrial.toISOString().split('T')[0],
    })
    .select('id')
    .single()

  if (erroLoja || !loja) {
    console.error('[cadastrar] erro ao criar loja:', erroLoja)
    return { error: 'Erro ao criar loja.' }
  }

  // 2. Criar auth user
  const { data: authData, error: erroAuth } = await admin.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
  })

  if (erroAuth || !authData.user) {
    console.error('[cadastrar] erro ao criar auth user:', erroAuth)
    await admin.from('lojas').delete().eq('id', loja.id)
    if (erroAuth?.code === 'email_exists' || erroAuth?.message?.includes('already been registered'))
      return { error: 'Este e-mail já está em uso.' }
    return { error: 'Erro ao criar conta.' }
  }

  // 3. Criar registro do usuário
  const { error: erroUsuario } = await admin.from('usuarios').insert({
    id: authData.user.id,
    loja_id: loja.id,
    nome: nomeAdmin,
    username: email.split('@')[0],
    email,
    perfil: 'loja_admin',
    iniciais: iniciais(nomeAdmin),
    comissao_pct: 0,
    utm_source: attrib.utm_source ?? null,
    utm_medium: attrib.utm_medium ?? null,
    utm_campaign: attrib.utm_campaign ?? null,
    utm_content: attrib.utm_content ?? null,
    utm_term: attrib.utm_term ?? null,
    gclid: attrib.gclid ?? null,
  })

  if (erroUsuario) {
    await admin.auth.admin.deleteUser(authData.user.id)
    await admin.from('lojas').delete().eq('id', loja.id)
    return { error: 'Erro ao salvar usuário.' }
  }

  // 4. Fazer login automático
  const supabase = await createClient()
  await supabase.auth.signInWithPassword({ email, password: senha })

  redirect('/dashboard?novo=1')
}

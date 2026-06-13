'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

function gerarSenha(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

function iniciais(nome: string): string {
  return nome.trim().split(/\s+/).slice(0, 2).map(p => p[0]).join('').toUpperCase()
}

async function uploadLogo(admin: any, lojaId: string, file: File): Promise<string | null> {
  await admin.storage.createBucket('logos', { public: true }).catch(() => {})
  const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
  const path = `${lojaId}/logo.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())
  const { error } = await admin.storage.from('logos').upload(path, buffer, {
    contentType: file.type || 'image/png',
    upsert: true,
  })
  if (error) return null
  const { data: { publicUrl } } = admin.storage.from('logos').getPublicUrl(path)
  return publicUrl
}

export async function criarLoja(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: ceo } = await supabase.from('usuarios').select('perfil').eq('id', user.id).single()
  if (ceo?.perfil !== 'ceo') redirect('/dashboard')

  const admin = createAdminClient()

  const nomeLoja      = formData.get('nome_loja') as string
  const responsavel   = formData.get('responsavel') as string
  const telefone      = formData.get('telefone') as string || null
  const whatsapp      = formData.get('whatsapp') as string || null
  const email         = formData.get('email_loja') as string || null
  const instagram     = formData.get('instagram') as string || null
  const cnpj          = formData.get('cnpj') as string || null
  const endereco      = formData.get('endereco') as string || null
  const corPrimaria   = formData.get('cor_primaria') as string || '#4f7eff'
  const corSecundaria = formData.get('cor_secundaria') as string || '#0e1018'
  const valorMensal   = parseFloat(formData.get('valor_mensal') as string) || 99.90
  const diasTrial     = parseInt(formData.get('dias_trial') as string) || 14
  const statusSaas    = formData.get('status_saas') as string || 'trial'
  const nomeAdmin     = formData.get('nome_admin') as string
  const emailAdmin    = formData.get('email_admin') as string
  const senhaAdmin    = gerarSenha()

  const agora = new Date()
  const fimTrial = new Date(agora); fimTrial.setDate(fimTrial.getDate() + diasTrial)
  const proxVenc = new Date(agora)
  if (statusSaas === 'ativo') proxVenc.setMonth(proxVenc.getMonth() + 1)
  else proxVenc.setDate(proxVenc.getDate() + diasTrial)

  const { data: loja, error: erroLoja } = await admin
    .from('lojas').insert({
      nome: nomeLoja,
      responsavel,
      telefone, whatsapp, email, instagram, cnpj, endereco,
      cor_primaria: corPrimaria,
      cor_secundaria: corSecundaria,
      valor_mensal: valorMensal,
      status_saas: statusSaas,
      data_inicio_trial: agora.toISOString().split('T')[0],
      data_fim_trial: fimTrial.toISOString().split('T')[0],
      proximo_vencimento: proxVenc.toISOString().split('T')[0],
    }).select('id').single()

  if (erroLoja || !loja) {
    return { error: 'Erro ao criar loja: ' + erroLoja?.message }
  }

  // Upload logo se enviada
  const logoFile = formData.get('logo') as File | null
  const logoUrlInput = formData.get('logo_url_input') as string || ''
  let logoUrl: string | null = null

  if (logoFile && logoFile.size > 0) {
    logoUrl = await uploadLogo(admin, loja.id, logoFile)
  } else if (logoUrlInput.trim()) {
    logoUrl = logoUrlInput.trim()
  }

  if (logoUrl) {
    await admin.from('lojas').update({ logo_url: logoUrl }).eq('id', loja.id)
  }

  // Criar auth user
  const { data: authUser, error: erroAuth } = await admin.auth.admin.createUser({
    email: emailAdmin,
    password: senhaAdmin,
    email_confirm: true,
  })

  if (erroAuth || !authUser.user) {
    await admin.from('lojas').delete().eq('id', loja.id)
    return { error: 'Erro ao criar usuário: ' + erroAuth?.message }
  }

  const { error: erroUsuario } = await admin.from('usuarios').insert({
    id: authUser.user.id,
    loja_id: loja.id,
    nome: nomeAdmin,
    username: emailAdmin.split('@')[0],
    email: emailAdmin,
    perfil: 'loja_admin',
    iniciais: iniciais(nomeAdmin),
    comissao_pct: 0,
  })

  if (erroUsuario) {
    await admin.auth.admin.deleteUser(authUser.user.id)
    await admin.from('lojas').delete().eq('id', loja.id)
    return { error: 'Erro ao salvar usuário: ' + erroUsuario.message }
  }

  return {
    ok: true,
    loja: { id: loja.id, nome: nomeLoja },
    credenciais: { email: emailAdmin, senha: senhaAdmin },
  }
}

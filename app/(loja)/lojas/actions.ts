'use server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

async function assertCeo() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data } = await supabase.from('usuarios').select('perfil').eq('id', user.id).single()
  if (data?.perfil !== 'ceo') redirect('/dashboard')
  return createAdminClient()
}

async function uploadLogoAdmin(admin: any, lojaId: string, file: File): Promise<string | null> {
  await admin.storage.createBucket('logos', { public: true }).catch(() => {})
  const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
  const buffer = Buffer.from(await file.arrayBuffer())
  const { error } = await admin.storage.from('logos').upload(`${lojaId}/logo.${ext}`, buffer, {
    contentType: file.type || 'image/png', upsert: true,
  })
  if (error) return null
  const { data: { publicUrl } } = admin.storage.from('logos').getPublicUrl(`${lojaId}/logo.${ext}`)
  return publicUrl
}

export async function salvarLojaCompleta(lojaId: string, formData: FormData) {
  const admin = await assertCeo()

  // Logo
  let logoUrl: string | undefined = undefined
  const logoFile = formData.get('logo') as File | null
  const logoUrlInput = (formData.get('logo_url_input') as string || '').trim()
  const removerLogo = formData.get('remover_logo') === 'true'

  if (removerLogo) logoUrl = ''
  else if (logoFile && logoFile.size > 0) logoUrl = (await uploadLogoAdmin(admin, lojaId, logoFile)) ?? undefined
  else if (logoUrlInput) logoUrl = logoUrlInput

  const lojaUpdate: Record<string, any> = {
    nome: formData.get('nome') as string,
    razao_social: (formData.get('razao_social') as string) || null,
    cnpj: (formData.get('cnpj') as string) || null,
    telefone: (formData.get('telefone') as string) || null,
    whatsapp: (formData.get('whatsapp') as string) || null,
    instagram: (formData.get('instagram') as string) || null,
    email: (formData.get('email') as string) || null,
    endereco: (formData.get('endereco') as string) || null,
    status_saas: (formData.get('status_saas') as string) || undefined,
    valor_mensal: parseFloat(formData.get('valor_mensal') as string) || null,
    data_fim_trial: (formData.get('data_fim_trial') as string) || null,
    proximo_vencimento: (formData.get('proximo_vencimento') as string) || null,
    cor_primaria: (formData.get('cor_primaria') as string) || '#4f7eff',
    cor_secundaria: (formData.get('cor_secundaria') as string) || '#0e1018',
  }
  if (logoUrl !== undefined) lojaUpdate.logo_url = logoUrl || null

  const { error: erroLoja } = await admin.from('lojas').update(lojaUpdate).eq('id', lojaId)
  if (erroLoja) return { error: erroLoja.message }

  // Admin user fields
  const nomeAdmin = (formData.get('nome_admin') as string || '').trim()
  const usernameAdmin = (formData.get('username_admin') as string || '').trim()
  const emailAdmin = (formData.get('email_admin') as string || '').trim()

  if (nomeAdmin || usernameAdmin) {
    const up: Record<string, string> = {}
    if (nomeAdmin) { up.nome = nomeAdmin; up.iniciais = nomeAdmin.trim().split(/\s+/).slice(0, 2).map((w: string) => w[0]).join('').toUpperCase() }
    if (usernameAdmin) up.username = usernameAdmin
    await admin.from('usuarios').update(up).eq('loja_id', lojaId).eq('perfil', 'loja_admin')
  }

  if (emailAdmin) {
    const { data: adminUser } = await admin.from('usuarios').select('id').eq('loja_id', lojaId).eq('perfil', 'loja_admin').single<{ id: string }>()
    if (adminUser) {
      await admin.auth.admin.updateUserById(adminUser.id, { email: emailAdmin })
      await admin.from('usuarios').update({ email: emailAdmin }).eq('id', adminUser.id)
    }
  }

  revalidatePath('/dashboard')
  revalidatePath('/lojas')
  return { ok: true }
}

function gerarSenha(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export async function redefinirSenhaAdmin(lojaId: string) {
  const admin = await assertCeo()

  const { data: adminUser } = await admin
    .from('usuarios').select('id, email, nome')
    .eq('loja_id', lojaId).eq('perfil', 'loja_admin')
    .single<{ id: string; email: string; nome: string }>()

  if (!adminUser) return { error: 'Admin não encontrado' }

  const novaSenha = gerarSenha()
  const { error } = await admin.auth.admin.updateUserById(adminUser.id, { password: novaSenha })
  if (error) return { error: error.message }

  return { ok: true, senha: novaSenha, email: adminUser.email, nome: adminUser.nome }
}

export async function excluirLoja(lojaId: string) {
  const admin = await assertCeo()

  // Busca todos os usuários da loja para deletar do Auth
  const { data: usuarios } = await admin
    .from('usuarios').select('id').eq('loja_id', lojaId)

  // Deleta usuários do Auth (sem logar erros individuais)
  for (const u of usuarios ?? []) {
    await admin.auth.admin.deleteUser(u.id).catch(() => {})
  }

  // Deleta dados relacionados na ordem correta (evita FK violation)
  await admin.from('venda_acessorios').delete().in(
    'venda_id',
    (await admin.from('vendas').select('id').eq('loja_id', lojaId)).data?.map(v => v.id) ?? []
  )
  await admin.from('vendas').delete().eq('loja_id', lojaId)
  await admin.from('aparelho_custos').delete().in(
    'aparelho_id',
    (await admin.from('aparelhos').select('id').eq('loja_id', lojaId)).data?.map(a => a.id) ?? []
  )
  await admin.from('aparelhos').delete().eq('loja_id', lojaId)
  await admin.from('acessorios_catalogo').delete().eq('loja_id', lojaId)
  await admin.from('motoboys').delete().eq('loja_id', lojaId)
  await admin.from('tabela_precos').delete().eq('loja_id', lojaId)
  await admin.from('clientes').delete().eq('loja_id', lojaId)
  await admin.from('usuarios').delete().eq('loja_id', lojaId)

  // Deleta a loja
  const { error } = await admin.from('lojas').delete().eq('id', lojaId)
  if (error) return { error: error.message }

  revalidatePath('/lojas')
  revalidatePath('/dashboard')
  return { ok: true }
}

export async function bloquearLoja(lojaId: string) {
  const admin = await assertCeo()
  await admin.from('lojas').update({ status_saas: 'bloqueado' }).eq('id', lojaId)
  revalidatePath('/dashboard')
}

export async function ativarLoja(lojaId: string) {
  const admin = await assertCeo()
  const proxVenc = new Date()
  proxVenc.setMonth(proxVenc.getMonth() + 1)
  await admin.from('lojas').update({
    status_saas: 'ativo',
    proximo_vencimento: proxVenc.toISOString().split('T')[0],
  }).eq('id', lojaId)
  revalidatePath('/dashboard')
}

export async function renovarLoja(lojaId: string) {
  const admin = await assertCeo()
  const { data: loja } = await admin
    .from('lojas').select('proximo_vencimento').eq('id', lojaId)
    .single<{ proximo_vencimento: string | null }>()
  const base = loja?.proximo_vencimento ? new Date(loja.proximo_vencimento) : new Date()
  if (base < new Date()) base.setTime(Date.now())
  base.setDate(base.getDate() + 30)
  await admin.from('lojas').update({
    status_saas: 'ativo',
    proximo_vencimento: base.toISOString().split('T')[0],
  }).eq('id', lojaId)
  revalidatePath('/dashboard')
}

export async function converterTrial(lojaId: string) {
  const admin = await assertCeo()
  const proxVenc = new Date()
  proxVenc.setMonth(proxVenc.getMonth() + 1)
  await admin.from('lojas').update({
    status_saas: 'ativo',
    proximo_vencimento: proxVenc.toISOString().split('T')[0],
  }).eq('id', lojaId)
  revalidatePath('/dashboard')
}

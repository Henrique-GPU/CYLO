'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

async function uploadLogo(admin: any, lojaId: string, file: File): Promise<string | null> {
  await admin.storage.createBucket('logos', { public: true }).catch(() => {})
  await admin.storage.updateBucket('logos', { public: true }).catch(() => {})
  const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
  const path = `${lojaId}/logo.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())
  const { error } = await admin.storage.from('logos').upload(path, buffer, {
    contentType: file.type || 'image/png',
    upsert: true,
  })
  if (error) return null
  const { data: { publicUrl } } = admin.storage.from('logos').getPublicUrl(path)
  return `${publicUrl}?t=${Date.now()}`
}

export async function editarMinhaLoja(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('perfil, loja_id')
    .eq('id', user.id)
    .single<{ perfil: string; loja_id: string }>()

  if (usuario?.perfil !== 'loja_admin' || !usuario?.loja_id) redirect('/dashboard')

  const lojaId = usuario.loja_id
  const admin = createAdminClient()

  let logoUrl: string | null = null
  const logoFile = formData.get('logo') as File | null
  const logoUrlInput = formData.get('logo_url_input') as string || ''
  const removerLogo = formData.get('remover_logo') === 'true'

  if (removerLogo) {
    logoUrl = null
  } else if (logoFile && logoFile.size > 0) {
    logoUrl = await uploadLogo(admin, lojaId, logoFile)
  } else if (logoUrlInput.trim()) {
    logoUrl = logoUrlInput.trim()
  }

  const updateData: Record<string, any> = {
    nome: formData.get('nome') as string,
    whatsapp: (formData.get('whatsapp') as string) || null,
    instagram: (formData.get('instagram') as string) || null,
    endereco: (formData.get('endereco') as string) || null,
    telefone: (formData.get('telefone') as string) || null,
    email: (formData.get('email') as string) || null,
    garantia_padrao: (formData.get('garantia_padrao') as string) || null,
    cor_primaria: (formData.get('cor_primaria') as string) || '#4f7eff',
  }

  if (removerLogo) updateData.logo_url = null
  else if (logoUrl) updateData.logo_url = logoUrl

  const { error } = await admin.from('lojas').update(updateData).eq('id', lojaId)
  if (error) return { error: error.message }

  revalidatePath('/configuracoes')
  revalidatePath('/dashboard')
  return { ok: true }
}

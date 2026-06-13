'use server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

async function uploadLogo(admin: any, lojaId: string, file: File): Promise<string | null> {
  // create bucket if not exists, then force public (in case it exists as private)
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
  // append cache-bust so browser reloads after re-upload
  const { data: { publicUrl } } = admin.storage.from('logos').getPublicUrl(path)
  return `${publicUrl}?t=${Date.now()}`
}

export async function editarLoja(lojaId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: ceo } = await supabase.from('usuarios').select('perfil').eq('id', user.id).single()
  if (ceo?.perfil !== 'ceo') redirect('/dashboard')

  const admin = createAdminClient()

  // Logo: arquivo ou URL
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
    responsavel: (formData.get('responsavel') as string) || null,
    cnpj: (formData.get('cnpj') as string) || null,
    telefone: (formData.get('telefone') as string) || null,
    whatsapp: (formData.get('whatsapp') as string) || null,
    email: (formData.get('email') as string) || null,
    instagram: (formData.get('instagram') as string) || null,
    endereco: (formData.get('endereco') as string) || null,
    cor_primaria: (formData.get('cor_primaria') as string) || '#4f7eff',
    cor_secundaria: (formData.get('cor_secundaria') as string) || '#0e1018',
    valor_mensal: parseFloat(formData.get('valor_mensal') as string) || null,
    garantia_padrao: (formData.get('garantia_padrao') as string) || null,
  }

  // Only update logo_url if something changed
  if (removerLogo) updateData.logo_url = null
  else if (logoUrl) updateData.logo_url = logoUrl

  const { error } = await admin.from('lojas').update(updateData).eq('id', lojaId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  revalidatePath('/lojas')
  revalidatePath(`/lojas/${lojaId}/editar`)
  return { ok: true }
}

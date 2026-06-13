'use server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function criarAcessorio(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usuario } = await supabase
    .from('usuarios').select('loja_id').eq('id', user.id)
    .single<{ loja_id: string }>()

  if (!usuario?.loja_id) redirect('/dashboard')

  const { error } = await supabase.from('acessorios_catalogo').insert({
    loja_id: usuario.loja_id,
    nome: formData.get('nome') as string,
    custo: parseFloat(formData.get('custo') as string) || 0,
    preco: parseFloat(formData.get('preco') as string) || 0,
    ativo: true,
  })

  if (error) return { error: error.message }

  revalidatePath('/acessorios')
  return { ok: true }
}

export async function toggleAcessorio(id: string, ativo: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  await supabase.from('acessorios_catalogo').update({ ativo }).eq('id', id)
  revalidatePath('/acessorios')
}

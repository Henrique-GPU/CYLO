'use server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function criarMotoboy(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usuario } = await supabase
    .from('usuarios').select('loja_id, perfil').eq('id', user.id)
    .single<{ loja_id: string; perfil: string }>()

  if (!usuario?.loja_id || usuario.perfil === 'vendedor') redirect('/dashboard')

  const { error } = await supabase.from('motoboys').insert({
    loja_id: usuario.loja_id,
    nome: formData.get('nome') as string,
    telefone: (formData.get('telefone') as string) || null,
    pix: (formData.get('pix') as string) || null,
    corridas: 0,
    total_pago: 0,
  })

  if (error) return { error: error.message }

  revalidatePath('/motoboys')
  return { ok: true }
}

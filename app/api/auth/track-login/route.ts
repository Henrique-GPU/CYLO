import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ ok: false }, { status: 401 })

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('loja_id')
    .eq('id', user.id)
    .single<{ loja_id: string | null }>()

  if (!usuario?.loja_id) return NextResponse.json({ ok: true })

  const admin = createAdminClient()
  await admin
    .from('lojas')
    .update({ ultimo_acesso: new Date().toISOString() })
    .eq('id', usuario.loja_id)

  return NextResponse.json({ ok: true })
}

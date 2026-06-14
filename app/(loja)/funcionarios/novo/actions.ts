'use server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

function gerarSenha(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

function iniciais(nome: string): string {
  return nome.trim().split(/\s+/).slice(0, 2).map(p => p[0]).join('').toUpperCase()
}

export async function criarFuncionario(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usuario } = await supabase
    .from('usuarios').select('loja_id, perfil').eq('id', user.id)
    .single<{ loja_id: string; perfil: string }>()

  if (usuario?.perfil !== 'loja_admin') redirect('/dashboard')
  if (!usuario?.loja_id) redirect('/dashboard')

  const admin = createAdminClient()

  const nome = formData.get('nome') as string
  const email = formData.get('email') as string
  const perfil = 'vendedor' // admin só pode criar vendedores
  const comissaoPct = parseFloat(formData.get('comissao_pct') as string) || 0
  const metaMensalRaw = formData.get('meta_mensal') as string
  const metaMensal = metaMensalRaw ? parseFloat(metaMensalRaw) : null
  const senha = gerarSenha()

  const { data: authUser, error: erroAuth } = await admin.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
  })

  if (erroAuth || !authUser.user) {
    return { error: 'Erro ao criar usuário: ' + erroAuth?.message }
  }

  const { error: erroUsuario } = await admin.from('usuarios').insert({
    id: authUser.user.id,
    loja_id: usuario.loja_id,
    nome,
    username: email.split('@')[0],
    email,
    perfil,
    iniciais: iniciais(nome),
    comissao_pct: comissaoPct,
    meta_mensal: metaMensal,
    status: 'ativo',
  })

  if (erroUsuario) {
    await admin.auth.admin.deleteUser(authUser.user.id)
    return { error: 'Erro ao salvar funcionário: ' + erroUsuario.message }
  }

  revalidatePath('/funcionarios')
  return { ok: true, credenciais: { email, senha } }
}

export async function bloquearFuncionario(funcId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usuario } = await supabase
    .from('usuarios').select('loja_id, perfil').eq('id', user.id)
    .single<{ loja_id: string; perfil: string }>()

  if (usuario?.perfil !== 'loja_admin' || !usuario?.loja_id) redirect('/dashboard')

  const admin = createAdminClient()
  await admin.from('usuarios').update({ status: 'bloqueado' }).eq('id', funcId).eq('loja_id', usuario.loja_id)
  revalidatePath('/funcionarios')
}

export async function ativarFuncionario(funcId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usuario } = await supabase
    .from('usuarios').select('loja_id, perfil').eq('id', user.id)
    .single<{ loja_id: string; perfil: string }>()

  if (usuario?.perfil !== 'loja_admin' || !usuario?.loja_id) redirect('/dashboard')

  const admin = createAdminClient()
  await admin.from('usuarios').update({ status: 'ativo' }).eq('id', funcId).eq('loja_id', usuario.loja_id)
  revalidatePath('/funcionarios')
}

export async function redefinirSenha(funcId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usuario } = await supabase
    .from('usuarios').select('loja_id, perfil').eq('id', user.id)
    .single<{ loja_id: string; perfil: string }>()

  if (!usuario?.loja_id) redirect('/dashboard')
  // Apenas admin da loja pode redefinir
  if (usuario.perfil !== 'loja_admin') return { error: 'Sem permissão' }

  const admin = createAdminClient()

  // Confirma que o funcionário pertence à mesma loja
  const { data: func } = await admin.from('usuarios').select('id').eq('id', funcId).eq('loja_id', usuario.loja_id).single()
  if (!func) return { error: 'Funcionário não encontrado' }

  const novaSenha = gerarSenha()
  const { error } = await admin.auth.admin.updateUserById(funcId, { password: novaSenha })
  if (error) return { error: error.message }

  return { ok: true, senha: novaSenha }
}

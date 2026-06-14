import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Rotas públicas — sem autenticação necessária
const PUBLIC_PATHS = ['/', '/login', '/cadastro', '/onboarding']

// Rotas que admins bloqueados/vencidos ainda podem acessar
const ALLOWED_WHEN_BLOCKED = ['/configuracoes', '/login', '/cadastro']

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user, supabase } = await updateSession(request)
  const path = request.nextUrl.pathname

  // Rotas públicas: libera sem verificação
  const isPublic = PUBLIC_PATHS.some(p => path === p || path.startsWith(p + '/'))
  if (isPublic) return supabaseResponse

  // Sem sessão: redireciona para login
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Busca perfil e status da loja
  const { data: usuario } = await supabase
    .from('usuarios')
    .select('perfil, loja_id')
    .eq('id', user.id)
    .single<{ perfil: string; loja_id: string | null }>()

  // CEO: acesso total, nunca bloqueado
  if (!usuario || usuario.perfil === 'ceo') {
    return supabaseResponse
  }

  // loja_admin e vendedor: ambos bloqueados junto com a loja
  if (usuario.loja_id) {
    const { data: loja } = await supabase
      .from('lojas')
      .select('status_saas, data_fim_trial')
      .eq('id', usuario.loja_id)
      .single<{ status_saas: string; data_fim_trial: string | null }>()

    if (loja) {
      const bloqueado = loja.status_saas === 'bloqueado'
      const vencido = loja.status_saas === 'vencido'
      let trialExpirado = false
      if (loja.status_saas === 'trial' && loja.data_fim_trial) {
        trialExpirado = new Date(loja.data_fim_trial) < new Date()
      }

      if ((bloqueado || vencido || trialExpirado) && !ALLOWED_WHEN_BLOCKED.some(p => path.startsWith(p))) {
        return NextResponse.redirect(new URL('/bloqueado', request.url))
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|cylo-logo.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

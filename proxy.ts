import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Rotas públicas — sem autenticação necessária
const PUBLIC_PATHS = ['/', '/login', '/cadastro', '/onboarding', '/sitemap.xml', '/robots.txt', '/manifest.webmanifest', '/api/webhooks']

export async function proxy(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request)
  const path = request.nextUrl.pathname

  // Rotas públicas: libera sem verificação
  const isPublic = PUBLIC_PATHS.some(p => path === p || path.startsWith(p + '/'))
  if (isPublic) return supabaseResponse

  // Sem sessão: redireciona para login
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // O bloqueio por assinatura (acesso_liberado) fica no layout de (loja),
  // para não consultar o banco em toda requisição.
  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|cylo-logo.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

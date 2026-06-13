import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const PUBLIC_ROUTES = ['/login']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const { supabaseResponse, user } = await updateSession(request)

  const isPublic = PUBLIC_ROUTES.some((r) => pathname.startsWith(r))

  if (isPublic) {
    if (user) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return supabaseResponse
  }

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

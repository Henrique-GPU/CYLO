import type { Perfil } from '@/types'

export function isCEO(perfil: Perfil): boolean {
  return perfil === 'ceo'
}

export function isLojaAdmin(perfil: Perfil): boolean {
  return perfil === 'loja_admin'
}

export function isVendedor(perfil: Perfil): boolean {
  return perfil === 'vendedor'
}

export function getDefaultRoute(perfil: Perfil): string {
  if (perfil === 'ceo') return '/dashboard'
  if (perfil === 'loja_admin') return '/dashboard'
  return '/minha-area'
}

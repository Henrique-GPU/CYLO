import type { Loja } from '@/types'

export function applyWhiteLabel(loja: Pick<Loja, 'cor_primaria' | 'cor_secundaria'>): void {
  if (typeof document === 'undefined') return
  document.documentElement.style.setProperty('--color-primary', loja.cor_primaria ?? '#4f7eff')
  document.documentElement.style.setProperty('--color-secondary', loja.cor_secundaria ?? '#0e1018')
}

export function getLojaIniciais(nome: string): string {
  return nome
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

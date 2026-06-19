import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Cylo — Gestão para lojas de iPhone',
    short_name: 'Cylo',
    description: 'Controle vendas, estoque por IMEI, trocas, comissões e relatórios.',
    start_url: '/',
    display: 'standalone',
    background_color: '#080a0f',
    theme_color: '#4f7eff',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/cylo-logo.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
  }
}

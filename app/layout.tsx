import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Cylo — Gestão para lojas de iPhone',
  description: 'Controle vendas, estoque por IMEI, trocas, comissões e relatórios em uma única plataforma.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Cylo',
  },
  icons: {
    icon: '/cylo-logo.svg',
    apple: '/cylo-logo.svg',
  },
}

export const viewport: Viewport = {
  themeColor: '#4f7eff',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="h-full">
      <body className="h-full">{children}</body>
    </html>
  )
}

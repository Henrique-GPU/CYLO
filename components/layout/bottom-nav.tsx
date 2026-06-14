'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import * as Icons from 'lucide-react'
import type { Perfil } from '@/types'

const CEO_ITEMS = [
  { href: '/dashboard', icon: 'LayoutGrid', label: 'Home' },
  { href: '/lojas', icon: 'Store', label: 'Lojas' },
]

const ADMIN_ITEMS = [
  { href: '/dashboard', icon: 'LayoutGrid', label: 'Home' },
  { href: '/estoque', icon: 'Package', label: 'Estoque' },
  { href: '/nova-venda', icon: 'PlusCircle', label: 'Vender', primary: true },
  { href: '/assistencia', icon: 'Wrench', label: 'Assist.' },
  { href: '/configuracoes', icon: 'Settings', label: 'Config' },
]

const VENDEDOR_ITEMS = [
  { href: '/minha-area', icon: 'User', label: 'Início' },
  { href: '/estoque', icon: 'Package', label: 'Estoque' },
  { href: '/nova-venda', icon: 'PlusCircle', label: 'Vender', primary: true },
  { href: '/assistencia', icon: 'Wrench', label: 'Assist.' },
  { href: '/meus-orcamentos', icon: 'FileText', label: 'Orçamentos' },
]

function NavIcon({ name, size }: { name: string; size: number }) {
  const Icon = (Icons as Record<string, any>)[name]
  if (!Icon) return null
  return <Icon size={size} />
}

export default function BottomNav({ variant }: { variant: Perfil }) {
  const pathname = usePathname()
  const items = variant === 'ceo' ? CEO_ITEMS : variant === 'loja_admin' ? ADMIN_ITEMS : VENDEDOR_ITEMS

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-white/8"
      style={{
        background: '#0e1018',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="flex items-end justify-around px-2 pt-2 pb-2">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          const primary = (item as any).primary

          if (primary) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-0.5 -mt-4"
              >
                <div className="w-13 h-13 rounded-2xl bg-[#4f7eff] flex items-center justify-center shadow-lg shadow-[#4f7eff]/30"
                  style={{ width: 52, height: 52 }}>
                  <NavIcon name={item.icon} size={22} />
                </div>
                <span className="text-[9px] font-bold text-[#4f7eff] mt-0.5">{item.label}</span>
              </Link>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-0.5 px-3 py-1"
            >
              <div style={{ color: active ? '#4f7eff' : 'rgba(255,255,255,0.3)' }}>
                <NavIcon name={item.icon} size={20} />
              </div>
              <span
                className="text-[9px] font-semibold"
                style={{ color: active ? '#4f7eff' : 'rgba(255,255,255,0.3)' }}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import * as Icons from 'lucide-react'
import { getNavItems } from './nav-items'
import { getLojaIniciais } from '@/lib/utils/white-label'
import type { Perfil } from '@/types'

interface SidebarProps {
  variant: Perfil
  loja?: {
    nome: string
    logo_url: string | null
    cor_primaria: string
    cor_secundaria: string
    status_saas?: string
    proximo_vencimento?: string | null
    data_fim_trial?: string | null
  }
  usuario?: {
    nome: string
    iniciais?: string | null
  }
}

function NavIcon({ name }: { name: string }) {
  const Icon = (Icons as Record<string, any>)[name]
  if (!Icon) return null
  return <Icon size={14} />
}

function daysUntil(dateStr: string | null | undefined) {
  if (!dateStr) return null
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000)
}

export default function Sidebar({ variant, loja, usuario }: SidebarProps) {
  const pathname = usePathname()
  const items = getNavItems(variant)

  const saasColor: Record<string, string> = {
    ativo: '#34d399', trial: '#fbbf24', vencido: '#f87171', bloqueado: '#a78bfa',
  }
  const dv = loja?.status_saas === 'trial'
    ? daysUntil(loja.data_fim_trial)
    : daysUntil(loja?.proximo_vencimento)

  return (
    <aside className="w-56 flex flex-col h-full border-r border-white/5 flex-shrink-0" style={{ background: '#0e1018' }}>

      {/* Branding header */}
      <div className="px-4 pt-4 pb-3 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          {variant === 'ceo' ? (
            <>
              <div className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ background: 'transparent' }}>
                <svg viewBox="0 0 100 100" width="28" height="28" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="cRing" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#38bdf8" />
                      <stop offset="50%" stopColor="#4f7eff" />
                      <stop offset="100%" stopColor="#a78bfa" />
                    </linearGradient>
                    <radialGradient id="cDot" cx="35%" cy="35%" r="75%">
                      <stop offset="0%" stopColor="#7dd3fc" />
                      <stop offset="100%" stopColor="#3b82f6" />
                    </radialGradient>
                  </defs>
                  <circle cx="50" cy="50" r="46" fill="none" stroke="url(#cRing)" strokeWidth="14" />
                  <circle cx="62" cy="50" r="15" fill="url(#cDot)" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-black tracking-tight text-white">CYLO</p>
                <p className="text-[10px] text-white/30">Cylux Platform</p>
              </div>
            </>
          ) : loja ? (
            <>
              {loja.logo_url ? (
                <img
                  src={loja.logo_url} alt={loja.nome}
                  className="w-7 h-7 rounded-lg object-cover flex-shrink-0"
                />
              ) : (
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                  style={{ backgroundColor: loja.cor_primaria }}
                >
                  {getLojaIniciais(loja.nome)}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-bold text-white truncate">{loja.nome}</p>
                {loja.status_saas && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <span
                      className="text-[10px] font-semibold"
                      style={{ color: saasColor[loja.status_saas] ?? '#8890b0' }}
                    >
                      {loja.status_saas === 'trial' ? 'Trial' : loja.status_saas === 'ativo' ? 'Ativo' : loja.status_saas}
                    </span>
                    {dv !== null && (
                      <span className="text-[9px] text-white/25">· {dv}d</span>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-2.5 overflow-y-auto space-y-px">
        {items.map((item) => {
          if (item.section) {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <div key={item.href}>
                <p className="px-3 pt-3 pb-1 text-[9px] font-bold uppercase tracking-widest text-white/20">
                  {item.section}
                </p>
                <Link
                  href={item.href}
                  className={[
                    'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors',
                    active
                      ? 'text-white font-semibold'
                      : 'text-white/45 hover:text-white/80 hover:bg-white/5',
                  ].join(' ')}
                  style={active ? { background: 'rgba(79,126,255,.15)', borderLeft: '2px solid #4f7eff', paddingLeft: '10px' } : {}}
                >
                  <span className="flex-shrink-0 opacity-70">
                    <NavIcon name={item.icon} />
                  </span>
                  {item.label}
                </Link>
              </div>
            )
          }
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors',
                active
                  ? 'text-white font-semibold'
                  : 'text-white/45 hover:text-white/80 hover:bg-white/5',
              ].join(' ')}
              style={active ? { background: 'rgba(79,126,255,.15)', borderLeft: '2px solid #4f7eff', paddingLeft: '10px' } : {}}
            >
              <span className="flex-shrink-0 opacity-70">
                <NavIcon name={item.icon} />
              </span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User + Signout */}
      <div className="px-4 py-3 border-t border-white/5 flex items-center gap-2">
        {usuario && (
          <div className="w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center text-[9px] font-bold text-white"
            style={{ background: variant === 'ceo' ? '#4f7eff' : '#4f7eff33' }}>
            {usuario.iniciais ?? usuario.nome.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          {usuario && <p className="text-[10px] text-white/60 truncate">{usuario.nome}</p>}
          <p className="text-[9px] text-white/25">
            {variant === 'ceo' ? 'CEO' : variant === 'loja_admin' ? 'Admin' : 'Vendedor'}
          </p>
        </div>
        <form action="/api/auth/signout" method="POST">
          <button type="submit" className="text-white/25 hover:text-white/60 transition-colors" title="Sair">
            <Icons.LogOut size={13} />
          </button>
        </form>
      </div>
    </aside>
  )
}

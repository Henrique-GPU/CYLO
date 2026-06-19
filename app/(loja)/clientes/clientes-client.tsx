'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Search, Phone, AtSign, ShoppingBag, ChevronRight } from 'lucide-react'

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

interface Cliente {
  id: string
  nome: string
  telefone: string | null
  instagram: string | null
  criado_em: string
  totalGasto: number
  compras: number
  orcamentosAtivos: number
  ultimaAtividade: string | null
}

export default function ClientesClient({
  lojaId, userId, perfil,
}: {
  lojaId: string
  userId: string
  perfil: string
}) {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [busca, setBusca] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()

    let q = supabase
      .from('clientes')
      .select(`id, nome, telefone, instagram, criado_em, vendas(id, data_venda, valor_total, status)`)
      .eq('loja_id', lojaId)
      .order('nome')

    if (perfil === 'vendedor') q = q.eq('vendedor_id', userId)

    const { data, error } = await q
    if (error || !data) { setLoading(false); return }

    const lista: Cliente[] = (data as any[]).map(c => {
      const vendas = c.vendas ?? []
      const convertidas = vendas.filter((v: any) => v.status === 'convertido')
      const orcamentosAtivos = vendas.filter((v: any) => v.status === 'orcamento').length
      const totalGasto = convertidas.reduce((s: number, v: any) => s + (v.valor_total ?? 0), 0)
      const datas = vendas.map((v: any) => v.data_venda).filter(Boolean).sort().reverse()
      return {
        id: c.id,
        nome: c.nome,
        telefone: c.telefone,
        instagram: c.instagram,
        criado_em: c.criado_em,
        totalGasto,
        compras: convertidas.length,
        orcamentosAtivos,
        ultimaAtividade: datas[0] ?? null,
      }
    })

    setClientes(lista)
    setLoading(false)
  }, [lojaId, userId, perfil])

  useEffect(() => { load() }, [load])

  const filtrados = clientes.filter(c =>
    !busca ||
    c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    (c.telefone ?? '').includes(busca) ||
    (c.instagram ?? '').toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div className="p-5 sm:p-8 max-w-6xl" style={{ background: 'var(--app-bg-base)' }}>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg font-medium" style={{ color: 'var(--app-ink-primary)' }}>Clientes</h1>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--app-ink-secondary)' }}>
            {perfil === 'vendedor' ? 'Seus clientes' : 'Todos os clientes da loja'}
          </p>
        </div>
        <span className="text-[11px]" style={{ color: 'var(--app-ink-tertiary)' }}>{filtrados.length} cliente(s)</span>
      </div>

      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--app-ink-tertiary)' }} />
        <input
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="Buscar por nome, telefone ou @..."
          className="w-full rounded-xl pl-8 pr-3 py-2.5 text-sm outline-none transition-colors"
          style={{ background: 'var(--app-bg-surface)', color: 'var(--app-ink-primary)', border: '1px solid transparent' }}
          onFocus={e => e.currentTarget.style.borderColor = '#4f7eff'}
          onBlur={e => e.currentTarget.style.borderColor = 'transparent'}
        />
      </div>

      {loading ? (
        <p className="text-sm py-8 text-center" style={{ color: 'var(--app-ink-tertiary)' }}>Carregando...</p>
      ) : filtrados.length === 0 ? (
        <div className="py-16 text-center">
          <ShoppingBag size={32} className="text-white/10 mx-auto mb-3" />
          <p className="text-sm" style={{ color: 'var(--app-ink-tertiary)' }}>
            {busca ? 'Nenhum cliente encontrado.' : 'Nenhum cliente ainda.'}
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {filtrados.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(i * 0.03, 0.3) }}
            >
              <Link
                href={`/clientes/${c.id}`}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl transition-all group"
                style={{ background: 'var(--app-bg-surface)' }}
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(79,126,255,.15)' }}>
                  <span className="text-sm font-semibold text-[#4f7eff]">
                    {c.nome.charAt(0).toUpperCase()}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--app-ink-primary)' }}>{c.nome}</p>
                    {c.orcamentosAtivos > 0 && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400 font-semibold flex-shrink-0">
                        {c.orcamentosAtivos} orç.
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    {c.telefone && (
                      <span className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--app-ink-tertiary)' }}>
                        <Phone size={9} />{c.telefone}
                      </span>
                    )}
                    {c.instagram && (
                      <span className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--app-ink-tertiary)' }}>
                        <AtSign size={9} />{c.instagram}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-medium text-[#4f7eff]">{fmt(c.totalGasto)}</p>
                  <p className="text-[10px]" style={{ color: 'var(--app-ink-tertiary)' }}>{c.compras} compra{c.compras !== 1 ? 's' : ''}</p>
                </div>

                <ChevronRight size={14} className="flex-shrink-0 transition-colors" style={{ color: 'var(--app-ink-tertiary)' }} />
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

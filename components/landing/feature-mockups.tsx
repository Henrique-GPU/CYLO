'use client'

import { motion } from 'framer-motion'

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      <div className="absolute -inset-px rounded-[28px] bg-gradient-to-br from-[#4f7eff]/40 via-transparent to-transparent blur-sm" />
      <div className="relative bg-[#0b0d14] border border-white/10 rounded-[28px] p-5 sm:p-7 shadow-2xl shadow-[#4f7eff]/10">
        {children}
      </div>
    </div>
  )
}

export function EstoqueMockup() {
  const items = [
    { modelo: 'iPhone 15 Pro Max', cap: '256GB', imei: '357812093421', status: 'disponivel', preco: 8900 },
    { modelo: 'iPhone 14 Pro', cap: '128GB', imei: '354439871100', status: 'negociacao', preco: 5400 },
    { modelo: 'iPhone 13', cap: '128GB', imei: '351209443821', status: 'disponivel', preco: 3200 },
    { modelo: 'iPhone 15', cap: '256GB', imei: '352290015532', status: 'reservado', preco: 4750 },
  ]
  const statusColor: Record<string, string> = {
    disponivel: 'bg-emerald-500/15 text-emerald-400',
    negociacao: 'bg-blue-500/15 text-blue-400',
    reservado: 'bg-amber-500/15 text-amber-400',
  }
  const statusLabel: Record<string, string> = {
    disponivel: 'disponível',
    negociacao: 'negociação',
    reservado: 'reservado',
  }

  return (
    <Frame>
      <div className="flex items-center justify-between mb-5">
        <p className="text-xs font-bold text-white/40 uppercase tracking-wider">Estoque · 43 aparelhos</p>
        <div className="flex gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
          <div className="w-2 h-2 rounded-full bg-white/15" />
          <div className="w-2 h-2 rounded-full bg-white/15" />
        </div>
      </div>
      <div className="space-y-2">
        {items.map((d, i) => (
          <motion.div
            key={d.imei}
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
            className="bg-white/[0.04] border border-white/8 rounded-xl p-3.5 flex items-center gap-3"
          >
            <div className="w-9 h-9 rounded-lg bg-[#4f7eff]/15 flex items-center justify-center flex-shrink-0 text-base">📱</div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-white truncate">{d.modelo} {d.cap}</p>
              <p className="text-[11px] text-white/30 font-mono">IMEI {d.imei}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-[13px] font-mono font-bold text-white">R$ {d.preco.toLocaleString('pt-BR')}</p>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColor[d.status]}`}>
                {statusLabel[d.status]}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </Frame>
  )
}

export function VendaMockup() {
  return (
    <Frame>
      <p className="text-xs font-bold text-white/40 uppercase tracking-wider mb-5">Nova venda</p>
      <div className="space-y-3">
        <div className="bg-white/[0.04] border border-white/8 rounded-xl p-4">
          <p className="text-[11px] text-white/30 uppercase tracking-wider mb-2.5">Aparelho vendido</p>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#4f7eff]/15 flex items-center justify-center text-base">📱</div>
            <div>
              <p className="text-[13px] font-semibold text-white">iPhone 15 Pro · 256GB · Titânio</p>
              <p className="text-[11px] text-white/30 font-mono">IMEI 357812093421</p>
            </div>
            <p className="ml-auto text-sm font-mono font-bold text-white">R$ 8.900</p>
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15 }}
          className="bg-amber-500/[0.08] border border-amber-500/20 rounded-xl p-4 flex items-center justify-between"
        >
          <div>
            <p className="text-[11px] text-amber-400/70 uppercase tracking-wider mb-1">Troca recebida</p>
            <p className="text-[13px] font-semibold text-white">iPhone 13 · 128GB · bateria 81%</p>
          </div>
          <p className="text-sm font-mono font-bold text-amber-400">− R$ 2.200</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="bg-emerald-500/[0.08] border border-emerald-500/20 rounded-xl p-4 flex items-center justify-between"
        >
          <div>
            <p className="text-[11px] text-emerald-400/70 uppercase tracking-wider mb-1">Cliente paga · PIX</p>
            <p className="text-2xl font-black text-emerald-400 leading-none">R$ 6.700</p>
          </div>
          <div className="bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-lg">Confirmar</div>
        </motion.div>
      </div>
    </Frame>
  )
}

export function ComissaoMockup() {
  const vendedores = [
    { nome: 'Marcos', iniciais: 'MS', vendas: 14, comissao: 1840 },
    { nome: 'Júlia', iniciais: 'JL', vendas: 11, comissao: 1290 },
    { nome: 'Pedro', iniciais: 'PD', vendas: 8, comissao: 980 },
  ]
  return (
    <Frame>
      <div className="flex items-center justify-between mb-5">
        <p className="text-xs font-bold text-white/40 uppercase tracking-wider">Comissões · este mês</p>
        <p className="text-xs font-mono font-bold text-[#4f7eff]">R$ 4.110 total</p>
      </div>
      <div className="space-y-2.5">
        {vendedores.map((v, i) => (
          <motion.div
            key={v.nome}
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="bg-white/[0.04] border border-white/8 rounded-xl p-3.5 flex items-center gap-3"
          >
            <div className="w-9 h-9 rounded-full bg-[#4f7eff]/20 text-[#7c9bff] font-bold text-xs flex items-center justify-center flex-shrink-0">
              {v.iniciais}
            </div>
            <div className="flex-1">
              <p className="text-[13px] font-semibold text-white">{v.nome}</p>
              <p className="text-[11px] text-white/30">{v.vendas} vendas no mês</p>
            </div>
            <p className="text-sm font-mono font-bold text-emerald-400">R$ {v.comissao.toLocaleString('pt-BR')}</p>
          </motion.div>
        ))}
      </div>
    </Frame>
  )
}

export function RelatoriosMockup() {
  const bars = [40, 65, 50, 80, 60, 95, 72]
  return (
    <Frame>
      <p className="text-xs font-bold text-white/40 uppercase tracking-wider mb-5">Faturamento · últimos 7 dias</p>
      <div className="flex items-end gap-2.5 h-32 mb-6">
        {bars.map((h, i) => (
          <motion.div
            key={i}
            initial={{ height: 0 }}
            whileInView={{ height: `${h}%` }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.07, duration: 0.5, ease: 'easeOut' }}
            className="flex-1 rounded-t-md bg-gradient-to-t from-[#4f7eff]/30 to-[#4f7eff]"
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {[
          { icon: '📦', label: 'Estoque completo', cor: '#4f7eff' },
          { icon: '💰', label: 'DRE mensal', cor: '#34d399' },
          { icon: '🧾', label: 'Recibo de venda', cor: '#fbbf24' },
          { icon: '📋', label: 'Orçamento', cor: '#a78bfa' },
        ].map(item => (
          <div key={item.label} className="bg-white/[0.04] border border-white/8 rounded-xl p-3 flex items-center gap-2">
            <span className="text-sm">{item.icon}</span>
            <p className="text-[11px] font-medium text-white/70 leading-tight">{item.label}</p>
          </div>
        ))}
      </div>
    </Frame>
  )
}

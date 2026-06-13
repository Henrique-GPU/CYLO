'use client'

import { useState, useEffect } from 'react'

const TABS = ['Dashboard', 'Estoque', 'Nova Venda', 'Relatórios'] as const
type Tab = typeof TABS[number]

function DashboardDemo() {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
          <p className="text-[9px] text-emerald-400/60 uppercase tracking-wider mb-1">Faturamento</p>
          <p className="text-lg font-black text-emerald-400 leading-none">R$ 87.400</p>
          <p className="text-[9px] text-emerald-400/50 mt-1">▲ 24% vs mês ant.</p>
        </div>
        <div className="bg-white/5 border border-white/8 rounded-xl p-3">
          <p className="text-[9px] text-white/30 uppercase tracking-wider mb-1">Ticket Médio</p>
          <p className="text-lg font-black text-white leading-none">R$ 3.190</p>
          <p className="text-[9px] text-white/30 mt-1">27 vendas</p>
        </div>
        <div className="bg-white/5 border border-white/8 rounded-xl p-3">
          <p className="text-[9px] text-white/30 uppercase tracking-wider mb-1">Em Estoque</p>
          <p className="text-lg font-black text-white leading-none">43</p>
          <p className="text-[9px] text-white/30 mt-1">aparelhos</p>
        </div>
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
          <p className="text-[9px] text-yellow-400/60 uppercase tracking-wider mb-1">Comissões</p>
          <p className="text-lg font-black text-yellow-400 leading-none">R$ 2.622</p>
          <p className="text-[9px] text-yellow-400/50 mt-1">3 vendedores</p>
        </div>
      </div>
      <div className="bg-white/3 border border-white/8 rounded-xl p-3">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[9px] text-white/30 uppercase tracking-wider">Meta Mensal</p>
          <p className="text-[9px] text-[#4f7eff]">72%</p>
        </div>
        <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-[#4f7eff]" style={{ width: '72%' }} />
        </div>
        <p className="text-[9px] text-white/20 mt-1.5">R$ 87.400 de R$ 120.000</p>
      </div>
    </div>
  )
}

function EstoqueDemo() {
  const items = [
    { modelo: 'iPhone 15 Pro Max', cap: '256GB', imei: '357812093421', status: 'disponivel', preco: 8900, dias: 5 },
    { modelo: 'iPhone 14 Pro', cap: '128GB', imei: '354439871100', status: 'negociacao', preco: 5400, dias: 12 },
    { modelo: 'iPhone 13', cap: '128GB', imei: '351209443821', status: 'disponivel', preco: 3200, dias: 28 },
  ]
  return (
    <div className="space-y-1.5">
      {items.map((d, i) => (
        <div key={i} className="bg-white/5 border border-white/8 rounded-xl p-2.5 flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-[#4f7eff]/15 flex items-center justify-center flex-shrink-0">
            <span className="text-[11px]">📱</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold text-white truncate">{d.modelo} {d.cap}</p>
            <p className="text-[9px] text-white/25 font-mono">IMEI: {d.imei}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-[10px] font-mono font-bold text-white">R$ {d.preco.toLocaleString('pt-BR')}</p>
            <span className={`text-[8px] px-1.5 py-0.5 rounded font-medium ${
              d.status === 'disponivel' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-blue-500/15 text-blue-400'
            }`}>
              {d.status === 'disponivel' ? 'disponível' : 'negociação'}
            </span>
          </div>
        </div>
      ))}
      <div className="flex gap-2 pt-0.5">
        <div className="flex-1 bg-white/3 border border-white/8 rounded-xl p-2 text-center">
          <p className="text-[9px] text-white/25">Novos</p>
          <p className="text-sm font-black text-white">18</p>
        </div>
        <div className="flex-1 bg-white/3 border border-white/8 rounded-xl p-2 text-center">
          <p className="text-[9px] text-white/25">Usados</p>
          <p className="text-sm font-black text-white">25</p>
        </div>
        <div className="flex-1 bg-white/3 border border-white/8 rounded-xl p-2 text-center">
          <p className="text-[9px] text-white/25">Investido</p>
          <p className="text-[11px] font-black text-[#4f7eff]">R$ 142k</p>
        </div>
      </div>
    </div>
  )
}

function VendaDemo() {
  return (
    <div className="space-y-2">
      <div className="bg-white/5 border border-white/8 rounded-xl p-3">
        <p className="text-[9px] text-white/30 uppercase tracking-wider mb-2">Aparelho vendido</p>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#4f7eff]/15 flex items-center justify-center">
            <span className="text-[11px]">📱</span>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-white">iPhone 15 Pro · 256GB · Titânio</p>
            <p className="text-[9px] text-white/30 font-mono">IMEI: 357812093421</p>
          </div>
          <p className="ml-auto text-[11px] font-mono font-bold text-white">R$ 8.900</p>
        </div>
      </div>
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
        <p className="text-[9px] text-amber-400/60 uppercase tracking-wider mb-2">Troca recebida</p>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold text-white">iPhone 13 · 128GB</p>
            <p className="text-[9px] text-white/30">Estado: Bom · bateria 81%</p>
          </div>
          <p className="text-[11px] font-mono font-bold text-amber-400">− R$ 2.200</p>
        </div>
      </div>
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-center justify-between">
        <div>
          <p className="text-[9px] text-emerald-400/60 uppercase tracking-wider">Cliente paga</p>
          <p className="text-xl font-black text-emerald-400 leading-none mt-0.5">R$ 6.700</p>
        </div>
        <div className="text-right">
          <p className="text-[9px] text-white/30 mb-1">PIX</p>
          <div className="bg-emerald-500 text-white text-[9px] font-bold px-3 py-1.5 rounded-lg">
            Confirmar Venda
          </div>
        </div>
      </div>
    </div>
  )
}

function RelatoriosDemo() {
  const items = [
    { icon: '📦', label: 'Estoque Completo', sub: 'PDF com IMEI, custo e status', cor: '#4f7eff' },
    { icon: '💰', label: 'DRE Mensal', sub: 'Receitas, custos e margem', cor: '#34d399' },
    { icon: '🧾', label: 'Recibo de Venda', sub: 'Para o cliente com garantia', cor: '#fbbf24' },
    { icon: '📋', label: 'Orçamento', sub: 'Proposta antes de fechar', cor: '#a78bfa' },
  ]
  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map(item => (
        <div key={item.label} className="bg-white/5 border border-white/8 rounded-xl p-3 hover:bg-white/8 transition-colors cursor-default">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-[13px]">{item.icon}</span>
            <div className="w-1 h-1 rounded-full" style={{ background: item.cor }} />
          </div>
          <p className="text-[10px] font-semibold text-white leading-tight">{item.label}</p>
          <p className="text-[8px] text-white/30 mt-0.5 leading-tight">{item.sub}</p>
          <div className="mt-2 flex items-center gap-1">
            <div className="h-0.5 flex-1 rounded-full" style={{ background: item.cor + '40' }} />
            <span className="text-[8px] font-semibold" style={{ color: item.cor }}>PDF</span>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function MockupAnimado() {
  const [tab, setTab] = useState<Tab>('Dashboard')

  useEffect(() => {
    const order: Tab[] = ['Dashboard', 'Estoque', 'Nova Venda', 'Relatórios']
    const t = setInterval(() => {
      setTab(cur => order[(order.indexOf(cur) + 1) % order.length])
    }, 4500)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="w-full h-full flex flex-col max-w-sm">

      {/* Brand */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-5">
          <img src="/cylo-logo.svg" alt="Cylo" className="w-11 h-11 flex-shrink-0" />
          <span className="text-white font-black text-2xl tracking-tight">CYLO</span>
        </div>
        <p className="text-[26px] font-black text-white leading-snug mb-3">
          A plataforma que<br />lojas de iPhone<br />sérias usam.
        </p>
        <p className="text-sm text-white/40 leading-relaxed mb-5">
          Vendas, estoque por IMEI, trocas, comissões e relatórios — white-label para cada loja.
        </p>
        {/* Social proof */}
        <div className="flex items-center gap-4">
          <div>
            <p className="text-base font-black text-white leading-none">10+</p>
            <p className="text-[9px] text-white/30 uppercase tracking-wider mt-0.5">Lojas ativas</p>
          </div>
          <div className="w-px h-7 bg-white/10" />
          <div>
            <p className="text-base font-black text-white leading-none">R$ 300k</p>
            <p className="text-[9px] text-white/30 uppercase tracking-wider mt-0.5">Gerenciados</p>
          </div>
          <div className="w-px h-7 bg-white/10" />
          <div>
            <p className="text-base font-black text-[#4f7eff] leading-none">White Label</p>
            <p className="text-[9px] text-white/30 uppercase tracking-wider mt-0.5">Por loja</p>
          </div>
        </div>
      </div>

      {/* Demo card */}
      <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col min-h-0">
        {/* Tabs */}
        <div className="flex gap-1 mb-4 flex-shrink-0">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all ${
                tab === t
                  ? 'bg-[#4f7eff] text-white'
                  : 'text-white/25 hover:text-white/50'
              }`}>
              {t === 'Nova Venda' ? 'Venda' : t}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <div key={tab} className="animate-in fade-in duration-300">
            {tab === 'Dashboard' && <DashboardDemo />}
            {tab === 'Estoque' && <EstoqueDemo />}
            {tab === 'Nova Venda' && <VendaDemo />}
            {tab === 'Relatórios' && <RelatoriosDemo />}
          </div>
        </div>
      </div>

      {/* Trust signals */}
      <div className="mt-6 flex items-center gap-5">
        {[
          { cor: '#34d399', txt: 'Multi-loja' },
          { cor: '#4f7eff', txt: 'White Label' },
          { cor: '#a78bfa', txt: 'IMEI por unidade' },
        ].map(({ cor, txt }) => (
          <div key={txt} className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: cor }} />
            <span className="text-[10px] text-white/30">{txt}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

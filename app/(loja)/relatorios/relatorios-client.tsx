'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { fmt } from '@/lib/utils/format'
import { FileBarChart, Printer, Package, TrendingUp } from 'lucide-react'

interface Loja {
  nome: string
  logo_url: string | null
  cor_primaria: string
  whatsapp: string | null
  instagram: string | null
  endereco: string | null
}

interface Props {
  lojaId: string
  userId: string
  perfil: string
  nomeUsuario: string
  loja: Loja
  vendedores: { id: string; nome: string }[]
}

type Tab = 'vendas' | 'estoque' | 'financeiro'

function hoje() { return new Date().toISOString().split('T')[0] }
function inicioMes() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0]
}
function fdBR(s: string) {
  const [y, m, d] = s.split('-')
  return `${d}/${m}/${y}`
}

function buildDocHtml(title: string, loja: Loja, body: string, geradoPor: string) {
  const cor = loja.cor_primaria || '#4f7eff'
  const lojaIni = (loja.nome || '').slice(0, 2).toUpperCase()
  const agora = new Date().toLocaleString('pt-BR')
  return `<!DOCTYPE html><html lang="pt-BR"><head>
<meta charset="UTF-8"/>
<title>${title} — ${loja.nome}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:system-ui,sans-serif;color:#1a1a2e;background:white;padding:28px;max-width:900px;margin:0 auto;font-size:12px}
  .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;padding-bottom:14px;border-bottom:2px solid ${cor}}
  .logo-box{display:flex;align-items:center;gap:10px}
  .logo-ini{width:44px;height:44px;border-radius:10px;background:${cor};color:white;font-size:15px;font-weight:900;display:flex;align-items:center;justify-content:center}
  .logo-nome{font-size:16px;font-weight:900}
  .doc-tipo{font-size:19px;font-weight:900;color:${cor};text-align:right}
  .doc-data{font-size:10px;color:#777;text-align:right;margin-top:2px}
  .section{margin-bottom:16px}
  .section-title{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#888;margin-bottom:6px;border-bottom:1px solid #eee;padding-bottom:3px}
  table{width:100%;border-collapse:collapse}
  th{text-align:left;padding:5px 7px;background:#f5f5f5;font-size:9px;text-transform:uppercase;letter-spacing:.04em;color:#555;white-space:nowrap}
  td{padding:5px 7px;border-bottom:1px solid #eee;font-size:11px}
  tr:last-child td{border-bottom:none}
  .num{text-align:right;font-variant-numeric:tabular-nums}
  .bold{font-weight:700}
  .green{color:#059669}
  .red{color:#dc2626}
  .blue{color:${cor}}
  .gray{color:#888}
  .kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:16px}
  .kpi{border:1px solid #eee;border-radius:8px;padding:10px 12px;background:#fafafa}
  .kpi-label{font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:.04em;color:#888;margin-bottom:4px}
  .kpi-value{font-size:18px;font-weight:900;color:${cor}}
  .kpi-sub{font-size:9px;color:#aaa;margin-top:2px}
  .badge{display:inline-block;padding:1px 6px;border-radius:4px;font-size:9px;font-weight:700}
  .badge-novo{background:#dbeafe;color:#1d4ed8}
  .badge-usado{background:#fef3c7;color:#b45309}
  .footer{margin-top:24px;padding-top:10px;border-top:1px solid #eee;font-size:8px;color:#bbb;text-transform:uppercase;letter-spacing:.06em;text-align:center}
  @media print{body{padding:14px}@page{margin:12mm}}
</style></head><body>
<div class="header">
  <div class="logo-box">
    ${loja.logo_url
      ? `<img src="${loja.logo_url}" style="width:44px;height:44px;border-radius:10px;object-fit:contain" alt="logo"/>`
      : `<div class="logo-ini">${lojaIni}</div>`}
    <div>
      <div class="logo-nome">${loja.nome}</div>
      ${loja.endereco ? `<div style="font-size:10px;color:#888">${loja.endereco}</div>` : ''}
      ${loja.whatsapp ? `<div style="font-size:10px;color:#888">WhatsApp: ${loja.whatsapp}</div>` : ''}
    </div>
  </div>
  <div>
    <div class="doc-tipo">${title}</div>
    <div class="doc-data">Gerado em: ${agora}</div>
    <div class="doc-data">Por: ${geradoPor}</div>
  </div>
</div>
${body}
<div class="footer">Gerado pelo CYLO · ${loja.nome}</div>
</body></html>`
}

function abrirJanela(html: string) {
  const win = window.open('', '_blank', 'width=960,height=900')
  if (!win) return
  win.document.write(html)
  win.document.close()
  win.focus()
  setTimeout(() => win.print(), 600)
}

export default function RelatoriosClient({ lojaId, userId, perfil, nomeUsuario, loja, vendedores }: Props) {
  const isAdmin = perfil === 'loja_admin'
  const [tab, setTab] = useState<Tab>('vendas')
  const [loading, setLoading] = useState(false)

  // Vendas state
  const [vDataDe, setVDataDe] = useState(inicioMes())
  const [vDataAte, setVDataAte] = useState(hoje())
  const [vVendedor, setVVendedor] = useState('todos')

  // Estoque state
  const [eTipo, setETipo] = useState('todos')

  // Financeiro state (admin)
  const [fMes, setFMes] = useState(hoje().slice(0, 7))

  // ── Gerar relatório de vendas ────────────────────────────────
  async function gerarVendas() {
    setLoading(true)
    const supabase = createClient()

    let q = supabase.from('vendas')
      .select('*, aparelhos(modelo, capacidade, cor), venda_acessorios(nome, preco_unitario, quantidade)')
      .eq('loja_id', lojaId)
      .eq('status', 'convertido')
      .gte('data_venda', vDataDe)
      .lte('data_venda', vDataAte)
      .order('data_venda', { ascending: false })

    if (!isAdmin) {
      q = q.eq('vendedor_id', userId)
    } else if (vVendedor !== 'todos') {
      q = q.eq('vendedor_id', vVendedor)
    }

    const { data: vendas } = await q
    setLoading(false)

    if (!vendas || vendas.length === 0) {
      alert('Nenhuma venda encontrada no período.')
      return
    }

    const fat = vendas.reduce((s: number, v: any) => s + (v.valor_total ?? 0), 0)
    const lucro = vendas.reduce((s: number, v: any) => s + (v.lucro ?? 0), 0)
    const com = vendas.reduce((s: number, v: any) => s + (v.comissao ?? 0), 0)
    const trocas = vendas.filter((v: any) => v.com_troca).length
    const periodo = `${fdBR(vDataDe)} a ${fdBR(vDataAte)}`

    const kpiHtml = isAdmin ? `
<div class="kpi-grid">
  <div class="kpi"><div class="kpi-label">Faturamento</div><div class="kpi-value">${fmt(fat)}</div><div class="kpi-sub">${vendas.length} venda(s)</div></div>
  <div class="kpi"><div class="kpi-label">Lucro Estimado</div><div class="kpi-value" style="color:#059669">${fmt(lucro)}</div><div class="kpi-sub">Margem: ${fat > 0 ? (lucro / fat * 100).toFixed(1) : 0}%</div></div>
  <div class="kpi"><div class="kpi-label">Comissões</div><div class="kpi-value" style="color:#d97706">${fmt(com)}</div><div class="kpi-sub">Total pago</div></div>
  <div class="kpi"><div class="kpi-label">Trocas</div><div class="kpi-value" style="color:#7c3aed">${trocas}</div><div class="kpi-sub">Aparelhos recebidos</div></div>
</div>` : `
<div class="kpi-grid" style="grid-template-columns:repeat(2,1fr)">
  <div class="kpi"><div class="kpi-label">Vendas Realizadas</div><div class="kpi-value">${vendas.length}</div></div>
  <div class="kpi"><div class="kpi-label">Total Vendido</div><div class="kpi-value">${fmt(fat)}</div></div>
</div>`

    const cols = isAdmin
      ? ['Data', 'Cliente', 'Produto', 'Valor', 'Desconto Troca', 'Lucro', 'Comissão', 'Vendedor']
      : ['Data', 'Cliente', 'Produto', 'Valor', 'Troca', 'Pagamento']

    const rows = vendas.map((v: any) => {
      const ap = v.aparelhos
      const nomeProd = ap ? [ap.modelo, ap.capacidade, ap.cor].filter(Boolean).join(' ') : '–'
      const pgtoParts = [
        v.pgto_pix > 0 ? `PIX ${fmt(v.pgto_pix)}` : '',
        v.pgto_dinheiro > 0 ? `Din. ${fmt(v.pgto_dinheiro)}` : '',
        v.pgto_debito > 0 ? `Déb. ${fmt(v.pgto_debito)}` : '',
        v.pgto_credito > 0 ? `Créd. ${fmt(v.pgto_credito)}` : '',
        v.pgto_transferencia > 0 ? `Transf. ${fmt(v.pgto_transferencia)}` : '',
      ].filter(Boolean).join(', ')
      const vendNome = vendedores.find(x => x.id === v.vendedor_id)?.nome ?? '–'

      if (isAdmin) {
        return `<tr>
          <td class="gray">${fdBR(v.data_venda ?? '')}</td>
          <td class="bold">${v.cliente_nome}</td>
          <td>${nomeProd}</td>
          <td class="num blue bold">${fmt(v.valor_total)}</td>
          <td class="num green">${v.com_troca ? `− ${fmt(v.troca_valor)}` : '–'}</td>
          <td class="num bold" style="color:${(v.lucro ?? 0) >= 0 ? '#059669' : '#dc2626'}">${fmt(v.lucro ?? 0)}</td>
          <td class="num" style="color:#d97706">${fmt(v.comissao ?? 0)}</td>
          <td class="gray">${vendNome}</td>
        </tr>`
      } else {
        return `<tr>
          <td class="gray">${fdBR(v.data_venda ?? '')}</td>
          <td class="bold">${v.cliente_nome}</td>
          <td>${nomeProd}</td>
          <td class="num blue bold">${fmt(v.valor_total)}</td>
          <td class="num green">${v.com_troca ? `− ${fmt(v.troca_valor)}` : '–'}</td>
          <td class="gray" style="font-size:10px">${pgtoParts || '–'}</td>
        </tr>`
      }
    }).join('')

    const totalRow = isAdmin
      ? `<tr style="background:#f5f5f5;font-weight:700">
          <td colspan="3">TOTAL (${vendas.length} venda(s))</td>
          <td class="num blue">${fmt(fat)}</td>
          <td></td>
          <td class="num green">${fmt(lucro)}</td>
          <td class="num" style="color:#d97706">${fmt(com)}</td>
          <td></td>
        </tr>`
      : `<tr style="background:#f5f5f5;font-weight:700">
          <td colspan="3">TOTAL</td>
          <td class="num blue">${fmt(fat)}</td>
          <td></td><td></td>
        </tr>`

    const tabelaHtml = `
<div class="section">
  <div class="section-title">Vendas — Período: ${periodo}</div>
  <table>
    <thead><tr>${cols.map(c => `<th>${c}</th>`).join('')}</tr></thead>
    <tbody>${rows}${totalRow}</tbody>
  </table>
</div>`

    const html = buildDocHtml(
      isAdmin ? 'RELATÓRIO DE VENDAS' : 'MINHAS VENDAS',
      loja,
      kpiHtml + tabelaHtml,
      nomeUsuario
    )
    abrirJanela(html)
  }

  // ── Gerar relatório de estoque ───────────────────────────────
  async function gerarEstoque() {
    setLoading(true)
    const supabase = createClient()

    let q = supabase.from('aparelhos')
      .select('modelo, capacidade, cor, tipo, status, preco, custo, bateria_pct, imei, data_entrada, estado, observacoes')
      .eq('loja_id', lojaId)
      .neq('status', 'vendido')
      .order('tipo').order('modelo')

    if (eTipo !== 'todos') q = q.eq('tipo', eTipo)

    const { data: aparelhos } = await q
    setLoading(false)

    if (!aparelhos || aparelhos.length === 0) {
      alert('Nenhum aparelho no estoque.')
      return
    }

    const disps = aparelhos.filter((a: any) => a.status === 'disponivel' || a.status === 'negociacao')
    const totalPreco = disps.reduce((s: number, a: any) => s + (a.preco ?? 0), 0)
    const totalCusto = disps.reduce((s: number, a: any) => s + (a.custo ?? 0), 0)
    const novos = disps.filter((a: any) => a.tipo === 'novo')
    const usados = disps.filter((a: any) => a.tipo === 'usado')

    const kpiHtml = isAdmin ? `
<div class="kpi-grid">
  <div class="kpi"><div class="kpi-label">Total Disponível</div><div class="kpi-value">${disps.length}</div></div>
  <div class="kpi"><div class="kpi-label">Novos / Usados</div><div class="kpi-value">${novos.length} / ${usados.length}</div></div>
  <div class="kpi"><div class="kpi-label">Valor em Estoque</div><div class="kpi-value">${fmt(totalPreco)}</div><div class="kpi-sub">Preço de venda</div></div>
  <div class="kpi"><div class="kpi-label">Custo Investido</div><div class="kpi-value" style="color:#dc2626">${fmt(totalCusto)}</div><div class="kpi-sub">Margem pot.: ${totalPreco > 0 ? ((totalPreco - totalCusto) / totalPreco * 100).toFixed(0) : 0}%</div></div>
</div>` : `
<div class="kpi-grid" style="grid-template-columns:repeat(3,1fr)">
  <div class="kpi"><div class="kpi-label">Total</div><div class="kpi-value">${disps.length}</div></div>
  <div class="kpi"><div class="kpi-label">Novos</div><div class="kpi-value">${novos.length}</div></div>
  <div class="kpi"><div class="kpi-label">Usados</div><div class="kpi-value">${usados.length}</div></div>
</div>`

    const adminCols = ['Modelo', 'Cap.', 'Cor', 'Tipo', 'Estado', 'IMEI', 'Bateria', 'Custo', 'Preço', 'Status', 'Entrada']
    const vendCols = ['Modelo', 'Cap.', 'Cor', 'Tipo', 'Estado', 'Bateria', 'Preço', 'Status']

    const rows = aparelhos.map((a: any) => {
      const tipoTag = a.tipo === 'novo'
        ? `<span class="badge badge-novo">Lacrado</span>`
        : `<span class="badge badge-usado">Usado</span>`
      const statusColor = a.status === 'disponivel' ? '#059669' : a.status === 'negociacao' ? '#d97706' : '#888'

      if (isAdmin) {
        return `<tr>
          <td class="bold">${a.modelo}</td>
          <td class="gray">${a.capacidade ?? '–'}</td>
          <td class="gray">${a.cor ?? '–'}</td>
          <td>${tipoTag}</td>
          <td class="gray">${a.estado ?? '–'}</td>
          <td class="gray" style="font-size:9px;font-family:monospace">${a.imei ?? '–'}</td>
          <td class="num gray">${a.bateria_pct ? `${a.bateria_pct}%` : '–'}</td>
          <td class="num red">${fmt(a.custo ?? 0)}</td>
          <td class="num blue bold">${fmt(a.preco ?? 0)}</td>
          <td style="color:${statusColor};font-weight:600;font-size:10px">${a.status}</td>
          <td class="gray" style="font-size:10px">${a.data_entrada ? fdBR(a.data_entrada) : '–'}</td>
        </tr>`
      } else {
        return `<tr>
          <td class="bold">${a.modelo}</td>
          <td class="gray">${a.capacidade ?? '–'}</td>
          <td class="gray">${a.cor ?? '–'}</td>
          <td>${tipoTag}</td>
          <td class="gray">${a.estado ?? '–'}</td>
          <td class="num gray">${a.bateria_pct ? `${a.bateria_pct}%` : '–'}</td>
          <td class="num blue bold">${fmt(a.preco ?? 0)}</td>
          <td style="color:${statusColor};font-weight:600;font-size:10px">${a.status}</td>
        </tr>`
      }
    }).join('')

    const totalRow = isAdmin
      ? `<tr style="background:#f5f5f5;font-weight:700">
          <td colspan="7">TOTAL (${disps.length} disponíveis)</td>
          <td class="num red">${fmt(totalCusto)}</td>
          <td class="num blue">${fmt(totalPreco)}</td>
          <td colspan="2"></td>
        </tr>`
      : `<tr style="background:#f5f5f5;font-weight:700">
          <td colspan="6">TOTAL</td>
          <td class="num blue">${fmt(totalPreco)}</td>
          <td></td>
        </tr>`

    const cols = isAdmin ? adminCols : vendCols

    const tabelaHtml = `
<div class="section">
  <div class="section-title">Estoque — Gerado em ${new Date().toLocaleDateString('pt-BR')}</div>
  <table>
    <thead><tr>${cols.map(c => `<th>${c}</th>`).join('')}</tr></thead>
    <tbody>${rows}${totalRow}</tbody>
  </table>
</div>`

    const html = buildDocHtml(
      'RELATÓRIO DE ESTOQUE',
      loja,
      kpiHtml + tabelaHtml,
      nomeUsuario
    )
    abrirJanela(html)
  }

  // ── Gerar relatório financeiro (admin only) ──────────────────
  async function gerarFinanceiro() {
    setLoading(true)
    const supabase = createClient()

    const [ano, mes] = fMes.split('-')
    const de = `${fMes}-01`
    const ate = new Date(parseInt(ano), parseInt(mes), 0).toISOString().split('T')[0]

    const { data: vendas } = await supabase.from('vendas')
      .select('*, aparelhos(modelo, capacidade)')
      .eq('loja_id', lojaId)
      .eq('status', 'convertido')
      .gte('data_venda', de)
      .lte('data_venda', ate)
      .order('data_venda')

    setLoading(false)

    if (!vendas) { alert('Erro ao carregar dados.'); return }

    const fat = vendas.reduce((s: number, v: any) => s + (v.valor_total ?? 0), 0)
    const lucro = vendas.reduce((s: number, v: any) => s + (v.lucro ?? 0), 0)
    const com = vendas.reduce((s: number, v: any) => s + (v.comissao ?? 0), 0)
    const trocas = vendas.filter((v: any) => v.com_troca)
    const somaTrocas = trocas.reduce((s: number, v: any) => s + (v.troca_valor ?? 0), 0)
    const entradaCaixa = fat - com
    const mg = fat > 0 ? (lucro / fat * 100).toFixed(1) : '0'
    const nomeMes = new Date(parseInt(ano), parseInt(mes) - 1, 1).toLocaleString('pt-BR', { month: 'long', year: 'numeric' })

    // Por vendedor
    const byVend: Record<string, { nome: string; fat: number; qtd: number; com: number }> = {}
    vendas.forEach((v: any) => {
      const id = v.vendedor_id
      const nome = vendedores.find(x => x.id === id)?.nome ?? 'Desconhecido'
      if (!byVend[id]) byVend[id] = { nome, fat: 0, qtd: 0, com: 0 }
      byVend[id].fat += v.valor_total ?? 0
      byVend[id].qtd += 1
      byVend[id].com += v.comissao ?? 0
    })

    const kpiHtml = `
<div class="kpi-grid">
  <div class="kpi"><div class="kpi-label">Faturamento</div><div class="kpi-value">${fmt(fat)}</div><div class="kpi-sub">${vendas.length} venda(s)</div></div>
  <div class="kpi"><div class="kpi-label">Lucro Líquido</div><div class="kpi-value" style="color:#059669">${fmt(lucro)}</div><div class="kpi-sub">Margem: ${mg}%</div></div>
  <div class="kpi"><div class="kpi-label">Entrada Caixa</div><div class="kpi-value" style="color:#4f7eff">${fmt(entradaCaixa)}</div><div class="kpi-sub">Após comissões</div></div>
  <div class="kpi"><div class="kpi-label">Comissões</div><div class="kpi-value" style="color:#d97706">${fmt(com)}</div><div class="kpi-sub">Total</div></div>
</div>`

    const vendRow = Object.values(byVend)
      .sort((a, b) => b.fat - a.fat)
      .map(v => `<tr>
        <td class="bold">${v.nome}</td>
        <td class="num">${v.qtd}</td>
        <td class="num blue bold">${fmt(v.fat)}</td>
        <td class="num" style="color:#d97706">${fmt(v.com)}</td>
        <td class="num green">${fmt(v.fat - v.com)}</td>
      </tr>`).join('')

    const vendSection = Object.keys(byVend).length > 0 ? `
<div class="section">
  <div class="section-title">Por Vendedor</div>
  <table>
    <thead><tr><th>Vendedor</th><th>Vendas</th><th>Faturamento</th><th>Comissão</th><th>Entrada Líq.</th></tr></thead>
    <tbody>${vendRow}</tbody>
  </table>
</div>` : ''

    const trocasSection = trocas.length > 0 ? `
<div class="section">
  <div class="section-title">Trocas Recebidas (${trocas.length}) — Total: ${fmt(somaTrocas)}</div>
  <table>
    <thead><tr><th>Data</th><th>Cliente</th><th>Aparelho Recebido</th><th>Estado</th><th class="num">Valor Troca</th></tr></thead>
    <tbody>${trocas.map((v: any) => `<tr>
      <td class="gray">${fdBR(v.data_venda ?? '')}</td>
      <td class="bold">${v.cliente_nome}</td>
      <td>${v.troca_modelo ?? '–'}</td>
      <td class="gray">${v.troca_estado ?? '–'}</td>
      <td class="num green">${fmt(v.troca_valor ?? 0)}</td>
    </tr>`).join('')}</tbody>
  </table>
</div>` : ''

    const resumoSection = `
<div class="section">
  <div class="section-title">Resumo Financeiro — ${nomeMes}</div>
  <table>
    <tbody>
      <tr><td class="bold">Faturamento Total</td><td class="num blue bold">${fmt(fat)}</td></tr>
      <tr><td>(−) Comissões Pagas</td><td class="num red">− ${fmt(com)}</td></tr>
      <tr><td>(−) Custo Mercadoria Vendida</td><td class="num red">− ${fmt(fat - lucro - com)}</td></tr>
      <tr style="background:#f0fdf4"><td class="bold">= Lucro Líquido</td><td class="num green bold">${fmt(lucro)}</td></tr>
      <tr><td class="gray" style="font-size:10px">Margem Líquida</td><td class="num gray">${mg}%</td></tr>
    </tbody>
  </table>
</div>`

    const html = buildDocHtml(
      `RELATÓRIO FINANCEIRO — ${nomeMes.toUpperCase()}`,
      loja,
      kpiHtml + resumoSection + vendSection + trocasSection,
      nomeUsuario
    )
    abrirJanela(html)
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'vendas', label: 'Vendas', icon: <TrendingUp size={15} /> },
    { id: 'estoque', label: 'Estoque', icon: <Package size={15} /> },
    ...(isAdmin ? [{ id: 'financeiro' as Tab, label: 'Financeiro', icon: <FileBarChart size={15} /> }] : []),
  ]

  return (
    <div className="p-5 sm:p-8 max-w-3xl" style={{ background: 'var(--app-bg-base)' }}>
      <div className="mb-6">
        <h1 className="text-xl font-medium" style={{ color: 'var(--app-ink-primary)' }}>Relatórios</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--app-ink-secondary)' }}>Gere relatórios em PDF para impressão ou envio</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 rounded-xl p-1 w-full sm:w-fit overflow-x-auto" style={{ background: 'var(--app-bg-surface)' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-shrink-0 whitespace-nowrap"
            style={tab === t.id
              ? { background: '#4f7eff', color: 'white' }
              : { color: 'var(--app-ink-secondary)' }}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* Panel */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="rounded-2xl p-6 space-y-5"
          style={{ background: 'var(--app-bg-surface)' }}
        >

          {tab === 'vendas' && (
            <>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider mb-3" style={{ color: 'var(--app-ink-tertiary)' }}>
                  {isAdmin ? 'Relatório completo de vendas com lucro, comissões e trocas' : 'Suas vendas no período'}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="lbl-r">Data inicial</label>
                    <input type="date" value={vDataDe} onChange={e => setVDataDe(e.target.value)} className="fld-r" />
                  </div>
                  <div>
                    <label className="lbl-r">Data final</label>
                    <input type="date" value={vDataAte} onChange={e => setVDataAte(e.target.value)} className="fld-r" />
                  </div>
                  {isAdmin && vendedores.length > 0 && (
                    <div className="col-span-2">
                      <label className="lbl-r">Filtrar por vendedor</label>
                      <select value={vVendedor} onChange={e => setVVendedor(e.target.value)} className="fld-r">
                        <option value="todos">Todos os vendedores</option>
                        {vendedores.map(v => <option key={v.id} value={v.id}>{v.nome}</option>)}
                      </select>
                    </div>
                  )}
                </div>
              </div>
              <div className="rounded-xl p-3 text-[11px]" style={{ background: 'rgba(255,255,255,0.03)', color: 'var(--app-ink-secondary)' }}>
                {isAdmin
                  ? '✓ Inclui: faturamento, lucro, margem, comissões por vendedor, trocas recebidas, formas de pagamento'
                  : '✓ Inclui: lista das suas vendas, clientes, produtos, valores e formas de pagamento'}
              </div>
              <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={gerarVendas} disabled={loading}
                className="w-full py-3 bg-[#4f7eff] hover:opacity-90 text-white font-medium rounded-xl flex items-center justify-center gap-2 disabled:opacity-40 transition-opacity">
                <Printer size={16} />{loading ? 'Gerando...' : 'Gerar relatório de vendas'}
              </motion.button>
            </>
          )}

          {tab === 'estoque' && (
            <>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider mb-3" style={{ color: 'var(--app-ink-tertiary)' }}>
                  {isAdmin ? 'Inventário completo com custos e valor investido' : 'Aparelhos disponíveis no estoque'}
                </p>
                <div>
                  <label className="lbl-r">Tipo de aparelho</label>
                  <div className="flex gap-2">
                    {['todos', 'novo', 'usado'].map(t => (
                      <button key={t} onClick={() => setETipo(t)}
                        className="flex-1 py-2 rounded-xl text-sm font-medium border transition-colors capitalize"
                        style={eTipo === t
                          ? { borderColor: '#4f7eff', background: 'rgba(79,126,255,0.15)', color: '#4f7eff' }
                          : { borderColor: 'var(--app-hairline)', color: 'var(--app-ink-secondary)' }}>
                        {t === 'todos' ? 'Todos' : t === 'novo' ? 'Lacrados' : 'Usados'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="rounded-xl p-3 text-[11px]" style={{ background: 'rgba(255,255,255,0.03)', color: 'var(--app-ink-secondary)' }}>
                {isAdmin
                  ? '✓ Inclui: custo de aquisição, preço de venda, margem potencial, IMEI, status de cada aparelho'
                  : '✓ Inclui: modelo, capacidade, cor, estado, bateria, preço e status'}
              </div>
              <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={gerarEstoque} disabled={loading}
                className="w-full py-3 bg-[#4f7eff] hover:opacity-90 text-white font-medium rounded-xl flex items-center justify-center gap-2 disabled:opacity-40 transition-opacity">
                <Printer size={16} />{loading ? 'Gerando...' : 'Gerar relatório de estoque'}
              </motion.button>
            </>
          )}

          {tab === 'financeiro' && isAdmin && (
            <>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider mb-3" style={{ color: 'var(--app-ink-tertiary)' }}>
                  DRE simplificado do mês com ranking de vendedores e trocas
                </p>
                <div>
                  <label className="lbl-r">Mês de referência</label>
                  <input type="month" value={fMes} onChange={e => setFMes(e.target.value)} className="fld-r max-w-xs" />
                </div>
              </div>
              <div className="rounded-xl p-3 text-[11px]" style={{ background: 'rgba(255,255,255,0.03)', color: 'var(--app-ink-secondary)' }}>
                ✓ Inclui: faturamento, lucro líquido, comissões, entrada de caixa, ranking de vendedores, trocas recebidas
              </div>
              <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={gerarFinanceiro} disabled={loading}
                className="w-full py-3 bg-[#4f7eff] hover:opacity-90 text-white font-medium rounded-xl flex items-center justify-center gap-2 disabled:opacity-40 transition-opacity">
                <Printer size={16} />{loading ? 'Gerando...' : 'Gerar relatório financeiro'}
              </motion.button>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      <style jsx global>{`
        .fld-r {
          width: 100%;
          background: rgba(255,255,255,.05);
          border: 1px solid rgba(255,255,255,.1);
          border-radius: .625rem;
          padding: .5rem .875rem;
          color: var(--app-ink-primary);
          font-size: .8125rem;
          outline: none;
          margin-top: .375rem;
        }
        .fld-r:focus { border-color: #4f7eff; }
        .fld-r option { background: var(--app-bg-elevated); }
        .lbl-r {
          display: block;
          font-size: .625rem;
          font-weight: 600;
          color: var(--app-ink-tertiary);
          text-transform: uppercase;
          letter-spacing: .05em;
        }
      `}</style>
    </div>
  )
}

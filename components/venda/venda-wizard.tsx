'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { fmt } from '@/lib/utils/format'
import { createClient } from '@/lib/supabase/client'
import { salvarTrocaNoEstoque } from '@/app/(loja)/nova-venda/actions'
import {
  Check, ChevronDown, ChevronUp, Plus, X,
  MessageCircle, Printer, ArrowRight, Smartphone,
} from 'lucide-react'
import ResumoPanel from './resumo-panel'
import ResumoMobileBar from './resumo-mobile-bar'
import CyloDocument from './cylo-document'

// ── types ──────────────────────────────────────────────────────────
interface AcessorioItem { id: string; nome: string; preco: number; custo: number; quantidade: number }
interface Custo { tipo: string; valor: string; obs: string }
interface Vendedor { id: string; nome: string; comissao_pct: number; perfil?: string }

interface LojaInfo {
  nome: string
  logo_url: string | null
  cor_primaria: string
  whatsapp: string | null
  instagram: string | null
  endereco: string | null
}

interface Props {
  vendedorId: string
  vendedorNome: string
  lojaId: string
  comissaoPct: number
  perfil: string
  aparelhos: any[]
  acessorios: any[]
  garantiaPadrao: string
  vendedores?: Vendedor[]
  loja: LojaInfo
  vendaInicial?: any
  autoConverter?: boolean
}

// ── Block accordion ────────────────────────────────────────────────
function Block({
  num, title, sub, badge, open, onToggle, children,
}: {
  num: string | number; title: string; sub?: string; badge?: React.ReactNode
  open: boolean; onToggle: () => void; children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl overflow-hidden mb-2.5" style={{ background: 'var(--app-bg-surface)' }}>
      <div
        className="flex items-center justify-between px-4 py-3.5 cursor-pointer transition-colors hover:bg-white/[0.02]"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-semibold flex-shrink-0"
            style={{ background: 'rgba(79,126,255,.15)', color: '#4f7eff' }}>
            {num}
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--app-ink-primary)' }}>{title}</p>
            {sub && <p className="text-[10px] mt-0.5" style={{ color: 'var(--app-ink-tertiary)' }}>{sub}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {badge}
          {open ? <ChevronUp size={14} style={{ color: 'var(--app-ink-tertiary)' }} /> : <ChevronDown size={14} style={{ color: 'var(--app-ink-tertiary)' }} />}
        </div>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div className="px-4 pb-4 pt-3" style={{ borderTop: '1px solid var(--app-hairline)' }}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Badge helpers ──────────────────────────────────────────────────
function Badge({ color, children }: { color: 'green' | 'blue' | 'yellow' | 'red' | 'gray'; children: React.ReactNode }) {
  const cls = {
    green: 'bg-emerald-500/15 text-emerald-400',
    blue: 'bg-blue-500/15 text-blue-400',
    yellow: 'bg-yellow-500/15 text-yellow-400',
    red: 'bg-red-500/15 text-red-400',
    gray: 'bg-white/8 text-white/40',
  }[color]
  return <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${cls}`}>{children}</span>
}

// ── Doc Preview Modal ──────────────────────────────────────────────
function DocPreviewModal({
  tipo, loja, clienteNome, clienteTel, aparelho, preco,
  comTroca, trocaModelo, trocaEstado, trocaBateria, trocaImei, trocaObs, valorTroca,
  acessoriosSel, acTotal, clientePaga, pgtos, garantia, garantiaValidade,
  vendedorNome, salvando,
  onSalvarOrcamento, onNova, onVerVendas, onClose,
}: {
  tipo: 'orcamento' | 'recibo'
  loja: LojaInfo
  clienteNome: string
  clienteTel: string
  aparelho: any
  preco: number
  comTroca: boolean
  trocaModelo: string
  trocaEstado: string
  trocaBateria: string
  trocaImei: string
  trocaObs: string
  valorTroca: number
  acessoriosSel: AcessorioItem[]
  acTotal: number
  clientePaga: number
  pgtos: Record<string, string>
  garantia: string
  garantiaValidade: string
  vendedorNome: string
  salvando: boolean
  onSalvarOrcamento?: () => void
  onNova?: () => void
  onVerVendas?: () => void
  onClose: () => void
}) {
  const [copiado, setCopiado] = useState(false)
  const hoje = new Date().toLocaleDateString('pt-BR')
  const cor = loja.cor_primaria || '#4f7eff'

  const pgtoLabel: Record<string, string> = {
    pix: 'PIX', dinheiro: 'Dinheiro', debito: 'Débito',
    credito: 'Crédito', transferencia: 'Transferência',
  }

  const pgtosUsados = Object.entries(pgtos)
    .filter(([, v]) => parseFloat(v) > 0)
    .map(([k, v]) => `${pgtoLabel[k]}: ${fmt(parseFloat(v))}`)
    .join(' · ')

  function buildMsg() {
    const lines: string[] = []
    lines.push(`*${tipo === 'orcamento' ? 'ORÇAMENTO' : 'RECIBO'} — ${loja.nome}*`)
    lines.push('')
    lines.push(`📋 Cliente: ${clienteNome}`)
    if (clienteTel) lines.push(`📱 Telefone: ${clienteTel}`)
    lines.push(`📅 Data: ${hoje}`)
    lines.push('')
    const nomeProd = [aparelho?.modelo, aparelho?.capacidade, aparelho?.cor].filter(Boolean).join(' ')
    lines.push(`📱 Produto: ${nomeProd}`)
    lines.push(`💰 Preço: ${fmt(preco)}`)
    if (comTroca && valorTroca > 0) {
      lines.push('')
      lines.push(`🔄 Troca: ${trocaModelo} (${trocaEstado})`)
      if (trocaObs) lines.push(`   Obs: ${trocaObs}`)
      lines.push(`↩️ Desconto troca: − ${fmt(valorTroca)}`)
    }
    if (acessoriosSel.length > 0) {
      lines.push('')
      lines.push(`🎧 Acessórios:`)
      acessoriosSel.forEach(a => lines.push(`  • ${a.nome} x${a.quantidade} — ${fmt(a.preco * a.quantidade)}`))
    }
    lines.push('')
    lines.push(`✅ *Total: ${fmt(clientePaga)}*`)
    if (pgtosUsados) lines.push(`💳 Pagamento: ${pgtosUsados}`)
    if (garantia) lines.push(`🛡️ Garantia: ${garantia}${garantiaValidade ? ` (${garantiaValidade})` : ''}`)
    lines.push('')
    lines.push(`_Gerado pelo CYLO · ${loja.nome}_`)
    return lines.join('\n')
  }

  function copiarMsg() {
    navigator.clipboard.writeText(buildMsg())
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2500)
  }

  function imprimir() {
    window.print()
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 print:p-0 print:bg-white"
      style={{ background: 'rgba(0,0,0,.8)', backdropFilter: 'blur(6px)' }}>
      <div className="bg-white rounded-3xl w-full max-w-md max-h-[92vh] flex flex-col shadow-2xl overflow-hidden relative print:max-h-none print:rounded-none print:shadow-none">

        <button onClick={onClose}
          className="absolute top-4 right-4 z-10 w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors print:hidden">
          <X size={14} className="text-gray-500" />
        </button>

        {/* Documento — única fonte de verdade para tela e impressão */}
        <div className="overflow-y-auto flex-1 cylo-print-area">
          <CyloDocument
            estado={tipo === 'orcamento' ? 'proposta' : 'concluida'}
            loja={loja}
            clienteNome={clienteNome}
            clienteTel={clienteTel}
            aparelho={aparelho}
            preco={preco}
            comTroca={comTroca}
            trocaModelo={trocaModelo}
            trocaEstado={trocaEstado}
            trocaBateria={trocaBateria}
            trocaImei={trocaImei}
            trocaObs={trocaObs}
            valorTroca={valorTroca}
            acessoriosSel={acessoriosSel}
            acTotal={acTotal}
            clientePaga={clientePaga}
            pgtos={pgtos}
            garantia={garantia}
            garantiaValidade={garantiaValidade}
            vendedorNome={vendedorNome}
          />
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-gray-100 flex-shrink-0 space-y-2.5 print:hidden">
          <div className="flex gap-2">
            <button onClick={imprimir}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors font-medium">
              <Printer size={14} />Imprimir
            </button>
            <button onClick={copiarMsg}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm border border-emerald-200 text-emerald-600 rounded-xl hover:bg-emerald-50 transition-colors font-medium">
              <MessageCircle size={14} />{copiado ? '✓ Copiado!' : 'WhatsApp'}
            </button>
          </div>

          {tipo === 'orcamento' && onSalvarOrcamento && (
            <button
              onClick={onSalvarOrcamento}
              disabled={salvando}
              className="w-full py-2.5 text-white text-sm font-semibold rounded-xl transition-opacity disabled:opacity-40"
              style={{ background: cor }}
            >
              {salvando ? 'Salvando…' : '💾 Salvar Orçamento'}
            </button>
          )}

          {tipo === 'recibo' && (
            <div className="flex gap-2">
              {onNova && (
                <button onClick={onNova}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm rounded-xl hover:bg-gray-50 transition-colors">
                  + Nova Venda
                </button>
              )}
              {onVerVendas && (
                <button onClick={onVerVendas}
                  className="flex-1 py-2.5 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-opacity"
                  style={{ background: cor }}>
                  Ver Vendas <ArrowRight size={13} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────
export default function VendaWizard({
  vendedorId, vendedorNome, lojaId, comissaoPct, perfil,
  aparelhos, acessorios, garantiaPadrao, vendedores = [], loja, vendaInicial, autoConverter,
}: Props) {
  const router = useRouter()
  const [salvando, setSalvando] = useState(false)
  const [vendaFechada, setVendaFechada] = useState(false)
  const [erroSalvar, setErroSalvar] = useState<string | null>(null)

  // modals
  const [showOrcModal, setShowOrcModal] = useState(false)
  const [showReciboModal, setShowReciboModal] = useState(false)

  // open blocks
  const [open, setOpen] = useState<Record<string, boolean>>({ b1: true, b3: true })
  const tog = (k: string) => setOpen(p => ({ ...p, [k]: !p[k] }))

  // ── state ──────────────────────────────────────────────────────
  const [clienteNome, setClienteNome] = useState('')
  const [clienteTel, setClienteTel] = useState('')
  const [clienteInsta, setClienteInsta] = useState('')
  const [origemLead, setOrigemLead] = useState('Loja Física')
  const [localVenda, setLocalVenda] = useState('Loja Física')
  const [vendedorSelId, setVendedorSelId] = useState(vendedorId)

  // produto
  const [aparelhoId, setAparelhoId] = useState('')
  const [aparelhoPrecoEdit, setAparelhoPrecoEdit] = useState<string>('')
  const [filtroModelo, setFiltroModelo] = useState('')
  const [filtroCapacidade, setFiltroCapacidade] = useState('')
  const [filtroCor, setFiltroCor] = useState('')

  // troca
  const [comTroca, setComTroca] = useState(false)
  const [trocaModelo, setTrocaModelo] = useState('')
  const [trocaEstado, setTrocaEstado] = useState('bom')
  const [trocaBateria, setTrocaBateria] = useState('')
  const [trocaValor, setTrocaValor] = useState('')
  const [trocaImei, setTrocaImei] = useState('')
  const [trocaObs, setTrocaObs] = useState('')
  const [trocaConfirmada, setTrocaConfirmada] = useState(false)

  // IMEI capture on fechar venda
  const [showImeiCaptura, setShowImeiCaptura] = useState(false)
  const [vendaImei, setVendaImei] = useState('')

  // acessórios
  const [acessoriosSel, setAcessoriosSel] = useState<AcessorioItem[]>([])
  const [acSelId, setAcSelId] = useState('')
  const [acQtd, setAcQtd] = useState('1')

  // pagamento
  const [pgtos, setPgtos] = useState({ pix: '', dinheiro: '', debito: '', credito: '', transferencia: '' })

  // custos operacionais
  const [custos, setCustos] = useState<Custo[]>([])

  // garantia
  const [garantia, setGarantia] = useState(garantiaPadrao)
  const [garantiaValidade, setGarantiaValidade] = useState('')

  // status
  const [statusVenda, setStatusVenda] = useState('Orçamento')

  // edit mode
  const isEditMode = !!vendaInicial
  const vendaEditId: string | null = vendaInicial?.id ?? null

  // client autocomplete
  const [clienteSugestoes, setClienteSugestoes] = useState<Array<{
    id: string; nome: string; telefone: string | null; instagram: string | null; orcamentoAtivo: string | null
  }>>([])
  const [showSugestoes, setShowSugestoes] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── pre-fill from vendaInicial (edit mode) ─────────────────────
  useEffect(() => {
    if (!vendaInicial) return
    setClienteNome(vendaInicial.cliente_nome ?? '')
    setClienteTel(vendaInicial.cliente_telefone ?? '')
    setClienteInsta(vendaInicial.cliente_insta ?? '')
    setOrigemLead(vendaInicial.origem_lead ?? 'Loja Física')
    setLocalVenda(vendaInicial.local_venda ?? 'Loja Física')
    setVendedorSelId(vendaInicial.vendedor_id ?? vendedorId)
    setAparelhoId(vendaInicial.aparelho_id ?? '')
    setComTroca(vendaInicial.com_troca ?? false)
    if (vendaInicial.com_troca) {
      setTrocaModelo(vendaInicial.troca_modelo ?? '')
      setTrocaImei(vendaInicial.troca_imei ?? '')
      setTrocaEstado(vendaInicial.troca_estado ?? 'bom')
      setTrocaBateria(vendaInicial.troca_bateria_pct ? String(vendaInicial.troca_bateria_pct) : '')
      setTrocaValor(vendaInicial.troca_valor ? String(vendaInicial.troca_valor) : '')
      setTrocaObs(vendaInicial.troca_obs ?? '')
      if (vendaInicial.troca_modelo && vendaInicial.troca_valor > 0) setTrocaConfirmada(true)
    }
    setPgtos({
      pix: vendaInicial.pgto_pix > 0 ? String(vendaInicial.pgto_pix) : '',
      dinheiro: vendaInicial.pgto_dinheiro > 0 ? String(vendaInicial.pgto_dinheiro) : '',
      debito: vendaInicial.pgto_debito > 0 ? String(vendaInicial.pgto_debito) : '',
      credito: vendaInicial.pgto_credito > 0 ? String(vendaInicial.pgto_credito) : '',
      transferencia: vendaInicial.pgto_transferencia > 0 ? String(vendaInicial.pgto_transferencia) : '',
    })
    setGarantia(vendaInicial.garantia ?? garantiaPadrao)
    setGarantiaValidade(vendaInicial.garantia_validade ?? '')
    if (vendaInicial.venda_acessorios?.length) {
      setAcessoriosSel(vendaInicial.venda_acessorios.map((va: any) => ({
        id: va.acessorio_id,
        nome: va.nome,
        preco: va.preco_unitario,
        custo: va.custo_unitario ?? 0,
        quantidade: va.quantidade,
      })))
    }
    // Recover edited price: valor_aparelho (sem troca) + troca_valor = preço de tabela usado
    const recoveredPreco = (vendaInicial.valor_aparelho ?? 0) + (vendaInicial.troca_valor ?? 0)
    const ap = aparelhos.find((a: any) => a.id === vendaInicial.aparelho_id)
    if (ap && Math.abs(ap.preco - recoveredPreco) > 0.5) {
      setAparelhoPrecoEdit(String(recoveredPreco))
    }
    // Pre-fill cascade filters for novos (shows correct selection in edit mode)
    if (ap?.tipo === 'novo') {
      setTipoTab('novo')
      setFiltroModelo(ap.modelo ?? '')
      setFiltroCapacidade(ap.capacidade ?? '')
      setFiltroCor(ap.cor ?? '')
    } else if (ap?.tipo === 'usado') {
      setTipoTab('usado')
    }

  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Quando autoConverter=true, dispara iniciarFechamento assim que o pre-fill estiver pronto
  const autoConverterFired = useRef(false)
  useEffect(() => {
    if (!autoConverter || autoConverterFired.current) return
    if (!clienteNome.trim() || !aparelhoId) return
    autoConverterFired.current = true
    iniciarFechamento()
  }) // roda a cada render até disparar

  // ── computed ───────────────────────────────────────────────────
  const aparelho = aparelhos.find(a => a.id === aparelhoId)
  const precoBase = aparelho?.preco ?? 0
  const preco = aparelhoPrecoEdit !== '' ? (parseFloat(aparelhoPrecoEdit) || 0) : precoBase
  const valorTroca = parseFloat(trocaValor) || 0
  const acTotal = acessoriosSel.reduce((s, a) => s + a.preco * a.quantidade, 0)
  const custoTotal = custos.reduce((s, c) => s + (parseFloat(c.valor) || 0), 0)
  const clientePaga = Math.max(0, preco - valorTroca + acTotal)
  const totalPago = Object.values(pgtos).reduce((s, v) => s + (parseFloat(v) || 0), 0)
  const diffPgto = clientePaga - totalPago
  const custoAp = aparelho?.custo ?? 0
  const custoAc = acessoriosSel.reduce((s, a) => s + a.custo * a.quantidade, 0)
  const lucro = clientePaga - custoAp - custoAc - custoTotal
  const vendedorSel = vendedores.find(v => v.id === vendedorSelId)
  // Admin nunca recebe comissão
  const isVendedorAdmin = vendedorSel?.perfil === 'loja_admin' || (!vendedorSel && perfil === 'loja_admin')
  const comPct = isVendedorAdmin ? 0 : (vendedorSel?.comissao_pct ?? comissaoPct)
  const comissao = clientePaga * (comPct / 100)
  const nomeVendedorAtual = vendedorSel?.nome ?? vendedorNome

  // filtered aparelhos
  const [tipoTab, setTipoTab] = useState<'novo' | 'usado'>('novo')

  // ── Novos: aggregated cascade (performático) ───────────────────
  const novosAll = aparelhos.filter((a: any) => a.tipo === 'novo')
  const countNovos = novosAll.length
  const novosModelos = [...new Set(novosAll.map((a: any) => a.modelo as string))].sort()
  const novosCaps = filtroModelo
    ? [...new Set(novosAll.filter((a: any) => a.modelo === filtroModelo).map((a: any) => a.capacidade as string).filter(Boolean))].sort()
    : []
  const novosCores = (filtroModelo && filtroCapacidade)
    ? [...new Set(novosAll.filter((a: any) => a.modelo === filtroModelo && a.capacidade === filtroCapacidade).map((a: any) => a.cor as string).filter(Boolean))].sort()
    : []
  const novosQtySelected = (filtroModelo && filtroCapacidade && filtroCor)
    ? novosAll.filter((a: any) => a.modelo === filtroModelo && a.capacidade === filtroCapacidade && a.cor === filtroCor).length
    : 0

  // ── Usados: individual table (inalterado) ──────────────────────
  const usadosAll = aparelhos.filter((a: any) => a.tipo === 'usado')
  const countUsados = usadosAll.length
  const usadosModelos = [...new Set(usadosAll.map((a: any) => a.modelo as string))].sort()
  const usadosCaps = [...new Set(usadosAll.map((a: any) => a.capacidade as string).filter(Boolean))].sort()
  const usadosCores = [...new Set(usadosAll.map((a: any) => a.cor as string).filter(Boolean))].sort()
  const usadosFiltered = usadosAll.filter((a: any) =>
    (!filtroModelo || a.modelo === filtroModelo) &&
    (!filtroCapacidade || a.capacidade === filtroCapacidade) &&
    (!filtroCor || a.cor === filtroCor)
  )

  const statusMap: Record<string, string> = {
    'Orçamento': 'orcamento', 'Aguardando Cliente': 'orcamento', 'Aprovado': 'orcamento',
    'Perdido': 'cancelado', 'Convertido em Venda': 'convertido',
  }

  // ── Auto-assign aparelhoId para novos via cascade ──────────────
  // Em edit mode o pre-fill já setou aparelhoId, só muda se o usuário interagir
  useEffect(() => {
    if (isEditMode || tipoTab !== 'novo') return
    if (!filtroModelo || !filtroCapacidade || !filtroCor) {
      const cur = aparelhos.find((a: any) => a.id === aparelhoId)
      if (cur?.tipo === 'novo') { setAparelhoId(''); setAparelhoPrecoEdit('') }
      return
    }
    const unit = aparelhos.find((a: any) =>
      a.tipo === 'novo' &&
      a.modelo === filtroModelo &&
      a.capacidade === filtroCapacidade &&
      a.cor === filtroCor
    )
    setAparelhoId(unit?.id ?? '')
    if (unit) setAparelhoPrecoEdit('')
  }, [filtroModelo, filtroCapacidade, filtroCor, tipoTab]) // eslint-disable-line

  // ── client autocomplete ────────────────────────────────────────
  function onClienteNomeChange(val: string) {
    setClienteNome(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (val.length < 2) { setClienteSugestoes([]); setShowSugestoes(false); return }
    debounceRef.current = setTimeout(() => buscarClientesSugestoes(val), 300)
  }

  async function buscarClientesSugestoes(termo: string) {
    const supabase = createClient()
    const { data } = await supabase.from('clientes')
      .select('id, nome, telefone, instagram')
      .eq('loja_id', lojaId)
      .or(`nome.ilike.%${termo}%,telefone.ilike.%${termo}%,instagram.ilike.%${termo}%`)
      .limit(5)
    if (!data?.length) { setClienteSugestoes([]); setShowSugestoes(false); return }

    const clienteIds = data.map(c => c.id)
    const { data: orcs } = await supabase.from('vendas')
      .select('cliente_id, id')
      .eq('loja_id', lojaId)
      .eq('status', 'orcamento')
      .in('cliente_id', clienteIds)

    const orcByCliente: Record<string, string> = {}
    orcs?.forEach((o: any) => { if (o.cliente_id) orcByCliente[o.cliente_id] = o.id })

    setClienteSugestoes(data.map(c => ({
      id: c.id,
      nome: c.nome,
      telefone: c.telefone,
      instagram: c.instagram,
      orcamentoAtivo: orcByCliente[c.id] ?? null,
    })))
    setShowSugestoes(true)
  }

  function selecionarClienteSugestao(c: typeof clienteSugestoes[0]) {
    setClienteNome(c.nome)
    setClienteTel(c.telefone ?? '')
    setClienteInsta(c.instagram ?? '')
    setClienteSugestoes([])
    setShowSugestoes(false)
  }

  function addAcessorio() {
    if (!acSelId) return
    const cat = acessorios.find(a => a.id === acSelId)
    if (!cat) return
    const qtd = parseInt(acQtd) || 1
    setAcessoriosSel(prev => {
      const ex = prev.find(x => x.id === acSelId)
      if (ex) return prev.map(x => x.id === acSelId ? { ...x, quantidade: x.quantidade + qtd } : x)
      return [...prev, { id: cat.id, nome: cat.nome, preco: cat.preco, custo: cat.custo, quantidade: qtd }]
    })
    setAcSelId('')
    setAcQtd('1')
  }

  function removeAcessorio(id: string) {
    setAcessoriosSel(prev => prev.filter(a => a.id !== id))
  }

  function updateAcPreco(id: string, p: number) {
    setAcessoriosSel(prev => prev.map(a => a.id === id ? { ...a, preco: p } : a))
  }

  function addCusto() {
    setCustos(prev => [...prev, { tipo: 'Motoboy', valor: '', obs: '' }])
  }

  function removeCusto(i: number) {
    setCustos(prev => prev.filter((_, idx) => idx !== i))
  }

  function resetForm() {
    setVendaFechada(false)
    setAparelhoId('')
    setAparelhoPrecoEdit('')
    setClienteNome('')
    setClienteTel('')
    setClienteInsta('')
    setComTroca(false)
    setTrocaModelo('')
    setTrocaValor('')
    setTrocaBateria('')
    setTrocaImei('')
    setTrocaObs('')
    setTrocaConfirmada(false)
    setAcessoriosSel([])
    setPgtos({ pix: '', dinheiro: '', debito: '', credito: '', transferencia: '' })
    setCustos([])
    setStatusVenda('Orçamento')
    setShowReciboModal(false)
    setShowOrcModal(false)
    setShowImeiCaptura(false)
    setVendaImei('')
    setOpen({ b1: true, b3: true })
  }

  function iniciarFechamento() {
    if (!clienteNome.trim() || !aparelhoId) return
    if (aparelho?.tipo === 'novo') {
      setVendaImei('')
      setShowImeiCaptura(true)
    } else {
      salvar('convertido')
    }
  }

  // ── upsert cliente ─────────────────────────────────────────────
  async function upsertCliente(supabase: ReturnType<typeof createClient>): Promise<string | null> {
    const nome = clienteNome.trim()
    const tel = clienteTel.trim() || null
    const insta = clienteInsta.trim() || null

    // Tenta achar pelo telefone primeiro (mais confiável), depois pelo nome
    let existente: { id: string } | null = null
    if (tel) {
      const { data } = await supabase
        .from('clientes').select('id').eq('loja_id', lojaId).eq('telefone', tel).maybeSingle()
      existente = data
    }
    if (!existente) {
      const { data } = await supabase
        .from('clientes').select('id').eq('loja_id', lojaId).ilike('nome', nome).maybeSingle()
      existente = data
    }

    if (existente) {
      await supabase.from('clientes').update({
        ...(tel ? { telefone: tel } : {}),
        ...(insta ? { instagram: insta } : {}),
        atualizado_em: new Date().toISOString(),
      }).eq('id', existente.id)
      return existente.id
    }

    const { data: novo } = await supabase.from('clientes').insert({
      loja_id: lojaId,
      nome,
      telefone: tel,
      instagram: insta,
      vendedor_id: vendedorSelId,
    }).select('id').single()
    return novo?.id ?? null
  }

  // ── salvar ─────────────────────────────────────────────────────
  async function salvar(forceStatus?: string) {
    if (!clienteNome.trim() || !aparelhoId) return
    setSalvando(true)
    setErroSalvar(null)
    const supabase = createClient()
    const dbStatus = forceStatus ?? statusMap[statusVenda] ?? 'orcamento'
    const hoje = new Date().toISOString().split('T')[0]

    const clienteId = await upsertCliente(supabase)

    const vendaPayload: Record<string, any> = {
      loja_id: lojaId,
      vendedor_id: vendedorSelId,
      vendedor_nome: nomeVendedorAtual,
      cliente_id: clienteId,
      cliente_nome: clienteNome,
      cliente_telefone: clienteTel || null,
      cliente_insta: clienteInsta || null,
      aparelho_id: aparelhoId,
      valor_total: clientePaga,
      valor_aparelho: Math.max(0, preco - valorTroca),
      valor_acessorios: acTotal,
      pgto_pix: parseFloat(pgtos.pix) || 0,
      pgto_dinheiro: parseFloat(pgtos.dinheiro) || 0,
      pgto_debito: parseFloat(pgtos.debito) || 0,
      pgto_credito: parseFloat(pgtos.credito) || 0,
      pgto_transferencia: parseFloat(pgtos.transferencia) || 0,
      com_troca: comTroca,
      troca_modelo: comTroca ? trocaModelo : null,
      troca_imei: comTroca ? trocaImei : null,
      troca_estado: comTroca ? trocaEstado : null,
      troca_bateria_pct: comTroca ? (parseInt(trocaBateria) || null) : null,
      troca_valor: valorTroca,
      troca_obs: comTroca ? (trocaObs || null) : null,
      comissao,
      lucro,
      garantia,
      garantia_validade: garantiaValidade || null,
      origem_lead: origemLead || null,
      local_venda: localVenda,
      status: dbStatus,
      data_venda: hoje,
    }

    let saveError: any = null
    let savedVendaId: string | null = null

    if (isEditMode && vendaEditId) {
      // UPDATE existing orçamento
      const { error } = await supabase.from('vendas').update(vendaPayload).eq('id', vendaEditId)
      saveError = error
      savedVendaId = vendaEditId
      if (!error) {
        await supabase.from('venda_acessorios').delete().eq('venda_id', vendaEditId)
        if (acessoriosSel.length > 0) {
          await supabase.from('venda_acessorios').insert(
            acessoriosSel.map(a => ({
              venda_id: vendaEditId,
              acessorio_id: a.id,
              nome: a.nome,
              preco_unitario: a.preco,
              custo_unitario: a.custo,
              quantidade: a.quantidade,
            }))
          )
        }
      }
    } else {
      // INSERT new venda
      const { data: venda, error } = await supabase.from('vendas').insert(vendaPayload).select('id').single()
      saveError = error
      savedVendaId = venda?.id ?? null
      if (!error && venda && acessoriosSel.length > 0) {
        await supabase.from('venda_acessorios').insert(
          acessoriosSel.map(a => ({
            venda_id: venda.id,
            acessorio_id: a.id,
            nome: a.nome,
            preco_unitario: a.preco,
            custo_unitario: a.custo,
            quantidade: a.quantidade,
          }))
        )
      }
    }

    if (!saveError && dbStatus === 'convertido') {
      const aparelhoUpdates: Record<string, any> = { status: 'vendido' }
      if (vendaImei.trim()) aparelhoUpdates.imei = vendaImei.trim()
      await supabase.from('aparelhos').update(aparelhoUpdates).eq('id', aparelhoId)

      if (comTroca && trocaModelo.trim()) {
        // Server action com admin client — bypassa RLS
        const trocaResult = await salvarTrocaNoEstoque({
          lojaId,
          modelo: trocaModelo,
          imei: trocaImei || null,
          bateriaPct: parseInt(trocaBateria) || null,
          estado: trocaEstado,
          custo: valorTroca,
          preco: valorTroca,
          dataEntrada: hoje,
          observacoes: [trocaObs, `Troca de: ${clienteNome}`].filter(Boolean).join(' | ') || null,
        })
        if (!trocaResult.ok) {
          setErroSalvar(`Troca não entrou no estoque: ${trocaResult.error}`)
        }
      }
    }

    setSalvando(false)
    if (saveError) {
      setErroSalvar(saveError.message || 'Erro ao salvar. Tente novamente.')
    } else {
      if (dbStatus === 'convertido') {
        setShowReciboModal(true)
      } else {
        router.push('/orcamentos')
      }
    }
  }

  // Show orçamento modal WITHOUT saving
  function verOrcamento() {
    if (!clienteNome.trim() || !aparelhoId) return
    setShowOrcModal(true)
  }

  // ── doc modal shared props ─────────────────────────────────────
  const docProps = {
    loja,
    clienteNome,
    clienteTel,
    aparelho,
    preco,
    comTroca,
    trocaModelo,
    trocaEstado,
    trocaBateria,
    trocaImei,
    trocaObs,
    valorTroca,
    acessoriosSel,
    acTotal,
    clientePaga,
    pgtos,
    garantia,
    garantiaValidade,
    vendedorNome: nomeVendedorAtual,
    salvando,
  }

  const resumoProps = {
    clienteNome,
    aparelhoLabel: aparelho ? `${aparelho.modelo} ${aparelho.capacidade}` : null,
    preco,
    comTroca,
    valorTroca,
    acTotal,
    custoTotal,
    clientePaga,
    totalPago,
    diffPgto,
    garantia,
    statusVenda,
    comissao,
    isEditMode,
    salvando,
    podeFechar: !!clienteNome && !!aparelhoId,
    onSalvarOrcamento: () => salvar('orcamento'),
    onIniciarFechamento: iniciarFechamento,
    onVerOrcamento: verOrcamento,
  }

  // ── renders ─────────────────────────────────────────────────────

  if (vendaFechada) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-2xl font-black tracking-tight text-white mb-2">Venda Fechada!</h2>
        <p className="text-sm text-white/50 mb-8">
          Negociação registrada com sucesso para <strong className="text-white">{clienteNome}</strong>
        </p>
        <div className="flex gap-3">
          <button onClick={resetForm}
            className="px-5 py-2.5 border border-white/15 text-white text-sm rounded-xl hover:bg-white/5 transition-colors">
            + Nova Venda
          </button>
          <button onClick={() => router.push('/vendas')}
            className="px-5 py-2.5 bg-[#4f7eff] hover:opacity-90 text-white text-sm font-semibold rounded-xl transition-opacity">
            Ver Vendas
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full">
      {/* Orçamento preview modal (no save yet) */}
      {showOrcModal && (
        <DocPreviewModal
          {...docProps}
          tipo="orcamento"
          onClose={() => setShowOrcModal(false)}
          onSalvarOrcamento={() => {
            setShowOrcModal(false)
            salvar('orcamento')
          }}
        />
      )}

      {/* Recibo modal (after fechar venda) */}
      {showReciboModal && (
        <DocPreviewModal
          {...docProps}
          tipo="recibo"
          onClose={() => { setShowReciboModal(false); setVendaFechada(true) }}
          onNova={() => { resetForm() }}
          onVerVendas={() => { router.push('/vendas') }}
        />
      )}

      {/* IMEI capture modal (novos only, before closing sale) */}
      {showImeiCaptura && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-base font-black text-white mb-1">Informar IMEI</h3>
            <p className="text-xs text-white/40 mb-4">
              Aparelho novo — informe o IMEI antes de fechar a venda.
            </p>
            <label className="label">IMEI *</label>
            <input
              value={vendaImei}
              onChange={e => setVendaImei(e.target.value)}
              placeholder="000000000000000"
              maxLength={20}
              autoFocus
              className="inp mb-4 font-mono"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowImeiCaptura(false)}
                className="flex-1 py-2 border border-white/15 text-white text-sm rounded-xl hover:bg-white/5 transition-colors">
                Cancelar
              </button>
              <button
                onClick={() => { setShowImeiCaptura(false); salvar('convertido') }}
                disabled={salvando}
                className="flex-1 py-2 bg-emerald-500 hover:opacity-90 text-white text-sm font-semibold rounded-xl disabled:opacity-30 transition-opacity">
                {salvando ? 'Salvando...' : 'Fechar Venda'}
              </button>
            </div>
            <p className="text-[10px] text-white/25 mt-3 text-center">Pode deixar em branco se não tiver em mãos agora</p>
          </div>
        </div>
      )}

      {/* ── Left: blocks ── */}
      <div className="flex-1 p-6 pb-32 lg:pb-6 overflow-y-auto">
        <div className="max-w-2xl">
          {erroSalvar && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2">
              <span className="text-red-400 text-sm flex-shrink-0">✕</span>
              <div>
                <p className="text-sm font-semibold text-red-400">Erro ao salvar</p>
                <p className="text-xs text-red-400/70 mt-0.5">{erroSalvar}</p>
              </div>
              <button onClick={() => setErroSalvar(null)} className="ml-auto text-red-400/50 hover:text-red-400 text-xs">fechar</button>
            </div>
          )}

          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="text-lg font-black tracking-tight text-white">
                {isEditMode ? 'Editar Orçamento' : 'Nova Venda'}
              </h1>
              <p className="text-[11px] text-white/30 mt-0.5">
                {isEditMode ? 'Atualize os dados e salve ou converta em venda' : 'Preencha os blocos abaixo'}
              </p>
            </div>
            <div className="flex gap-2">
              {isEditMode ? (
                <>
                  <button onClick={() => salvar('orcamento')} disabled={salvando || !clienteNome || !aparelhoId}
                    className="px-4 py-2 border border-white/15 text-white text-sm rounded-xl hover:bg-white/5 disabled:opacity-30 transition-colors">
                    {salvando ? 'Salvando...' : '💾 Salvar'}
                  </button>
                  <button onClick={iniciarFechamento} disabled={salvando || !clienteNome || !aparelhoId}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:opacity-90 text-white text-sm font-semibold rounded-xl disabled:opacity-30 transition-opacity">
                    <Check size={14} />{salvando ? 'Salvando...' : 'Converter em Venda'}
                  </button>
                </>
              ) : (
                <>
                  <button onClick={verOrcamento} disabled={!clienteNome || !aparelhoId}
                    className="px-4 py-2 border border-white/15 text-white text-sm rounded-xl hover:bg-white/5 disabled:opacity-30 transition-colors">
                    📄 Orçamento
                  </button>
                  <button onClick={iniciarFechamento} disabled={salvando || !clienteNome || !aparelhoId}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:opacity-90 text-white text-sm font-semibold rounded-xl disabled:opacity-30 transition-opacity">
                    <Check size={14} />{salvando ? 'Salvando...' : 'Fechar Venda'}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* B1: Cliente */}
          <Block num="1" title="Cliente"
            sub={clienteNome || 'Nenhum selecionado'}
            badge={clienteNome ? <Badge color="green">✓ {clienteNome}</Badge> : <Badge color="red">Obrigatório</Badge>}
            open={!!open.b1} onToggle={() => tog('b1')}>
            <div className="grid grid-cols-2 gap-3 mt-1">
              <div className="col-span-2 relative">
                <label className="label">Nome *</label>
                <input
                  value={clienteNome}
                  onChange={e => onClienteNomeChange(e.target.value)}
                  onBlur={() => setTimeout(() => setShowSugestoes(false), 150)}
                  placeholder="Nome, telefone ou @instagram"
                  className="inp"
                />
                {showSugestoes && clienteSugestoes.length > 0 && (
                  <div className="absolute left-0 right-0 top-full z-20 mt-1 bg-[#1a1a2e] border border-white/15 rounded-xl overflow-hidden shadow-xl">
                    {clienteSugestoes.map(c => (
                      <div key={c.id}
                        className="flex items-center justify-between px-3 py-2.5 hover:bg-white/5 cursor-pointer border-b border-white/5 last:border-0"
                        onMouseDown={() => selecionarClienteSugestao(c)}>
                        <div>
                          <p className="text-sm font-semibold text-white">{c.nome}</p>
                          <p className="text-[10px] text-white/30">
                            {[c.telefone, c.instagram].filter(Boolean).join(' · ')}
                          </p>
                        </div>
                        {c.orcamentoAtivo && (
                          <button
                            type="button"
                            onMouseDown={e => { e.stopPropagation(); router.push(`/nova-venda?editar=${c.orcamentoAtivo}`) }}
                            className="text-[10px] px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/30 whitespace-nowrap ml-2">
                            Editar orç.
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="label">Telefone</label>
                <input value={clienteTel} onChange={e => setClienteTel(e.target.value)}
                  placeholder="(61) 99999-0000" className="inp" />
              </div>
              <div>
                <label className="label">Instagram</label>
                <input value={clienteInsta} onChange={e => setClienteInsta(e.target.value)}
                  placeholder="@usuario" className="inp" />
              </div>
            </div>
          </Block>

          {/* B2: Captação */}
          <Block num="2" title="Captação da Venda"
            sub={`${origemLead} → ${localVenda}`}
            open={!!open.b2} onToggle={() => tog('b2')}>
            <div className="grid grid-cols-2 gap-3 mt-1">
              <div>
                <label className="label">Origem do lead</label>
                <select value={origemLead} onChange={e => setOrigemLead(e.target.value)} className="inp">
                  {['Instagram', 'WhatsApp', 'Facebook', 'OLX', 'Indicação', 'Loja Física', 'Outro'].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Venda finalizada em</label>
                <select value={localVenda} onChange={e => setLocalVenda(e.target.value)} className="inp">
                  {['Loja Física', 'Delivery', 'Motoboy', 'Correios', 'Retirada', 'Outro'].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
            </div>
          </Block>

          {/* B3: Vendedor (admin only) */}
          {perfil === 'loja_admin' && (
            <Block num="3" title="Vendedor"
              sub={nomeVendedorAtual}
              badge={<Badge color="blue">{nomeVendedorAtual}</Badge>}
              open={!!open.b_vend} onToggle={() => tog('b_vend')}>
              <div className="mt-1">
                <label className="label">Vendedor responsável</label>
                <select value={vendedorSelId} onChange={e => setVendedorSelId(e.target.value)} className="inp">
                  {vendedores.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.nome} {v.perfil === 'loja_admin' ? '(admin · sem comissão)' : `(${v.comissao_pct}%)`}
                    </option>
                  ))}
                </select>
                {isVendedorAdmin && (
                  <p className="text-[10px] text-yellow-400/70 mt-1.5">
                    Admin não recebe comissão. Selecione um vendedor para atribuir comissão.
                  </p>
                )}
              </div>
            </Block>
          )}

          {/* B4: Produto */}
          <Block num="4" title="Produto Vendido"
            sub={aparelho ? `${aparelho.modelo} ${aparelho.capacidade ?? ''}` : 'Nenhum selecionado'}
            badge={aparelho
              ? <Badge color="blue">{fmt(preco)}</Badge>
              : <Badge color="red">Obrigatório</Badge>}
            open={!!open.b3} onToggle={() => tog('b3')}>

            {/* Tabs Lacrados / Usados */}
            <div className="flex gap-1.5 mb-4 mt-1">
              <button
                type="button"
                onClick={() => { setTipoTab('novo'); setFiltroModelo(''); setFiltroCapacidade(''); setFiltroCor(''); setAparelhoId(''); setAparelhoPrecoEdit('') }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${tipoTab === 'novo' ? 'bg-[#4f7eff] text-white' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}>
                📱 Lacrados
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${tipoTab === 'novo' ? 'bg-white/20' : 'bg-white/10'}`}>{countNovos}</span>
              </button>
              <button
                type="button"
                onClick={() => { setTipoTab('usado'); setFiltroModelo(''); setFiltroCapacidade(''); setFiltroCor(''); setAparelhoId(''); setAparelhoPrecoEdit('') }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${tipoTab === 'usado' ? 'bg-amber-500 text-white' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}>
                🔄 Usados
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${tipoTab === 'usado' ? 'bg-white/20' : 'bg-white/10'}`}>{countUsados}</span>
              </button>
            </div>

            {/* ── NOVOS: cascade picker performático ── */}
            {tipoTab === 'novo' && (
              <div className="space-y-3">
                {/* Step 1: Modelo */}
                <div>
                  <label className="label">Modelo</label>
                  {novosModelos.length === 0 ? (
                    <p className="text-xs text-white/25 py-2">Nenhum lacrado em estoque</p>
                  ) : (
                    <select
                      value={filtroModelo}
                      onChange={e => { setFiltroModelo(e.target.value); setFiltroCapacidade(''); setFiltroCor('') }}
                      className="inp"
                    >
                      <option value="">Selecione o modelo</option>
                      {novosModelos.map(m => {
                        const qty = novosAll.filter((a: any) => a.modelo === m).length
                        return <option key={m} value={m}>{m} — {qty} un.</option>
                      })}
                    </select>
                  )}
                </div>

                {/* Step 2: Capacidade (pills) */}
                {filtroModelo && novosCaps.length > 0 && (
                  <div>
                    <label className="label">Capacidade</label>
                    <div className="flex flex-wrap gap-1.5">
                      {novosCaps.map(cap => {
                        const qty = novosAll.filter((a: any) => a.modelo === filtroModelo && a.capacidade === cap).length
                        return (
                          <button key={cap} type="button"
                            onClick={() => { setFiltroCapacidade(cap); setFiltroCor('') }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                              filtroCapacidade === cap ? 'bg-[#4f7eff] text-white' : 'bg-white/5 text-white/50 hover:bg-white/10'
                            }`}>
                            {cap}
                            <span className="ml-1.5 opacity-60">({qty})</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Step 3: Cor (pills) */}
                {filtroModelo && filtroCapacidade && novosCores.length > 0 && (
                  <div>
                    <label className="label">Cor</label>
                    <div className="flex flex-wrap gap-1.5">
                      {novosCores.map(cor => {
                        const qty = novosAll.filter((a: any) => a.modelo === filtroModelo && a.capacidade === filtroCapacidade && a.cor === cor).length
                        return (
                          <button key={cor} type="button"
                            onClick={() => setFiltroCor(cor)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                              filtroCor === cor ? 'bg-[#4f7eff] text-white' : 'bg-white/5 text-white/50 hover:bg-white/10'
                            }`}>
                            {cor}
                            <span className="ml-1.5 opacity-60">({qty})</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Sem estoque para combo selecionada */}
                {filtroModelo && filtroCapacidade && filtroCor && novosQtySelected === 0 && (
                  <p className="text-xs text-red-400/70 mt-1">Sem estoque para essa configuração</p>
                )}

                {/* Estoque disponível badge */}
                {novosQtySelected > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/8 border border-emerald-500/20 rounded-lg">
                    <span className="text-emerald-400 text-xs">✓</span>
                    <span className="text-xs text-white/60">{novosQtySelected} unidade{novosQtySelected !== 1 ? 's' : ''} disponível</span>
                  </div>
                )}
              </div>
            )}

            {/* ── USADOS: tabela individual (inalterado) ── */}
            {tipoTab === 'usado' && (
              <div>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div>
                    <label className="label">Modelo</label>
                    <select value={filtroModelo} onChange={e => setFiltroModelo(e.target.value)} className="inp">
                      <option value="">Todos</option>
                      {usadosModelos.map(m => <option key={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Capacidade</label>
                    <select value={filtroCapacidade} onChange={e => setFiltroCapacidade(e.target.value)} className="inp">
                      <option value="">Todas</option>
                      {usadosCaps.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Cor</label>
                    <select value={filtroCor} onChange={e => setFiltroCor(e.target.value)} className="inp">
                      <option value="">Todas</option>
                      {usadosCores.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                {usadosFiltered.length === 0 ? (
                  <p className="text-xs text-white/30 py-3 text-center">Nenhum usado disponível</p>
                ) : (
                  <div className="rounded-xl overflow-hidden border border-white/8">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/5">
                          {['Modelo', 'Cap.', 'Cor', 'Bat.', 'Estado', 'Preço', ''].map(h => (
                            <th key={h} className="text-left text-[10px] text-white/30 font-medium px-3 py-2">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {usadosFiltered.map((a: any) => (
                          <tr key={a.id}
                            onClick={() => { setAparelhoId(a.id); setAparelhoPrecoEdit(''); tog('b3') }}
                            className={`border-b border-white/5 last:border-0 cursor-pointer transition-colors ${aparelhoId === a.id ? 'bg-amber-500/10' : 'hover:bg-white/3'}`}>
                            <td className="px-3 py-2 text-xs font-semibold text-white">{a.modelo}</td>
                            <td className="px-3 py-2 text-xs text-white/50">{a.capacidade ?? '—'}</td>
                            <td className="px-3 py-2 text-xs text-white/50">{a.cor ?? '—'}</td>
                            <td className="px-3 py-2 text-xs text-white/50">{a.bateria_pct != null ? `${a.bateria_pct}%` : '—'}</td>
                            <td className="px-3 py-2">
                              <span className={`text-[10px] px-1.5 py-0.5 rounded capitalize ${
                                a.estado === 'excelente' ? 'bg-emerald-500/15 text-emerald-400'
                                : a.estado === 'bom' ? 'bg-blue-500/15 text-blue-400'
                                : a.estado === 'regular' ? 'bg-yellow-500/15 text-yellow-400'
                                : 'bg-red-500/15 text-red-400'
                              }`}>{a.estado ?? '—'}</span>
                            </td>
                            <td className="px-3 py-2 text-xs font-mono text-[#4f7eff] font-bold">{fmt(a.preco)}</td>
                            <td className="px-3 py-2">
                              <button className={`text-[10px] px-2 py-0.5 rounded-md ${aparelhoId === a.id ? 'bg-amber-500/30 text-amber-400' : 'bg-white/8 text-white/40'}`}>
                                {aparelhoId === a.id ? '✓' : 'Sel.'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {aparelho && (
              <div className="mt-3 p-3 rounded-xl border border-blue-500/20 bg-blue-500/8">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-bold text-white">{aparelho.modelo} {aparelho.capacidade} · {aparelho.cor}</p>
                    {aparelho.imei && <p className="text-[10px] font-mono text-white/30 mt-0.5">IMEI: {aparelho.imei}</p>}
                  </div>
                  <button onClick={() => { setAparelhoId(''); setAparelhoPrecoEdit(''); setFiltroModelo(''); setFiltroCapacidade(''); setFiltroCor('') }}
                    className="text-white/30 hover:text-white/60"><X size={14} /></button>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[11px] text-white/40">Preço de venda:</span>
                  <input type="number"
                    value={aparelhoPrecoEdit !== '' ? aparelhoPrecoEdit : aparelho.preco}
                    onChange={e => setAparelhoPrecoEdit(e.target.value)}
                    className="w-24 bg-white/10 border border-white/15 rounded-lg px-2 py-1 text-sm font-bold text-[#4f7eff] text-right focus:outline-none focus:border-[#4f7eff]"
                  />
                </div>
                {(!aparelho.custo || aparelho.custo === 0) && (
                  <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-500/8 border border-yellow-500/20">
                    <span className="text-[11px] text-yellow-400">⚠ Custo não informado — lucro ficará pendente até o Admin atualizar.</span>
                  </div>
                )}
              </div>
            )}
          </Block>

          {/* B5: Troca */}
          <Block num="5" title="Troca"
            sub={comTroca ? `${trocaModelo || '—'} · ${fmt(valorTroca)}` : 'Sem troca'}
            badge={comTroca && valorTroca > 0 ? <Badge color="yellow">− {fmt(valorTroca)}</Badge> : undefined}
            open={!!open.b5} onToggle={() => tog('b5')}>
            <div className="mt-1">
              <div
                className="flex items-center gap-2.5 cursor-pointer mb-3"
                onClick={() => { setComTroca(!comTroca); setTrocaConfirmada(false) }}>
                <div className={`w-9 h-5 rounded-full relative transition-colors flex-shrink-0 ${comTroca ? 'bg-[#4f7eff]' : 'bg-white/10'}`}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${comTroca ? 'left-4' : 'left-0.5'}`} />
                </div>
                <span className="text-sm text-white">Cliente entrega aparelho na troca</span>
              </div>

              {comTroca && (
                <div className="space-y-3">
                  {trocaConfirmada ? (
                    /* Confirmed card */
                    <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/8">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-1">
                            ✓ Aparelho incluído na troca
                          </p>
                          <p className="text-sm font-bold text-white">{trocaModelo} · {trocaEstado}</p>
                          {trocaBateria && <p className="text-xs text-white/40">Bateria: {trocaBateria}%</p>}
                          {trocaObs && <p className="text-xs text-white/40 italic">{trocaObs}</p>}
                          <p className="text-base font-black text-emerald-400 mt-1">− {fmt(valorTroca)}</p>
                        </div>
                        <button onClick={() => setTrocaConfirmada(false)}
                          className="text-[10px] px-3 py-1.5 bg-white/8 hover:bg-white/12 text-white/50 rounded-lg transition-colors flex-shrink-0">
                          Editar
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Input fields */
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="label">Modelo *</label>
                        <input value={trocaModelo} onChange={e => setTrocaModelo(e.target.value)}
                          placeholder="Ex: iPhone 13" className="inp" />
                      </div>
                      <div>
                        <label className="label">IMEI (opcional)</label>
                        <input value={trocaImei} onChange={e => setTrocaImei(e.target.value)}
                          placeholder="15 dígitos" className="inp" />
                      </div>
                      <div>
                        <label className="label">Estado</label>
                        <div className="grid grid-cols-4 gap-1.5">
                          {['excelente', 'bom', 'regular', 'ruim'].map(e => (
                            <button key={e} onClick={() => setTrocaEstado(e)}
                              className={`py-1.5 rounded-lg text-[11px] font-medium capitalize transition-colors ${trocaEstado === e ? 'bg-[#4f7eff] text-white' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}>
                              {e}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="label">Bateria (%)</label>
                        <input type="number" value={trocaBateria} onChange={e => setTrocaBateria(e.target.value)}
                          placeholder="85" className="inp" />
                      </div>
                      <div className="col-span-2">
                        <div className="p-3 rounded-xl bg-white/3 border border-white/8">
                          <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">Valor negociado (R$)</p>
                          <input
                            inputMode="decimal"
                            value={trocaValor}
                            onChange={e => setTrocaValor(e.target.value.replace(',', '.'))}
                            placeholder="2800"
                            className="w-full bg-transparent text-xl font-black text-emerald-400 outline-none placeholder:text-emerald-400/30"
                          />
                        </div>
                      </div>
                      <div className="col-span-2">
                        <label className="label">Observações técnicas</label>
                        <textarea value={trocaObs} onChange={e => setTrocaObs(e.target.value)}
                          placeholder="Ex: tela trincada no canto, Face ID funcionando, carregador original incluído..."
                          rows={2}
                          className="inp resize-none" />
                      </div>
                      <div className="col-span-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (!trocaModelo.trim() || !(parseFloat(trocaValor) > 0)) return
                            setTrocaConfirmada(true)
                          }}
                          className={`w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-500 hover:opacity-90 text-white text-sm font-semibold rounded-xl transition-opacity ${(!trocaModelo.trim() || !(parseFloat(trocaValor) > 0)) ? 'opacity-30 cursor-not-allowed' : ''}`}>
                          <Smartphone size={14} />Incluir Aparelho na Troca
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Block>

          {/* B6: Acessórios */}
          <Block num="6" title="Acessórios"
            sub={acessoriosSel.length > 0 ? `${acessoriosSel.length} item(ns) · ${fmt(acTotal)}` : 'Nenhum'}
            badge={acessoriosSel.length > 0 ? <Badge color="green">{fmt(acTotal)}</Badge> : undefined}
            open={!!open.b6} onToggle={() => tog('b6')}>
            <div className="grid grid-cols-3 gap-2 mb-3 mt-1">
              <div className="col-span-2">
                <label className="label">Acessório</label>
                <select value={acSelId} onChange={e => setAcSelId(e.target.value)} className="inp">
                  <option value="">Selecione...</option>
                  {acessorios.map((a: any) => <option key={a.id} value={a.id}>{a.nome} — {fmt(a.preco)}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Qtd</label>
                <div className="flex gap-1.5">
                  <input type="number" min="1" value={acQtd} onChange={e => setAcQtd(e.target.value)} className="inp" />
                  <button onClick={addAcessorio}
                    className="flex-shrink-0 w-10 h-10 bg-[#4f7eff] rounded-xl flex items-center justify-center hover:opacity-90">
                    <Plus size={14} className="text-white" />
                  </button>
                </div>
              </div>
            </div>

            {acessoriosSel.length > 0 && (
              <div className="space-y-2">
                {acessoriosSel.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 bg-white/3 border border-white/8 rounded-xl px-3 py-2">
                    <span className="text-sm text-white flex-1">{a.nome} <span className="text-white/30">x{a.quantidade}</span></span>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-white/30">R$</span>
                      <input type="number" value={a.preco} onChange={e => updateAcPreco(a.id, parseFloat(e.target.value) || 0)}
                        className="w-20 bg-white/10 border border-white/10 rounded-lg px-2 py-1 text-xs font-bold text-[#4f7eff] text-right outline-none" />
                    </div>
                    <span className="text-xs font-mono text-[#4f7eff] w-20 text-right">{fmt(a.preco * a.quantidade)}</span>
                    <button onClick={() => removeAcessorio(a.id)} className="text-white/25 hover:text-red-400">
                      <X size={13} />
                    </button>
                  </div>
                ))}
                <div className="flex justify-between items-center px-3 py-2 rounded-xl bg-[#4f7eff]/10 border border-[#4f7eff]/20">
                  <span className="text-xs text-white/50">Total acessórios</span>
                  <span className="text-sm font-bold text-[#4f7eff]">{fmt(acTotal)}</span>
                </div>
                <p className="text-[10px] text-white/25">💡 Zere o preço de um acessório para dar de brinde.</p>
              </div>
            )}
          </Block>

          {/* B7: Calculadora inline */}
          <Block num="7" title="Calculadora"
            sub="Resumo da negociação"
            badge={<Badge color={clientePaga > 0 ? 'blue' : 'green'}>{fmt(clientePaga)}</Badge>}
            open={!!open.b7} onToggle={() => tog('b7')}>
            <div className="flex items-center justify-center gap-4 py-4 mt-1 flex-wrap">
              <div className="text-center">
                <p className="text-xl font-black text-[#4f7eff]">{fmt(preco)}</p>
                <p className="text-[10px] text-white/30 mt-0.5">Produto</p>
              </div>
              {comTroca && valorTroca > 0 && <>
                <span className="text-white/30 font-bold">−</span>
                <div className="text-center">
                  <p className="text-xl font-black text-emerald-400">{fmt(valorTroca)}</p>
                  <p className="text-[10px] text-white/30 mt-0.5">Troca</p>
                </div>
              </>}
              {acTotal > 0 && <>
                <span className="text-white/30 font-bold">+</span>
                <div className="text-center">
                  <p className="text-xl font-black text-[#4f7eff]">{fmt(acTotal)}</p>
                  <p className="text-[10px] text-white/30 mt-0.5">Acessórios</p>
                </div>
              </>}
              <span className="text-white/30 font-bold">=</span>
              <div className="text-center bg-[#4f7eff]/10 border border-[#4f7eff]/20 rounded-2xl px-5 py-3">
                <p className="text-2xl font-black text-[#4f7eff]">{fmt(clientePaga)}</p>
                <p className="text-[10px] text-white/30 mt-0.5">Cliente Paga</p>
              </div>
            </div>
            {perfil === 'loja_admin' && aparelho && (
              <div className="mt-2 p-3 rounded-xl bg-yellow-500/8 border border-yellow-500/20">
                <p className="text-[9px] font-bold uppercase tracking-wider text-yellow-400 mb-2">⚠ Dados internos — somente admin</p>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-sm font-bold text-yellow-400">{fmt(lucro)}</p>
                    <p className="text-[9px] text-white/30">Lucro Estimado</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-yellow-400">{clientePaga > 0 ? (lucro / clientePaga * 100).toFixed(1) : 0}%</p>
                    <p className="text-[9px] text-white/30">Margem</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-red-400">{fmt(custoAp)}</p>
                    <p className="text-[9px] text-white/30">Custo Produto</p>
                  </div>
                </div>
              </div>
            )}
          </Block>

          {/* B8: Pagamento */}
          <Block num="8" title="Pagamento"
            sub={totalPago > 0 ? `${fmt(totalPago)} registrado` : 'Preencher após fechar negociação'}
            badge={totalPago > 0 ? <Badge color={Math.abs(diffPgto) < 1 ? 'green' : 'yellow'}>{Math.abs(diffPgto) < 1 ? '✓ Ok' : `Diff: ${fmt(diffPgto)}`}</Badge> : undefined}
            open={!!open.b8} onToggle={() => tog('b8')}>
            <p className="text-[11px] text-white/40 mb-3 mt-1">Informe os valores por forma de pagamento. Deixe em branco o que não usar.</p>
            <div className="space-y-2">
              {(['pix', 'dinheiro', 'debito', 'credito', 'transferencia'] as const).map(key => (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-xs text-white/50 w-24 capitalize">
                    {key === 'transferencia' ? 'Transferência' : key === 'debito' ? 'Débito' : key === 'credito' ? 'Crédito' : key === 'pix' ? 'PIX' : 'Dinheiro'}
                  </span>
                  <span className="text-xs text-white/30">R$</span>
                  <input type="number" value={pgtos[key]} onChange={e => setPgtos(p => ({ ...p, [key]: e.target.value }))}
                    placeholder="0" className="flex-1 inp" />
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/8">
              <span className="text-xs text-white/40">Total informado</span>
              <span className="text-sm font-bold text-white">{fmt(totalPago)}</span>
            </div>
          </Block>

          {/* B9: Custos Operacionais */}
          <Block num="9" title="Custos Operacionais"
            sub={custos.length > 0 ? `${custos.length} custo(s) · ${fmt(custoTotal)}` : 'Opcional — motoboy, frete etc.'}
            badge={custoTotal > 0 ? <Badge color="red">− {fmt(custoTotal)}</Badge> : undefined}
            open={!!open.b9} onToggle={() => tog('b9')}>
            <p className="text-[10px] text-white/30 mb-3 mt-1 italic">Custos da negociação, não do vendedor. Usados em análise financeira.</p>
            {custos.map((c, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <select value={c.tipo} onChange={e => setCustos(p => p.map((x, j) => j === i ? { ...x, tipo: e.target.value } : x))} className="inp w-32">
                  {['Motoboy', 'Uber', 'Frete', 'Estacionamento', 'Outro'].map(t => <option key={t}>{t}</option>)}
                </select>
                <input type="number" value={c.valor} onChange={e => setCustos(p => p.map((x, j) => j === i ? { ...x, valor: e.target.value } : x))}
                  placeholder="R$" className="inp w-24" />
                <input value={c.obs} onChange={e => setCustos(p => p.map((x, j) => j === i ? { ...x, obs: e.target.value } : x))}
                  placeholder="Observação" className="inp flex-1" />
                <button onClick={() => removeCusto(i)} className="text-white/25 hover:text-red-400"><X size={14} /></button>
              </div>
            ))}
            <button onClick={addCusto} className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white transition-colors mt-1">
              <Plus size={12} />Adicionar custo
            </button>
          </Block>

          {/* B10: Garantia */}
          <Block num="10" title="Garantia"
            sub={garantia}
            open={!!open.b10} onToggle={() => tog('b10')}>
            <div className="flex flex-wrap gap-2 mb-3 mt-1">
              {['Sem garantia', 'Garantia Apple ativa', 'Garantia Loja 30 dias', 'Garantia Loja 90 dias', 'Personalizada'].map(g => (
                <button key={g} onClick={() => setGarantia(g)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${garantia === g ? 'border-[#4f7eff] bg-[#4f7eff]/15 text-[#4f7eff]' : 'border-white/10 text-white/50 hover:border-white/20'}`}>
                  {g}
                </button>
              ))}
            </div>
            {(garantia === 'Garantia Apple ativa' || garantia === 'Personalizada') && (
              <div>
                <label className="label">Data / descrição</label>
                <input value={garantiaValidade} onChange={e => setGarantiaValidade(e.target.value)}
                  placeholder={garantia === 'Garantia Apple ativa' ? 'Data de validade' : 'Ex: 6 meses a partir da compra'}
                  className="inp" />
              </div>
            )}
          </Block>

          {/* B11: Situação */}
          <Block num="11" title="Situação da Negociação"
            sub={statusVenda}
            badge={<Badge color={statusVenda === 'Convertido em Venda' ? 'green' : statusVenda === 'Perdido' ? 'red' : 'yellow'}>{statusVenda}</Badge>}
            open={!!open.b11} onToggle={() => tog('b11')}>
            <div className="flex flex-wrap gap-2 mt-1">
              {['Orçamento', 'Aguardando Cliente', 'Aprovado', 'Perdido', 'Convertido em Venda'].map(s => (
                <button key={s} onClick={() => setStatusVenda(s)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${statusVenda === s ? 'border-[#4f7eff] bg-[#4f7eff]/15 text-[#4f7eff]' : 'border-white/10 text-white/50 hover:border-white/20'}`}>
                  {s}
                </button>
              ))}
            </div>
          </Block>

          {/* Action footer */}
          <div className="flex gap-3 mt-2 pt-2">
            {isEditMode ? (
              <>
                <button onClick={() => salvar('orcamento')} disabled={salvando || !clienteNome || !aparelhoId}
                  className="flex-1 py-2.5 border border-white/15 text-white text-sm rounded-xl hover:bg-white/5 disabled:opacity-30 transition-colors">
                  {salvando ? 'Salvando...' : '💾 Salvar Orçamento'}
                </button>
                <button onClick={iniciarFechamento} disabled={salvando || !clienteNome || !aparelhoId}
                  className="flex-1 py-2.5 bg-emerald-500 hover:opacity-90 text-white text-sm font-semibold rounded-xl disabled:opacity-30 transition-opacity">
                  <Check size={14} className="inline mr-1.5" />{salvando ? 'Salvando...' : 'Converter em Venda'}
                </button>
              </>
            ) : (
              <>
                <button onClick={verOrcamento} disabled={!clienteNome || !aparelhoId}
                  className="flex-1 py-2.5 border border-white/15 text-white text-sm rounded-xl hover:bg-white/5 disabled:opacity-30 transition-colors">
                  📄 Ver Orçamento
                </button>
                <button onClick={iniciarFechamento} disabled={salvando || !clienteNome || !aparelhoId}
                  className="flex-1 py-2.5 bg-emerald-500 hover:opacity-90 text-white text-sm font-semibold rounded-xl disabled:opacity-30 transition-opacity">
                  <Check size={14} className="inline mr-1.5" />{salvando ? 'Salvando...' : 'Fechar Venda'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Right: summary panel (desktop) + sticky bar (mobile) ── */}
      <div className="hidden lg:flex w-64 p-4 flex-col overflow-y-auto flex-shrink-0" style={{ borderLeft: '1px solid var(--app-hairline)' }}>
        <ResumoPanel {...resumoProps} />
      </div>
      <ResumoMobileBar {...resumoProps} />

      <style jsx global>{`
        .inp {
          width: 100%;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 0.625rem;
          padding: 0.5rem 0.875rem;
          color: white;
          font-size: 0.8125rem;
          outline: none;
        }
        .inp:focus { border-color: #4f7eff; }
        .inp::placeholder { color: rgba(255,255,255,0.2); }
        .inp option { background: #0e1018; }
        .label {
          display: block;
          font-size: 0.625rem;
          font-weight: 600;
          color: rgba(255,255,255,0.4);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.375rem;
        }
      `}</style>
    </div>
  )
}

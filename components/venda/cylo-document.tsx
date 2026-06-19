import { ShieldCheck } from 'lucide-react'
import { fmt } from '@/lib/utils/format'

export type DocEstado = 'proposta' | 'concluida'

interface AcessorioItem { id: string; nome: string; preco: number; custo: number; quantidade: number }

interface LojaInfo {
  nome: string
  logo_url: string | null
  cor_primaria: string
  whatsapp: string | null
  instagram: string | null
  endereco: string | null
}

export interface CyloDocumentProps {
  estado: DocEstado
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
}

const ESTADO_LABEL: Record<DocEstado, string> = {
  proposta: 'Proposta comercial',
  concluida: 'Venda concluída',
}

const PGTO_LABEL: Record<string, string> = {
  pix: 'PIX', dinheiro: 'Dinheiro', debito: 'Débito',
  credito: 'Crédito', transferencia: 'Transferência',
}

export default function CyloDocument({
  estado, loja, clienteNome, clienteTel, aparelho, preco,
  comTroca, trocaModelo, trocaEstado, trocaBateria, trocaImei, trocaObs, valorTroca,
  acessoriosSel, acTotal, clientePaga, pgtos, garantia, garantiaValidade, vendedorNome,
}: CyloDocumentProps) {
  const cor = loja.cor_primaria || '#4f7eff'
  const lojaIni = (loja.nome || '').slice(0, 2).toUpperCase()
  const hoje = new Date().toLocaleDateString('pt-BR')
  const pgtoEntries = Object.entries(pgtos).filter(([, v]) => parseFloat(v) > 0)
  const nomeProd = aparelho ? [aparelho.modelo, aparelho.capacidade, aparelho.cor].filter(Boolean).join(' ') : ''

  return (
    <div className="bg-white text-gray-900" style={{ fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,sans-serif' }}>
      {/* Accent hairline — único uso forte da cor da loja */}
      <div className="h-[3px] w-full" style={{ background: cor }} />

      <div className="px-8 sm:px-10 py-8 sm:py-9">

        {/* ── Cabeçalho: marca da loja + estado ── */}
        <div className="flex items-start justify-between gap-6 pb-6" style={{ borderBottom: '1px solid #f1f1f3' }}>
          <div className="flex items-center gap-3">
            {loja.logo_url ? (
              <img src={loja.logo_url} alt={loja.nome} className="w-11 h-11 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-semibold text-white flex-shrink-0" style={{ background: cor }}>
                {lojaIni}
              </div>
            )}
            <div>
              <p className="text-[14px] font-semibold text-gray-900 leading-tight">{loja.nome}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {[loja.whatsapp, loja.instagram].filter(Boolean).join(' · ') || loja.endereco || ' '}
              </p>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-gray-500 uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: cor }} />
              {ESTADO_LABEL[estado]}
            </span>
            <p className="text-[11px] text-gray-400 mt-1.5">{hoje}</p>
          </div>
        </div>

        {/* ── Cliente ── */}
        <div className="py-6" style={{ borderBottom: '1px solid #f1f1f3' }}>
          <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1.5">Para</p>
          <p className="text-[16px] font-medium text-gray-900">{clienteNome}</p>
          {clienteTel && <p className="text-[13px] text-gray-400 mt-0.5">{clienteTel}</p>}
        </div>

        {/* ── Produto (hero) ── */}
        <div className="py-6 space-y-4" style={{ borderBottom: '1px solid #f1f1f3' }}>
          {aparelho && (
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[17px] font-semibold text-gray-900 leading-snug">{nomeProd}</p>
                {aparelho.imei && <p className="text-[12px] text-gray-400 font-mono mt-1">IMEI {aparelho.imei}</p>}
              </div>
              <p className="text-[16px] font-medium text-gray-900 tabular-nums flex-shrink-0">{fmt(preco)}</p>
            </div>
          )}

          {comTroca && valorTroca > 0 && (
            <div className="flex items-start justify-between gap-4 pl-4" style={{ borderLeft: '2px solid #f1f1f3' }}>
              <div>
                <p className="text-[13px] text-gray-500">Entrada — {trocaModelo}</p>
                {trocaEstado && <p className="text-[11px] text-gray-400 mt-0.5 capitalize">{trocaEstado}{trocaBateria ? ` · ${trocaBateria}%` : ''}</p>}
                {trocaImei && <p className="text-[11px] text-gray-400 font-mono mt-0.5">IMEI {trocaImei}</p>}
                {trocaObs && <p className="text-[11px] text-gray-400 mt-0.5 italic">{trocaObs}</p>}
              </div>
              <p className="text-[14px] font-medium text-gray-500 tabular-nums flex-shrink-0">− {fmt(valorTroca)}</p>
            </div>
          )}

          {acessoriosSel.map(a => (
            <div key={a.id} className="flex items-center justify-between gap-4">
              <p className="text-[13px] text-gray-500">{a.nome}{a.quantidade > 1 ? <span className="text-gray-400"> × {a.quantidade}</span> : ''}</p>
              <p className="text-[13px] text-gray-700 tabular-nums">{fmt(a.preco * a.quantidade)}</p>
            </div>
          ))}
        </div>

        {/* ── Pagamento ── */}
        {pgtoEntries.length > 0 && (
          <div className="py-5 space-y-2" style={{ borderBottom: '1px solid #f1f1f3' }}>
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-2">Forma de pagamento</p>
            {pgtoEntries.map(([k, v]) => (
              <div key={k} className="flex items-center justify-between">
                <p className="text-[13px] text-gray-500">{PGTO_LABEL[k]}</p>
                <p className="text-[13px] text-gray-700 tabular-nums">{fmt(parseFloat(v))}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Total — o momento de foco ── */}
        <div className="mt-6 rounded-2xl px-6 py-5 flex items-center justify-between" style={{ background: '#0a0a0c' }}>
          <span className="text-[11px] font-medium text-white/40 uppercase tracking-wider">Total</span>
          <span className="text-[30px] font-semibold text-white tabular-nums leading-none">{fmt(clientePaga)}</span>
        </div>

        {/* ── Garantia ── */}
        {garantia && garantia !== 'Sem garantia' && (
          <div className="mt-4 flex items-center gap-3 px-4 py-3.5 rounded-xl" style={{ background: '#fafafa' }}>
            <ShieldCheck size={16} className="text-gray-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-[13px] font-medium text-gray-700">{garantia}</p>
            </div>
            {garantiaValidade && <p className="text-[11px] text-gray-400 flex-shrink-0">até {garantiaValidade}</p>}
          </div>
        )}

        {/* ── Rodapé ── */}
        <div className="pt-7 mt-2 text-center">
          <p className="text-[10px] text-gray-300 tracking-wider">
            {loja.nome}{vendedorNome ? ` · ${vendedorNome}` : ''}
          </p>
          <p className="text-[9px] text-gray-200 tracking-wider uppercase mt-1">via Cylo</p>
        </div>
      </div>
    </div>
  )
}

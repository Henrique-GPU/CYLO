'use client'
import { fmt } from '@/lib/utils/format'
import { X, MessageCircle, Printer, CheckCircle2, Clock } from 'lucide-react'

interface Doc2Props {
  tipo: 'orcamento' | 'recibo'
  venda: any
  loja: any
  onClose: () => void
}

export default function Doc2({ tipo, venda, loja, onClose }: Doc2Props) {
  const isRecibo = tipo === 'recibo'
  const titulo = isRecibo ? 'RECIBO DE VENDA' : 'ORÇAMENTO'
  const ap = venda.aparelhos ?? null
  const acessorios: any[] = venda.venda_acessorios ?? []
  const cor = loja.cor_primaria ?? '#4f7eff'

  const pgtos: { label: string; valor: number }[] = []
  if (venda.pgto_pix > 0) pgtos.push({ label: 'PIX', valor: venda.pgto_pix })
  if (venda.pgto_dinheiro > 0) pgtos.push({ label: 'Dinheiro', valor: venda.pgto_dinheiro })
  if (venda.pgto_debito > 0) pgtos.push({ label: 'Débito', valor: venda.pgto_debito })
  if (venda.pgto_credito > 0) pgtos.push({ label: 'Crédito', valor: venda.pgto_credito })
  if (venda.pgto_transferencia > 0) pgtos.push({ label: 'Transferência', valor: venda.pgto_transferencia })

  const dataBr = venda.data_venda
    ? new Date(venda.data_venda + 'T12:00:00').toLocaleDateString('pt-BR')
    : '–'
  const garantiaValBr = venda.garantia_validade
    ? new Date(venda.garantia_validade + 'T12:00:00').toLocaleDateString('pt-BR')
    : null

  function copiarWhatsApp() {
    let txt = `*${titulo}*\n`
    txt += `━━━━━━━━━━━━━━━━\n`
    txt += `📱 *${loja.nome}*\n`
    if (loja.whatsapp) txt += `WhatsApp: ${loja.whatsapp}\n`
    txt += `\n*Cliente:* ${venda.cliente_nome}\n`
    if (venda.cliente_telefone) txt += `*Fone:* ${venda.cliente_telefone}\n`
    txt += `*Data:* ${dataBr}\n`
    if (ap) {
      txt += `\n*Aparelho:* ${ap.modelo}${ap.capacidade ? ` ${ap.capacidade}` : ''}${ap.cor ? ` · ${ap.cor}` : ''}\n`
      if (ap.imei) txt += `*IMEI:* ${ap.imei}\n`
    }
    if (venda.com_troca && venda.troca_modelo) {
      txt += `\n*Troca:* ${venda.troca_modelo} (- ${fmt(venda.troca_valor ?? 0)})\n`
    }
    if (acessorios.length) {
      txt += `\n*Acessórios:*\n`
      acessorios.forEach((a: any) => {
        txt += `  • ${a.nome}${a.quantidade > 1 ? ` x${a.quantidade}` : ''} — ${fmt(a.preco_unitario * a.quantidade)}\n`
      })
    }
    if (pgtos.length) {
      txt += `\n*Pagamento:*\n`
      pgtos.forEach(p => { txt += `  • ${p.label}: ${fmt(p.valor)}\n` })
    }
    txt += `\n*TOTAL: ${fmt(venda.valor_total)}*\n`
    if (venda.garantia) {
      txt += `\n*Garantia:* ${venda.garantia} dias`
      if (garantiaValBr) txt += ` (até ${garantiaValBr})`
      txt += '\n'
    }
    navigator.clipboard.writeText(txt).then(() => alert('Copiado! Cole no WhatsApp.'))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm print:bg-white print:p-0 print:block">
      <div className="relative bg-white rounded-3xl w-full max-w-md max-h-[92vh] overflow-y-auto shadow-2xl print:shadow-none print:rounded-none print:max-h-none">

        {/* Toolbar */}
        <div className="sticky top-0 bg-white/95 backdrop-blur border-b border-gray-100 px-5 py-3 flex items-center justify-between rounded-t-3xl z-10 print:hidden">
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">{titulo}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={copiarWhatsApp}
              className="flex items-center gap-1.5 text-xs bg-[#25D366] text-white px-3 py-1.5 rounded-full font-medium hover:opacity-90 transition-opacity"
            >
              <MessageCircle size={11} />WhatsApp
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 text-xs bg-gray-900 text-white px-3 py-1.5 rounded-full font-medium hover:opacity-90 transition-opacity"
            >
              <Printer size={11} />Imprimir
            </button>
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors ml-1">
              <X size={14} className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* Document body */}
        <div className="px-8 pb-8">

          {/* ── Brand header ── */}
          <div className="pt-8 pb-6 flex items-start justify-between border-b border-gray-100">
            <div className="flex-1">
              {loja.logo_url ? (
                <img
                  src={loja.logo_url}
                  alt={loja.nome}
                  className="h-36 max-w-[240px] object-contain mb-4"
                  onError={e => {
                    const t = e.currentTarget
                    t.style.display = 'none'
                    const fb = t.nextElementSibling as HTMLElement | null
                    if (fb) fb.style.display = 'flex'
                  }}
                />
              ) : null}
              <div
                className="w-14 h-14 rounded-2xl mb-4 flex items-center justify-center text-xl font-black text-white"
                style={{ backgroundColor: cor, display: loja.logo_url ? 'none' : 'flex' }}
              >
                {loja.nome?.slice(0, 2).toUpperCase()}
              </div>
              <p className="text-[15px] font-bold text-gray-900 leading-tight">{loja.nome}</p>
              <div className="mt-1 space-y-0.5">
                {loja.whatsapp && <p className="text-xs text-gray-400">{loja.whatsapp}</p>}
                {loja.instagram && <p className="text-xs text-gray-400">{loja.instagram}</p>}
                {loja.endereco && <p className="text-xs text-gray-400">{loja.endereco}</p>}
              </div>
            </div>
            <div className="text-right ml-6 flex-shrink-0">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2">{titulo}</p>
              {isRecibo ? (
                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full border border-emerald-100">
                  <CheckCircle2 size={10} />Pago
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-600 text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full border border-amber-100">
                  <Clock size={10} />Aguardando
                </span>
              )}
              <p className="text-xs text-gray-400 mt-2">{dataBr}</p>
            </div>
          </div>

          {/* ── Cliente ── */}
          <div className="py-5 border-b border-gray-100">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Para</p>
            <p className="text-[15px] font-semibold text-gray-900">{venda.cliente_nome}</p>
            {venda.cliente_telefone && <p className="text-sm text-gray-400 mt-0.5">{venda.cliente_telefone}</p>}
          </div>

          {/* ── Itens ── */}
          <div className="py-5 space-y-4 border-b border-gray-100">

            {/* Aparelho */}
            {ap && (
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-[14px] font-semibold text-gray-900">
                    {ap.modelo}{ap.capacidade ? ` ${ap.capacidade}` : ''}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {ap.cor && ap.cor}
                    {ap.cor && ap.imei && ' · '}
                    {ap.imei && <span className="font-mono">IMEI {ap.imei}</span>}
                  </p>
                </div>
                <p className="text-[14px] font-semibold text-gray-900 tabular-nums">
                  {fmt(venda.valor_aparelho ?? venda.valor_total)}
                </p>
              </div>
            )}

            {/* Troca */}
            {venda.com_troca && venda.troca_modelo && (
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-[13px] text-gray-500">Troca — {venda.troca_modelo}</p>
                  {venda.troca_estado && <p className="text-xs text-gray-400 mt-0.5 capitalize">{venda.troca_estado}</p>}
                </div>
                <p className="text-[14px] font-semibold text-amber-500 tabular-nums">
                  − {fmt(venda.troca_valor ?? 0)}
                </p>
              </div>
            )}

            {/* Acessórios */}
            {acessorios.map((a: any, i: number) => (
              <div key={i} className="flex items-center justify-between gap-4">
                <p className="text-[13px] text-gray-600">
                  {a.nome}{a.quantidade > 1 ? <span className="text-gray-400"> × {a.quantidade}</span> : ''}
                </p>
                <p className="text-[13px] text-gray-900 tabular-nums">{fmt(a.preco_unitario * a.quantidade)}</p>
              </div>
            ))}
          </div>

          {/* ── Pagamento ── */}
          {pgtos.length > 0 && (
            <div className="py-5 border-b border-gray-100 space-y-2">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Pagamento</p>
              {pgtos.map((p, i) => (
                <div key={i} className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">{p.label}</p>
                  <p className="text-sm text-gray-700 tabular-nums">{fmt(p.valor)}</p>
                </div>
              ))}
            </div>
          )}

          {/* ── Total ── */}
          <div className="mt-5 rounded-2xl bg-gray-950 px-6 py-5 flex items-center justify-between">
            <span className="text-xs font-semibold text-white/40 uppercase tracking-widest">Total</span>
            <span className="text-[28px] font-black text-white tabular-nums leading-none">
              {fmt(venda.valor_total)}
            </span>
          </div>

          {/* ── Garantia ── */}
          {venda.garantia && (
            <div className="mt-4 flex items-center justify-between px-4 py-3 rounded-xl bg-gray-50 border border-gray-100">
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-0.5">Garantia</p>
                <p className="text-sm font-semibold text-gray-700">{venda.garantia} dias</p>
              </div>
              {garantiaValBr && <p className="text-xs text-gray-400">até {garantiaValBr}</p>}
            </div>
          )}

          {/* ── Footer ── */}
          <div className="mt-8 text-center">
            <p className="text-xs font-medium text-gray-300">{loja.nome}</p>
            {loja.whatsapp && <p className="text-xs text-gray-200 mt-0.5">{loja.whatsapp}</p>}
            <p className="text-[9px] text-gray-200 mt-4 tracking-widest uppercase">Gerado pelo CYLO</p>
          </div>

        </div>
      </div>
    </div>
  )
}

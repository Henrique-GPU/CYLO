import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { fmt } from '@/lib/utils/format'
import Link from 'next/link'
import { ArrowLeft, Package } from 'lucide-react'

function daysSince(date: string | null): number {
  if (!date) return 0
  return Math.floor((Date.now() - new Date(date).getTime()) / 86400000)
}

const STATUS_LABEL: Record<string, string> = {
  disponivel: 'Disponível', reservado: 'Reservado', vendido: 'Vendido',
  manutencao: 'Manutenção', negociacao: 'Em Negociação', em_analise: 'Em Análise',
}
const STATUS_COLOR: Record<string, string> = {
  disponivel: 'bg-emerald-500/15 text-emerald-400',
  reservado: 'bg-amber-500/15 text-amber-400',
  vendido: 'bg-white/8 text-white/30',
  manutencao: 'bg-red-500/15 text-red-400',
  negociacao: 'bg-blue-500/15 text-blue-400',
  em_analise: 'bg-purple-500/15 text-purple-400',
}

export default async function AparelhoPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usuario } = await supabase
    .from('usuarios').select('loja_id, perfil').eq('id', user.id)
    .single<{ loja_id: string; perfil: string }>()

  if (!usuario?.loja_id) redirect('/dashboard')

  const { data: ap } = await supabase
    .from('aparelhos').select('*')
    .eq('id', params.id).eq('loja_id', usuario.loja_id)
    .single()

  if (!ap) notFound()

  const isAdmin = usuario.perfil !== 'vendedor'
  const dias = daysSince(ap.data_entrada)
  const custo = ap.custo ?? 0
  const preco = ap.preco ?? 0
  const lucro = preco - custo
  const mg = preco > 0 ? (lucro / preco * 100).toFixed(1) : null
  const mgN = mg ? parseFloat(mg) : 0
  const mgColor = mgN > 25 ? '#34d399' : mgN > 15 ? '#fbbf24' : '#f87171'

  const Row = ({ label, value, highlight }: { label: string; value: React.ReactNode; highlight?: string }) => (
    <div className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
      <span className="text-xs text-white/40">{label}</span>
      <span className={`text-sm font-semibold ${highlight ?? 'text-white'}`}>{value}</span>
    </div>
  )

  return (
    <div className="p-8 max-w-2xl">
      <Link href="/estoque" className="flex items-center gap-2 text-white/40 hover:text-white text-sm mb-6 transition-colors">
        <ArrowLeft size={14} />Voltar ao estoque
      </Link>

      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(79,126,255,.1)' }}>
          <Package size={24} className="text-[#4f7eff]" />
        </div>
        <div>
          <h1 className="text-xl font-black text-white">{ap.modelo}</h1>
          <p className="text-sm text-white/50 mt-0.5">{ap.capacidade}{ap.cor ? ` · ${ap.cor}` : ''}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className={`text-xs px-2 py-0.5 rounded-md ${ap.tipo === 'novo' ? 'bg-blue-500/15 text-blue-400' : 'bg-amber-500/15 text-amber-400'}`}>
              {ap.tipo === 'novo' ? '📦 Lacrado' : '🔄 Usado'}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-md ${STATUS_COLOR[ap.status] ?? ''}`}>
              {STATUS_LABEL[ap.status]}
            </span>
            <span className="text-xs text-white/25">{dias}d no estoque</span>
          </div>
        </div>
      </div>

      {/* Ficha técnica */}
      <div className="bg-white/3 border border-white/8 rounded-2xl p-5 mb-4">
        <p className="text-xs font-bold uppercase tracking-wider text-white/30 mb-2">Identificação</p>
        <Row label="Modelo" value={ap.modelo} />
        {ap.imei && <Row label="IMEI" value={<span className="font-mono text-xs">{ap.imei}</span>} />}
        {ap.capacidade && <Row label="Capacidade" value={ap.capacidade} />}
        {ap.cor && <Row label="Cor" value={ap.cor} />}
        {ap.data_entrada && <Row label="Entrada em estoque" value={new Date(ap.data_entrada).toLocaleDateString('pt-BR')} />}
      </div>

      {/* Usado detail */}
      {ap.tipo === 'usado' && (
        <div className="bg-white/3 border border-white/8 rounded-2xl p-5 mb-4">
          <p className="text-xs font-bold uppercase tracking-wider text-white/30 mb-2">Condição</p>
          {ap.estado && <Row label="Estado" value={<span className="capitalize">{ap.estado}</span>} />}
          {ap.bateria_pct != null && (
            <div className="flex items-center justify-between py-2.5 border-b border-white/5">
              <span className="text-xs text-white/40">Bateria</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full rounded-full"
                    style={{
                      width: `${ap.bateria_pct}%`,
                      background: ap.bateria_pct >= 80 ? '#34d399' : ap.bateria_pct >= 60 ? '#fbbf24' : '#f87171'
                    }} />
                </div>
                <span className="text-sm font-semibold text-white">{ap.bateria_pct}%</span>
              </div>
            </div>
          )}
          {ap.origem_aparelho && <Row label="Origem" value={ap.origem_aparelho} />}
          {ap.extras && <Row label="Extras" value={ap.extras} />}
        </div>
      )}

      {/* Pricing — admin only */}
      {isAdmin && (
        <div className="bg-white/3 border border-white/8 rounded-2xl p-5 mb-4">
          <p className="text-xs font-bold uppercase tracking-wider text-white/30 mb-2">Financeiro</p>
          <Row label="Custo" value={fmt(custo)} highlight="text-red-400" />
          <Row label="Preço de venda" value={fmt(preco)} highlight="text-[#4f7eff]" />
          {mg && (
            <div className="flex items-center justify-between py-2.5">
              <span className="text-xs text-white/40">Margem</span>
              <div className="flex items-center gap-2">
                <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${Math.min(100, mgN)}%`, background: mgColor }} />
                </div>
                <span className="text-sm font-bold" style={{ color: mgColor }}>{mg}%</span>
              </div>
            </div>
          )}
          {preco > 0 && <Row label="Lucro estimado" value={fmt(lucro)} highlight={lucro >= 0 ? 'text-emerald-400' : 'text-red-400'} />}
        </div>
      )}

      {/* Precio visible to vendedor too */}
      {!isAdmin && (
        <div className="bg-white/3 border border-white/8 rounded-2xl p-5 mb-4">
          <p className="text-xs font-bold uppercase tracking-wider text-white/30 mb-2">Preço</p>
          <div className="text-3xl font-black text-[#4f7eff] mt-1">{fmt(preco)}</div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Link href="/estoque"
          className="flex-1 py-2.5 text-center border border-white/15 text-white/60 text-sm rounded-xl hover:bg-white/5 transition-colors">
          Voltar
        </Link>
        {ap.status === 'disponivel' && (
          <Link href={`/nova-venda`}
            className="flex-1 py-2.5 text-center bg-emerald-500 hover:opacity-90 text-white text-sm font-semibold rounded-xl transition-opacity">
            Vender este aparelho
          </Link>
        )}
      </div>
    </div>
  )
}

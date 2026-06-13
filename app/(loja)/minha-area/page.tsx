import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { fmt } from '@/lib/utils/format'
import { mesAtual } from '@/lib/utils/date'
import Link from 'next/link'
import { PlusCircle, Package, Calculator, FileText } from 'lucide-react'
import MinhaAreaVendas from './minha-area-vendas'

export default async function MinhaAreaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usuario } = await supabase
    .from('usuarios').select('nome, loja_id, meta_mensal, comissao_pct, iniciais')
    .eq('id', user.id)
    .single<{ nome: string; loja_id: string; meta_mensal: number | null; comissao_pct: number; iniciais: string | null }>()

  if (!usuario?.loja_id) redirect('/dashboard')

  const inicioMesStr = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

  const [vendasRes, lojaRes] = await Promise.all([
    supabase.from('vendas')
      .select('*, aparelhos(modelo, capacidade, cor, imei), venda_acessorios(nome, preco_unitario, custo_unitario, quantidade)')
      .eq('loja_id', usuario.loja_id)
      .eq('vendedor_id', user.id)
      .eq('status', 'convertido')
      .gte('data_venda', inicioMesStr)
      .order('data_venda', { ascending: false }),
    supabase.from('lojas').select('nome, whatsapp, instagram, endereco, cor_primaria')
      .eq('id', usuario.loja_id).single<any>(),
  ])

  const vendas = vendasRes.data ?? []
  const loja = lojaRes.data ?? {}

  const faturamento = vendas.reduce((s, v: any) => s + (v.valor_total ?? 0), 0)
  const comissao = vendas.reduce((s, v: any) => s + (v.comissao ?? 0), 0)
  const progresso = usuario.meta_mensal ? Math.min((faturamento / usuario.meta_mensal) * 100, 100) : null
  const primeiroNome = usuario.nome.split(' ')[0]
  const hora = new Date().getHours()
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'

  const quickActions = [
    { label: 'Nova Venda', href: '/nova-venda', icon: PlusCircle, color: 'bg-[var(--color-primary)]' },
    { label: 'Estoque', href: '/estoque', icon: Package, color: 'bg-white/5' },
    { label: 'Calculadora', href: '/calculadora', icon: Calculator, color: 'bg-white/5' },
    { label: 'Orçamentos', href: '/meus-orcamentos', icon: FileText, color: 'bg-white/5' },
  ]

  return (
    <div className="p-8 max-w-3xl">
      {/* Hero */}
      <div className="bg-white/5 border border-white/8 rounded-2xl p-7 mb-6">
        <p className="text-white/50 text-sm mb-1">{saudacao}, {primeiroNome}</p>
        <p className="text-5xl font-bold text-white tracking-tight mb-1">{fmt(faturamento)}</p>
        <p className="text-white/40 text-sm">
          {vendas.length} {vendas.length === 1 ? 'venda' : 'vendas'} · comissão {fmt(comissao)} em {mesAtual()}
        </p>

        {progresso !== null && usuario.meta_mensal && (
          <div className="mt-5">
            <div className="flex justify-between text-xs text-white/40 mb-1.5">
              <span>Meta mensal</span>
              <span>{progresso.toFixed(0)}% de {fmt(usuario.meta_mensal)}</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-[var(--color-primary)]" style={{ width: `${progresso}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-4 gap-3 mb-8">
        {quickActions.map(({ label, href, icon: Icon, color }) => (
          <Link
            key={href} href={href}
            className={`${color} border border-white/8 rounded-2xl p-4 flex flex-col items-center gap-2 hover:opacity-80 transition-opacity`}
          >
            <Icon size={20} className="text-white" />
            <span className="text-xs text-white/70 text-center">{label}</span>
          </Link>
        ))}
      </div>

      {/* Minhas vendas do mês */}
      <div className="mb-2">
        <p className="text-sm font-semibold text-white mb-4">Minhas vendas — {mesAtual()}</p>
      </div>
      <MinhaAreaVendas vendas={vendas} loja={loja} />
    </div>
  )
}

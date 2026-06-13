import { fmt } from '@/lib/utils/format'
import { mesAtual } from '@/lib/utils/date'

interface HeroExecutivoProps {
  nome: string
  faturamento: number
  vendas: number
  meta?: number
}

export default function HeroExecutivo({ nome, faturamento, vendas, meta }: HeroExecutivoProps) {
  const progresso = meta ? Math.min((faturamento / meta) * 100, 100) : null
  const primeiroNome = nome.split(' ')[0]

  const hora = new Date().getHours()
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'

  return (
    <div className="bg-white/5 border border-white/8 rounded-2xl p-7 mb-6">
      <p className="text-white/50 text-sm mb-1">{saudacao}, {primeiroNome}</p>
      <p className="text-5xl font-bold text-white tracking-tight mb-1">{fmt(faturamento)}</p>
      <p className="text-white/40 text-sm">{vendas} {vendas === 1 ? 'venda' : 'vendas'} em {mesAtual()}</p>

      {meta && progresso !== null && (
        <div className="mt-5">
          <div className="flex justify-between text-xs text-white/40 mb-1.5">
            <span>Meta mensal</span>
            <span>{progresso.toFixed(0)}% — {fmt(meta)}</span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-[var(--color-primary)] transition-all"
              style={{ width: `${progresso}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

import Link from 'next/link'

interface Props {
  status: 'trial' | 'ativa' | 'inadimplente' | 'cancelada'
  trialAte: string
}

const diasAte = (iso: string) => Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000))

// Banner no topo do app: dias restantes do teste ou aviso de cobrança falha.
export default function AssinaturaBanner({ status, trialAte }: Props) {
  if (status === 'inadimplente') {
    return (
      <div className="bg-red-500/15 border-b border-red-500/30 px-4 py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-center gap-1.5 sm:gap-3 text-center">
        <p className="text-xs sm:text-sm font-semibold text-red-300">
          Não conseguimos cobrar seu cartão. Atualize o pagamento para não perder o acesso.
        </p>
        <Link href="/assinar" className="text-xs font-black text-white bg-red-500 hover:bg-red-400 transition-colors px-3 py-1.5 rounded-lg self-center whitespace-nowrap">
          Atualizar pagamento
        </Link>
      </div>
    )
  }

  if (status !== 'trial') return null

  const dias = diasAte(trialAte)
  const urgente = dias <= 3
  const texto = dias === 0
    ? 'Seu teste grátis termina hoje.'
    : `Seu teste grátis termina em ${dias} ${dias === 1 ? 'dia' : 'dias'}.`

  return (
    <div className={`px-4 py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-center gap-1.5 sm:gap-3 text-center border-b ${
      urgente ? 'bg-amber-500/20 border-amber-500/40' : 'bg-[#4f7eff]/10 border-[#4f7eff]/20'
    }`}>
      <p className={`text-xs sm:text-sm ${urgente ? 'font-bold text-amber-200' : 'font-medium text-white/70'}`}>
        {texto}
      </p>
      <Link href="/assinar" className={`text-xs font-black transition-colors px-3 py-1.5 rounded-lg self-center whitespace-nowrap ${
        urgente ? 'bg-amber-400 hover:bg-amber-300 text-black' : 'bg-[#4f7eff] hover:bg-[#6b93ff] text-white'
      }`}>
        Assinar agora
      </Link>
    </div>
  )
}

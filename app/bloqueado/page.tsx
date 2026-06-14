import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const FOUNDER_WA = '5511999999999'
const WA_MSG = encodeURIComponent('Olá! Minha conta no Cylo está bloqueada/vencida. Gostaria de renovar.')
const WA_LINK = `https://wa.me/${FOUNDER_WA}?text=${WA_MSG}`

export default async function BloqueadoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usuario } = await supabase
    .from('usuarios').select('loja_id, nome, perfil').eq('id', user.id)
    .single<{ loja_id: string; nome: string; perfil: string }>()

  if (usuario?.perfil === 'ceo') redirect('/dashboard')

  const { data: loja } = await supabase
    .from('lojas').select('nome, status_saas, data_fim_trial, proximo_vencimento').eq('id', usuario?.loja_id ?? '').single<any>()

  const isTrialExpirado = loja?.status_saas === 'trial'
  const isBloqueado = loja?.status_saas === 'bloqueado'

  return (
    <div className="min-h-screen bg-[#080a0f] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[500px] bg-red-500/6 rounded-full blur-[130px]" />
      </div>

      <div className="relative z-10 max-w-md w-full text-center">
        <div className="text-5xl mb-6">{isBloqueado ? '🔒' : '⏰'}</div>

        <h1 className="text-2xl font-black text-white mb-3">
          {isBloqueado ? 'Conta bloqueada' : 'Período de trial encerrado'}
        </h1>

        <p className="text-white/40 text-sm leading-relaxed mb-2">
          {loja?.nome && <span className="text-white/60 font-medium">{loja.nome} · </span>}
          {isBloqueado
            ? 'Sua conta foi bloqueada. Entre em contato para regularizar o acesso.'
            : isTrialExpirado
            ? 'Seu trial de 14 dias chegou ao fim. Para continuar usando o Cylo, fale com o responsável.'
            : 'Seu acesso venceu. Renove para continuar usando o Cylo.'}
        </p>

        <div className="flex flex-col gap-3 mt-8">
          <a
            href={WA_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 bg-[#4f7eff] hover:bg-[#3d6eef] text-white font-bold rounded-2xl transition-colors text-sm flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.532 5.855L.073 23.927a.5.5 0 0 0 .612.612l6.072-1.459A11.938 11.938 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.927 0-3.732-.518-5.284-1.42l-.378-.223-3.924.943.943-3.924-.223-.378A9.938 9.938 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
            </svg>
            Falar com o suporte
          </a>

          <Link href="/configuracoes"
            className="w-full py-3 border border-white/10 text-white/40 hover:text-white/60 text-sm rounded-2xl transition-colors">
            Ver configurações da conta
          </Link>

          <form action="/api/auth/signout" method="POST">
            <button type="submit" className="w-full py-3 text-white/20 hover:text-white/40 text-sm transition-colors">
              Sair
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

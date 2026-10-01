'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const INTERVALO_MS = 3000
const LIMITE_MS = 60000

// Espera o webhook marcar a assinatura como 'ativa'. Não usa acesso_liberado:
// durante o trial ele já é true e redirecionaria antes do pagamento ser confirmado.
export default function AguardarPagamento() {
  const router = useRouter()
  const [expirou, setExpirou] = useState(false)
  const [tentativa, setTentativa] = useState(0)

  useEffect(() => {
    const supabase = createClient()
    const inicio = Date.now()
    let parado = false

    async function checar() {
      if (parado) return
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: usuario } = await supabase.from('usuarios').select('loja_id').eq('id', user.id).single<{ loja_id: string | null }>()
        if (usuario?.loja_id) {
          const { data } = await supabase.from('assinaturas').select('status').eq('loja_id', usuario.loja_id).single<{ status: string }>()
          if (data?.status === 'ativa') {
            parado = true
            router.replace('/dashboard')
            return
          }
        }
      }
      if (Date.now() - inicio >= LIMITE_MS) {
        parado = true
        setExpirou(true)
      }
    }

    checar()
    const timer = setInterval(checar, INTERVALO_MS)
    return () => {
      parado = true
      clearInterval(timer)
    }
  }, [router, tentativa])

  if (expirou) {
    return (
      <>
        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl mx-auto mb-6">⏳</div>
        <h1 className="text-2xl font-black text-white mb-2">Ainda estamos confirmando</h1>
        <p className="text-sm text-white/50 mb-6">
          Seu pagamento pode levar alguns minutos para ser confirmado pelo banco. Assim que ele chegar, seu acesso é liberado automaticamente.
        </p>
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => { setExpirou(false); setTentativa(t => t + 1) }}
            className="w-full py-3.5 bg-[#4f7eff] hover:bg-[#3d6eef] text-white font-bold rounded-xl transition-colors text-sm"
          >
            Verificar novamente
          </button>
          <Link href="/dashboard" className="block text-sm text-white/40 hover:text-white/70 transition-colors">
            Ir para o app
          </Link>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="w-16 h-16 rounded-2xl bg-[#4f7eff]/10 border border-[#4f7eff]/20 flex items-center justify-center mx-auto mb-6">
        <div className="w-7 h-7 border-2 border-[#4f7eff]/30 border-t-[#4f7eff] rounded-full animate-spin" />
      </div>
      <h1 className="text-2xl font-black text-white mb-2">Pagamento em processamento</h1>
      <p className="text-sm text-white/50">Estamos confirmando seu pagamento. Não feche esta página, você será levado ao app em instantes.</p>
    </>
  )
}

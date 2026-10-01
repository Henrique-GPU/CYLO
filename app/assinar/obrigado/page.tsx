import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AguardarPagamento from './aguardar-pagamento'

export default async function ObrigadoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-[#080a0f] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#4f7eff]/10 rounded-full blur-[130px]" />
      </div>
      <div className="relative z-10 w-full max-w-sm text-center">
        <div className="flex items-center justify-center gap-3 mb-10">
          <img src="/cylo-logo.svg" alt="CYLO" className="w-9 h-9" />
          <span className="text-white font-black text-xl tracking-tight">CYLO</span>
        </div>
        <AguardarPagamento />
      </div>
    </div>
  )
}

import { Wrench } from 'lucide-react'

export default function AssistenciaPage() {
  return (
    <div className="min-h-screen bg-[#0e1018] flex items-center justify-center px-6">
      <div className="max-w-sm w-full text-center">

        <div className="w-16 h-16 rounded-2xl bg-[#4f7eff]/10 border border-[#4f7eff]/20 flex items-center justify-center mx-auto mb-6">
          <Wrench size={28} className="text-[#4f7eff]" />
        </div>

        <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-1.5 mb-5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Em desenvolvimento</span>
        </div>

        <h1 className="text-2xl font-black text-white tracking-tight mb-3">
          Assistência Técnica
        </h1>
        <p className="text-white/40 text-sm leading-relaxed">
          Gestão completa de ordens de serviço — entrada de aparelhos, diagnóstico, peças trocadas e acompanhamento de status.
        </p>

        <div className="mt-8 grid grid-cols-2 gap-3 text-left">
          {[
            { icon: '📋', label: 'Ordens de Serviço' },
            { icon: '🔧', label: 'Peças e Serviços' },
            { icon: '📱', label: 'Histórico por IMEI' },
            { icon: '🧾', label: 'Recibo de OS' },
          ].map(({ icon, label }) => (
            <div key={label} className="bg-white/3 border border-white/6 rounded-xl px-4 py-3 flex items-center gap-3">
              <span className="text-base">{icon}</span>
              <span className="text-xs text-white/50 font-medium">{label}</span>
            </div>
          ))}
        </div>

        <p className="text-white/20 text-xs mt-8">Em breve disponível</p>
      </div>
    </div>
  )
}

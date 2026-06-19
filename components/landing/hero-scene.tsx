'use client'

import { motion } from 'framer-motion'

function FloatCard({
  className,
  delay,
  children,
}: {
  className: string
  delay: number
  children: React.ReactNode
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.7, ease: 'easeOut' }}
      className={className}
    >
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 5 + delay, repeat: Infinity, ease: 'easeInOut' }}
        className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-2xl shadow-xl shadow-[#4f7eff]/10 p-3.5"
      >
        {children}
      </motion.div>
    </motion.div>
  )
}

export default function HeroScene() {
  return (
    <div className="relative w-full h-[420px] sm:h-[480px] lg:h-[560px] [perspective:1600px]">
      {/* Notebook */}
      <motion.div
        initial={{ opacity: 0, rotateX: 20, y: 40 }}
        animate={{ opacity: 1, rotateX: 8, y: 0 }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
        style={{ transformStyle: 'preserve-3d' }}
        className="absolute left-1/2 top-10 -translate-x-1/2 w-[320px] sm:w-[420px] lg:w-[480px] [transform:rotateX(8deg)_rotateY(-4deg)]"
      >
        <div className="rounded-t-xl bg-[#0b0d14] border border-white/10 p-2.5 shadow-2xl shadow-[#4f7eff]/20">
          <div className="rounded-lg bg-[#0e1018] overflow-hidden border border-white/5">
            <div className="flex items-center gap-1.5 px-3 py-2 border-b border-white/5">
              <span className="w-2 h-2 rounded-full bg-red-400/60" />
              <span className="w-2 h-2 rounded-full bg-yellow-400/60" />
              <span className="w-2 h-2 rounded-full bg-green-400/60" />
            </div>
            <div className="p-3.5">
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2.5">
                  <p className="text-[8px] text-emerald-400/60 uppercase tracking-wider mb-1">Faturamento</p>
                  <p className="text-sm font-black text-emerald-400 leading-none">R$ 87.400</p>
                </div>
                <div className="bg-white/5 border border-white/8 rounded-lg p-2.5">
                  <p className="text-[8px] text-white/30 uppercase tracking-wider mb-1">Em estoque</p>
                  <p className="text-sm font-black text-white leading-none">43</p>
                </div>
              </div>
              <div className="bg-white/[0.03] border border-white/8 rounded-lg p-2.5">
                <div className="flex items-end gap-1 h-10">
                  {[40, 65, 50, 80, 60, 95, 72].map((h, i) => (
                    <div key={i} className="flex-1 rounded-sm bg-[#4f7eff]/70" style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="h-2.5 bg-gradient-to-b from-[#1a1d28] to-[#0b0d14] rounded-b-2xl border-x border-b border-white/10" />
      </motion.div>

      {/* iPhone flutuante */}
      <motion.div
        initial={{ opacity: 0, x: 30, y: 60 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 0.9, delay: 0.2, ease: 'easeOut' }}
        className="absolute right-2 sm:right-6 lg:right-10 bottom-6 w-[100px] sm:w-[124px]"
      >
        <motion.div
          animate={{ y: [0, -14, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="rounded-[22px] bg-[#0b0d14] border border-white/15 p-1.5 shadow-2xl shadow-black/30"
        >
          <div className="rounded-[16px] bg-[#0e1018] aspect-[9/19] p-2.5 flex flex-col">
            <div className="flex justify-center mb-2">
              <div className="w-10 h-2.5 rounded-full bg-black/40" />
            </div>
            <p className="text-[7px] text-white/30 uppercase tracking-wider mb-1.5">Nova venda</p>
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2 mb-1.5">
              <p className="text-[8px] text-emerald-400/70">Cliente paga</p>
              <p className="text-[11px] font-black text-emerald-400">R$ 6.700</p>
            </div>
            <div className="bg-white/5 rounded-lg p-2 flex-1">
              <p className="text-[7px] text-white/30">IMEI</p>
              <p className="text-[8px] font-mono text-white/60">3578...3421</p>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Cards flutuantes */}
      <FloatCard className="absolute left-0 sm:left-2 top-2 sm:top-6 w-[140px] z-10" delay={0.4}>
        <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-1">Comissão</p>
        <p className="text-base font-black text-[#0f172a]">R$ 2.622</p>
        <p className="text-[10px] text-emerald-500 font-medium mt-0.5">▲ 18% vs mês ant.</p>
      </FloatCard>

      <FloatCard className="absolute left-0 sm:left-4 bottom-10 sm:bottom-16 w-[150px] z-10" delay={0.6}>
        <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-1">Venda confirmada</p>
        <div className="flex items-center gap-2">
          <span className="text-lg">📱</span>
          <div>
            <p className="text-[11px] font-bold text-[#0f172a] leading-tight">iPhone 15 Pro</p>
            <p className="text-[10px] text-gray-400">R$ 8.900 · PIX</p>
          </div>
        </div>
      </FloatCard>

      <FloatCard className="absolute right-0 sm:right-4 top-0 sm:top-2 w-[130px] z-10" delay={0.8}>
        <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-1">Meta mensal</p>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-1">
          <div className="h-full rounded-full bg-[#4f7eff]" style={{ width: '72%' }} />
        </div>
        <p className="text-[10px] font-bold text-[#4f7eff]">72% atingido</p>
      </FloatCard>
    </div>
  )
}

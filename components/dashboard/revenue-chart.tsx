'use client'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface PontoSerie {
  dia: string // 'dd/MM'
  total: number
}

function fmtCompacto(v: number) {
  if (v >= 1000) return `R$ ${(v / 1000).toFixed(1).replace('.', ',')}k`
  return `R$ ${v.toFixed(0)}`
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#0b0c11] border border-white/10 rounded-lg px-3 py-2 text-xs">
      <p className="text-[#8a8b94] mb-0.5">{label}</p>
      <p className="text-[#e8e8ec] font-semibold">
        {payload[0].value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
      </p>
    </div>
  )
}

export default function RevenueChart({ serie }: { serie: PontoSerie[] }) {
  return (
    <>
      {/* Desktop: gráfico completo com eixos */}
      <div className="hidden md:block" style={{ height: 180 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={serie} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34d399" stopOpacity={0.1} />
                <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis
              dataKey="dia"
              tick={{ fill: '#6b6c75', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              interval={Math.max(0, Math.floor(serie.length / 6))}
            />
            <YAxis
              tick={{ fill: '#6b6c75', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={fmtCompacto}
              width={48}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="total"
              stroke="#34d399"
              strokeWidth={2}
              fill="url(#revenueGradient)"
              dot={false}
              activeDot={{ r: 3, fill: '#34d399', stroke: '#0b0c11', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Mobile: sparkline compacto, sem eixos */}
      <div className="md:hidden" style={{ height: 96 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={serie} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGradientMobile" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34d399" stopOpacity={0.12} />
                <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="total"
              stroke="#34d399"
              strokeWidth={2}
              fill="url(#revenueGradientMobile)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </>
  )
}

interface KpiCardProps {
  label: string
  value: string
  sub?: string
  trend?: 'up' | 'down' | 'neutral'
}

export default function KpiCard({ label, value, sub, trend }: KpiCardProps) {
  return (
    <div className="bg-white/5 border border-white/8 rounded-2xl p-5">
      <p className="text-xs text-white/40 font-medium uppercase tracking-wide mb-3">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
      {sub && (
        <p className={[
          'text-xs mt-1',
          trend === 'up' ? 'text-emerald-400' :
          trend === 'down' ? 'text-red-400' :
          'text-white/40'
        ].join(' ')}>
          {sub}
        </p>
      )}
    </div>
  )
}

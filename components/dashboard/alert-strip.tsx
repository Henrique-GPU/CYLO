import { AlertTriangle } from 'lucide-react'

interface AlertStripProps {
  message: string
  type?: 'warning' | 'info'
}

export default function AlertStrip({ message, type = 'warning' }: AlertStripProps) {
  return (
    <div className={[
      'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm',
      type === 'warning' ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400' : 'bg-blue-500/10 border border-blue-500/20 text-blue-400'
    ].join(' ')}>
      <AlertTriangle size={14} className="flex-shrink-0" />
      {message}
    </div>
  )
}

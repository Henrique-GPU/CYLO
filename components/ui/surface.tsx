export default function Surface({
  elevated = false,
  className = '',
  children,
}: {
  elevated?: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={`rounded-2xl ${className}`}
      style={{
        background: elevated ? 'var(--app-bg-elevated)' : 'var(--app-bg-surface)',
        boxShadow: elevated
          ? '0 8px 30px rgba(0,0,0,0.35)'
          : '0 1px 0 rgba(255,255,255,0.03) inset, 0 4px 16px rgba(0,0,0,0.2)',
      }}
    >
      {children}
    </div>
  )
}

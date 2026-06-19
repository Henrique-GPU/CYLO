export function MeshBackground({ variant = 'light' }: { variant?: 'light' | 'dark' }) {
  if (variant === 'dark') {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-[#4f7eff]/20 rounded-full blur-[140px]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px]" />
      </div>
    )
  }

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-[#4f7eff]/[0.08] rounded-full blur-[120px]" />
      <div className="absolute top-1/3 -right-32 w-[500px] h-[500px] bg-[#4f7eff]/[0.06] rounded-full blur-[110px]" />
      <div className="absolute bottom-0 left-1/4 w-[450px] h-[450px] bg-indigo-300/[0.10] rounded-full blur-[100px]" />
      <svg className="absolute inset-0 w-full h-full opacity-[0.4]" preserveAspectRatio="none">
        <defs>
          <pattern id="grid" width="64" height="64" patternUnits="userSpaceOnUse">
            <path d="M 64 0 L 0 0 0 64" fill="none" stroke="#4f7eff" strokeOpacity="0.05" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </div>
  )
}

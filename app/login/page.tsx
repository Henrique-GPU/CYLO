import LoginForm from '@/components/login/login-form'
import MockupAnimado from '@/components/login/mockup-animado'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex bg-[#080a0f]">

      {/* ── Lado esquerdo — showcase ── */}
      <div className="hidden lg:flex lg:w-[58%] xl:w-[60%] bg-[#0a0c12] border-r border-white/5 items-center justify-center p-16 relative overflow-hidden">

        {/* Glows dramáticos */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Glow central azul — principal */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#4f7eff]/14 rounded-full blur-[130px]" />
          {/* Glow inferior esquerdo — roxo */}
          <div className="absolute bottom-0 left-0 w-[450px] h-[450px] bg-purple-600/12 rounded-full blur-[100px]" />
          {/* Glow superior direito — cyan */}
          <div className="absolute top-0 right-0 w-[350px] h-[350px] bg-cyan-500/10 rounded-full blur-[90px]" />
          {/* Glow inferior direito — azul suave */}
          <div className="absolute bottom-1/4 right-1/4 w-[250px] h-[250px] bg-blue-500/8 rounded-full blur-[70px]" />
        </div>

        <div className="relative z-10 w-full max-w-md">
          <MockupAnimado />
        </div>
      </div>

      {/* ── Lado direito — form ── */}
      <div className="flex-1 flex items-center justify-center p-8 relative overflow-hidden">

        {/* Glow sutil no form */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#4f7eff]/6 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 w-full max-w-sm">

          {/* Logo — sempre visível */}
          <div className="flex items-center gap-3 mb-10">
            <img src="/cylo-logo.svg" alt="Cylo" className="w-10 h-10" />
            <span className="text-white font-black text-xl tracking-tight">CYLO</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-black text-white mb-1.5">Bem-vindo de volta</h1>
            <p className="text-sm text-white/40">Entre na sua conta para continuar</p>
          </div>

          <LoginForm />

          <p className="text-center text-[10px] text-white/15 mt-10 uppercase tracking-widest">
            Cylo · Gestão para lojas de iPhone
          </p>
        </div>
      </div>
    </div>
  )
}

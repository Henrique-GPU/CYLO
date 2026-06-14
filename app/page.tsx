import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import MockupAnimado from '@/components/login/mockup-animado'

// Atualize com o número do WhatsApp do fundador (DDI + DDD + número, sem espaços ou símbolos)
const FOUNDER_WA = '5511932652082'
const WA_MSG = encodeURIComponent('Olá! Vi o Cylo e quero saber mais sobre como minha loja pode ter acesso.')
const WA_LINK = `https://wa.me/${FOUNDER_WA}?text=${WA_MSG}`

export default async function RootPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('perfil')
      .eq('id', user.id)
      .single<{ perfil: string }>()

    if (usuario?.perfil === 'vendedor') redirect('/minha-area')
    redirect('/dashboard')
  }

  return (
    <main className="min-h-screen bg-[#080a0f] text-white overflow-x-hidden">

      {/* ── Glows de fundo ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/3 w-[800px] h-[600px] bg-[#4f7eff]/10 rounded-full blur-[150px] -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-600/8 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 right-1/4 w-[350px] h-[350px] bg-cyan-500/6 rounded-full blur-[100px]" />
      </div>

      {/* ── Navbar ── */}
      <nav className="relative z-20 flex items-center justify-between px-6 sm:px-10 py-5 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <img src="/cylo-logo.svg" alt="Cylo" className="w-8 h-8" />
          <span className="text-white font-black text-lg tracking-tight">CYLO</span>
        </div>
        <Link
          href="/login"
          className="text-sm text-white/40 hover:text-white transition-colors font-medium"
        >
          Entrar →
        </Link>
      </nav>

      {/* ── Hero ── */}
      <section className="relative z-10 max-w-[1280px] mx-auto px-6 sm:px-10 pt-16 pb-24 flex flex-col lg:flex-row items-center gap-16">

        {/* Copy */}
        <div className="flex-1 max-w-[560px]">
          {/* Pill badge */}
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-1.5 mb-7">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">15 dias grátis · Sem cartão</span>
          </div>

          <h1 className="text-[42px] sm:text-[52px] font-black tracking-tight leading-[1.08] mb-6">
            A gestão que<br />
            <span className="text-[#4f7eff]">lojas de iPhone</span><br />
            de verdade precisam.
          </h1>

          <p className="text-white/45 text-lg leading-relaxed mb-8 max-w-[440px]">
            Controle total sobre vendas, estoque por IMEI, trocas, comissões e relatórios —
            tudo em uma plataforma white-label, exclusiva para lojas selecionadas.
          </p>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <Link
              href="/cadastro"
              className="inline-flex items-center gap-2 bg-[#4f7eff] hover:bg-[#3d6eef] text-white font-bold px-7 py-3.5 rounded-2xl transition-colors text-sm"
            >
              Criar conta grátis →
            </Link>
            <a
              href={WA_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-white/15 hover:border-white/30 text-white/60 hover:text-white font-semibold px-5 py-3.5 rounded-2xl transition-colors text-sm"
            >
              <WaIcon />
              Falar com o fundador
            </a>
          </div>
        </div>

        {/* Mockup animado */}
        <div className="flex-1 w-full max-w-[400px] lg:max-w-none">
          <div className="relative">
            <div className="absolute inset-0 bg-[#4f7eff]/15 rounded-3xl blur-[60px] scale-90" />
            <div className="relative bg-white/4 border border-white/10 rounded-3xl p-7">
              <MockupAnimado />
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <div className="relative z-10 border-y border-white/6 bg-white/2">
        <div className="max-w-[1280px] mx-auto px-6 sm:px-10 py-5 flex flex-wrap items-center justify-center gap-8 sm:gap-12">
          {([
            { value: '10+', label: 'Lojas ativas', blue: false },
            { value: 'R$ 300k', label: 'Gerenciados', blue: false },
            { value: 'White Label', label: 'Por loja', blue: true },
            { value: 'Por convite', label: 'Acesso exclusivo', blue: true },
          ] as const).map(({ value, label, blue }) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <span className={`text-lg font-black leading-none ${blue ? 'text-[#4f7eff]' : 'text-white'}`}>{value}</span>
              <span className="text-[10px] text-white/25 uppercase tracking-wider">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Features ── */}
      <section className="relative z-10 max-w-[1280px] mx-auto px-6 sm:px-10 py-24">
        <div className="text-center mb-14">
          <p className="text-[11px] font-bold text-[#4f7eff] uppercase tracking-widest mb-3">Funcionalidades</p>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
            Tudo que uma loja séria precisa
          </h2>
          <p className="text-white/35 mt-3 max-w-md mx-auto text-sm leading-relaxed">
            Construído especificamente para o mercado de iPhones no Brasil.
            Nenhuma funcionalidade genérica — só o que você realmente usa.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {([
            { icon: '📱', title: 'Estoque por IMEI', desc: 'Cada aparelho rastreado individualmente. Novos e usados com custo, status e histórico completo.', color: '#4f7eff' },
            { icon: '💰', title: 'Vendas e Trocas', desc: 'Registre vendas com aparelhos de troca, calcule o saldo e emita recibo ou orçamento na hora.', color: '#34d399' },
            { icon: '👥', title: 'Comissões Automáticas', desc: 'Cada vendedor tem sua meta e percentual. O sistema calcula tudo automaticamente.', color: '#a78bfa' },
            { icon: '📊', title: 'Dashboard em Tempo Real', desc: 'Faturamento, margem, giro de estoque, saúde da operação — tudo atualizado ao vivo.', color: '#fbbf24' },
          ] as const).map(({ icon, title, desc, color }) => (
            <div key={title} className="bg-white/4 border border-white/8 rounded-2xl p-6 hover:bg-white/6 transition-colors">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg mb-5"
                style={{ background: color + '18', border: `1px solid ${color}30` }}
              >
                {icon}
              </div>
              <h3 className="font-bold text-white text-sm mb-2">{title}</h3>
              <p className="text-white/35 text-[12px] leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          {([
            { icon: '🧾', title: 'Recibos e Orçamentos', desc: 'Documentos profissionais com o logo e cor da sua loja. Compartilhe direto pelo WhatsApp.' },
            { icon: '📦', title: 'Alertas de Estoque', desc: 'Aparelhos parados há mais de 30/60/90 dias sinalizados automaticamente.' },
            { icon: '🏷️', title: 'White Label', desc: 'Cada loja tem sua identidade visual. Seus clientes veem a sua marca, não o Cylo.' },
          ] as const).map(({ icon, title, desc }) => (
            <div key={title} className="bg-white/3 border border-white/6 rounded-2xl p-5 flex items-start gap-4">
              <span className="text-xl flex-shrink-0 mt-0.5">{icon}</span>
              <div>
                <h3 className="font-bold text-white text-sm mb-1">{title}</h3>
                <p className="text-white/30 text-[11px] leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Invite-only CTA ── */}
      <section className="relative z-10 px-6 sm:px-10 pb-28">
        <div className="max-w-[640px] mx-auto">
          <div className="relative bg-gradient-to-br from-[#0f1420] to-[#080a0f] border border-white/10 rounded-3xl p-10 text-center overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-[#4f7eff]/12 rounded-full blur-[80px]" />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-6">
                <span className="text-sm">🔒</span>
                <span className="text-[11px] font-bold text-white/50 uppercase tracking-wider">Plataforma fechada</span>
              </div>

              <h2 className="text-3xl font-black tracking-tight mb-4">
                Comece grátis.<br />
                <span className="text-[#4f7eff]">15 dias sem compromisso.</span>
              </h2>

              <p className="text-white/40 text-sm leading-relaxed mb-8 max-w-[420px] mx-auto">
                Crie sua conta agora e explore tudo. Sem cartão de crédito.
                Se quiser conversar antes, é só chamar no WhatsApp.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/cadastro"
                  className="inline-flex items-center gap-2 bg-[#4f7eff] hover:bg-[#3d6eef] text-white font-bold px-8 py-4 rounded-2xl transition-colors text-sm"
                >
                  Criar conta grátis →
                </Link>
                <a
                  href={WA_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 border border-white/15 hover:border-white/25 text-white/50 hover:text-white/80 font-semibold px-6 py-4 rounded-2xl transition-colors text-sm"
                >
                  <WaIcon />
                  Falar antes
                </a>
              </div>

              <p className="text-white/20 text-[11px] mt-5">
                Sem cartão · Sem contrato · Cancele quando quiser
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-white/5 px-6 sm:px-10 py-6">
        <div className="max-w-[1280px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <img src="/cylo-logo.svg" alt="Cylo" className="w-5 h-5 opacity-60" />
            <span className="text-white/25 text-xs">Cylo · Para lojas de iPhone sérias</span>
          </div>
          <Link href="/login" className="text-white/20 text-xs hover:text-white/40 transition-colors">
            Acesso dos clientes →
          </Link>
        </div>
      </footer>

    </main>
  )
}

function WaIcon() {
  return (
    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.532 5.855L.073 23.927a.5.5 0 0 0 .612.612l6.072-1.459A11.938 11.938 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.927 0-3.732-.518-5.284-1.42l-.378-.223-3.924.943.943-3.924-.223-.378A9.938 9.938 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
    </svg>
  )
}

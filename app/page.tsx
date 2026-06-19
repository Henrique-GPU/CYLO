import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import UtmCapture from '@/components/landing/utm-capture'
import FAQAccordion from '@/components/landing/faq-accordion'
import HeroScene from '@/components/landing/hero-scene'
import { MeshBackground } from '@/components/landing/mesh-background'
import PainSection from '@/components/landing/pain-section'
import RevealSection from '@/components/landing/reveal-section'
import FeatureBlock from '@/components/landing/feature-block'
import { EstoqueMockup, VendaMockup, ComissaoMockup, RelatoriosMockup } from '@/components/landing/feature-mockups'
import MetricsSection from '@/components/landing/metrics-section'
import PricingSection from '@/components/landing/pricing-section'
import CtaFinal from '@/components/landing/cta-final'

const FOUNDER_WA = '5511932652082'
const WA_LINK = `https://wa.me/${FOUNDER_WA}?text=${encodeURIComponent('Olá! Vi o Cylo e quero saber mais sobre como minha loja pode ter acesso.')}`

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
    <div className="bg-white text-[#0f172a]">
      <UtmCapture />

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-gray-100/80">
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/cylo-logo.svg" alt="Cylo" className="w-7 h-7" />
            <span className="font-black text-xl tracking-tight">CYLO</span>
          </div>
          <Link href="/login" className="text-sm text-gray-400 hover:text-gray-800 font-medium transition-colors">
            Entrar →
          </Link>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="relative px-5 pt-16 sm:pt-20 pb-12 overflow-hidden">
        <MeshBackground variant="light" />
        <div className="relative max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">

            <div>
              <div className="inline-flex items-center gap-2 bg-[#4f7eff]/8 rounded-full px-4 py-1.5 mb-7">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4f7eff] animate-pulse" />
                <span className="text-xs font-bold text-[#4f7eff] uppercase tracking-wider">15 dias grátis · sem cartão</span>
              </div>

              <h1 className="text-[42px] sm:text-5xl lg:text-[56px] font-black tracking-tight leading-[1.05] mb-6 text-[#0f172a]">
                Menos planilhas.<br />Mais vendas.
              </h1>

              <p className="text-lg text-gray-400 leading-relaxed mb-9 max-w-md">
                O sistema feito para quem vive de vender iPhone. Estoque por IMEI, vendas, comissão e caixa — tudo numa tela só.
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <Link
                  href="/cadastro"
                  className="inline-flex items-center gap-2 bg-[#4f7eff] hover:bg-[#3d6eef] text-white font-bold px-8 py-4 rounded-2xl text-base transition-all shadow-lg shadow-[#4f7eff]/25 hover:shadow-xl hover:shadow-[#4f7eff]/30 hover:scale-[1.02]"
                >
                  Começar teste grátis →
                </Link>
                <a
                  href={WA_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-[#0f172a] font-semibold px-6 py-4 rounded-2xl text-base border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  Ver demonstração
                </a>
              </div>
              <p className="text-sm text-gray-400 mt-4">15 dias grátis · sem cartão de crédito</p>
            </div>

            <HeroScene />
          </div>
        </div>
      </section>

      {/* ── DOR ── */}
      <PainSection />

      {/* ── VIRADA ── */}
      <RevealSection />

      {/* ── FUNCIONALIDADES ── */}
      <FeatureBlock
        eyebrow="Estoque"
        title="Cada aparelho, rastreado por IMEI."
        description="Saiba exatamente o que entrou, o que vendeu e o que está parado na prateleira — sem depender de memória ou planilha."
        mockup={<EstoqueMockup />}
      />
      <FeatureBlock
        eyebrow="Vendas"
        title="Venda com troca, sem dor de cabeça."
        description="Registre a venda, o aparelho de troca e a forma de pagamento em um fluxo só. O sistema calcula o valor final automaticamente."
        mockup={<VendaMockup />}
        reverse
      />
      <FeatureBlock
        eyebrow="Comissão"
        title="Comissão calculada sozinha, sem erro."
        description="Cada vendedor já vê quanto vendeu e quanto vai receber. Fim da planilha de fim de mês e das discussões sobre valores."
        mockup={<ComissaoMockup />}
      />
      <FeatureBlock
        eyebrow="Relatórios"
        title="Sua loja, em números, na hora."
        description="Faturamento, DRE, recibos e orçamentos prontos para exportar — sem abrir uma única planilha."
        mockup={<RelatoriosMockup />}
        reverse
      />

      {/* ── MÉTRICAS ── */}
      <MetricsSection />

      {/* ── PREÇO ── */}
      <PricingSection />

      {/* ── FAQ ── */}
      <section className="bg-gray-50 px-5 py-24">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-black text-center mb-10 tracking-tight text-[#0f172a]">Dúvidas frequentes</h2>
          <FAQAccordion />
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <CtaFinal />

      {/* ── FOOTER ── */}
      <footer className="bg-white border-t border-gray-100 px-5 py-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/cylo-logo.svg" alt="Cylo" className="w-5 h-5 opacity-40" />
            <span className="text-sm text-gray-400">© {new Date().getFullYear()} CYLO · Para lojas de iPhone</span>
          </div>
          <div className="flex items-center gap-6">
            <a
              href={WA_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-400 hover:text-gray-700 transition-colors"
            >
              Contato
            </a>
            <Link href="/login" className="text-sm text-gray-400 hover:text-gray-700 transition-colors">
              Entrar
            </Link>
          </div>
        </div>
      </footer>

    </div>
  )
}

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import MockupAnimado from '@/components/login/mockup-animado'
import FAQAccordion from '@/components/landing/faq-accordion'

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

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between">
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
      <section className="bg-gradient-to-b from-indigo-50 via-indigo-50/50 to-white px-5 pt-16 pb-24">
        <div className="max-w-5xl mx-auto">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-indigo-100 rounded-full px-4 py-1.5 mb-7">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
              <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">15 dias grátis · sem cartão</span>
            </div>

            <h1 className="text-[40px] sm:text-5xl font-black tracking-tight leading-[1.08] mb-5 text-[#0f172a]">
              O sistema feito pra quem vive de vender iPhone
            </h1>

            <p className="text-lg text-gray-500 leading-relaxed mb-8 max-w-xl">
              Controle o estoque por IMEI, as vendas, a comissão dos vendedores e o caixa da loja — tudo numa tela só.
            </p>

            <Link
              href="/cadastro"
              className="inline-flex items-center gap-2 bg-[#6366f1] hover:bg-[#4f51d9] text-white font-bold px-8 py-4 rounded-2xl text-base transition-colors shadow-lg shadow-indigo-200"
            >
              Criar conta grátis →
            </Link>
            <p className="text-sm text-gray-400 mt-3">15 dias grátis · sem cartão de crédito</p>
          </div>

          {/* Mockup */}
          <div className="mt-14 bg-[#0e1018] rounded-3xl p-6 sm:p-8 shadow-2xl shadow-slate-200 max-w-2xl">
            <MockupAnimado />
          </div>
        </div>
      </section>

      {/* ── DOR ── */}
      <section className="bg-white px-5 py-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-black text-center mb-3 tracking-tight leading-snug">
            Controlar a loja na planilha<br className="hidden sm:block" /> (ou na cabeça) tá ficando insustentável?
          </h2>
          <p className="text-center text-gray-400 mb-12 max-w-md mx-auto text-sm leading-relaxed">
            Se você se identificou com pelo menos uma situação abaixo, o Cylo foi feito pra você.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {([
              { icon: '📱', text: 'Não sei exatamente quais aparelhos tenho em estoque nem onde está cada IMEI.' },
              { icon: '💰', text: 'Fecho o mês sem saber direito quanto cada vendedor vendeu e quanto pagar de comissão.' },
              { icon: '📊', text: 'O caixa da loja vive uma incógnita — entrou quanto, saiu quanto?' },
            ] as const).map(({ icon, text }) => (
              <div key={text} className="bg-red-50 border border-red-100 rounded-2xl p-6">
                <span className="text-3xl mb-4 block">{icon}</span>
                <p className="text-[15px] text-gray-700 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SOLUÇÃO ── */}
      <section className="bg-gray-50 px-5 py-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-black text-center mb-12 tracking-tight">
            O CYLO organiza sua loja inteira num lugar só
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {([
              { icon: '📦', title: 'Estoque por IMEI', desc: 'Saiba na hora cada aparelho que entrou, vendeu ou está parado na prateleira.' },
              { icon: '🤝', title: 'Vendas e comissão', desc: 'Cada venda registrada e a comissão do vendedor calculada sozinha, sem erro.' },
              { icon: '💵', title: 'Caixa no controle', desc: 'Veja entradas, saídas e o resultado da loja sem abrir uma planilha sequer.' },
              { icon: '🍎', title: 'Feito pra loja de iPhone', desc: 'Não é sistema genérico adaptado. É pensado do zero pro seu negócio.' },
            ] as const).map(({ icon, title, desc }) => (
              <div key={title} className="bg-white border border-gray-100 rounded-2xl p-7 shadow-sm">
                <span className="text-3xl mb-4 block">{icon}</span>
                <h3 className="font-bold text-[#0f172a] mb-2 text-base">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMO FUNCIONA ── */}
      <section className="bg-white px-5 py-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-black text-center mb-14 tracking-tight">
            Comece em menos de 5 minutos
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 mb-14">
            {([
              { num: '1', title: 'Crie sua conta grátis', desc: 'Leva 1 minuto. Só nome da loja, e-mail e senha. Sem cartão.' },
              { num: '2', title: 'Cadastre seus aparelhos', desc: 'Sua loja já vem com um catálogo de modelos pronto pra você editar.' },
              { num: '3', title: 'Venda e controle', desc: 'Registre vendas e acompanhe estoque, comissão e caixa em tempo real.' },
            ] as const).map(({ num, title, desc }) => (
              <div key={num} className="flex flex-col items-start">
                <div className="w-11 h-11 rounded-xl bg-indigo-100 text-[#6366f1] font-black text-lg flex items-center justify-center mb-5 flex-shrink-0">
                  {num}
                </div>
                <h3 className="font-bold text-[#0f172a] mb-2 text-base">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center">
            <Link
              href="/cadastro"
              className="inline-flex items-center gap-2 bg-[#6366f1] hover:bg-[#4f51d9] text-white font-bold px-8 py-4 rounded-2xl text-base transition-colors shadow-lg shadow-indigo-200"
            >
              Criar conta grátis →
            </Link>
            <p className="text-sm text-gray-400 mt-3">15 dias grátis · sem cartão de crédito</p>
          </div>
        </div>
      </section>

      {/* ── PROVA SOCIAL (placeholder até ter depoimentos reais) ── */}
      <section className="bg-gray-50 px-5 py-16">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Desenvolvido por quem entende do mercado</p>
          <div className="inline-flex items-center gap-4 bg-white border border-gray-200 rounded-2xl px-7 py-5 shadow-sm">
            <span className="text-3xl">🍎</span>
            <div className="text-left">
              <p className="text-sm font-bold text-[#0f172a]">Feito por quem entende de loja de celular</p>
              <p className="text-xs text-gray-400 mt-0.5">Cada funcionalidade nasceu de uma dor real do mercado</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── PREÇO ── */}
      <section className="bg-white px-5 py-20">
        <div className="max-w-md mx-auto">
          <h2 className="text-2xl sm:text-3xl font-black text-center mb-10 tracking-tight">
            Um plano simples, sem pegadinha
          </h2>
          <div className="border-2 border-[#6366f1] rounded-3xl p-8 shadow-xl shadow-indigo-100">
            <div className="inline-flex items-center gap-2 bg-indigo-50 rounded-full px-4 py-1.5 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">15 dias grátis para começar</span>
            </div>
            <div className="flex items-end gap-1 mb-1">
              <span className="text-5xl font-black text-[#0f172a]">R$ 59,90</span>
              <span className="text-gray-400 text-sm mb-2">/mês</span>
            </div>
            <p className="text-gray-400 text-sm mb-8">Sem fidelidade. Cancela quando quiser.</p>
            <ul className="text-sm text-gray-600 space-y-3 mb-8">
              {[
                'Estoque por IMEI ilimitado',
                'Vendas com cálculo de comissão automático',
                'Orçamentos e recibos profissionais',
                'Dashboard em tempo real',
                'Funciona no celular e no computador',
              ].map(f => (
                <li key={f} className="flex items-center gap-2.5">
                  <span className="text-[#6366f1] font-bold">✓</span> {f}
                </li>
              ))}
            </ul>
            <Link
              href="/cadastro"
              className="block w-full bg-[#6366f1] hover:bg-[#4f51d9] text-white font-bold py-4 rounded-2xl text-base transition-colors text-center shadow-lg shadow-indigo-200"
            >
              Começar meus 15 dias grátis
            </Link>
            <p className="text-xs text-gray-400 mt-3 text-center">Sem cartão de crédito</p>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="bg-gray-50 px-5 py-20">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-black text-center mb-10 tracking-tight">Dúvidas frequentes</h2>
          <FAQAccordion />
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="bg-[#6366f1] px-5 py-24">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-3 tracking-tight leading-tight">
            Pare de controlar<br />sua loja no escuro.
          </h2>
          <p className="text-indigo-200 text-base mb-8">Sua concorrência já está se organizando.</p>
          <Link
            href="/cadastro"
            className="inline-flex items-center gap-2 bg-white text-[#6366f1] font-black px-8 py-4 rounded-2xl text-base hover:bg-indigo-50 transition-colors shadow-lg"
          >
            Criar conta grátis →
          </Link>
          <p className="text-indigo-300 text-sm mt-4">15 dias grátis · sem cartão · começa em 1 minuto</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-white border-t border-gray-100 px-5 py-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/cylo-logo.svg" alt="Cylo" className="w-5 h-5 opacity-40" />
            <span className="text-sm text-gray-400">© {new Date().getFullYear()} Cylo · Para lojas de iPhone</span>
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

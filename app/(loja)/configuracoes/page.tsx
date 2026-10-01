import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TrocarSenhaForm from './trocar-senha-form'
import EditarMinhaLojaForm from './editar-loja-form'
import CancelarAssinaturaButton from './cancelar-assinatura-button'
import Link from 'next/link'

export default async function ConfiguracoesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usuario } = await supabase
    .from('usuarios').select('loja_id, perfil').eq('id', user.id)
    .single<{ loja_id: string; perfil: string }>()

  if (!usuario?.loja_id) redirect('/dashboard')

  const { data: loja } = await supabase
    .from('lojas').select('*').eq('id', usuario.loja_id)
    .single<any>()

  if (!loja) redirect('/dashboard')

  const isAdmin = usuario.perfil === 'loja_admin'

  const { data: ass } = await supabase
    .from('assinaturas')
    .select('status, trial_ate, pago_ate')
    .eq('loja_id', usuario.loja_id)
    .single<{ status: 'trial' | 'ativa' | 'inadimplente' | 'cancelada'; trial_ate: string; pago_ate: string | null }>()

  const fmt = (iso: string | null | undefined) =>
    iso ? new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : null
  const diasTrial = ass?.status === 'trial'
    ? Math.max(0, Math.ceil((new Date(ass.trial_ate).getTime() - Date.now()) / 86400000))
    : null

  const badge: Record<string, { texto: string; cls: string }> = {
    trial: { texto: 'Teste grátis', cls: 'bg-amber-500/15 text-amber-400' },
    ativa: { texto: 'Ativa', cls: 'bg-emerald-500/15 text-emerald-400' },
    inadimplente: { texto: 'Pagamento pendente', cls: 'bg-red-500/15 text-red-400' },
    cancelada: { texto: 'Cancelada', cls: 'bg-white/10 text-white/50' },
  }

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Configurações</h1>
        <p className="text-sm text-white/40 mt-0.5">
          {isAdmin ? 'Edite os dados da sua loja e segurança da conta' : 'Dados da loja e segurança da conta'}
        </p>
      </div>

      {/* Assinatura — só para admin */}
      {isAdmin && ass && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-white/30 mb-3">Assinatura</p>
          <div className="bg-white/4 border border-white/10 rounded-2xl p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white font-bold text-sm">Plano CYLO</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge[ass.status].cls}`}>
                    {badge[ass.status].texto}
                  </span>
                </div>
                {ass.status === 'trial' && diasTrial !== null && (
                  <p className="text-white/40 text-xs">
                    {diasTrial > 0
                      ? `${diasTrial} dia${diasTrial !== 1 ? 's' : ''} restante${diasTrial !== 1 ? 's' : ''} no teste grátis`
                      : 'Teste grátis encerrado'}
                  </p>
                )}
                {ass.status === 'ativa' && ass.pago_ate && (
                  <p className="text-white/40 text-xs">Próxima cobrança: {fmt(ass.pago_ate)}</p>
                )}
                {ass.status === 'inadimplente' && (
                  <p className="text-white/40 text-xs">Não conseguimos cobrar seu cartão.</p>
                )}
                {ass.status === 'cancelada' && (
                  <p className="text-white/40 text-xs">
                    {ass.pago_ate && new Date(ass.pago_ate) > new Date()
                      ? `Acesso até ${fmt(ass.pago_ate)}`
                      : 'Acesso encerrado'}
                  </p>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-white font-black text-xl leading-none">R$59<span className="text-white/50 text-sm font-medium">,90</span></p>
                <p className="text-white/30 text-[10px] mt-0.5">/mês no cartão</p>
              </div>
            </div>

            {(ass.status === 'trial' || ass.status === 'inadimplente' || ass.status === 'cancelada') && (
              <Link
                href="/assinar"
                className="mt-4 w-full py-2.5 bg-[#4f7eff]/10 hover:bg-[#4f7eff]/20 border border-[#4f7eff]/20 text-[#4f7eff] text-xs font-semibold rounded-xl transition-colors flex items-center justify-center"
              >
                {ass.status === 'inadimplente' ? 'Atualizar pagamento' : ass.status === 'cancelada' ? 'Assinar novamente' : 'Assinar com cartão'}
              </Link>
            )}

            {(ass.status === 'ativa' || ass.status === 'inadimplente') && (
              <CancelarAssinaturaButton acessoAte={fmt(ass.pago_ate)} />
            )}
          </div>
        </div>
      )}

      {isAdmin ? (
        <EditarMinhaLojaForm loja={loja} />
      ) : (
        /* Vendedor: read-only */
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-white/30 mb-3">Dados da Loja</p>
          <div className="bg-white/5 border border-white/8 rounded-2xl divide-y divide-white/5">
            {[
              { label: 'Nome fantasia', value: loja.nome },
              { label: 'WhatsApp', value: loja.whatsapp },
              { label: 'Instagram', value: loja.instagram },
              { label: 'Endereço', value: loja.endereco },
              { label: 'Garantia padrão', value: loja.garantia_padrao ? `${loja.garantia_padrao} dias` : null },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between px-5 py-3">
                <span className="text-sm text-white/40">{label}</span>
                <span className="text-sm text-white">{value ?? '—'}</span>
              </div>
            ))}
          </div>
          {loja.cor_primaria && (
            <div className="mt-2 flex items-center gap-3 p-4 bg-white/3 border border-white/8 rounded-xl">
              <div className="w-7 h-7 rounded-lg flex-shrink-0" style={{ backgroundColor: loja.cor_primaria }} />
              <div>
                <p className="text-[10px] text-white/30">Cor primária</p>
                <p className="text-sm text-white font-mono">{loja.cor_primaria}</p>
              </div>
              {loja.logo_url && (
                <>
                  <div className="w-px h-8 bg-white/10 mx-1" />
                  <img src={loja.logo_url} alt="logo" className="h-7 object-contain rounded" />
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Trocar senha — todos os perfis */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-white/30 mb-3">Segurança</p>
        <TrocarSenhaForm email={user.email ?? ''} />
      </div>
    </div>
  )
}

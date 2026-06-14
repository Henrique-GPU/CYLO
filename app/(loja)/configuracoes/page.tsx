import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TrocarSenhaForm from './trocar-senha-form'
import EditarMinhaLojaForm from './editar-loja-form'

const FOUNDER_WA = '5511932652082'

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

  // Calcula dias restantes do trial
  let diasRestantes: number | null = null
  if (loja.status_saas === 'trial' && loja.data_fim_trial) {
    const diff = new Date(loja.data_fim_trial).getTime() - new Date().getTime()
    diasRestantes = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }

  const waMsg = encodeURIComponent(`Olá! Quero ativar o plano da minha loja ${loja.nome} no Cylo.`)
  const waLink = `https://wa.me/${FOUNDER_WA}?text=${waMsg}`

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Configurações</h1>
        <p className="text-sm text-white/40 mt-0.5">
          {isAdmin ? 'Edite os dados da sua loja e segurança da conta' : 'Dados da loja e segurança da conta'}
        </p>
      </div>

      {/* Card de plano — só para admin */}
      {isAdmin && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-white/30 mb-3">Plano</p>
          <div className="bg-white/4 border border-white/10 rounded-2xl p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white font-bold text-sm">Plano Cylo</span>
                  {loja.status_saas === 'trial' && (
                    <span className="text-[10px] bg-amber-500/15 text-amber-400 font-bold px-2 py-0.5 rounded-full">Trial</span>
                  )}
                  {loja.status_saas === 'ativo' && (
                    <span className="text-[10px] bg-emerald-500/15 text-emerald-400 font-bold px-2 py-0.5 rounded-full">Ativo</span>
                  )}
                </div>
                {loja.status_saas === 'trial' && diasRestantes !== null && (
                  <p className="text-white/40 text-xs">
                    {diasRestantes > 0
                      ? `${diasRestantes} dia${diasRestantes !== 1 ? 's' : ''} restante${diasRestantes !== 1 ? 's' : ''} no trial`
                      : 'Trial encerrado'}
                  </p>
                )}
                {loja.status_saas === 'ativo' && loja.proximo_vencimento && (
                  <p className="text-white/40 text-xs">
                    Próximo vencimento: {new Date(loja.proximo_vencimento).toLocaleDateString('pt-BR')}
                  </p>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-white font-black text-xl leading-none">R$59<span className="text-white/50 text-sm font-medium">,99</span></p>
                <p className="text-white/30 text-[10px] mt-0.5">/mês</p>
              </div>
            </div>

            {loja.status_saas === 'trial' && (
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 w-full py-2.5 bg-[#4f7eff]/10 hover:bg-[#4f7eff]/20 border border-[#4f7eff]/20 text-[#4f7eff] text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.532 5.855L.073 23.927a.5.5 0 0 0 .612.612l6.072-1.459A11.938 11.938 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.927 0-3.732-.518-5.284-1.42l-.378-.223-3.924.943.943-3.924-.223-.378A9.938 9.938 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                </svg>
                Ativar plano via WhatsApp
              </a>
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

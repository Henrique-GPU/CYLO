import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TrocarSenhaForm from './trocar-senha-form'
import EditarMinhaLojaForm from './editar-loja-form'

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

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Configurações</h1>
        <p className="text-sm text-white/40 mt-0.5">
          {isAdmin ? 'Edite os dados da sua loja e segurança da conta' : 'Dados da loja e segurança da conta'}
        </p>
      </div>

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

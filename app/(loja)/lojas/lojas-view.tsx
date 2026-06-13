'use client'

import { useState, useEffect, useTransition } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Plus, Store, Check, KeyRound, Copy, X } from 'lucide-react'
import Link from 'next/link'
import { bloquearLoja, ativarLoja, renovarLoja, converterTrial, redefinirSenhaAdmin, excluirLoja } from './actions'
import EditarModal from './editar-modal'

const STATUS_COLOR: Record<string, string> = {
  ativo: 'bg-emerald-500/10 text-emerald-400',
  trial: 'bg-blue-500/10 text-blue-400',
  vencido: 'bg-amber-500/10 text-amber-400',
  bloqueado: 'bg-red-500/10 text-red-400',
}

function Toast({ msg, onDone }: { msg: string; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t) }, [onDone])
  return (
    <div className="fixed bottom-6 right-6 z-[60] flex items-center gap-2 bg-emerald-500 text-white text-sm font-semibold px-4 py-3 rounded-2xl shadow-xl">
      <Check size={15} /> {msg}
    </div>
  )
}

// ── Credenciais inline por loja ─────────────────────────────
function CredenciaisCard({ lojaId, emailAdmin }: { lojaId: string; emailAdmin: string | undefined }) {
  const [loading, setLoading] = useState(false)
  const [creds, setCreds] = useState<{ email: string; senha: string } | null>(null)
  const [copiado, setCopiado] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function redefinir() {
    setLoading(true); setCreds(null); setErro(null)
    const res = await redefinirSenhaAdmin(lojaId)
    setLoading(false)
    if ('error' in res) { setErro(res.error ?? 'Erro'); return }
    if ('senha' in res) setCreds({ email: res.email!, senha: res.senha! })
  }

  function copiar() {
    if (!creds) return
    navigator.clipboard.writeText(`Login: ${creds.email}\nSenha: ${creds.senha}`)
    setCopiado(true); setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <div className="border-t border-white/5 px-4 pt-3 pb-3.5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[9px] text-white/25 uppercase tracking-wider mb-0.5">Admin</p>
          <p className="text-[11px] text-white/50 font-mono truncate">{emailAdmin ?? '—'}</p>
        </div>
        <button
          onClick={redefinir}
          disabled={loading}
          className="flex items-center gap-1.5 text-[10px] px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg transition-colors disabled:opacity-40 flex-shrink-0"
        >
          <KeyRound size={11} />
          {loading ? 'Gerando…' : creds ? 'Nova senha' : 'Redefinir senha'}
        </button>
      </div>

      {erro && <p className="text-[10px] text-red-400 mt-2">{erro}</p>}

      {creds && (
        <div className="mt-2.5 bg-[#080a0f] border border-amber-500/30 rounded-xl px-3 py-2.5 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[9px] text-amber-400/50 uppercase tracking-wider mb-1">Nova senha gerada — copie agora</p>
            <div className="flex items-baseline gap-2">
              <p className="text-[11px] text-white/40 font-mono truncate">{creds.email}</p>
              <span className="text-white/20">·</span>
              <p className="text-base font-mono font-black text-amber-400 tracking-widest">{creds.senha}</p>
            </div>
          </div>
          <button onClick={copiar}
            className="flex items-center gap-1.5 text-[10px] px-2.5 py-1.5 bg-white/8 hover:bg-white/12 text-white/50 rounded-lg transition-colors flex-shrink-0">
            {copiado ? <><Check size={11} className="text-emerald-400" />Copiado</> : <><Copy size={11} />Copiar</>}
          </button>
          <button onClick={() => setCreds(null)} className="text-white/20 hover:text-white/50 flex-shrink-0">
            <X size={13} />
          </button>
        </div>
      )}
    </div>
  )
}

// ── Dialog de confirmação de exclusão ──────────────────────
function ExcluirDialog({ loja, onCancel, onConfirm, loading }: {
  loja: any; onCancel: () => void; onConfirm: () => void; loading: boolean
}) {
  const [input, setInput] = useState('')
  const correto = input.trim() === loja.nome.trim()

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,.85)', backdropFilter: 'blur(4px)' }}>
      <div className="bg-[#0e1018] border border-red-500/30 rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <div className="text-center mb-5">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-3">
            <X size={20} className="text-red-400" />
          </div>
          <p className="text-base font-black text-white mb-1">Excluir loja</p>
          <p className="text-sm text-white/40">Esta ação é <strong className="text-red-400">permanente e irreversível</strong>. Todos os dados serão apagados.</p>
        </div>

        <div className="bg-white/3 border border-white/8 rounded-xl p-3 mb-4 text-xs text-white/40 space-y-0.5">
          <p>Serão deletados: usuários, aparelhos, vendas, acessórios, motoboys e todos os dados da loja.</p>
        </div>

        <div className="mb-4">
          <label className="block text-[10px] font-semibold text-white/35 uppercase tracking-wider mb-1.5">
            Digite o nome da loja para confirmar
          </label>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={loja.nome}
            className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-red-500/50 transition-colors font-mono"
          />
          {input.length > 0 && !correto && (
            <p className="text-[10px] text-red-400/60 mt-1">Nome incorreto</p>
          )}
        </div>

        <div className="flex gap-3">
          <button onClick={onCancel} disabled={loading}
            className="flex-1 py-2.5 border border-white/15 text-white/60 text-sm rounded-xl hover:bg-white/5 transition-colors">
            Cancelar
          </button>
          <button onClick={onConfirm} disabled={!correto || loading}
            className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-xl disabled:opacity-30 transition-colors">
            {loading ? 'Excluindo…' : 'Excluir permanentemente'}
          </button>
        </div>
      </div>
    </div>
  )
}

interface LojasViewProps {
  lojas: any[]
  admins: any[]
}

export default function LojasView({ lojas, admins }: LojasViewProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [editingLoja, setEditingLoja] = useState<any | null>(null)
  const [excluindoLoja, setExcluindoLoja] = useState<any | null>(null)
  const [excluindoLoading, setExcluindoLoading] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [pending, start] = useTransition()

  async function confirmarExclusao() {
    if (!excluindoLoja) return
    setExcluindoLoading(true)
    const res = await excluirLoja(excluindoLoja.id)
    setExcluindoLoading(false)
    if ('error' in res) { setToast('Erro: ' + res.error); return }
    setExcluindoLoja(null)
    setToast(`Loja "${excluindoLoja.nome}" excluída.`)
  }

  useEffect(() => {
    const editId = searchParams.get('editar')
    if (editId) {
      const l = lojas.find(l => l.id === editId)
      if (l) setEditingLoja(l)
      router.replace('/lojas', { scroll: false })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}

      {excluindoLoja && (
        <ExcluirDialog
          loja={excluindoLoja}
          onCancel={() => setExcluindoLoja(null)}
          onConfirm={confirmarExclusao}
          loading={excluindoLoading}
        />
      )}

      {editingLoja && (
        <EditarModal
          loja={editingLoja}
          adminUser={admins.find(a => a.loja_id === editingLoja.id) ?? null}
          onClose={() => setEditingLoja(null)}
          onSaved={() => setToast('Loja atualizada com sucesso!')}
        />
      )}

      <div className="p-8 max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-white">Lojas</h1>
            <p className="text-sm text-white/40 mt-0.5">{lojas.length} cadastradas</p>
          </div>
          <Link href="/lojas/novo"
            className="flex items-center gap-2 px-4 py-2 bg-[#4f7eff] hover:opacity-90 text-white text-sm font-semibold rounded-xl transition-opacity">
            <Plus size={15} />Nova loja
          </Link>
        </div>

        {!lojas.length ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Store size={40} className="text-white/10 mb-3" />
            <p className="text-white/40 text-sm">Nenhuma loja cadastrada</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {lojas.map((l: any) => {
              const adminUser = admins.find(a => a.loja_id === l.id)
              return (
                <div key={l.id} className="bg-white/5 border border-white/8 rounded-2xl overflow-hidden">
                  <div className="h-0.5" style={{ background: l.cor_primaria ?? '#4f7eff' }} />

                  {/* Linha principal */}
                  <div className="p-4 flex items-center gap-4">
                    {l.logo_url ? (
                      <img src={l.logo_url} alt={l.nome}
                        className="w-10 h-10 rounded-xl object-contain flex-shrink-0"
                        style={{ background: 'rgba(255,255,255,.05)' }} />
                    ) : (
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                        style={{ backgroundColor: l.cor_primaria ?? '#4f7eff' }}>
                        {l.nome?.slice(0, 2).toUpperCase()}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{l.nome}</p>
                      <p className="text-xs text-white/40">{l.responsavel ?? '—'} · {l.cnpj ?? 'Sem CNPJ'}</p>
                    </div>

                    <div className="hidden md:flex items-center gap-6 text-right">
                      <div>
                        <p className="text-[10px] text-white/30">Vencimento</p>
                        <p className="text-sm text-white">{l.proximo_vencimento ?? '—'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-white/30">Mensalidade</p>
                        <p className="text-sm text-white">R$ {l.valor_mensal?.toFixed(2) ?? '—'}</p>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-lg font-medium ${STATUS_COLOR[l.status_saas] ?? 'bg-white/10 text-white/40'}`}>
                        {l.status_saas}
                      </span>
                    </div>

                    <div className="flex gap-1.5 flex-shrink-0">
                      <button onClick={() => setEditingLoja(l)}
                        className="text-[10px] px-2.5 py-1.5 bg-white/8 hover:bg-white/12 text-white/60 hover:text-white rounded-lg transition-colors">
                        Editar
                      </button>
                      {(l.status_saas === 'ativo' || l.status_saas === 'trial') && (
                        <button disabled={pending}
                          onClick={() => start(() => bloquearLoja(l.id))}
                          className="text-[10px] px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors disabled:opacity-40">
                          Bloquear
                        </button>
                      )}
                      {(l.status_saas === 'bloqueado' || l.status_saas === 'vencido') && (
                        <button disabled={pending}
                          onClick={() => start(() => ativarLoja(l.id))}
                          className="text-[10px] px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-colors disabled:opacity-40">
                          Ativar
                        </button>
                      )}
                      {l.status_saas === 'trial' && (
                        <button disabled={pending}
                          onClick={() => start(() => converterTrial(l.id))}
                          className="text-[10px] px-2.5 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors disabled:opacity-40">
                          → Converter
                        </button>
                      )}
                      <button disabled={pending}
                        onClick={() => start(() => renovarLoja(l.id))}
                        className="text-[10px] px-2.5 py-1.5 bg-white/5 hover:bg-white/10 text-white/40 rounded-lg transition-colors disabled:opacity-40">
                        +30d
                      </button>
                      <button
                        onClick={() => setExcluindoLoja(l)}
                        className="text-[10px] px-2.5 py-1.5 bg-red-500/8 hover:bg-red-500/18 text-red-500/60 hover:text-red-400 rounded-lg transition-colors">
                        Excluir
                      </button>
                    </div>
                  </div>

                  {/* Faixa de credenciais do admin */}
                  <CredenciaisCard lojaId={l.id} emailAdmin={adminUser?.email} />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}

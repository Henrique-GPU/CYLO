'use client'

import { useState, useRef } from 'react'
import { X, Check, Upload, KeyRound, Copy } from 'lucide-react'
import { salvarLojaCompleta, redefinirSenhaAdmin } from './actions'

interface EditarModalProps {
  loja: any
  adminUser: { id: string; nome: string; email: string; username: string } | null
  onClose: () => void
  onSaved: () => void
}

const STATUS_OPTIONS = ['trial', 'ativo', 'vencido', 'bloqueado']

function Field({ label, name, defaultValue, placeholder, type = 'text', span2 }: {
  label: string; name: string; defaultValue?: string | null; placeholder?: string; type?: string; span2?: boolean
}) {
  return (
    <div className={span2 ? 'col-span-2' : ''}>
      <label className="lbl">{label}</label>
      <input type={type} name={name} defaultValue={defaultValue ?? ''} placeholder={placeholder}
        className="fld" />
    </div>
  )
}

export default function EditarModal({ loja, adminUser, onClose, onSaved }: EditarModalProps) {
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [salvo, setSalvo] = useState(false)
  const [resetSenha, setResetSenha] = useState<{ senha: string; email: string } | null>(null)
  const [resetando, setResetando] = useState(false)
  const [copiado, setCopiado] = useState(false)

  async function handleResetSenha() {
    setResetando(true); setResetSenha(null)
    const res = await redefinirSenhaAdmin(loja.id)
    setResetando(false)
    if ('error' in res) { setErro(res.error ?? 'Erro ao redefinir'); return }
    if ('senha' in res) setResetSenha({ senha: res.senha!, email: res.email! })
  }

  function copiarSenha() {
    if (!resetSenha) return
    navigator.clipboard.writeText(`Login: ${resetSenha.email}\nSenha: ${resetSenha.senha}`)
    setCopiado(true); setTimeout(() => setCopiado(false), 2000)
  }
  const [corPrimaria, setCorPrimaria] = useState(loja.cor_primaria ?? '#4f7eff')
  const [corSecundaria, setCorSecundaria] = useState(loja.cor_secundaria ?? '#0e1018')
  const [statusSaas, setStatusSaas] = useState(loja.status_saas ?? 'trial')
  const [logoPreview, setLogoPreview] = useState<string | null>(loja.logo_url ?? null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoUrlInput, setLogoUrlInput] = useState('')
  const [removerLogo, setRemoverLogo] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = ev => { if (ev.target?.result) { setLogoPreview(ev.target.result as string); setLogoFile(f); setRemoverLogo(false) } }
    reader.readAsDataURL(f)
  }

  function remover() { setLogoPreview(null); setLogoFile(null); setLogoUrlInput(''); setRemoverLogo(true) }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSalvando(true); setErro(null)
    const fd = new FormData(e.currentTarget)
    fd.set('cor_primaria', corPrimaria)
    fd.set('cor_secundaria', corSecundaria)
    fd.set('status_saas', statusSaas)
    if (logoFile) fd.set('logo', logoFile)
    if (logoUrlInput && !logoFile) fd.set('logo_url_input', logoUrlInput)
    if (removerLogo) fd.set('remover_logo', 'true')
    const res = await salvarLojaCompleta(loja.id, fd)
    setSalvando(false)
    if ('error' in res) { setErro(res.error ?? 'Erro'); return }
    setSalvo(true)
    setTimeout(() => { onSaved(); onClose() }, 800)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(6px)' }}>
      <div className="bg-[#0e1018] border border-white/10 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8 flex-shrink-0">
          <div className="flex items-center gap-3">
            {logoPreview && !removerLogo ? (
              <img src={logoPreview} alt="" className="w-8 h-8 rounded-lg object-contain" />
            ) : (
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: corPrimaria }}>
                {loja.nome?.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-sm font-bold text-white">Editar loja</p>
              <p className="text-[11px] text-white/40">{loja.nome}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          <form id="editar-form" onSubmit={handleSubmit} className="space-y-5">

            {/* Dados da Loja */}
            <Section title="Dados da Loja">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Nome fantasia *" name="nome" defaultValue={loja.nome} placeholder="Ex: iStore Brasília" span2 />
                <Field label="Razão social" name="razao_social" defaultValue={loja.razao_social} placeholder="Razão social" span2 />
                <Field label="CNPJ" name="cnpj" defaultValue={loja.cnpj} placeholder="00.000.000/0001-00" />
                <Field label="E-mail" name="email" type="email" defaultValue={loja.email} placeholder="loja@email.com" />
                <Field label="Telefone" name="telefone" defaultValue={loja.telefone} placeholder="(xx) 99999-0000" />
                <Field label="WhatsApp" name="whatsapp" defaultValue={loja.whatsapp} placeholder="(xx) 99999-0001" />
                <Field label="Instagram" name="instagram" defaultValue={loja.instagram} placeholder="@loja" />
                <div className="col-span-2">
                  <label className="lbl">Endereço</label>
                  <input name="endereco" defaultValue={loja.endereco ?? ''} placeholder="Rua, número, bairro" className="fld" />
                </div>
              </div>
            </Section>

            {/* Identidade Visual */}
            <Section title="Identidade Visual">
              <div className="space-y-3">
                {/* Logo */}
                <div>
                  <label className="lbl">Logo</label>
                  {logoPreview && !removerLogo ? (
                    <div className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl">
                      <img src={logoPreview} alt="logo" className="w-10 h-10 object-contain rounded-lg flex-shrink-0"
                        style={{ background: 'repeating-conic-gradient(#fff1 0% 25%,transparent 0% 50%) 0 0/10px 10px' }} />
                      <p className="flex-1 text-xs text-white/50 truncate">
                        {logoFile ? logoFile.name : logoPreview}
                      </p>
                      <button type="button" onClick={remover} className="text-white/30 hover:text-red-400 transition-colors flex-shrink-0">
                        <X size={13} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input ref={fileRef} type="file" accept="image/png,image/webp,image/svg+xml,image/jpeg"
                        onChange={handleFile} className="hidden" />
                      <button type="button" onClick={() => fileRef.current?.click()}
                        className="flex items-center gap-2 px-4 py-2 border border-dashed border-white/15 hover:border-white/30 rounded-xl text-xs text-white/40 hover:text-white/60 transition-colors">
                        <Upload size={13} />Upload (PNG/WEBP/SVG/JPG)
                      </button>
                      <input type="text" placeholder="ou cole uma URL…" value={logoUrlInput}
                        onChange={e => { setLogoUrlInput(e.target.value); setLogoPreview(e.target.value || null); setRemoverLogo(false) }}
                        className="fld flex-1 text-[11px]" />
                    </div>
                  )}
                </div>

                {/* Cores */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="lbl">Cor primária</label>
                    <div className="flex gap-2.5 items-center">
                      <input type="color" value={corPrimaria} onChange={e => setCorPrimaria(e.target.value)}
                        className="w-9 h-9 rounded-lg border border-white/15 bg-transparent cursor-pointer flex-shrink-0" />
                      <span className="text-[10px] text-white/40 font-mono">{corPrimaria}</span>
                    </div>
                  </div>
                  <div>
                    <label className="lbl">Cor secundária</label>
                    <div className="flex gap-2.5 items-center">
                      <input type="color" value={corSecundaria} onChange={e => setCorSecundaria(e.target.value)}
                        className="w-9 h-9 rounded-lg border border-white/15 bg-transparent cursor-pointer flex-shrink-0" />
                      <span className="text-[10px] text-white/40 font-mono">{corSecundaria}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Section>

            {/* Admin */}
            <Section title="Administrador">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Nome" name="nome_admin" defaultValue={adminUser?.nome} placeholder="Nome do admin" />
                <Field label="Username" name="username_admin" defaultValue={adminUser?.username} placeholder="username" />
                <Field label="E-mail de acesso" name="email_admin" type="email" defaultValue={adminUser?.email} placeholder="admin@loja.com" span2 />
              </div>
              <p className="text-[10px] text-white/20 mt-2 mb-3">Alterar o e-mail também atualiza o login de acesso.</p>

              {/* Reset senha */}
              <div className="border-t border-white/8 pt-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-semibold text-white/50">Senha do administrador</p>
                    <p className="text-[10px] text-white/25 mt-0.5">Gera uma nova senha aleatória e exibe aqui</p>
                  </div>
                  <button type="button" onClick={handleResetSenha} disabled={resetando}
                    className="flex items-center gap-1.5 text-[10px] px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg transition-colors disabled:opacity-40 flex-shrink-0">
                    <KeyRound size={11} />
                    {resetando ? 'Gerando…' : 'Redefinir senha'}
                  </button>
                </div>

                {resetSenha && (
                  <div className="mt-3 bg-[#080a0f] border border-amber-500/30 rounded-xl p-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] text-amber-400/60 uppercase tracking-wider mb-1">Nova senha gerada</p>
                      <p className="text-base font-mono font-black text-amber-400 tracking-widest">{resetSenha.senha}</p>
                      <p className="text-[9px] text-white/30 mt-0.5">{resetSenha.email}</p>
                    </div>
                    <button type="button" onClick={copiarSenha}
                      className="flex items-center gap-1.5 text-[10px] px-2.5 py-1.5 bg-white/8 hover:bg-white/12 text-white/50 rounded-lg transition-colors flex-shrink-0">
                      {copiado ? <><Check size={11} className="text-emerald-400" />Copiado</> : <><Copy size={11} />Copiar</>}
                    </button>
                    <button type="button" onClick={() => setResetSenha(null)} className="text-white/20 hover:text-white/50">
                      <X size={13} />
                    </button>
                  </div>
                )}
              </div>
            </Section>

            {/* SaaS */}
            <Section title="Plano & Cobrança">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="lbl">Status SaaS</label>
                  <div className="flex gap-2">
                    {STATUS_OPTIONS.map(s => (
                      <button key={s} type="button" onClick={() => setStatusSaas(s)}
                        className={`flex-1 py-1.5 rounded-xl border text-[10px] font-semibold transition-colors capitalize ${
                          statusSaas === s ? 'border-[#4f7eff] bg-[#4f7eff]/10 text-[#4f7eff]' : 'border-white/10 text-white/40 hover:border-white/20'
                        }`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <Field label="Valor mensal (R$)" name="valor_mensal" type="number"
                  defaultValue={loja.valor_mensal?.toString()} placeholder="99.90" />
                <Field label="Data fim trial" name="data_fim_trial" type="date"
                  defaultValue={loja.data_fim_trial} />
                <Field label="Próximo vencimento" name="proximo_vencimento" type="date"
                  defaultValue={loja.proximo_vencimento} />
              </div>
            </Section>

            {erro && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">{erro}</div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-white/8 flex-shrink-0">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 border border-white/15 text-white/60 text-sm rounded-xl hover:bg-white/5 transition-colors">
            Cancelar
          </button>
          <button type="submit" form="editar-form" disabled={salvando || salvo}
            className="flex-1 py-2.5 bg-[#4f7eff] hover:opacity-90 text-white text-sm font-semibold rounded-xl disabled:opacity-40 transition-opacity flex items-center justify-center gap-2">
            {salvo ? <><Check size={14} />Salvo!</> : salvando ? 'Salvando…' : 'Salvar alterações'}
          </button>
        </div>
      </div>

      <style jsx global>{`
        .fld { width:100%; background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.1); border-radius:.625rem; padding:.5rem .875rem; color:white; font-size:.8125rem; outline:none; }
        .fld:focus { border-color:#4f7eff; }
        .fld::placeholder { color:rgba(255,255,255,.2); }
        .lbl { display:block; font-size:.625rem; font-weight:600; color:rgba(255,255,255,.35); text-transform:uppercase; letter-spacing:.05em; margin-bottom:.375rem; }
      `}</style>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white/3 border border-white/8 rounded-2xl p-4">
      <p className="text-[10px] font-bold uppercase tracking-wider text-white/30 mb-3">{title}</p>
      {children}
    </div>
  )
}

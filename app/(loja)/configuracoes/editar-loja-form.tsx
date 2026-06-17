'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Upload, X, Link2 } from 'lucide-react'
import { editarMinhaLoja } from './actions'

function LogoUpload({ currentLogoUrl, preview, onFile, onUrl, onRemove }: {
  currentLogoUrl?: string | null
  preview: string | null
  onFile: (f: File, preview: string) => void
  onUrl: (url: string) => void
  onRemove: () => void
}) {
  const ref = useRef<HTMLInputElement>(null)
  const [tab, setTab] = useState<'upload' | 'url'>('upload')
  const [urlVal, setUrlVal] = useState('')
  const displayLogo = preview || currentLogoUrl

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => { if (ev.target?.result) onFile(file, ev.target.result as string) }
    reader.readAsDataURL(file)
  }

  return (
    <div>
      <label className="label">Logo da loja</label>
      {displayLogo ? (
        <div className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl">
          <img src={displayLogo} alt="logo"
            className="w-12 h-12 object-contain rounded-lg flex-shrink-0"
            style={{ background: 'repeating-conic-gradient(#ffffff15 0% 25%, transparent 0% 50%) 0 0/10px 10px' }} />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-white/60">Logo carregado</p>
            <p className="text-[10px] text-white/30 truncate">{displayLogo.startsWith('data:') ? 'Arquivo selecionado' : displayLogo}</p>
          </div>
          <button type="button" onClick={onRemove} className="text-white/30 hover:text-red-400 transition-colors">
            <X size={14} />
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex gap-1 p-1 bg-white/5 border border-white/8 rounded-xl w-fit">
            {(['upload', 'url'] as const).map(t => (
              <button key={t} type="button" onClick={() => setTab(t)}
                className={`px-3 py-1 rounded-lg text-[10px] font-semibold transition-colors ${tab === t ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}>
                {t === 'upload' ? '⬆ Upload' : '🔗 URL'}
              </button>
            ))}
          </div>
          {tab === 'upload' ? (
            <div>
              <input ref={ref} type="file" accept="image/png,image/webp,image/svg+xml,image/jpeg" onChange={handleFile} className="hidden" />
              <button type="button" onClick={() => ref.current?.click()}
                className="w-full border border-dashed border-white/15 rounded-xl py-5 flex flex-col items-center gap-2 hover:border-white/30 hover:bg-white/3 transition-colors">
                <Upload size={18} className="text-white/30" />
                <span className="text-xs text-white/40">Clique para selecionar</span>
                <span className="text-[10px] text-white/20">PNG · WEBP · SVG · JPG · máx 2MB</span>
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input type="text" placeholder="https://..." value={urlVal}
                onChange={e => setUrlVal(e.target.value)} className="inp flex-1" />
              <button type="button" onClick={() => { if (urlVal.trim()) onUrl(urlVal.trim()) }}
                className="px-3 py-2 bg-white/8 hover:bg-white/12 text-white/60 text-xs rounded-xl transition-colors">
                <Link2 size={13} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function EditarMinhaLojaForm({ loja, redirectAfterSave }: { loja: any; redirectAfterSave?: string }) {
  const router = useRouter()
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [salvo, setSalvo] = useState(false)
  const [corPrimaria, setCorPrimaria] = useState(loja.cor_primaria ?? '#4f7eff')
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoUrl, setLogoUrl] = useState('')
  const [removerLogo, setRemoverLogo] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSalvando(true)
    setErro(null)
    const fd = new FormData(e.currentTarget)
    fd.set('cor_primaria', corPrimaria)
    if (logoFile) fd.set('logo', logoFile)
    if (logoUrl && !logoFile) fd.set('logo_url_input', logoUrl)
    if (removerLogo) fd.set('remover_logo', 'true')
    const res = await editarMinhaLoja(fd)
    setSalvando(false)
    if (res && 'error' in res) { setErro(res.error ?? 'Erro desconhecido'); return }
    if (redirectAfterSave) { router.push(redirectAfterSave); return }
    setSalvo(true)
    setTimeout(() => setSalvo(false), 3000)
  }

  const previewLogo = removerLogo ? null : (logoPreview || logoUrl || loja.logo_url || null)

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
        <p className="label mb-3">Dados da Loja</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="label">Nome da loja</label>
            <input name="nome" defaultValue={loja.nome} required className="inp" />
          </div>
          <div>
            <label className="label">WhatsApp</label>
            <input name="whatsapp" defaultValue={loja.whatsapp ?? ''} placeholder="(xx) 99999-0000" className="inp" />
          </div>
          <div>
            <label className="label">Instagram</label>
            <input name="instagram" defaultValue={loja.instagram ?? ''} placeholder="@loja" className="inp" />
          </div>
          <div>
            <label className="label">Telefone</label>
            <input name="telefone" defaultValue={loja.telefone ?? ''} placeholder="(xx) 9999-0000" className="inp" />
          </div>
          <div>
            <label className="label">E-mail</label>
            <input name="email" type="email" defaultValue={loja.email ?? ''} placeholder="loja@email.com" className="inp" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Endereço</label>
            <input name="endereco" defaultValue={loja.endereco ?? ''} placeholder="Rua, número, bairro" className="inp" />
          </div>
          <div>
            <label className="label">Garantia padrão (dias)</label>
            <input name="garantia_padrao" defaultValue={loja.garantia_padrao ?? ''} placeholder="90" className="inp" />
          </div>
          <div>
            <label className="label">Meta de faturamento do mês (R$)</label>
            <input name="meta_mensal" type="number" min="0" step="100" defaultValue={loja.meta_mensal ?? ''} placeholder="Ex: 80000" className="inp" />
          </div>
        </div>
      </div>

      <div className="bg-white/3 border border-white/8 rounded-2xl p-5 space-y-4">
        <p className="label">Identidade Visual</p>
        <LogoUpload
          currentLogoUrl={removerLogo ? null : loja.logo_url}
          preview={logoPreview}
          onFile={(file, prev) => { setLogoFile(file); setLogoPreview(prev); setLogoUrl(''); setRemoverLogo(false) }}
          onUrl={url => { setLogoUrl(url); setLogoPreview(url); setLogoFile(null); setRemoverLogo(false) }}
          onRemove={() => { setLogoPreview(null); setLogoFile(null); setLogoUrl(''); setRemoverLogo(true) }}
        />
        <div>
          <label className="label">Cor primária</label>
          <div className="flex gap-3 items-center">
            <input type="color" value={corPrimaria} onChange={e => setCorPrimaria(e.target.value)}
              className="w-10 h-10 rounded-lg border border-white/15 bg-transparent cursor-pointer flex-shrink-0" />
            <div>
              <p className="text-[10px] text-white/50 font-mono">{corPrimaria}</p>
              <p className="text-[9px] text-white/25">Cor dos botões e destaques</p>
            </div>
            {previewLogo && (
              <img src={previewLogo} alt="preview logo" className="h-8 object-contain rounded ml-auto opacity-80" />
            )}
          </div>
        </div>
      </div>

      {erro && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">{erro}</div>
      )}

      <button type="submit" disabled={salvando}
        className="w-full py-3 bg-[#4f7eff] hover:opacity-90 text-white text-sm font-semibold rounded-xl disabled:opacity-40 transition-opacity flex items-center justify-center gap-2">
        {salvo ? <><Check size={14} /> Salvo!</> : salvando ? 'Salvando...' : redirectAfterSave ? 'Salvar e continuar →' : 'Salvar alterações'}
      </button>

      <style jsx global>{`
        .inp { width:100%; background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.1); border-radius:.625rem; padding:.5rem .875rem; color:white; font-size:.8125rem; outline:none; }
        .inp:focus { border-color:#4f7eff; }
        .inp::placeholder { color:rgba(255,255,255,.2); }
        .label { display:block; font-size:.625rem; font-weight:600; color:rgba(255,255,255,.4); text-transform:uppercase; letter-spacing:.05em; margin-bottom:.375rem; }
      `}</style>
    </form>
  )
}

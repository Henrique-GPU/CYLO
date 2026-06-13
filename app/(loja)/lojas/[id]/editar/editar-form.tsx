'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Upload, X, Link2 } from 'lucide-react'
import { editarLoja } from './actions'

function ini(nome: string) {
  return nome.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() || 'CL'
}

// ── Preview ao vivo ─────────────────────────────────────────
function PreviewPanel({ nome, instagram, corPrimaria, corSecundaria, logo }: {
  nome: string; instagram: string; corPrimaria: string; corSecundaria: string; logo: string | null
}) {
  const initials = ini(nome || 'Nome da Loja')
  const bg = corSecundaria || '#0e1018'

  return (
    <div className="sticky top-6">
      <p className="text-[10px] font-bold uppercase tracking-wider text-white/30 mb-3">Prévia da identidade</p>

      <div className="rounded-2xl overflow-hidden border border-white/10 mb-3" style={{ background: bg }}>
        <div className="px-3 pt-3 pb-2.5 border-b border-white/10">
          <div className="flex items-center gap-2">
            {logo ? (
              <img src={logo} alt="logo" className="w-7 h-7 rounded-lg object-contain flex-shrink-0"
                style={{ background: 'transparent' }} />
            ) : (
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                style={{ backgroundColor: corPrimaria }}>
                {initials}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-white truncate">{nome || 'Nome da Loja'}</p>
              {instagram && <p className="text-[9px] text-white/40">{instagram}</p>}
            </div>
          </div>
        </div>
        <div className="px-3 py-2 space-y-px">
          {['Dashboard', 'Estoque', 'Nova Venda', 'Vendas'].map(item => (
            <div key={item} className="flex items-center gap-2 px-2 py-1 rounded-md">
              <div className="w-1 h-1 rounded-full" style={{ background: corPrimaria + '80' }} />
              <span className="text-[10px] text-white/40">{item}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 p-4 bg-white/3">
        <p className="text-[10px] text-white/30 mb-3">Botão e interface</p>
        <button className="w-full py-1.5 rounded-xl text-xs font-semibold text-white mb-3"
          style={{ backgroundColor: corPrimaria }}>
          Nova Venda
        </button>
        <div className="rounded-xl p-3 border border-white/8" style={{ background: corPrimaria + '10' }}>
          <p className="text-[10px] font-semibold text-white mb-0.5">{nome || 'Nome da Loja'}</p>
          <p className="text-[9px] text-white/30">Status · Ativo</p>
          <div className="mt-2 h-1 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full rounded-full w-3/4" style={{ background: corPrimaria }} />
          </div>
        </div>
      </div>

      <div className="mt-3 rounded-2xl border border-white/10 p-4 bg-white/3">
        <p className="text-[10px] text-white/30 mb-3">Orçamento / Recibo</p>
        <div className="bg-white rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2">
            {logo ? (
              <img src={logo} alt="logo" className="w-6 h-6 rounded object-contain" />
            ) : (
              <div className="w-6 h-6 rounded flex items-center justify-center text-white text-[9px] font-bold"
                style={{ backgroundColor: corPrimaria }}>
                {initials}
              </div>
            )}
            <div>
              <p className="text-[10px] font-bold text-gray-900">{nome || 'Nome da Loja'}</p>
              {instagram && <p className="text-[8px] text-gray-400">{instagram}</p>}
            </div>
          </div>
          <div className="text-[8px] text-gray-400 border-t border-gray-100 pt-1.5">
            ORÇAMENTO · Cliente Exemplo · R$ 3.500,00
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Logo Upload ─────────────────────────────────────────────
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
          <button type="button" onClick={onRemove}
            className="text-white/30 hover:text-red-400 transition-colors flex-shrink-0">
            <X size={14} />
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex gap-1 p-1 bg-white/5 border border-white/8 rounded-xl w-fit">
            {(['upload', 'url'] as const).map(t => (
              <button key={t} type="button" onClick={() => setTab(t)}
                className={`px-3 py-1 rounded-lg text-[10px] font-semibold transition-colors ${
                  tab === t ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'
                }`}>
                {t === 'upload' ? '⬆ Upload' : '🔗 URL'}
              </button>
            ))}
          </div>
          {tab === 'upload' ? (
            <div>
              <input ref={ref} type="file" name="logo" accept="image/png,image/webp,image/svg+xml,image/jpeg"
                onChange={handleFile} className="hidden" />
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

// ── Main form ───────────────────────────────────────────────
export default function EditarLojaForm({ loja }: { loja: any }) {
  const router = useRouter()
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [salvo, setSalvo] = useState(false)

  // Preview state — seed from loja
  const [nomePrev, setNomePrev] = useState(loja.nome ?? '')
  const [instaPrev, setInstaPrev] = useState(loja.instagram ?? '')
  const [corPrimaria, setCorPrimaria] = useState(loja.cor_primaria ?? '#4f7eff')
  const [corSecundaria, setCorSecundaria] = useState(loja.cor_secundaria ?? '#0e1018')
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
    fd.set('cor_secundaria', corSecundaria)
    if (logoFile) fd.set('logo', logoFile)
    if (logoUrl && !logoFile) fd.set('logo_url_input', logoUrl)
    if (removerLogo) fd.set('remover_logo', 'true')
    const res = await editarLoja(loja.id, fd)
    setSalvando(false)
    if ('error' in res) { setErro(res.error ?? 'Erro desconhecido'); return }
    setSalvo(true)
    setTimeout(() => setSalvo(false), 3000)
  }

  const previewLogo = removerLogo ? null : (logoPreview || (logoUrl || null))

  return (
    <div className="flex gap-8 items-start">

      {/* Formulário */}
      <form onSubmit={handleSubmit} className="flex-1 space-y-4 min-w-0">

        {/* Dados da Loja */}
        <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-white/30 mb-3">Dados da Loja</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="label">Nome da loja</label>
              <input name="nome" defaultValue={loja.nome} placeholder="Nome fantasia" className="inp"
                onChange={e => setNomePrev(e.target.value)} />
            </div>
            <div>
              <label className="label">Responsável</label>
              <input name="responsavel" defaultValue={loja.responsavel ?? ''} placeholder="Nome completo" className="inp" />
            </div>
            <div>
              <label className="label">CNPJ</label>
              <input name="cnpj" defaultValue={loja.cnpj ?? ''} placeholder="00.000.000/0001-00" className="inp" />
            </div>
            <div>
              <label className="label">Telefone</label>
              <input name="telefone" defaultValue={loja.telefone ?? ''} placeholder="(xx) 99999-0000" className="inp" />
            </div>
            <div>
              <label className="label">WhatsApp</label>
              <input name="whatsapp" defaultValue={loja.whatsapp ?? ''} placeholder="(xx) 99999-0001" className="inp" />
            </div>
            <div>
              <label className="label">Email</label>
              <input name="email" type="email" defaultValue={loja.email ?? ''} placeholder="loja@email.com" className="inp" />
            </div>
            <div>
              <label className="label">Instagram</label>
              <input name="instagram" defaultValue={loja.instagram ?? ''} placeholder="@loja" className="inp"
                onChange={e => setInstaPrev(e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="label">Endereço</label>
              <input name="endereco" defaultValue={loja.endereco ?? ''} placeholder="Rua, número, bairro" className="inp" />
            </div>
            <div>
              <label className="label">Garantia padrão (dias)</label>
              <input name="garantia_padrao" defaultValue={loja.garantia_padrao ?? ''} placeholder="90" className="inp" />
            </div>
          </div>
        </div>

        {/* Identidade Visual */}
        <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-white/30 mb-3">Identidade Visual</p>
          <div className="space-y-4">
            <LogoUpload
              currentLogoUrl={removerLogo ? null : loja.logo_url}
              preview={logoPreview}
              onFile={(file, prev) => { setLogoFile(file); setLogoPreview(prev); setLogoUrl(''); setRemoverLogo(false) }}
              onUrl={(url) => { setLogoUrl(url); setLogoPreview(url); setLogoFile(null); setRemoverLogo(false) }}
              onRemove={() => { setLogoPreview(null); setLogoFile(null); setLogoUrl(''); setRemoverLogo(true) }}
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Cor primária</label>
                <div className="flex gap-2.5 items-center">
                  <input type="color" value={corPrimaria} onChange={e => setCorPrimaria(e.target.value)}
                    className="w-10 h-10 rounded-lg border border-white/15 bg-transparent cursor-pointer flex-shrink-0" />
                  <div>
                    <p className="text-[10px] text-white/50">{corPrimaria}</p>
                    <p className="text-[9px] text-white/25">Botões e destaques</p>
                  </div>
                </div>
              </div>
              <div>
                <label className="label">Cor secundária (fundo)</label>
                <div className="flex gap-2.5 items-center">
                  <input type="color" value={corSecundaria} onChange={e => setCorSecundaria(e.target.value)}
                    className="w-10 h-10 rounded-lg border border-white/15 bg-transparent cursor-pointer flex-shrink-0" />
                  <div>
                    <p className="text-[10px] text-white/50">{corSecundaria}</p>
                    <p className="text-[9px] text-white/25">Sidebar e fundo</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cobrança */}
        <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-white/30 mb-3">Cobrança</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Valor mensal (R$)</label>
              <input type="number" name="valor_mensal" defaultValue={loja.valor_mensal?.toString() ?? '99.90'}
                step="0.01" placeholder="99.90" className="inp" />
            </div>
          </div>
        </div>

        {erro && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">{erro}</div>
        )}

        <div className="flex gap-3">
          <button type="button" onClick={() => router.push('/dashboard')}
            className="flex-1 py-2.5 border border-white/15 text-white/60 text-sm rounded-xl hover:bg-white/5 transition-colors">
            Cancelar
          </button>
          <button type="submit" disabled={salvando}
            className="flex-1 py-2.5 bg-[#4f7eff] hover:opacity-90 text-white text-sm font-semibold rounded-xl disabled:opacity-40 transition-opacity flex items-center justify-center gap-2">
            {salvo ? <><Check size={14} />Salvo!</> : salvando ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </div>

        <style jsx global>{`
          .inp { width:100%; background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.1); border-radius:.625rem; padding:.5rem .875rem; color:white; font-size:.8125rem; outline:none; }
          .inp:focus { border-color:#4f7eff; }
          .inp::placeholder { color:rgba(255,255,255,.2); }
          .label { display:block; font-size:.625rem; font-weight:600; color:rgba(255,255,255,.4); text-transform:uppercase; letter-spacing:.05em; margin-bottom:.375rem; }
        `}</style>
      </form>

      {/* Preview ao vivo */}
      <div className="w-64 flex-shrink-0 hidden lg:block">
        <PreviewPanel
          nome={nomePrev}
          instagram={instaPrev}
          corPrimaria={corPrimaria}
          corSecundaria={corSecundaria}
          logo={previewLogo}
        />
      </div>
    </div>
  )
}

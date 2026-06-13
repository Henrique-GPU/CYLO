'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Copy } from 'lucide-react'
import { criarFuncionario } from './actions'

interface Credenciais { email: string; senha: string }

function Field({ label, name, placeholder, type = 'text', required }: {
  label: string; name: string; placeholder?: string; type?: string; required?: boolean
}) {
  return (
    <div>
      <label className="label">{label}{required ? ' *' : ''}</label>
      <input type={type} name={name} placeholder={placeholder} required={required} className="inp" />
    </div>
  )
}

export default function NovoFuncionarioForm() {
  const router = useRouter()
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [credenciais, setCredenciais] = useState<Credenciais | null>(null)
  const [perfil, setPerfil] = useState('vendedor')
  const [copiado, setCopiado] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSalvando(true)
    setErro(null)
    const fd = new FormData(e.currentTarget)
    fd.set('perfil', perfil)
    const res = await criarFuncionario(fd)
    setSalvando(false)
    if ('error' in res) { setErro(res.error ?? 'Erro desconhecido'); return }
    if (res.ok && res.credenciais) setCredenciais(res.credenciais)
  }

  function copiar(email: string, senha: string) {
    navigator.clipboard.writeText(`Email: ${email}\nSenha: ${senha}`)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  if (credenciais) {
    return (
      <div className="bg-white/3 border border-white/8 rounded-2xl p-8 text-center">
        <div className="text-4xl mb-3">✅</div>
        <h2 className="text-xl font-black text-white mb-1">Funcionário criado!</h2>
        <p className="text-sm text-white/50 mb-6">Compartilhe as credenciais abaixo.</p>

        <div className="bg-[#0e1018] border border-white/10 rounded-xl p-5 mb-6 text-left">
          <p className="text-[10px] font-bold uppercase tracking-wider text-white/30 mb-3">Credenciais de Acesso</p>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-xs text-white/40">Email</span>
              <span className="text-sm font-mono text-white">{credenciais.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-white/40">Senha</span>
              <span className="text-sm font-mono font-bold text-[#4f7eff]">{credenciais.senha}</span>
            </div>
          </div>
          <button
            onClick={() => copiar(credenciais.email, credenciais.senha)}
            className="flex items-center gap-1.5 mt-4 text-xs text-white/40 hover:text-white transition-colors"
          >
            {copiado ? <><Check size={12} className="text-emerald-400" />Copiado!</> : <><Copy size={12} />Copiar credenciais</>}
          </button>
        </div>
        <p className="text-[11px] text-white/30 mb-6">⚠ Guarde a senha agora — ela não será exibida novamente.</p>

        <div className="flex gap-3">
          <button onClick={() => router.push('/funcionarios')}
            className="flex-1 py-2.5 border border-white/15 text-white text-sm rounded-xl hover:bg-white/5 transition-colors">
            Ver equipe
          </button>
          <button onClick={() => setCredenciais(null)}
            className="flex-1 py-2.5 bg-[#4f7eff] hover:opacity-90 text-white text-sm font-semibold rounded-xl transition-opacity">
            + Outro funcionário
          </button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-white/30 mb-3">Dados</p>
        <div className="space-y-3">
          <Field label="Nome completo" name="nome" placeholder="Ex: João Silva" required />
          <Field label="Email de acesso" name="email" type="email" placeholder="joao@loja.com" required />

          <div>
            <label className="label">Perfil</label>
            <div className="flex gap-2">
              {[
                { key: 'vendedor', label: '🛍 Vendedor', desc: 'Acesso a vendas e estoque' },
                { key: 'loja_admin', label: '⚙ Admin', desc: 'Acesso total à loja' },
              ].map(p => (
                <button key={p.key} type="button" onClick={() => setPerfil(p.key)}
                  className={`flex-1 py-2 px-3 rounded-xl border text-left transition-colors ${
                    perfil === p.key ? 'border-[#4f7eff] bg-[#4f7eff]/10' : 'border-white/10 hover:border-white/20'
                  }`}>
                  <p className="text-sm font-semibold text-white">{p.label}</p>
                  <p className="text-[10px] text-white/30">{p.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-white/30 mb-3">Remuneração</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Comissão (%)</label>
            <input type="number" name="comissao_pct" defaultValue="5" min="0" max="100" step="0.5" className="inp" />
          </div>
          <div>
            <label className="label">Meta mensal (R$)</label>
            <input type="number" name="meta_mensal" placeholder="Ex: 30000" min="0" step="100" className="inp" />
          </div>
        </div>
      </div>

      {erro && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">{erro}</div>
      )}

      <div className="flex gap-3">
        <button type="button" onClick={() => router.back()}
          className="flex-1 py-2.5 border border-white/15 text-white/60 text-sm rounded-xl hover:bg-white/5 transition-colors">
          Cancelar
        </button>
        <button type="submit" disabled={salvando}
          className="flex-1 py-2.5 bg-[#4f7eff] hover:opacity-90 text-white text-sm font-semibold rounded-xl disabled:opacity-40 transition-opacity">
          {salvando ? 'Criando...' : 'Criar funcionário'}
        </button>
      </div>

      <style jsx global>{`
        .inp { width:100%; background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.1); border-radius:.625rem; padding:.5rem .875rem; color:white; font-size:.8125rem; outline:none; }
        .inp:focus { border-color:#4f7eff; }
        .inp::placeholder { color:rgba(255,255,255,.2); }
        .label { display:block; font-size:.625rem; font-weight:600; color:rgba(255,255,255,.4); text-transform:uppercase; letter-spacing:.05em; margin-bottom:.375rem; }
      `}</style>
    </form>
  )
}

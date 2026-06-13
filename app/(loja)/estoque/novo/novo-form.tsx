'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { MODELOS_IPHONE, getCaps, getCores } from '@/lib/catalog/iphone'

interface Props {
  lojaId: string
  initialModelo?: string
  initialCapacidade?: string
  initialCor?: string
}

export default function NovoAparelhoForm({ lojaId, initialModelo = '', initialCapacidade = '', initialCor = '' }: Props) {
  const router = useRouter()
  const [salvando, setSalvando] = useState(false)
  const [tipo, setTipo] = useState<'novo' | 'usado'>(initialModelo ? 'novo' : 'novo')

  // novo fields
  const [novoModelo, setNovoModelo] = useState(initialModelo)
  const [novoCap, setNovoCap] = useState(initialCapacidade)
  const [novoCor, setNovoCor] = useState(initialCor)
  const [novoCusto, setNovoCusto] = useState('')
  const [novoPreco, setNovoPreco] = useState('')
  const [novoQtd, setNovoQtd] = useState('1')

  // usado fields
  const [usadoModelo, setUsadoModelo] = useState('')
  const [usadoCap, setUsadoCap] = useState('')
  const [usadoCor, setUsadoCor] = useState('')
  const [imei, setImei] = useState('')
  const [custo, setCusto] = useState('')
  const [preco, setPreco] = useState('')
  const [bateria, setBateria] = useState('')
  const [estado, setEstado] = useState('bom')
  const [origemAp, setOrigemAp] = useState('Troca')
  const [extras, setExtras] = useState('')
  const [dataEntrada, setDataEntrada] = useState(new Date().toISOString().split('T')[0])

  async function salvar() {
    if (tipo === 'novo') {
      if (!novoModelo || !novoCap) return
      setSalvando(true)
      const supabase = createClient()
      const qty = Math.max(1, parseInt(novoQtd) || 1)
      const rows = Array.from({ length: qty }, () => ({
        loja_id: lojaId,
        tipo: 'novo',
        modelo: novoModelo,
        capacidade: novoCap,
        cor: novoCor || null,
        custo: parseFloat(novoCusto) || 0,
        preco: parseFloat(novoPreco) || 0,
        status: 'disponivel',
        data_entrada: new Date().toISOString().split('T')[0],
      }))
      const { error } = await supabase.from('aparelhos').insert(rows)
      setSalvando(false)
      if (!error) router.push('/estoque')
    } else {
      if (!usadoModelo) return
      setSalvando(true)
      const supabase = createClient()
      const { error } = await supabase.from('aparelhos').insert({
        loja_id: lojaId,
        tipo: 'usado',
        modelo: usadoModelo,
        capacidade: usadoCap || null,
        cor: usadoCor || null,
        imei: imei || null,
        custo: parseFloat(custo) || 0,
        preco: parseFloat(preco) || 0,
        bateria_pct: parseInt(bateria) || null,
        estado,
        origem_aparelho: origemAp || null,
        extras: extras || null,
        status: 'disponivel',
        data_entrada: dataEntrada,
      })
      setSalvando(false)
      if (!error) router.push('/estoque')
    }
  }

  const custoNum = parseFloat(tipo === 'novo' ? novoCusto : custo) || 0
  const precoNum = parseFloat(tipo === 'novo' ? novoPreco : preco) || 0
  const mg = precoNum > 0 ? (((precoNum - custoNum) / precoNum) * 100).toFixed(0) : '—'

  const caps = novoModelo ? getCaps(novoModelo) : []
  const cores = novoModelo ? getCores(novoModelo) : []

  return (
    <div className="space-y-4">
      {/* Tipo toggle */}
      <div className="flex gap-2">
        {(['novo', 'usado'] as const).map(t => (
          <button key={t} onClick={() => setTipo(t)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
              tipo === t
                ? 'bg-[#4f7eff] border-[#4f7eff] text-white'
                : 'border-white/15 text-white/50 hover:border-white/30 hover:text-white'
            }`}>
            {t === 'novo' ? '📦 Novo Lacrado' : '🔄 Usado'}
          </button>
        ))}
      </div>

      {tipo === 'novo' ? (
        <div className="bg-white/3 border border-white/8 rounded-2xl p-5 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-white/30 mb-1">Modelo</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="label">iPhone *</label>
              <select
                value={novoModelo}
                onChange={e => { setNovoModelo(e.target.value); setNovoCap(''); setNovoCor('') }}
                className="inp"
              >
                <option value="">Selecione o modelo</option>
                {MODELOS_IPHONE.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            {novoModelo && (
              <>
                <div>
                  <label className="label">Capacidade *</label>
                  <select value={novoCap} onChange={e => setNovoCap(e.target.value)} className="inp">
                    <option value="">Selecione</option>
                    {caps.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Cor</label>
                  <select value={novoCor} onChange={e => setNovoCor(e.target.value)} className="inp">
                    <option value="">Selecione</option>
                    {cores.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </>
            )}
            <div>
              <label className="label">Quantidade</label>
              <input type="number" min="1" value={novoQtd} onChange={e => setNovoQtd(e.target.value)} className="inp" />
            </div>
            {parseInt(novoQtd) > 1 && (
              <div className="flex items-end">
                <p className="text-[11px] text-yellow-400/80 pb-2">
                  ↑ {novoQtd} unidades — IMEI informado na venda
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white/3 border border-white/8 rounded-2xl p-5 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-white/30 mb-1">Identificação</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="label">Modelo *</label>
              <input value={usadoModelo} onChange={e => setUsadoModelo(e.target.value)}
                placeholder="Ex: iPhone 13 Pro Max" className="inp" />
            </div>
            <div>
              <label className="label">IMEI</label>
              <input value={imei} onChange={e => setImei(e.target.value)}
                placeholder="15 dígitos" className="inp" />
            </div>
            <div>
              <label className="label">Capacidade</label>
              <select value={usadoCap} onChange={e => setUsadoCap(e.target.value)} className="inp">
                <option value="">Selecione</option>
                {['64GB', '128GB', '256GB', '512GB', '1TB'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="label">Cor</label>
              <input value={usadoCor} onChange={e => setUsadoCor(e.target.value)}
                placeholder="Ex: Titânio Natural" className="inp" />
            </div>
          </div>
          <div className="pt-2 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-white/30">Detalhes</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Estado físico</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {['excelente', 'bom', 'regular', 'ruim'].map(e => (
                    <button key={e} onClick={() => setEstado(e)}
                      className={`py-1.5 rounded-lg text-[11px] font-medium capitalize transition-colors ${estado === e ? 'bg-[#4f7eff] text-white' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}>
                      {e}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Bateria (%)</label>
                <input type="number" value={bateria} onChange={e => setBateria(e.target.value)}
                  placeholder="85" className="inp" />
              </div>
              <div>
                <label className="label">Origem</label>
                <select value={origemAp} onChange={e => setOrigemAp(e.target.value)} className="inp">
                  {['Troca', 'Compra cliente', 'Consignado', 'Fornecedor', 'Outro'].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Data entrada</label>
                <input type="date" value={dataEntrada} onChange={e => setDataEntrada(e.target.value)} className="inp" />
              </div>
              <div className="col-span-2">
                <label className="label">Extras / Observações</label>
                <input value={extras} onChange={e => setExtras(e.target.value)}
                  placeholder="Carregador, caixa, capinha..." className="inp" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pricing */}
      <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-white/30 mb-3">Precificação</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Custo (R$)</label>
            <input type="number"
              value={tipo === 'novo' ? novoCusto : custo}
              onChange={e => tipo === 'novo' ? setNovoCusto(e.target.value) : setCusto(e.target.value)}
              placeholder="3200" className="inp" />
          </div>
          <div>
            <label className="label">Preço de venda (R$)</label>
            <input type="number"
              value={tipo === 'novo' ? novoPreco : preco}
              onChange={e => tipo === 'novo' ? setNovoPreco(e.target.value) : setPreco(e.target.value)}
              placeholder="3999" className="inp" />
          </div>
        </div>
        {custoNum > 0 && precoNum > 0 && (
          <div className="mt-3 flex items-center gap-3">
            <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.min(100, Math.max(0, parseFloat(mg as string)))}%`,
                  background: parseFloat(mg as string) > 25 ? '#34d399' : parseFloat(mg as string) > 15 ? '#fbbf24' : '#f87171',
                }}
              />
            </div>
            <span className="text-xs font-bold text-white/50">Margem: {mg}%</span>
          </div>
        )}
        {tipo === 'novo' && (!novoCusto || parseFloat(novoCusto) === 0) && (
          <p className="text-[11px] text-yellow-400/70 mt-2">⚠ Custo não informado — será marcado como pendente.</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={() => router.back()}
          className="flex-1 py-2.5 border border-white/15 text-white/60 text-sm rounded-xl hover:bg-white/5 transition-colors">
          Cancelar
        </button>
        <button
          onClick={salvar}
          disabled={salvando || (tipo === 'novo' ? (!novoModelo || !novoCap) : !usadoModelo)}
          className="flex-1 py-2.5 bg-[#4f7eff] hover:opacity-90 text-white text-sm font-semibold rounded-xl disabled:opacity-30 transition-opacity">
          {salvando
            ? 'Salvando...'
            : tipo === 'novo' && parseInt(novoQtd) > 1
              ? `Adicionar ${novoQtd} unidades`
              : 'Cadastrar Aparelho'}
        </button>
      </div>

      <style jsx global>{`
        .inp {
          width: 100%;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 0.625rem;
          padding: 0.5rem 0.875rem;
          color: white;
          font-size: 0.8125rem;
          outline: none;
        }
        .inp:focus { border-color: #4f7eff; }
        .inp::placeholder { color: rgba(255,255,255,0.2); }
        .inp option { background: #0e1018; }
        .label {
          display: block;
          font-size: 0.625rem;
          font-weight: 600;
          color: rgba(255,255,255,0.4);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.375rem;
        }
      `}</style>
    </div>
  )
}

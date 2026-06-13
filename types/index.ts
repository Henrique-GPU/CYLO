export type Perfil = 'ceo' | 'loja_admin' | 'vendedor'
export type StatusSaas = 'trial' | 'ativo' | 'vencido' | 'bloqueado'
export type StatusAparelho = 'disponivel' | 'reservado' | 'vendido' | 'manutencao' | 'negociacao'
export type TipoAparelho = 'novo' | 'usado'
export type StatusVenda = 'orcamento' | 'convertido' | 'cancelado'
export type EstadoTroca = 'excelente' | 'bom' | 'regular' | 'ruim'

export interface Loja {
  id: string
  nome: string
  razao_social: string | null
  cnpj: string | null
  responsavel: string | null
  telefone: string | null
  whatsapp: string | null
  instagram: string | null
  email: string | null
  endereco: string | null
  garantia_padrao: string
  logo_url: string | null
  cor_primaria: string
  cor_secundaria: string
  status_saas: StatusSaas
  valor_mensal: number
  data_inicio_trial: string | null
  data_fim_trial: string | null
  proximo_vencimento: string | null
  ultimo_acesso: string | null
  criada_em: string
  atualizada_em: string
}

export interface Usuario {
  id: string
  loja_id: string | null
  nome: string
  username: string
  email: string | null
  perfil: Perfil
  iniciais: string | null
  status: 'ativo' | 'bloqueado'
  comissao_pct: number
  meta_mensal: number | null
  criado_em: string
}

export interface Aparelho {
  id: string
  loja_id: string
  modelo: string
  capacidade: string | null
  cor: string | null
  tipo: TipoAparelho
  bateria_pct: number | null
  imei: string | null
  status: StatusAparelho
  preco: number
  custo: number
  origem: string | null
  reservado_para: string | null
  data_entrada: string
  criado_em: string
  atualizado_em: string
}

export interface Cliente {
  id: string
  loja_id: string
  nome: string
  telefone: string | null
  instagram: string | null
  criado_em: string
}

export interface AcessorioCatalogo {
  id: string
  loja_id: string
  nome: string
  custo: number
  preco: number
  ativo: boolean
}

export interface Venda {
  id: string
  loja_id: string
  vendedor_id: string
  cliente_id: string | null
  cliente_nome: string
  cliente_telefone: string | null
  aparelho_id: string | null
  valor_total: number
  valor_aparelho: number
  valor_acessorios: number
  pgto_pix: number
  pgto_dinheiro: number
  pgto_debito: number
  pgto_credito: number
  pgto_transferencia: number
  com_troca: boolean
  troca_modelo: string | null
  troca_imei: string | null
  troca_estado: EstadoTroca | null
  troca_bateria_pct: number | null
  troca_valor: number
  comissao: number
  lucro: number
  garantia: string | null
  garantia_validade: string | null
  origem_lead: string | null
  local_venda: string | null
  status: StatusVenda
  data_venda: string
  criado_em: string
}

export interface VendaAcessorio {
  id: string
  venda_id: string
  acessorio_id: string | null
  nome: string
  preco_unitario: number
  custo_unitario: number
  quantidade: number
}

export interface TabelaPreco {
  id: string
  loja_id: string
  modelo: string
  serie: string
  preco_lacrado: number | null
  preco_excelente: number | null
  preco_bom: number | null
  preco_regular: number | null
  valor_sugerido_compra: number | null
  margem_pct: string | null
}

// Tipo utilitário para o banco (a ser expandido com geração automática via Supabase CLI)
export type Database = {
  public: {
    Tables: {
      lojas: { Row: Loja; Insert: Partial<Loja>; Update: Partial<Loja> }
      usuarios: { Row: Usuario; Insert: Partial<Usuario>; Update: Partial<Usuario> }
      aparelhos: { Row: Aparelho; Insert: Partial<Aparelho>; Update: Partial<Aparelho> }
      clientes: { Row: Cliente; Insert: Partial<Cliente>; Update: Partial<Cliente> }
      acessorios_catalogo: { Row: AcessorioCatalogo; Insert: Partial<AcessorioCatalogo>; Update: Partial<AcessorioCatalogo> }
      vendas: { Row: Venda; Insert: Partial<Venda>; Update: Partial<Venda> }
      venda_acessorios: { Row: VendaAcessorio; Insert: Partial<VendaAcessorio>; Update: Partial<VendaAcessorio> }
      tabela_precos: { Row: TabelaPreco; Insert: Partial<TabelaPreco>; Update: Partial<TabelaPreco> }
    }
  }
}

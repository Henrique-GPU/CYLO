import type { Perfil } from '@/types'

export interface NavItem {
  label: string
  href: string
  icon: string
  section?: string
}

const CEO_NAV: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: 'LayoutGrid', section: 'Plataforma' },
  { label: 'Lojas', href: '/lojas', icon: 'Store' },
]

const ADMIN_NAV: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: 'LayoutGrid', section: 'Principal' },
  { label: 'Estoque', href: '/estoque', icon: 'Package' },
  { label: 'Nova Venda', href: '/nova-venda', icon: 'PlusCircle' },
  { label: 'Assistência', href: '/assistencia', icon: 'Wrench', section: 'Ferramentas' },
  { label: 'Calc. Troca', href: '/calculadora', icon: 'Calculator' },
  { label: 'Preços Ref.', href: '/precos', icon: 'Tag' },
  { label: 'Orçamentos', href: '/orcamentos', icon: 'FileText' },
  { label: 'Recibos', href: '/recibos', icon: 'FileCheck' },
  { label: 'Acessórios', href: '/acessorios', icon: 'Headphones' },
  { label: 'Funcionários', href: '/funcionarios', icon: 'Users', section: 'Gestão' },
  { label: 'Motoboys', href: '/motoboys', icon: 'Truck' },
  { label: 'DRE / Custos', href: '/dre', icon: 'TrendingUp' },
  { label: 'Vendas', href: '/vendas', icon: 'Receipt' },
  { label: 'Clientes', href: '/clientes', icon: 'Users2' },
  { label: 'Financeiro', href: '/financeiro', icon: 'BarChart2' },
  { label: 'Relatórios', href: '/relatorios', icon: 'FileBarChart' },
  { label: 'Configurações', href: '/configuracoes', icon: 'Settings' },
]

const VENDEDOR_NAV: NavItem[] = [
  { label: 'Minha Área', href: '/minha-area', icon: 'User', section: 'Meu Painel' },
  { label: 'Nova Venda', href: '/nova-venda', icon: 'PlusCircle' },
  { label: 'Assistência', href: '/assistencia', icon: 'Wrench' },
  { label: 'Calc. Troca', href: '/calculadora', icon: 'Calculator' },
  { label: 'Estoque Disp.', href: '/estoque', icon: 'Package', section: 'Catálogo' },
  { label: 'Preços Ref.', href: '/precos', icon: 'Tag' },
  { label: 'Meus Orçamentos', href: '/meus-orcamentos', icon: 'FileText', section: 'Documentos' },
  { label: 'Meus Recibos', href: '/meus-recibos', icon: 'FileCheck' },
  { label: 'Clientes', href: '/clientes', icon: 'Users2' },
  { label: 'Relatórios', href: '/relatorios', icon: 'FileBarChart' },
]

export function getNavItems(perfil: Perfil): NavItem[] {
  if (perfil === 'ceo') return CEO_NAV
  if (perfil === 'loja_admin') return ADMIN_NAV
  return VENDEDOR_NAV
}

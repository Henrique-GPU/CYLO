import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/login', '/cadastro'],
      disallow: [
        '/dashboard',
        '/estoque',
        '/vendas',
        '/clientes',
        '/funcionarios',
        '/configuracoes',
        '/relatorios',
        '/financeiro',
        '/dre',
        '/acessorios',
        '/motoboys',
        '/lojas',
        '/orcamentos',
        '/meus-orcamentos',
        '/recibos',
        '/meus-recibos',
        '/assistencia',
        '/precos',
        '/calculadora',
        '/minha-area',
        '/nova-venda',
        '/onboarding',
        '/bloqueado',
        '/api/',
      ],
    },
    sitemap: 'https://www.cyloapp.com.br/sitemap.xml',
  }
}

# Cylo — Documentação Técnica

SaaS white-label de gestão para lojas de iPhone. Multi-tenant, cada loja tem dados 100% isolados.

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 16.2.9 (App Router, Turbopack) |
| Banco / Auth | Supabase (Postgres + RLS + Auth) |
| Hosting | Vercel (branch `main` → produção automática) |
| DNS | Cloudflare → `cyloapp.com.br` |
| Estilos | Tailwind CSS |
| Ícones | Lucide React |

**Repositório:** `github.com/Henrique-GPU/CYLO`  
**Produção:** `https://www.cyloapp.com.br`  
**Vercel:** `cylo-zeta.vercel.app` (alias interno)

---

## Variáveis de Ambiente

Configuradas no Vercel → Project → Environment Variables:

```env
NEXT_PUBLIC_SUPABASE_URL=        # URL pública do projeto Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # Chave anon (segura para expor no client)
SUPABASE_SERVICE_ROLE_KEY=       # Chave service role — APENAS server-side, nunca expor
```

> **Regra de ouro:** `SUPABASE_SERVICE_ROLE_KEY` só existe em `createAdminClient()` (server). Nunca use no client.

---

## Estrutura de Arquivos

```
cylo/
├── app/
│   ├── page.tsx                  # Landing page pública
│   ├── login/page.tsx            # Login
│   ├── cadastro/
│   │   ├── page.tsx              # Form de self-signup
│   │   └── actions.ts            # Server action: cria loja + auth user + usuario
│   ├── onboarding/page.tsx       # Configuração inicial após cadastro
│   ├── bloqueado/page.tsx        # Tela de trial expirado / conta bloqueada
│   └── (loja)/                   # Grupo autenticado (layout compartilhado)
│       ├── layout.tsx            # Sidebar + BottomNav injetados aqui
│       ├── dashboard/            # Dashboard CEO e admin
│       ├── estoque/              # Listagem e cadastro por IMEI
│       ├── nova-venda/           # Fluxo de venda com troca
│       ├── vendas/               # Histórico de vendas
│       ├── orcamentos/           # Orçamentos (admin)
│       ├── meus-orcamentos/      # Orçamentos (vendedor)
│       ├── recibos/              # Recibos (admin)
│       ├── meus-recibos/         # Recibos (vendedor)
│       ├── minha-area/           # Painel pessoal do vendedor
│       ├── funcionarios/         # Gestão de equipe (admin)
│       ├── lojas/                # Gestão de lojas (CEO)
│       ├── clientes/             # CRM básico
│       ├── financeiro/           # Visão financeira
│       ├── dre/                  # DRE mensal
│       ├── relatorios/           # Relatórios PDF
│       ├── calculadora/          # Calculadora de troca
│       ├── precos/               # Tabela de preços de referência
│       ├── acessorios/           # Catálogo de acessórios
│       ├── motoboys/             # Cadastro de motoboys
│       └── configuracoes/        # Configurações da loja
├── components/
│   └── layout/
│       ├── sidebar.tsx           # Sidebar desktop (hidden em mobile)
│       ├── bottom-nav.tsx        # Nav mobile (lg:hidden)
│       └── nav-items.ts          # Itens de nav por perfil
├── lib/
│   └── supabase/
│       ├── client.ts             # createClient() — browser, usa anon key + RLS
│       ├── server.ts             # createClient() — server, usa anon key + RLS
│       ├── admin.ts              # createAdminClient() — server only, bypassa RLS
│       └── middleware.ts         # updateSession() — refresh de cookies de auth
├── types/index.ts                # Tipos TypeScript de todas as entidades
├── proxy.ts                      # Middleware de autenticação e bloqueio (Next.js 16)
└── public/
    └── cylo-logo.svg
```

---

## Banco de Dados (Supabase / Postgres)

### Tabelas principais

#### `lojas`
Cada cliente do Cylo é uma loja. Isolamento total por `id`.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | uuid | PK |
| `nome` | text | Nome fantasia |
| `responsavel` | text | Nome do dono |
| `status_saas` | enum | `trial` / `ativo` / `vencido` / `bloqueado` |
| `valor_mensal` | numeric | Padrão: 59.99 |
| `data_inicio_trial` | date | Início do trial |
| `data_fim_trial` | date | Fim do trial (início + 15 dias) |
| `proximo_vencimento` | date | Data do próximo pagamento |
| `cor_primaria` | text | Hex da cor da loja (white-label) |
| `logo_url` | text | URL pública do logo no Supabase Storage |

#### `usuarios`
Vinculado ao Supabase Auth via `id = auth.users.id`.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | uuid | FK → auth.users |
| `loja_id` | uuid | FK → lojas (null para CEO) |
| `perfil` | enum | `ceo` / `loja_admin` / `vendedor` |
| `status` | enum | `ativo` / `bloqueado` |
| `comissao_pct` | numeric | % de comissão do vendedor |
| `meta_mensal` | numeric | Meta mensal em R$ |

#### `aparelhos`
Estoque por IMEI. Sempre filtrado por `loja_id`.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `imei` | text | IMEI único |
| `modelo` | text | Ex: "iPhone 14 Pro Max" |
| `tipo` | enum | `novo` / `usado` |
| `status` | enum | `disponivel` / `reservado` / `vendido` / `manutencao` / `negociacao` |
| `preco` | numeric | Preço de venda |
| `custo` | numeric | Custo de aquisição |

#### `vendas`
Registra cada venda com suporte a troca de aparelho.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `com_troca` | boolean | Se houve aparelho de troca |
| `troca_valor` | numeric | Valor dado na troca |
| `pgto_pix/dinheiro/debito/credito/transferencia` | numeric | Formas de pagamento |
| `comissao` | numeric | Valor calculado da comissão |
| `lucro` | numeric | Lucro bruto da venda |
| `status` | enum | `orcamento` / `convertido` / `cancelado` |

#### Demais tabelas
- `clientes` — CRM básico vinculado à loja
- `acessorios_catalogo` — produtos de acessório com custo/preço
- `venda_acessorios` — itens de acessório por venda
- `tabela_precos` — preços de referência de modelos iPhone

---

## Perfis de Usuário

| Perfil | `loja_id` | Acesso |
|--------|-----------|--------|
| `ceo` | `null` | Dashboard global, gestão de todas as lojas |
| `loja_admin` | preenchido | Gestão completa da própria loja |
| `vendedor` | preenchido | Vendas, estoque (leitura), orçamentos próprios |

### Regras críticas
- **CEO nunca é bloqueado**, independente de qualquer status
- **loja_admin e vendedor são bloqueados juntos** — quando a loja bloqueia, todos os usuários dela bloqueiam
- **Admin só cria vendedores** — `perfil` é hardcoded como `vendedor` em `criarFuncionario()`
- **Ações CEO-only** usam `assertCeo()` nas server actions de `/lojas`

---

## Autenticação e Clientes Supabase

```
lib/supabase/client.ts   → createClient()  — browser, anon key, sujeito a RLS
lib/supabase/server.ts   → createClient()  — server (async), anon key, sujeito a RLS
lib/supabase/admin.ts    → createAdminClient() — server only, service role, bypassa RLS
```

Use `createAdminClient()` apenas quando precisar:
- Criar usuários auth (`admin.auth.admin.createUser`)
- Inserir dados ignorando RLS (ex: cadastro de nova loja)
- Deletar usuários auth

---

## Proxy (Middleware)

**Arquivo:** `proxy.ts` (raiz do projeto — Next.js 16 usa `proxy.ts` em vez de `middleware.ts`)

Fluxo de cada request:

```
request chega
    ↓
rota pública? (/, /login, /cadastro, /onboarding) → passa
    ↓
sem sessão? → redirect /login
    ↓
busca usuario (perfil, loja_id)
    ↓
CEO? → passa sempre
    ↓
tem loja_id? → busca loja (status_saas, data_fim_trial)
    ↓
bloqueado / vencido / trial expirado?
    → rota permitida? (/bloqueado, /configuracoes, /login, /cadastro, /api/auth) → passa
    → senão → redirect /bloqueado
    ↓
passa
```

---

## Fluxos Principais

### Self-Signup (`/cadastro`)
1. Usuário preenche: nome da loja, nome, email, senha
2. `cadastrar()` (server action):
   - Cria loja com `status_saas='trial'`, `data_fim_trial = hoje + 15 dias`
   - `admin.auth.admin.createUser()` — cria auth user com email confirmado
   - Insere `usuario` com `perfil='loja_admin'`
   - Faz login automático via `supabase.auth.signInWithPassword()`
3. Redirect → `/onboarding`

### Onboarding (`/onboarding`)
- Só acessível por `loja_admin`
- Exibe `EditarMinhaLojaForm` com `redirectAfterSave="/dashboard"`
- Após salvar → `/dashboard`

### Bloqueio de Trial
- O `proxy.ts` verifica `data_fim_trial` em toda request
- Se `status_saas='trial'` e `data_fim_trial < hoje` → redirect `/bloqueado`
- **Não depende de cron job** — verificado em tempo real a cada request

### Ativação pelo CEO
No painel `/lojas`, o CEO pode:
- **Converter trial** → muda `status_saas` para `ativo`
- **Bloquear / Ativar** → alterna entre `bloqueado` e `ativo`
- **+30 dias** → estende `proximo_vencimento`
- **Redefinir senha** → gera nova senha via `admin.auth.admin.updateUserById()`
- **Excluir loja** → cascade delete completo (uso emergencial)

### Criar Funcionário
- Só `loja_admin` pode criar
- Perfil sempre `vendedor` (hardcoded na action — não há como criar outro admin)
- Senha gerada automaticamente e exibida uma única vez

---

## Multi-tenant

**Regra absoluta:** toda query no banco deve ter `.eq('loja_id', usuario.loja_id)`.

O RLS do Supabase reforça isso para o `createClient()` (anon key). O `createAdminClient()` bypassa RLS — use com cuidado e sempre filtre manualmente por `loja_id`.

Nunca confie apenas no RLS para o admin client — adicione o filtro explícito.

---

## White-Label

Cada loja tem:
- `cor_primaria` — hex usada nos botões e destaques (padrão `#4f7eff`)
- `cor_secundaria` — hex do fundo
- `logo_url` — armazenada no Supabase Storage (bucket público)

O upload de logo usa `createAdminClient()` para contornar as policies de storage.

---

## PWA (Mobile)

- `app/manifest.ts` — manifesto com nome, ícone, cores
- `app/layout.tsx` — meta tags `appleWebApp`, viewport
- `public/cylo-logo.svg` — ícone do app
- Sidebar: `hidden lg:flex` — invisível em mobile
- Bottom nav: `lg:hidden` — só em mobile, com botão central elevado (nova venda)
- `<main className="pb-16 lg:pb-0">` — espaço pra bottom nav no mobile

---

## Navegação por Perfil

### CEO
Sidebar + bottom nav: Dashboard, Lojas

### loja_admin
Sidebar: Dashboard, Estoque, Nova Venda, Calc. Troca, Preços Ref., Orçamentos, Recibos, Acessórios, Funcionários, Motoboys, DRE/Custos, Vendas, Clientes, Financeiro, Relatórios, Configurações  
Bottom nav: Dashboard, Estoque, **Nova Venda** (primário), Vendas, Config

### vendedor
Sidebar: Minha Área, Nova Venda, Calc. Troca, Estoque, Preços Ref., Meus Orçamentos, Meus Recibos, Clientes, Relatórios  
Bottom nav: Minha Área, Estoque, **Nova Venda** (primário), Orçamentos, Recibos

---

## Tela `/bloqueado`

Exibida quando trial expira ou conta é manualmente bloqueada.

- Detecta `status_saas` da loja e exibe mensagem personalizada
- Card de preço: **R$59,99/mês** com lista de features
- Botão WhatsApp verde abre `wa.me/5511932652082` com mensagem pré-preenchida
- Contato: **Henrique (fundador)** — (11) 93265-2082

---

## Implantação

### Deploy
Push para `main` → Vercel detecta e faz build automaticamente.  
Build command: `next build` | Output: `.next`

### DNS
```
Registro.br → nameservers: kanye.ns.cloudflare.com / kay.ns.cloudflare.com
Cloudflare  → CNAME @ → cname.vercel-dns.com (DNS only, nuvem cinza)
Vercel      → Domain: cyloapp.com.br → Production
```

### Supabase Auth URLs
- Site URL: `https://www.cyloapp.com.br`
- Redirect URLs: `https://cylo-cylo.vercel.app/**`, `https://*.cyloapp.com.br/**`

---

## Contato / Suporte

Fundador: Henrique — WhatsApp (11) 93265-2082  
Email: rico.goncalves97@hotmail.com

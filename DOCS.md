# Cylo — Documentação Técnica

SaaS white-label de gestão para lojas de iPhone. Multi-tenant, cada loja tem dados 100% isolados.

---

## Stack

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Framework | Next.js (App Router, Turbopack) | 16.2.9 |
| Banco / Auth | Supabase (Postgres + RLS + Auth) | — |
| Hosting | Vercel (branch `main` → produção automática) | — |
| DNS | Cloudflare → `cyloapp.com.br` | — |
| Estilos | Tailwind CSS | 4 |
| Ícones | Lucide React | 1.18 |
| React | React | 19.2.4 |

**Repositório:** `github.com/Henrique-GPU/CYLO`  
**Produção:** `https://www.cyloapp.com.br`  
**Vercel alias:** `cylo-zeta.vercel.app`  
**Supabase org:** Henrique-GPU's Org → projeto **CYLO**

---

## Setup Local

```bash
# 1. Clonar
git clone https://github.com/Henrique-GPU/CYLO.git
cd CYLO

# 2. Instalar dependências
npm install

# 3. Criar arquivo de ambiente
# Crie .env.local na raiz com:
NEXT_PUBLIC_SUPABASE_URL=https://<projeto>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>

# 4. Rodar
npm run dev   # http://localhost:3000
```

> As chaves estão no Supabase → Project Settings → API.  
> **Nunca commitar `.env.local`** — está no `.gitignore`.

---

## Scripts

```bash
npm run dev    # desenvolvimento com Turbopack
npm run build  # build de produção
npm run start  # serve o build localmente
npm run lint   # ESLint
```

---

## Variáveis de Ambiente

| Variável | Onde usar | Descrição |
|----------|-----------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | client + server | URL pública do Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client + server | Chave anon (segura para expor) |
| `SUPABASE_SERVICE_ROLE_KEY` | **server only** | Bypassa RLS — NUNCA expor no client |

**Regra de ouro:** `SUPABASE_SERVICE_ROLE_KEY` só existe dentro de `createAdminClient()`. Se você ver essa variável sendo usada em um componente client ou arquivo com `'use client'`, é um bug de segurança crítico.

---

## Estrutura de Arquivos

```
cylo/
├── app/
│   ├── page.tsx                        # Landing page pública
│   ├── login/page.tsx                  # Tela de login
│   ├── cadastro/
│   │   ├── page.tsx                    # Form de self-signup (client component)
│   │   └── actions.ts                  # Server action: cria loja + auth user + usuario
│   ├── onboarding/page.tsx             # Configuração inicial após cadastro
│   ├── bloqueado/page.tsx              # Tela trial expirado / conta bloqueada
│   ├── api/
│   │   └── auth/signout/route.ts       # POST → supabase.auth.signOut() + redirect /login
│   └── (loja)/                         # Route group autenticado
│       ├── layout.tsx                  # Injeta Sidebar + BottomNav em todas as rotas filhas
│       ├── dashboard/page.tsx          # Dashboard (CEO vê todas as lojas, admin vê a sua)
│       ├── estoque/                    # Listagem e cadastro de aparelhos por IMEI
│       ├── nova-venda/                 # Fluxo completo de venda com suporte a troca
│       ├── vendas/                     # Histórico de vendas (admin)
│       ├── orcamentos/                 # Orçamentos (admin)
│       ├── meus-orcamentos/            # Orçamentos (vendedor — só os próprios)
│       ├── recibos/                    # Recibos (admin)
│       ├── meus-recibos/              # Recibos (vendedor — só os próprios)
│       ├── minha-area/                 # Painel pessoal do vendedor
│       ├── funcionarios/               # Gestão de equipe (admin cria vendedores)
│       ├── lojas/                      # Gestão de lojas (CEO only)
│       │   └── actions.ts              # assertCeo() + bloquear/ativar/excluir lojas
│       ├── clientes/                   # CRM básico
│       ├── financeiro/                 # Visão financeira
│       ├── dre/                        # DRE mensal
│       ├── relatorios/                 # Relatórios exportáveis
│       ├── calculadora/                # Calculadora de troca
│       ├── precos/                     # Tabela de preços de referência
│       ├── acessorios/                 # Catálogo de acessórios
│       ├── motoboys/                   # Cadastro de motoboys
│       └── configuracoes/
│           ├── page.tsx                # Configurações da loja (admin) ou read-only (vendedor)
│           ├── actions.ts              # editarMinhaLoja() — salva dados + logo
│           ├── editar-loja-form.tsx    # Form client com upload de logo e cor primária
│           └── trocar-senha-form.tsx   # Form de troca de senha
├── components/
│   └── layout/
│       ├── sidebar.tsx                 # Sidebar desktop (hidden lg:flex)
│       ├── bottom-nav.tsx              # Nav mobile (lg:hidden)
│       └── nav-items.ts               # Itens de nav por perfil (CEO/admin/vendedor)
├── lib/
│   └── supabase/
│       ├── client.ts                   # createClient() — browser, anon key, sujeito a RLS
│       ├── server.ts                   # createClient() — server async, anon key, sujeito a RLS
│       ├── admin.ts                    # createAdminClient() — server only, bypassa RLS
│       └── middleware.ts               # updateSession() — renova cookies de auth no proxy
├── types/index.ts                      # Tipos TypeScript de todas as entidades do banco
├── proxy.ts                            # Middleware de autenticação e bloqueio (Next.js 16)
└── public/
    └── cylo-logo.svg                   # Logo SVG do Cylo
```

---

## Clientes Supabase

São três clientes distintos — usar o errado é a causa mais comum de bugs de permissão:

```
lib/supabase/client.ts  → createClient()       browser   anon key   sujeito a RLS
lib/supabase/server.ts  → createClient()       server    anon key   sujeito a RLS
lib/supabase/admin.ts   → createAdminClient()  server    service role  bypassa RLS
```

### Quando usar cada um

| Situação | Cliente |
|----------|---------|
| Componente client (`'use client'`) | `client.ts` |
| Server component / server action lendo dados normais | `server.ts` |
| Criar/deletar usuários auth | `admin.ts` |
| Upload de logo no Storage | `admin.ts` |
| Criar loja no cadastro (bypassa RLS) | `admin.ts` |
| Ações do CEO (bloquear, excluir loja) | `admin.ts` via `assertCeo()` |

### Como `updateSession` funciona

`lib/supabase/middleware.ts` é chamado no `proxy.ts` a cada request. Ele renova o token de sessão nos cookies e retorna `{ supabaseResponse, user, supabase }`. Sem essa chamada, a sessão expira e o usuário é deslogado aleatoriamente.

---

## Banco de Dados (Supabase / Postgres)

### Tabelas

#### `lojas`
Cada cliente do Cylo é uma loja. Isolamento total por `id`.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | uuid PK | Identificador único |
| `nome` | text | Nome fantasia |
| `responsavel` | text | Nome do dono |
| `status_saas` | text | `trial` / `ativo` / `vencido` / `bloqueado` |
| `valor_mensal` | numeric | Padrão: 59.99 |
| `data_inicio_trial` | date | Início do trial |
| `data_fim_trial` | date | Fim do trial (início + 15 dias) |
| `proximo_vencimento` | date | Próximo pagamento |
| `cor_primaria` | text | Hex da cor (white-label) — padrão `#4f7eff` |
| `cor_secundaria` | text | Hex do fundo |
| `logo_url` | text | URL pública no Supabase Storage |
| `garantia_padrao` | text | Dias de garantia padrão da loja |

#### `usuarios`
Vinculado ao Supabase Auth via `id = auth.users.id`.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | uuid PK | Mesmo ID do `auth.users` |
| `loja_id` | uuid FK | `null` para CEO, preenchido para admin/vendedor |
| `perfil` | text | `ceo` / `loja_admin` / `vendedor` |
| `status` | text | `ativo` / `bloqueado` |
| `comissao_pct` | numeric | % de comissão |
| `meta_mensal` | numeric | Meta em R$ |
| `iniciais` | text | 2 letras para avatar |

#### `aparelhos`
Estoque por IMEI. Sempre filtrado por `loja_id`.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `imei` | text | IMEI único |
| `modelo` | text | Ex: "iPhone 14 Pro Max" |
| `tipo` | text | `novo` / `usado` |
| `status` | text | `disponivel` / `reservado` / `vendido` / `manutencao` / `negociacao` |
| `preco` | numeric | Preço de venda |
| `custo` | numeric | Custo de aquisição |

#### `vendas`
Venda completa com suporte a troca e múltiplas formas de pagamento.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `com_troca` | boolean | Se houve aparelho de troca |
| `troca_valor` | numeric | Valor dado na troca |
| `pgto_pix/dinheiro/debito/credito/transferencia` | numeric | Formas de pagamento |
| `comissao` | numeric | Valor calculado da comissão |
| `lucro` | numeric | Lucro bruto |
| `status` | text | `orcamento` / `convertido` / `cancelado` |

#### Demais tabelas
| Tabela | Descrição |
|--------|-----------|
| `clientes` | CRM básico (nome, telefone, instagram) |
| `acessorios_catalogo` | Produtos com custo/preço por loja |
| `venda_acessorios` | Itens de acessório por venda |
| `tabela_precos` | Preços de referência por modelo iPhone |

### RLS (Row Level Security)

O Supabase tem RLS ativado. As policies garantem que cada usuário só vê dados da sua `loja_id`.

**Quando um query retorna vazio sem erro** — provavelmente é RLS bloqueando. Para debugar:
1. Teste a query no Supabase SQL Editor logado como service role — se retornar dados, é RLS
2. Verifique se o `loja_id` está correto no filtro
3. Verifique se o usuário está autenticado (token válido)

**`createAdminClient()` bypassa RLS** — use quando precisar escrever dados administrativos, mas sempre filtre por `loja_id` manualmente para não misturar dados entre lojas.

---

## Supabase Storage

**Bucket:** `logos` (público — qualquer um pode ler a URL)

Estrutura dos arquivos:
```
logos/
└── {loja_id}/
    └── logo.{png|webp|svg|jpg}
```

O upload usa `createAdminClient()` porque o bucket tem policies restritivas para escrita. O código em `configuracoes/actions.ts` e `lojas/actions.ts` cria o bucket automaticamente se não existir (`createBucket` com `.catch(() => {})` para ignorar se já existe).

Para acessar uma logo: a URL pública é gerada por `admin.storage.from('logos').getPublicUrl(path)`.

---

## Perfis de Usuário

| Perfil | `loja_id` | Rota padrão | Acesso |
|--------|-----------|-------------|--------|
| `ceo` | `null` | `/dashboard` | Dashboard global, gestão de todas as lojas |
| `loja_admin` | preenchido | `/dashboard` | Gestão completa da própria loja |
| `vendedor` | preenchido | `/minha-area` | Vendas, estoque (leitura), documentos próprios |

### Regras críticas
- **CEO nunca é bloqueado** — o proxy deixa CEO passar sempre
- **loja_admin e vendedor bloqueiam juntos** — quando a loja bloqueia, todos os usuários dela são barrados
- **Admin só cria vendedores** — `perfil` é hardcoded como `'vendedor'` em `funcionarios/novo/actions.ts`
- **Ações CEO-only** sempre chamam `assertCeo()` antes de executar

---

## `assertCeo()` — Guard de CEO

**Localização:** `app/(loja)/lojas/actions.ts` (linhas 7-14)

```typescript
async function assertCeo() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data } = await supabase.from('usuarios').select('perfil').eq('id', user.id).single()
  if (data?.perfil !== 'ceo') redirect('/dashboard')
  return createAdminClient() // retorna admin client para uso na action
}
```

Toda server action de `/lojas` começa com `const admin = await assertCeo()`. Se o usuário não for CEO, é redirecionado para `/dashboard` antes de qualquer operação.

---

## Signout

**Rota:** `app/api/auth/signout/route.ts`

```typescript
export async function POST() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
```

Chamado via `<form action="/api/auth/signout" method="POST">` no sidebar e na tela `/bloqueado`. Não usar `GET` para signout — seria vulnerável a CSRF.

---

## Proxy (Middleware)

**Arquivo:** `proxy.ts` (raiz do projeto)

> **Importante:** Next.js 16 usa `proxy.ts` em vez de `middleware.ts`. Se existirem os dois ao mesmo tempo, o build falha com erro de conflito. Manter apenas `proxy.ts`.

Fluxo de cada request:

```
request chega
    ↓
rota pública? (/, /login, /cadastro, /onboarding) → passa direto
    ↓
sem sessão (user = null)? → redirect /login
    ↓
busca usuario: SELECT perfil, loja_id FROM usuarios WHERE id = user.id
    ↓
CEO ou usuario não encontrado? → passa sempre (sem restrição)
    ↓
tem loja_id? → busca loja: SELECT status_saas, data_fim_trial FROM lojas
    ↓
loja bloqueada / vencida / trial expirado?
    → path em [/bloqueado, /configuracoes, /login, /cadastro, /api/auth]? → passa
    → senão → redirect /bloqueado
    ↓
passa
```

**Rotas sempre permitidas quando bloqueado:**
- `/bloqueado` — a própria tela de bloqueio (sem isso vira loop infinito)
- `/configuracoes` — admin pode ver dados mesmo bloqueado
- `/login`, `/cadastro` — fluxo de auth
- `/api/auth` — signout precisa funcionar

---

## Fluxos Principais

### Self-Signup (`/cadastro`)
1. Usuário preenche: nome da loja, nome, email, senha (mín. 8 chars)
2. `cadastrar()` em `app/cadastro/actions.ts`:
   - Valida campos
   - Cria loja: `status_saas='trial'`, `data_fim_trial = hoje + 15 dias`
   - `admin.auth.admin.createUser({ email_confirm: true })` — sem verificação de email
   - Insere `usuario` com `perfil='loja_admin'`
   - Login automático: `supabase.auth.signInWithPassword()`
3. Redirect → `/onboarding`

### Onboarding (`/onboarding`)
- Só acessível por `loja_admin` com `loja_id` válido
- Renderiza `EditarMinhaLojaForm` com prop `redirectAfterSave="/dashboard"`
- Após salvar → `/dashboard`
- Se vendedor ou CEO acessar → redirect `/dashboard`

### Bloqueio de Trial
- O `proxy.ts` verifica `data_fim_trial` em **toda request**
- Se `status_saas='trial'` e `data_fim_trial < new Date()` → redirect `/bloqueado`
- **Não depende de cron job** — é verificado em tempo real, sem delay
- Tanto `loja_admin` quanto `vendedor` da mesma loja são bloqueados

### Ativação pelo CEO
Em `app/(loja)/lojas/actions.ts`, todas as funções chamam `assertCeo()`:

| Função | O que faz |
|--------|-----------|
| `bloquearLoja(lojaId)` | `status_saas = 'bloqueado'` |
| `ativarLoja(lojaId)` | `status_saas = 'ativo'` |
| `converterTrial(lojaId)` | `status_saas = 'ativo'` (converte trial em pago) |
| `renovarLoja(lojaId)` | `proximo_vencimento += 30 dias` |
| `redefinirSenhaAdmin(lojaId)` | Gera senha aleatória via `admin.auth.admin.updateUserById()` |
| `excluirLoja(lojaId)` | Cascade delete completo — uso emergencial |

### Criar Funcionário
- Só `loja_admin` pode criar — verificado na action
- `perfil` é **sempre** `'vendedor'` (hardcoded) — admin não pode criar outro admin
- Senha gerada aleatoriamente (10 chars, charset sem ambíguos)
- Exibida uma única vez na tela após criação

### Upload de Logo
- Bucket: `logos` no Supabase Storage (público)
- Caminho: `logos/{loja_id}/logo.{ext}`
- Usa `createAdminClient()` para escrita
- `upsert: true` — sobrescreve se já existir
- URL com `?t=timestamp` para bustar cache do browser

---

## Multi-Tenant — Regra Absoluta

**Toda query no banco deve ter `.eq('loja_id', usuario.loja_id)`.**

O RLS do Supabase reforça isso para `createClient()` (anon key). Mas `createAdminClient()` bypassa o RLS — nesse caso o filtro manual por `loja_id` é obrigatório.

```typescript
// ✅ Correto
await admin.from('aparelhos')
  .select('*')
  .eq('loja_id', usuario.loja_id)  // ← sempre

// ❌ Errado — retorna dados de TODAS as lojas
await admin.from('aparelhos').select('*')
```

---

## White-Label

Cada loja tem identidade visual própria:
- `cor_primaria` — hex dos botões e destaques (padrão `#4f7eff`)
- `cor_secundaria` — hex do fundo
- `logo_url` — logo no Supabase Storage

O nome e logo da loja aparecem no header do sidebar. Os recibos e orçamentos usam a cor e logo da loja — o cliente final nunca vê o nome "Cylo".

---

## PWA (Mobile)

| Arquivo | Função |
|---------|--------|
| `app/manifest.ts` | Manifesto PWA (nome, ícones, cores, display standalone) |
| `app/layout.tsx` | Meta tags `appleWebApp`, viewport |
| `public/cylo-logo.svg` | Ícone do app instalado |

Layout mobile:
- Sidebar: `hidden lg:flex` — invisível em telas menores que 1024px
- Bottom nav: `lg:hidden` — só aparece em mobile
- Main content: `pb-16 lg:pb-0` — espaço para o bottom nav não sobrepor conteúdo
- Bottom nav tem botão central elevado (Nova Venda) com `bg-[#4f7eff]` e shadow

---

## Navegação por Perfil

### CEO (sidebar + bottom nav)
Dashboard, Lojas

### loja_admin (sidebar)
Dashboard, Estoque, Nova Venda, Calc. Troca, Preços Ref., Orçamentos, Recibos, Acessórios, Funcionários, Motoboys, DRE/Custos, Vendas, Clientes, Financeiro, Relatórios, Configurações

### loja_admin (bottom nav)
Dashboard · Estoque · **Nova Venda** (primário) · Vendas · Config

### vendedor (sidebar)
Minha Área, Nova Venda, Calc. Troca, Estoque, Preços Ref., Meus Orçamentos, Meus Recibos, Clientes, Relatórios

### vendedor (bottom nav)
Minha Área · Estoque · **Nova Venda** (primário) · Orçamentos · Recibos

---

## Tela `/bloqueado`

Exibida quando trial expira ou loja é manualmente bloqueada pelo CEO.

- Detecta `status_saas` e exibe mensagem personalizada por estado
- Card de preço: **R$59,99/mês** com lista de features incluídas
- Botão WhatsApp verde — abre `wa.me/5511932652082` com mensagem pré-preenchida contendo nome da loja
- Botão "Sair da conta" sempre visível
- CEO que acessa `/bloqueado` é redirecionado para `/dashboard` (CEO nunca bloqueia)

**Contato fundador:** Henrique — (11) 93265-2082

---

## Deploy e Infraestrutura

### Fluxo de deploy
```
git push origin main → Vercel detecta → build → produção
```
Cada push para `main` aciona um novo deploy automaticamente.

### DNS
```
Domínio registrado em:  Registro.br (registro.br)
DNS gerenciado em:      Cloudflare (free plan)
Nameservers:            kanye.ns.cloudflare.com / kay.ns.cloudflare.com

Cloudflare DNS records:
  CNAME  @  →  cname.vercel-dns.com  (DNS only — nuvem cinza, não proxied)

Vercel Domains:
  cyloapp.com.br    → Production (redireciona para www)
  www.cyloapp.com.br → Production
```

> **Por que DNS only no Cloudflare?** O Vercel gerencia o SSL próprio. Se usar o proxy do Cloudflare (nuvem laranja), pode conflitar com o certificado do Vercel.

### Supabase Auth URLs
Em Supabase → Authentication → URL Configuration:

- **Site URL:** `https://www.cyloapp.com.br`
- **Redirect URLs:**
  - `https://cylo-cylo.vercel.app/**`
  - `https://*.cyloapp.com.br/**`

---

## Problemas Comuns e Soluções

| Sintoma | Causa provável | Onde olhar |
|---------|---------------|-----------|
| Query retorna vazio sem erro | RLS bloqueando | Testar no SQL Editor como service role |
| Build falha com erro de "middleware e proxy" | Ambos existem | Deletar `middleware.ts`, manter só `proxy.ts` |
| Logo não aparece | Bucket não público ou URL errada | Supabase → Storage → logos → bucket settings |
| Usuário deslogado aleatoriamente | `updateSession` não está sendo chamado | Verificar `proxy.ts` chama `updateSession` |
| Admin consegue criar outro admin | `perfil` sendo enviado pelo form | `funcionarios/novo/actions.ts` linha 32 — deve ser hardcoded `'vendedor'` |
| Trial não bloqueia | `data_fim_trial` nulo ou formato errado | Verificar campo no banco — deve ser `YYYY-MM-DD` |
| WhatsApp não abre mensagem pré-preenchida | Número errado ou texto não encodado | Número: `5511932652082`, usar `encodeURIComponent()` |

---

## Contato

**Fundador:** Henrique (rico.goncalves97@hotmail.com)  
**WhatsApp:** (11) 93265-2082 — `wa.me/5511932652082`

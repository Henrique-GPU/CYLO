-- ════════════════════════════════════════════════════════════
-- CYLO — Schema Supabase (Postgres)
-- Execute na ordem. Todas as tabelas operacionais têm loja_id
-- para isolamento via RLS.
-- ════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────
-- EXTENSÕES
-- ───────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";


-- ───────────────────────────────────────────────────────────
-- 1. LOJAS
-- Cadastrada pelo CEO. Define identidade visual e status SaaS.
-- ───────────────────────────────────────────────────────────
create table lojas (
  id                uuid primary key default uuid_generate_v4(),
  nome              text not null,              -- nome fantasia
  razao_social      text,
  cnpj              text,
  responsavel       text,                       -- nome do responsável
  telefone          text,
  whatsapp          text,
  instagram         text,
  email             text,
  endereco          text,
  garantia_padrao   text default '90 dias de garantia de funcionamento',

  -- White label
  logo_url          text,                       -- Supabase Storage URL
  cor_primaria      text default '#4f7eff',
  cor_secundaria    text default '#0e1018',

  -- SaaS / cobrança (manual no lançamento)
  status_saas       text not null default 'trial'
                    check (status_saas in ('trial','ativo','vencido','bloqueado')),
  valor_mensal      numeric(10,2) default 99.90,
  data_inicio_trial date,
  data_fim_trial    date,
  proximo_vencimento date,
  ultimo_acesso     timestamptz,

  criada_em         timestamptz not null default now(),
  atualizada_em     timestamptz not null default now()
);

comment on table lojas is 'Tenant. Cada loja é isolada — nenhum dado cruza entre lojas.';


-- ───────────────────────────────────────────────────────────
-- 2. USUÁRIOS
-- Espelha auth.users do Supabase Auth (1:1 via id).
-- perfil define o nível de acesso.
-- ───────────────────────────────────────────────────────────
create table usuarios (
  id              uuid primary key references auth.users(id) on delete cascade,
  loja_id         uuid references lojas(id) on delete cascade,  -- null para CEO
  nome            text not null,
  username        text unique not null,         -- usado no login
  email           text,
  perfil          text not null check (perfil in ('ceo','loja_admin','vendedor')),
  iniciais        text,                          -- ex: 'CM' (Carlos Mendes)
  status          text not null default 'ativo' check (status in ('ativo','bloqueado')),
  comissao_pct    numeric(5,2) default 2.0,      -- % de comissão sobre venda
  meta_mensal     numeric(10,2),                 -- meta de faturamento do vendedor

  criado_em       timestamptz not null default now()
);

comment on table usuarios is 'perfil=ceo tem loja_id null e acesso a todas as lojas.';


-- ───────────────────────────────────────────────────────────
-- 3. CATÁLOGO GLOBAL DE MODELOS DE IPHONE
-- Mantido pelo CEO. Copiado para o estoque de lojas novas
-- como ponto de partida (não é trava — admin edita/exclui livre).
-- ───────────────────────────────────────────────────────────
create table iphone_modelos_padrao (
  id              uuid primary key default uuid_generate_v4(),
  modelo          text not null,        -- ex: 'iPhone 15 Pro Max'
  serie           text not null,        -- ex: '15' (para filtros de tabela de preços)
  capacidades     text[] not null default array['128GB','256GB','512GB'],
  cores           text[] not null default array['Preto','Branco','Azul'],
  ordem           int default 0,        -- ordenação na lista (mais novo primeiro)
  ativo           boolean not null default true
);

comment on table iphone_modelos_padrao is 'Catálogo de referência. Copiado para aparelhos ao criar loja nova — apenas conveniência.';


-- ───────────────────────────────────────────────────────────
-- 4. APARELHOS (ESTOQUE)
-- ───────────────────────────────────────────────────────────
create table aparelhos (
  id              uuid primary key default uuid_generate_v4(),
  loja_id         uuid not null references lojas(id) on delete cascade,

  modelo          text not null,
  capacidade      text,
  cor             text,
  tipo            text not null check (tipo in ('novo','usado')),
  bateria_pct     int,                           -- só para usados

  imei            text,                          -- opcional até cadastro físico
  status          text not null default 'disponivel'
                  check (status in ('disponivel','reservado','vendido','manutencao','negociacao')),

  preco           numeric(10,2) default 0,       -- preço de venda
  custo           numeric(10,2) default 0,       -- custo de aquisição

  origem          text,                          -- 'Troca' | 'Compra Direta' | 'Fornecedor'
  reservado_para  text,                          -- nome do cliente, se reservado

  data_entrada    date default current_date,

  criado_em       timestamptz not null default now(),
  atualizado_em   timestamptz not null default now()
);

create index idx_aparelhos_loja on aparelhos(loja_id);
create index idx_aparelhos_status on aparelhos(loja_id, status);

comment on table aparelhos is 'Estoque. tipo=usado normalmente entra via troca em uma venda.';


-- ───────────────────────────────────────────────────────────
-- 5. CUSTOS EXTRAS DE APARELHO (opcional, N:1)
-- Ex: troca de tela, bateria nova — soma ao custo do aparelho.
-- ───────────────────────────────────────────────────────────
create table aparelho_custos (
  id            uuid primary key default uuid_generate_v4(),
  aparelho_id   uuid not null references aparelhos(id) on delete cascade,
  descricao     text not null,
  valor         numeric(10,2) not null default 0
);


-- ───────────────────────────────────────────────────────────
-- 6. CLIENTES
-- ───────────────────────────────────────────────────────────
create table clientes (
  id            uuid primary key default uuid_generate_v4(),
  loja_id       uuid not null references lojas(id) on delete cascade,
  nome          text not null,
  telefone      text,
  instagram     text,
  criado_em     timestamptz not null default now()
);

create index idx_clientes_loja on clientes(loja_id);
create index idx_clientes_busca on clientes(loja_id, nome, telefone);


-- ───────────────────────────────────────────────────────────
-- 7. CATÁLOGO DE ACESSÓRIOS (por loja)
-- ───────────────────────────────────────────────────────────
create table acessorios_catalogo (
  id            uuid primary key default uuid_generate_v4(),
  loja_id       uuid not null references lojas(id) on delete cascade,
  nome          text not null,             -- ex: 'Capinha Silicone'
  custo         numeric(10,2) default 0,
  preco         numeric(10,2) default 0,   -- preço sugerido (vendedor pode alterar na venda)
  ativo         boolean not null default true
);

create index idx_acessorios_loja on acessorios_catalogo(loja_id);


-- ───────────────────────────────────────────────────────────
-- 8. VENDAS
-- Registro final de uma negociação convertida em venda.
-- ───────────────────────────────────────────────────────────
create table vendas (
  id                uuid primary key default uuid_generate_v4(),
  loja_id           uuid not null references lojas(id) on delete cascade,
  vendedor_id       uuid not null references usuarios(id),

  cliente_id        uuid references clientes(id),
  cliente_nome      text not null,           -- snapshot, mesmo se cliente for editado depois
  cliente_telefone  text,

  aparelho_id       uuid references aparelhos(id),

  valor_total       numeric(10,2) not null,   -- preço do aparelho + acessórios
  valor_aparelho    numeric(10,2) not null,
  valor_acessorios  numeric(10,2) not null default 0,

  -- Pagamento (split por forma)
  pgto_pix          numeric(10,2) default 0,
  pgto_dinheiro     numeric(10,2) default 0,
  pgto_debito       numeric(10,2) default 0,
  pgto_credito      numeric(10,2) default 0,
  pgto_transferencia numeric(10,2) default 0,

  -- Troca
  com_troca         boolean default false,
  troca_modelo      text,
  troca_imei        text,
  troca_estado      text,                    -- excelente | bom | regular | ruim
  troca_bateria_pct int,
  troca_valor       numeric(10,2) default 0,

  comissao          numeric(10,2) default 0,
  lucro             numeric(10,2) default 0,

  garantia          text,
  garantia_validade date,

  origem_lead       text,                    -- Instagram | Indicação | etc
  local_venda       text,                    -- Loja Física | WhatsApp | etc

  status            text not null default 'orcamento'
                    check (status in ('orcamento','convertido','cancelado')),

  data_venda        date not null default current_date,
  criado_em         timestamptz not null default now()
);

create index idx_vendas_loja on vendas(loja_id);
create index idx_vendas_vendedor on vendas(loja_id, vendedor_id);
create index idx_vendas_data on vendas(loja_id, data_venda);

comment on table vendas is 'status=orcamento ainda não compromete estoque. status=convertido marca aparelho como vendido.';


-- ───────────────────────────────────────────────────────────
-- 9. ITENS DE ACESSÓRIO POR VENDA (N:N com preço/qtd snapshot)
-- ───────────────────────────────────────────────────────────
create table venda_acessorios (
  id              uuid primary key default uuid_generate_v4(),
  venda_id        uuid not null references vendas(id) on delete cascade,
  acessorio_id    uuid references acessorios_catalogo(id),
  nome            text not null,       -- snapshot
  preco_unitario  numeric(10,2) not null default 0,  -- editável na venda (pode ser 0 = brinde)
  custo_unitario  numeric(10,2) not null default 0,
  quantidade      int not null default 1
);

create index idx_venda_acessorios_venda on venda_acessorios(venda_id);


-- ───────────────────────────────────────────────────────────
-- 10. TABELA DE PREÇOS (referência para vendedores)
-- ───────────────────────────────────────────────────────────
create table tabela_precos (
  id            uuid primary key default uuid_generate_v4(),
  loja_id       uuid not null references lojas(id) on delete cascade,
  modelo        text not null,
  serie         text not null,           -- '16', '15', '14'... para filtro

  preco_lacrado     numeric(10,2),
  preco_excelente   numeric(10,2),
  preco_bom         numeric(10,2),
  preco_regular     numeric(10,2),
  valor_sugerido_compra numeric(10,2),   -- quanto a loja paga ao comprar usado
  margem_pct        text                 -- ex: '14%' (display only)
);

create index idx_tabela_precos_loja on tabela_precos(loja_id);


-- ───────────────────────────────────────────────────────────
-- 11. MOTOBOYS / ENTREGAS
-- ───────────────────────────────────────────────────────────
create table motoboys (
  id            uuid primary key default uuid_generate_v4(),
  loja_id       uuid not null references lojas(id) on delete cascade,
  nome          text not null,
  telefone      text,
  corridas      int default 0,
  total_pago    numeric(10,2) default 0
);

create index idx_motoboys_loja on motoboys(loja_id);


-- ════════════════════════════════════════════════════════════
-- RLS — ROW LEVEL SECURITY
-- ════════════════════════════════════════════════════════════

-- Helper: pega o perfil e loja_id do usuário autenticado
-- (assume que auth.uid() retorna o id em usuarios.id)

create or replace function auth_perfil()
returns text language sql stable as $$
  select perfil from usuarios where id = auth.uid()
$$;

create or replace function auth_loja_id()
returns uuid language sql stable as $$
  select loja_id from usuarios where id = auth.uid()
$$;

create or replace function is_ceo()
returns boolean language sql stable as $$
  select auth_perfil() = 'ceo'
$$;


-- ── LOJAS ──────────────────────────────────────────────────
alter table lojas enable row level security;

create policy "ceo_full_access_lojas" on lojas
  for all using (is_ceo());

create policy "loja_users_read_own_loja" on lojas
  for select using (id = auth_loja_id());


-- ── USUARIOS ───────────────────────────────────────────────
alter table usuarios enable row level security;

create policy "ceo_full_access_usuarios" on usuarios
  for all using (is_ceo());

create policy "loja_users_read_own_loja_usuarios" on usuarios
  for select using (loja_id = auth_loja_id());

create policy "loja_admin_manage_own_usuarios" on usuarios
  for insert with check (
    auth_perfil() = 'loja_admin' and loja_id = auth_loja_id()
  );

create policy "loja_admin_update_own_usuarios" on usuarios
  for update using (
    auth_perfil() = 'loja_admin' and loja_id = auth_loja_id()
  );


-- ── IPHONE_MODELOS_PADRAO ──────────────────────────────────
alter table iphone_modelos_padrao enable row level security;

create policy "everyone_read_catalogo_padrao" on iphone_modelos_padrao
  for select using (true);

create policy "ceo_manage_catalogo_padrao" on iphone_modelos_padrao
  for all using (is_ceo());


-- ── TABELAS OPERACIONAIS (mesmo padrão para todas) ─────────
-- aparelhos, aparelho_custos, clientes, acessorios_catalogo,
-- vendas, venda_acessorios, tabela_precos, motoboys

alter table aparelhos enable row level security;
alter table aparelho_custos enable row level security;
alter table clientes enable row level security;
alter table acessorios_catalogo enable row level security;
alter table vendas enable row level security;
alter table venda_acessorios enable row level security;
alter table tabela_precos enable row level security;
alter table motoboys enable row level security;

-- Padrão: isolamento total por loja_id, CEO vê tudo
create policy "isolamento_aparelhos" on aparelhos
  for all using (is_ceo() or loja_id = auth_loja_id());

create policy "isolamento_clientes" on clientes
  for all using (is_ceo() or loja_id = auth_loja_id());

create policy "isolamento_acessorios_catalogo" on acessorios_catalogo
  for all using (is_ceo() or loja_id = auth_loja_id());

create policy "isolamento_vendas" on vendas
  for all using (is_ceo() or loja_id = auth_loja_id());

create policy "isolamento_tabela_precos" on tabela_precos
  for all using (is_ceo() or loja_id = auth_loja_id());

create policy "isolamento_motoboys" on motoboys
  for all using (is_ceo() or loja_id = auth_loja_id());

-- Tabelas filhas (sem loja_id direto) — herdam via join
create policy "isolamento_aparelho_custos" on aparelho_custos
  for all using (
    is_ceo() or aparelho_id in (
      select id from aparelhos where loja_id = auth_loja_id()
    )
  );

create policy "isolamento_venda_acessorios" on venda_acessorios
  for all using (
    is_ceo() or venda_id in (
      select id from vendas where loja_id = auth_loja_id()
    )
  );


-- ════════════════════════════════════════════════════════════
-- SEED — Catálogo global de iPhones (exemplo inicial)
-- ════════════════════════════════════════════════════════════
insert into iphone_modelos_padrao (modelo, serie, capacidades, cores, ordem) values
  ('iPhone 16 Pro Max', '16', array['256GB','512GB','1TB'], array['Titânio Preto','Titânio Natural','Titânio Branco','Titânio Deserto'], 1),
  ('iPhone 16 Pro',     '16', array['128GB','256GB','512GB'], array['Titânio Preto','Titânio Natural','Titânio Branco','Titânio Deserto'], 2),
  ('iPhone 16',         '16', array['128GB','256GB','512GB'], array['Preto','Branco','Rosa','Azul','Verde'], 3),
  ('iPhone 15 Pro Max', '15', array['256GB','512GB','1TB'], array['Titânio Preto','Titânio Natural','Titânio Branco','Titânio Azul'], 4),
  ('iPhone 15 Pro',     '15', array['128GB','256GB','512GB'], array['Titânio Preto','Titânio Natural','Titânio Branco','Titânio Azul'], 5),
  ('iPhone 15',         '15', array['128GB','256GB','512GB'], array['Preto','Azul','Verde','Amarelo','Rosa'], 6),
  ('iPhone 14 Pro Max', '14', array['128GB','256GB','512GB'], array['Roxo Profundo','Dourado','Prateado','Preto Espacial'], 7),
  ('iPhone 14 Pro',     '14', array['128GB','256GB','512GB'], array['Roxo Profundo','Dourado','Prateado','Preto Espacial'], 8),
  ('iPhone 14',         '14', array['128GB','256GB','512GB'], array['Azul','Roxo','Amarelo','Meia-noite','Estelar','Vermelho'], 9),
  ('iPhone 13',         '13', array['128GB','256GB','512GB'], array['Meia-noite','Estelar','Rosa','Azul','Verde','Vermelho'], 10),
  ('iPhone 12',         '12', array['64GB','128GB','256GB'], array['Preto','Branco','Azul','Verde','Roxo','Vermelho'], 11),
  ('iPhone 11',         '11', array['64GB','128GB','256GB'], array['Preto','Branco','Verde','Amarelo','Roxo','Vermelho'], 12);

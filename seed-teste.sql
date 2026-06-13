-- ════════════════════════════════════════════════
-- CYLO — Seed de teste
-- Execute no Supabase SQL Editor em 2 etapas:
--
-- ETAPA 1: rode o bloco abaixo (cria a loja)
-- ETAPA 2: crie o auth user no dashboard do Supabase:
--   Authentication → Add user
--   Email: admin@cylo.test
--   Password: Admin@123
--   → copie o UUID gerado
-- ETAPA 3: rode o segundo bloco (cria o usuario linkado)
-- ════════════════════════════════════════════════


-- ── ETAPA 1: Loja de teste ────────────────────
INSERT INTO lojas (
  id, nome, razao_social, responsavel, telefone,
  cor_primaria, cor_secundaria,
  status_saas, data_inicio_trial, data_fim_trial, proximo_vencimento,
  garantia_padrao
) VALUES (
  'a1b2c3d4-0000-0000-0000-000000000001',
  'iStore Teste',
  'iStore Comércio LTDA',
  'Admin Teste',
  '(61) 99999-0001',
  '#4f7eff', '#0e1018',
  'ativo', NOW(), NOW() + interval '30 days', NOW() + interval '30 days',
  '90 dias de garantia de funcionamento'
)
ON CONFLICT (id) DO NOTHING;


-- ── Aparelhos de teste ────────────────────────
INSERT INTO aparelhos (loja_id, tipo, modelo, capacidade, cor, imei, custo, preco, status, data_entrada) VALUES
  ('a1b2c3d4-0000-0000-0000-000000000001', 'novo',  'iPhone 15 Pro Max', '256GB', 'Titan Natural',  '353012340000001', 5800, 7999, 'disponivel', NOW() - interval '5 days'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'novo',  'iPhone 15',         '128GB', 'Rosa',           '353012340000002', 3600, 4999, 'disponivel', NOW() - interval '3 days'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'novo',  'iPhone 14 Pro',     '256GB', 'Dourado',        '353012340000003', 4200, 5499, 'disponivel', NOW() - interval '7 days'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'usado', 'iPhone 13',         '128GB', 'Midnight',       '353012340000004', 1800, 2599, 'disponivel', NOW() - interval '15 days'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'usado', 'iPhone 12',         '64GB',  'Azul',           '353012340000005', 1200, 1799, 'disponivel', NOW() - interval '40 days'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'novo',  'iPhone 15 Plus',    '512GB', 'Amarelo',        '353012340000006', 5200, 6999, 'reservado',  NOW() - interval '2 days')
ON CONFLICT DO NOTHING;


-- ── Acessórios de teste ───────────────────────
INSERT INTO acessorios_catalogo (loja_id, nome, preco, custo, ativo) VALUES
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Capinha MagSafe',        89,  30, true),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Película de Vidro',      49,  8,  true),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Carregador 20W USB-C',   129, 45, true),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Cabo USB-C Lightning',   69,  15, true),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'AirPods 3ª Geração',     999, 650, true),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Suporte Veicular MagSafe', 149, 55, true)
ON CONFLICT DO NOTHING;


-- ════════════════════════════════════════════════
-- ETAPA 3: depois de criar o auth user acima,
-- substitua o UUID abaixo e execute este bloco:
-- ════════════════════════════════════════════════

-- INSERT INTO usuarios (id, loja_id, nome, username, email, perfil, iniciais, comissao_pct, meta_mensal)
-- VALUES (
--   'COLE-AQUI-O-UUID-DO-AUTH-USER',          -- UUID do usuário criado em Authentication
--   'a1b2c3d4-0000-0000-0000-000000000001',   -- loja iStore Teste
--   'Admin Teste',
--   'admin',
--   'admin@cylo.test',
--   'loja_admin',
--   'AT',
--   2.0,
--   50000
-- );

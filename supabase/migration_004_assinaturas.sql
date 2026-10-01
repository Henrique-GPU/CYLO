-- ════════════════════════════════════════════════════════════
-- CYLO — Migration 004: Assinaturas (cobrança automática via Asaas)
-- Execute no SQL Editor do Supabase. Só CRIA objetos novos; não altera
-- nem apaga nada de lojas/usuarios/vendas. Reexecutável (idempotente).
-- ════════════════════════════════════════════════════════════

-- ── 1. Status possíveis ──────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE status_assinatura AS ENUM ('trial', 'ativa', 'inadimplente', 'cancelada');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 2. Tabela de assinaturas (1 linha por loja) ──────────────
CREATE TABLE IF NOT EXISTS assinaturas (
  loja_id               uuid PRIMARY KEY REFERENCES lojas(id) ON DELETE CASCADE,
  status                status_assinatura NOT NULL DEFAULT 'trial',
  trial_ate             timestamptz NOT NULL,
  inadimplente_desde    timestamptz,
  pago_ate              timestamptz,
  asaas_customer_id     text,
  asaas_subscription_id text UNIQUE,
  atualizado_em         timestamptz NOT NULL DEFAULT now()
);

-- ── 3. RLS: usuário só LÊ a própria assinatura ───────────────
-- Sem policy de insert/update/delete: só o service role escreve.
ALTER TABLE assinaturas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "loja_le_propria_assinatura" ON assinaturas;
CREATE POLICY "loja_le_propria_assinatura" ON assinaturas
  FOR SELECT USING (loja_id = auth_loja_id() OR is_ceo());

-- ── 4. Idempotência do webhook (sem policies: só service role) ──
CREATE TABLE IF NOT EXISTS asaas_webhook_eventos (
  evento_id   text PRIMARY KEY,
  tipo        text NOT NULL,
  recebido_em timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE asaas_webhook_eventos ENABLE ROW LEVEL SECURITY;

-- ── 5. Regra única de acesso ─────────────────────────────────
CREATE OR REPLACE FUNCTION acesso_liberado(p_loja uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((
    SELECT CASE
      WHEN status = 'ativa'        THEN true
      WHEN status = 'trial'        THEN now() < trial_ate
      WHEN status = 'inadimplente' THEN now() < inadimplente_desde + interval '3 days'
      WHEN status = 'cancelada'    THEN now() < pago_ate
      ELSE false
    END
    FROM assinaturas WHERE loja_id = p_loja
  ), false);
$$;

REVOKE EXECUTE ON FUNCTION acesso_liberado(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION acesso_liberado(uuid) TO authenticated, service_role;

-- ── 6. Migração das lojas existentes ─────────────────────────
-- Ninguém trava de surpresa: trial até o maior entre (criação + 15 dias)
-- e (hoje + 7 dias). Lojas que já estavam 'ativo' no modelo antigo
-- (lojas.status_saas) entram como 'ativa'.
-- A conta CEO (perfil 'ceo') não tem loja (loja_id null), então não há
-- linha para ela: o app deve pular a checagem quando perfil = 'ceo'.
INSERT INTO assinaturas (loja_id, status, trial_ate)
SELECT id,
       CASE WHEN status_saas = 'ativo' THEN 'ativa'::status_assinatura
            ELSE 'trial'::status_assinatura END,
       GREATEST(criada_em + interval '15 days', now() + interval '7 days')
FROM lojas
ON CONFLICT (loja_id) DO NOTHING;

-- ════════════════════════════════════════════════════════════
-- Verificação (rode depois):
-- select count(*) from lojas;            -- 13
-- select count(*) from assinaturas;      -- 13
-- select l.nome, a.status, a.trial_ate, acesso_liberado(l.id)
--   from lojas l join assinaturas a on a.loja_id = l.id order by l.nome;
-- ════════════════════════════════════════════════════════════

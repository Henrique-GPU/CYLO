-- ════════════════════════════════════════════════════════════
-- CYLO — Migration 001: Fix schema for venda/troca flow
-- Execute no SQL Editor do Supabase (Dashboard > SQL Editor)
-- ════════════════════════════════════════════════════════════

-- ── 1. aparelhos: colunas faltando para troca ────────────────
ALTER TABLE aparelhos ADD COLUMN IF NOT EXISTS estado          text;
ALTER TABLE aparelhos ADD COLUMN IF NOT EXISTS observacoes     text;
ALTER TABLE aparelhos ADD COLUMN IF NOT EXISTS origem_aparelho text;

-- ── 2. aparelhos: expandir CHECK de status para em_analise ───
-- Remove qualquer constraint de CHECK que mencione o valor 'disponivel'
-- (é a constraint do campo status, independente do nome gerado)
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'aparelhos'::regclass
      AND contype  = 'c'
      AND pg_get_constraintdef(oid) LIKE '%disponivel%'
  LOOP
    EXECUTE 'ALTER TABLE aparelhos DROP CONSTRAINT ' || quote_ident(r.conname);
  END LOOP;
END $$;

ALTER TABLE aparelhos ADD CONSTRAINT aparelhos_status_check
  CHECK (status IN (
    'disponivel','reservado','vendido',
    'manutencao','negociacao','em_analise'
  ));

-- ── 3. vendas: colunas faltando ──────────────────────────────
ALTER TABLE vendas ADD COLUMN IF NOT EXISTS troca_obs      text;
ALTER TABLE vendas ADD COLUMN IF NOT EXISTS cliente_insta  text;
ALTER TABLE vendas ADD COLUMN IF NOT EXISTS vendedor_nome  text;

-- ── 4. vendas: garantia_validade vira text (pode ser "6 meses")
ALTER TABLE vendas
  ALTER COLUMN garantia_validade TYPE text
  USING garantia_validade::text;

-- ── 5. clientes: campo vendedor_id para filtro por vendedor ──
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS vendedor_id uuid REFERENCES usuarios(id);
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS atualizado_em timestamptz DEFAULT now();

-- ════════════════════════════════════════════════════════════
-- Verificação (execute após a migration para confirmar)
-- ════════════════════════════════════════════════════════════
-- SELECT column_name, data_type
-- FROM information_schema.columns
-- WHERE table_name IN ('aparelhos', 'vendas', 'clientes')
--   AND column_name IN (
--     'estado','observacoes','origem_aparelho',
--     'troca_obs','cliente_insta','vendedor_nome','vendedor_id'
--   )
-- ORDER BY table_name, column_name;

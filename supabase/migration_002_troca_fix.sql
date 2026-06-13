-- ════════════════════════════════════════════════════════════
-- CYLO — Migration 002: Fix troca → estoque definitivo
-- Execute no SQL Editor do Supabase se trocar ainda não entra no estoque
-- ════════════════════════════════════════════════════════════

-- ── DIAGNÓSTICO: rode primeiro para ver as constraints atuais ──
-- SELECT conname, pg_get_constraintdef(oid) as definicao
-- FROM pg_constraint
-- WHERE conrelid = 'aparelhos'::regclass AND contype = 'c';

-- ── 1. Remove QUALQUER check constraint em aparelhos ──────────
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'aparelhos'::regclass AND contype = 'c'
  LOOP
    EXECUTE 'ALTER TABLE aparelhos DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
  END LOOP;
END $$;

-- ── 2. Recria o check de status com todos os valores válidos ──
ALTER TABLE aparelhos ADD CONSTRAINT aparelhos_status_check
  CHECK (status IN (
    'disponivel', 'reservado', 'vendido',
    'manutencao', 'negociacao', 'em_analise'
  ));

-- ── 3. Garante colunas de troca existem ──────────────────────
ALTER TABLE aparelhos ADD COLUMN IF NOT EXISTS estado          text;
ALTER TABLE aparelhos ADD COLUMN IF NOT EXISTS observacoes     text;
ALTER TABLE aparelhos ADD COLUMN IF NOT EXISTS origem_aparelho text;

-- ── 4. Teste: insere e deleta um aparelho de troca de exemplo ─
-- (descomente para testar antes de commitar)
-- INSERT INTO aparelhos (loja_id, modelo, tipo, status, custo, preco, data_entrada, origem, origem_aparelho, estado)
-- VALUES ('00000000-0000-0000-0000-000000000000', 'TESTE TROCA', 'usado', 'em_analise', 0, 0, now(), 'Troca', 'troca', 'bom');
-- DELETE FROM aparelhos WHERE modelo = 'TESTE TROCA';

-- ── Verificação final ─────────────────────────────────────────
SELECT conname, pg_get_constraintdef(oid) as definicao
FROM pg_constraint
WHERE conrelid = 'aparelhos'::regclass AND contype = 'c';

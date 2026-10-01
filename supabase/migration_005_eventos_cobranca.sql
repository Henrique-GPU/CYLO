-- ════════════════════════════════════════════════════════════
-- CYLO — Migration 005: histórico de cobranças para o painel do CEO
-- Só adiciona 2 colunas opcionais na tabela de eventos do webhook.
-- Reexecutável. O webhook funciona mesmo sem esta migration (só não registra a loja).
-- ════════════════════════════════════════════════════════════

ALTER TABLE asaas_webhook_eventos ADD COLUMN IF NOT EXISTS loja_id uuid REFERENCES lojas(id) ON DELETE SET NULL;
ALTER TABLE asaas_webhook_eventos ADD COLUMN IF NOT EXISTS detalhe text;

CREATE INDEX IF NOT EXISTS asaas_webhook_eventos_recebido_idx ON asaas_webhook_eventos (recebido_em DESC);

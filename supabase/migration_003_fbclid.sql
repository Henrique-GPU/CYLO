-- ════════════════════════════════════════════════
-- Migration 003 — captura de fbclid (Meta/Instagram Ads)
-- Execute no Supabase SQL Editor.
-- Espelha a coluna gclid já existente em usuarios.
-- ════════════════════════════════════════════════

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS fbclid text;

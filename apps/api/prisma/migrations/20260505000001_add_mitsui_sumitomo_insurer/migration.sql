-- Migration: add_mitsui_sumitomo_insurer
-- Adiciona MITSUI_SUMITOMO ao enum Insurer para suportar cotações cosseguradas com a Porto Seguro.

ALTER TYPE "Insurer" ADD VALUE IF NOT EXISTS 'MITSUI_SUMITOMO';

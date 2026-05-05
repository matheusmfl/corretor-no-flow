-- Migration: add_azul_insurer
-- Adiciona AZUL ao enum Insurer para suportar cotações da Azul Seguros (família Porto).

ALTER TYPE "Insurer" ADD VALUE IF NOT EXISTS 'AZUL';

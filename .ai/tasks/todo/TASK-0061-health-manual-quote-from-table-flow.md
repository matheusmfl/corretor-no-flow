---
id: TASK-0061
title: Criar fluxo de cotacao manual Saude por tabela
status: todo
kind: implementation
lifecycle: open
area: api, dashboard
owner: unassigned
reviewer: codex
complexity: high
risk: medium
tdd_required: true
created_at: 2026-05-14
---

# TASK-0061 - Criar fluxo de cotacao manual Saude por tabela

## Context

Nem toda operadora possui cotador proprio ou PDF de retorno. O corretor precisa poder criar uma cotacao manual usando uma tabela previamente cadastrada/importada e uma base de vidas informada no sistema ou reaproveitada de um PDF ja extraido.

## Objective

Permitir que o fluxo Saude tenha uma entrada manual inicial: informar/criar vidas, escolher uma tabela manual valida e gerar uma `HealthQuoteOption` calculada pelo motor de tabela.

## Scope

- Habilitar card "Criar cotacao manual" na tela inicial de Saude.
- Criar tela/formulario para inserir vidas manualmente ou partir de uma base ja existente quando houver rascunho em sessao.
- Reusar `POST /quotes/health/apply-table` e `HealthManualTablePricingService`.
- Exibir validade da tabela e bloquear/alertar quando a tabela estiver sem validade ou fora da cobertura de idade.
- Enviar o resultado para a tela de review como um `HealthQuoteDraft` com `sourceType: manual_table`.

## Out Of Scope

- Persistencia definitiva de catalogo de tabelas.
- OCR/visao para tabelas em imagem.
- Edicao completa de beneficiarios em massa.
- Rede referenciada/carencia/reembolso real fora do que estiver na tabela.

## Executor Context Pack

Read these files first, in order:

1. `.ai/discovery/HEALTH-QUOTE-ASSISTED-MVP.md`
2. `.ai/tasks/done/TASK-0055-create-health-manual-table-pricing-engine.md`
3. `packages/types/src/health-quote-draft.types.ts`
4. `apps/api/src/modules/quotes/application/use-cases/apply-health-table.use-case.ts`
5. `apps/dashboard/src/app/(app)/dashboard/quotes/health/page.tsx`
6. `apps/dashboard/src/app/(app)/dashboard/quotes/health/review/page.tsx`
7. `apps/dashboard/src/lib/api/quote-process.api.ts`

Use `rg` only for these terms before opening more files:

- `applyHealthTable`
- `apply-table`
- `HealthManualTableSource`
- `manual_table`
- `HealthManualTablePricingService`
- `health-draft-pending`
- `StartCard`

## Acceptance Criteria

- [ ] User can start a manual Saude quote from `/dashboard/quotes/health`.
- [ ] User can add at least age, optional name, optional relationship for each life.
- [ ] System can apply a manual table and produce a draft review screen.
- [ ] Table validity is visible before review/export.
- [ ] Age outside table coverage gives a recoverable UI error.
- [ ] Existing PDF-to-review flow remains unaffected.

## QA Notes

- Test with unnamed lives.
- Test with at least one child and one older adult.
- Test missing table validity.
- Test age outside every configured band.

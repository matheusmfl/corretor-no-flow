---
id: TASK-0059
title: Criar PDF comercial Saude a partir do draft revisado
status: todo
kind: implementation
lifecycle: open
area: api
owner: claude
reviewer: codex
complexity: high
risk: medium
tdd_required: true
created_at: 2026-05-13
---

# TASK-0059 - Criar PDF comercial Saude a partir do draft revisado

## Context

Depois da planilha, a segunda saida desejada e um PDF comercial claro. O PDF deve ser gerado a partir do mesmo `HealthQuoteDraft` revisado, sem reextrair nem recalcular informacoes de forma independente.

## Objective

Criar um template/renderizacao PDF Saude v0 com resumo de vidas, opcoes, totais, validade e avisos.

## Scope

- Criar template HTML/PDF Saude separado do template AUTO.
- Renderizar:
  - cabecalho da corretora/processo;
  - resumo do grupo de vidas;
  - comparativo por plano/opcao;
  - totais;
  - validade por fonte;
  - avisos de campos inferidos/nao encontrados;
  - nota de que rede/reembolso/carencia devem ser confirmados quando nao revisados.
- Reusar `PdfRendererService` se adequado.
- Criar testes de template para garantir que campos sensiveis/warnings aparecem.

## Out Of Scope

- Nao criar link publico.
- Nao criar rede referenciada detalhada.
- Nao simular reembolso.
- Nao resolver OCR.

## Likely Files

- `apps/api/src/modules/quotes/application/services/pdf-renderer.service.ts`
- `apps/api/src/modules/quotes/application/services/quote-pdf-template.service.ts`
- `apps/api/src/modules/quotes/application/services/quote-pdf-template.service.spec.ts`
- `apps/api/src/modules/quotes/application/services/health-spreadsheet-matrix.service.ts`
- `apps/api/src/modules/quotes/domain/schemas/health-quote-draft.schema.ts`

## Executor Context Pack

Read these files first, in order:

1. `.ai/discovery/HEALTH-QUOTE-ASSISTED-MVP.md`
2. `apps/api/src/modules/quotes/application/services/quote-pdf-template.service.ts`
3. `apps/api/src/modules/quotes/application/services/quote-pdf-template.service.spec.ts`
4. `apps/api/src/modules/quotes/application/services/pdf-renderer.service.ts`
5. `apps/api/src/modules/quotes/domain/schemas/health-quote-draft.schema.ts`

Use `rg` only for these terms before opening more files:

- `build`
- `template`
- `PdfRendererService`
- `premium`
- `warnings`
- `HealthQuoteDraft`
- `validUntil`
- `needsReview`

Do not use broad Explore/subagent/codebase-map workflows before reading these files. If more than 6 additional files seem necessary, stop and explain why.

## TDD Requirement

Add tests for the Health PDF HTML/template output before implementation.

## Acceptance Criteria

- [ ] Health PDF template is separate from AUTO assumptions.
- [ ] PDF content includes lives, options, totals and validity.
- [ ] Warnings/review notes are visible in generated HTML/PDF.
- [ ] The template does not claim unconfirmed network/reimbursement/carencia.
- [ ] Existing AUTO PDF tests still pass.

## Risks

- Copy can overpromise Saude details not in the reviewed draft.
- Reusing AUTO visual assumptions may make the Health proposal confusing.

## Failure Scenario

The PDF looks polished but hides that some Saude fields were inferred or not found, creating client-facing misinformation.

## Human QA Checklist

- [ ] Generate sample Health PDF.
- [ ] Check readability on one page or multiple pages.
- [ ] Confirm warning language is clear and commercially acceptable.


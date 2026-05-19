---
id: TASK-0068
title: Bloquear PDFs que nao sao Saude no upload Saude
status: todo
kind: implementation
lifecycle: open
area: api, dashboard
owner: unassigned
reviewer: codex
complexity: medium
risk: high
tdd_required: true
created_at: 2026-05-19
---

# TASK-0068 - Bloquear PDFs que nao sao Saude no upload Saude

## Context

No teste real, o usuario subiu um PDF de AUTO (`porto-seguro-orcamento-completo.pdf`) dentro do fluxo de Saude. O sistema aceitou o arquivo, tentou extrair como `HealthQuoteDraft` e criou uma opcao medica falsa:

- `AUTO SENIOR e PROTECAO COMBINADA`
- `PORTO SEGURO`
- campos de Saude `not_found`
- coluna vazia na matriz

Isso contamina o rascunho e passa uma mensagem errada: parece que o sistema "entendeu" AUTO como plano de Saude.

## Objective

Antes de chamar a extracao de Saude, detectar o ramo do PDF e bloquear arquivos com sinais fortes de AUTO ou sem sinais suficientes de Saude, com uma mensagem clara no item do upload.

## Scope

- Reusar ou adaptar o detector existente (`detectInsurerFromText`) para validar produto/ramo no endpoint de Saude.
- No backend, `POST /quotes/health/extract-draft` deve rejeitar com erro recuperavel quando:
  - `detectedProduct === "AUTO"` com confianca alta/media;
  - houver sinais claros de veiculo/placa/FIPE/seguro auto;
  - nao houver sinais minimos de proposta/cotacao/plano de Saude.
- A rejeicao deve retornar mensagem especifica, por exemplo: `Esse PDF parece ser de Automovel, nao de Saude. Remova este arquivo ou envie pelo fluxo AUTO.`
- No frontend de upload Saude, mostrar esse motivo no card do arquivo e permitir continuar com os PDFs de Saude processados.
- Garantir que PDF rejeitado nao entre em `buildCombinedHealthDraft`.
- Manter comportamento parcial atual: se 1 PDF de Saude passa e 1 AUTO falha, o usuario pode continuar com o de Saude.

## Out Of Scope

- Implementar fluxo AUTO dentro da tela Saude.
- Criar detector universal perfeito para todos os ramos.
- OCR/vision para PDFs sem texto.

## Executor Context Pack

Read these files first, in order:

1. `.ai/discovery/HEALTH-QUOTE-ASSISTED-MVP.md`
2. `apps/api/src/modules/quotes/application/services/insurer-detector.ts`
3. `apps/api/src/modules/quotes/application/services/insurer-detector.spec.ts`
4. `apps/api/src/modules/quotes/application/use-cases/extract-health-draft.use-case.ts`
5. `apps/api/src/modules/quotes/presentation/quote.controller.ts`
6. `apps/dashboard/src/app/(app)/dashboard/quotes/health/upload/page.tsx`
7. `apps/dashboard/src/app/(app)/dashboard/quotes/health/upload/health-upload.helpers.ts`

Use `rg` only for these terms before opening more files:

- `detectInsurerFromText`
- `detectedProduct`
- `notProcessable`
- `extractHealthDraft`
- `extract-draft`
- `friendlyHealthUploadError`
- `buildCombinedHealthDraft`
- `porto-seguro-orcamento-completo`
- `AUTO_PRODUCT_PATTERNS`
- `HEALTH_PRODUCT_PATTERNS`

Do not use broad Explore/subagent/codebase-map workflows before reading these files. If more than 6 additional files seem necessary, stop and explain why.

## TDD Requirement

Start with backend tests:

- `ExtractHealthDraftUseCase` rejects AUTO-like text before AI extraction.
- AUTO fixture text with Porto signals is rejected as wrong product.
- Health text is still accepted.
- Ambiguous/no-product text returns a clear recoverable error instead of generating a fake draft.

Then add frontend helper tests if the upload helper has test coverage or create focused tests for friendly error mapping.

## Acceptance Criteria

- [ ] Uploading `porto-seguro-orcamento-completo.pdf` in Saude shows an item-level error saying it appears to be AUTO.
- [ ] The AUTO PDF does not create a Health quote option.
- [ ] Uploading one valid Saude PDF plus one AUTO PDF ends in partial state, with a "continuar com processados" path.
- [ ] Valid Saude PDFs still reach review.
- [ ] The review never shows AUTO product names in the Saude medical options.
- [ ] Tests cover AUTO rejection and Health acceptance.

## QA Notes

- Reproduce with:
  - `MARAVILHA CESTAS LTDA EFETIVO ENF.COM DESC..pdf`
  - `porto-seguro-orcamento-completo.pdf`
- Expected: only the Saude PDF contributes to the review; Porto AUTO remains failed in upload.

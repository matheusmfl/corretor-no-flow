---
id: TASK-0003
title: Implementar base Porto Seguro AUTO
status: done
kind: implementation
lifecycle: closed
area: api
owner: claude
reviewer: codex
complexity: high
risk: high
tdd_required: true
created_at: 2026-04-30
blocked_by: TASK-0002
---

# TASK-0003 - Implementar base Porto Seguro AUTO

## Status

Substituida por tasks menores:

- `TASK-0013` - Criar fixtures Porto completo/incompleto.
- `TASK-0014` - Parser deterministico de pagamentos Porto.
- `TASK-0015` - Extracao core Porto AUTO para AutoQuoteData.
- `TASK-0016` - Integrar Porto no fluxo de processamento.
- `TASK-0017` - Validar review, PDF e link publico com Porto.

Esta task fica fechada para preservar o historico da intencao original.

## Context

Porto Seguro is the first target after Bradesco. It should establish the reusable Porto-family extraction approach for Itau, Sompo, and Azul.

## Objective

Support Porto Seguro AUTO extraction end-to-end using the existing quote process flow: upload, async extraction, review, PDF generation, and public link.

## Scope

- Add Porto-specific extraction prompt/parser behavior where needed.
- Keep output compatible with `AutoQuoteData`.
- Add deterministic parsing for payment tables if needed.
- Add backend tests using sample text/PDF fixtures.
- Ensure generated quote name is meaningful for Porto.

## Out Of Scope

- Do not implement Itau, Sompo, or Azul in this task.
- Do not redesign the public link comparison.
- Do not change Health or post-sale behavior.

## Likely Files

- `apps/api/src/modules/quotes/jobs/extract-pdf.processor.ts`
- `apps/api/src/modules/quotes/application/services/**`
- `apps/api/src/modules/ai/**`

## TDD Requirement

Backend task. Must start with tests or fixtures before implementation.

Minimum tests:

- Porto sample text maps into valid `AutoQuoteData`.
- Payment installments parse correctly or are corrected predictably.
- Invalid/missing required data moves to the existing failure/review path.
- Bradesco behavior remains unchanged.

## Acceptance Criteria

- [ ] Porto Seguro AUTO PDF can be uploaded and processed.
- [ ] Extracted data validates as `AutoQuoteData`.
- [ ] Review page can display Porto data without custom frontend changes.
- [ ] PDF generation works for Porto.
- [ ] Public link displays Porto quote.
- [ ] Tests pass.

## Risks

- Payment table extraction may be the hardest part and may need deterministic parsing.
- A prompt-only implementation may pass one sample and fail real-world variations.

## Failure Scenario

The system appears to support Porto but silently extracts wrong installment or deductible data, damaging broker trust.

## Human QA Checklist

- [ ] Upload at least one real Porto Seguro AUTO PDF.
- [ ] Confirm vehicle, premium, deductible, RCF, assistance, and installments.
- [ ] Generate PDF and public link.
- [ ] Compare displayed data against the original insurer PDF.

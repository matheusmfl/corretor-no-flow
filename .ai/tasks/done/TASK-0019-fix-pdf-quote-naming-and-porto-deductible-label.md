---
id: TASK-0019
title: Corrigir nome do PDF e label de franquia Porto
status: done
kind: implementation
lifecycle: closed
area: api
owner: claude
reviewer: codex
complexity: low
risk: medium
tdd_required: true
created_at: 2026-05-01
priority: urgent
---

# TASK-0019 - Corrigir nome do PDF e label de franquia Porto

## Context

Na QA da `TASK-0017`, o PDF gerado ficou funcional, mas o nome/label da cotacao ainda nao esta bom para uso comercial.

O usuario quer que o nome do arquivo PDF seja composto por:

- nome/modelo do veiculo;
- nome da seguradora;
- nome/tipo da franquia;
- premio total entre parenteses.

O valor da franquia nao deve ser o principal identificador do arquivo.

Tambem foi observado que Porto aparece como `Franquia principal: (compreensiva)`. `Compreensiva` e tipo de cobertura/casco, nao nome de franquia. No PDF Porto analisado, a franquia parece ser `50% da Obrigatoria`, mas ainda faltam amostras de franquia normal/reduzida para generalizar.

## Objective

Corrigir nomenclatura de PDF/quote label para ficar comercialmente clara e evitar confundir cobertura com franquia.

## Scope

- Ajustar `buildQuotePdfFilename` para usar premio total em parenteses, nao valor da franquia.
- Ajustar label/nome de cotacao gerado no processor para priorizar tipo/nome da franquia, quando confiavel.
- Evitar exibir `Compreensiva` como tipo de franquia.
- Para Porto, se `deductibleType` vier como `Compreensiva`, omitir ou substituir apenas quando houver evidencia clara de franquia no texto extraido.
- Adicionar/atualizar testes cobrindo Bradesco Reduzida e Porto sem tipo de franquia confiavel.

## Out Of Scope

- Nao implementar suporte completo a todas as variacoes de franquia Porto.
- Nao alterar schema de `AutoQuoteData`.
- Nao redesenhar PDF.

## Likely Files

- `apps/api/src/modules/quotes/application/services/quote-filename.ts`
- `apps/api/src/modules/quotes/application/services/quote-filename.spec.ts`
- `apps/api/src/modules/quotes/jobs/extract-pdf.processor.ts`
- `apps/api/src/modules/quotes/jobs/extract-pdf.processor.spec.ts`
- `apps/api/src/modules/quotes/application/services/quote-pdf-template.service.ts`

## TDD Requirement

Backend task. Tests must be updated before or alongside implementation.

Minimum tests:

- Bradesco filename uses vehicle, insurer, `Reduzida`, and premium total.
- Porto filename does not use deductible value as main identifier.
- Porto does not show `Compreensiva` as deductible/franchise type.
- Existing Bradesco filename behavior remains readable.

## Acceptance Criteria

- [x] PDF filename follows `{veiculo}_{seguradora}_{franquia}({premioTotal}).pdf` when data exists.
- [x] Deductible value is not used as the main filename parenthetical.
- [x] Porto no longer displays `Compreensiva` as franchise type.
- [x] Tests pass.

## Risks

- Porto PDF may not always expose franchise type in the same wording.

## Failure Scenario

The broker sends a PDF named or labeled with the wrong franchise concept, making the quote look unprofessional or misleading.

## Human QA Checklist

- [x] Generate Bradesco PDF and inspect filename.
- [x] Generate Porto PDF and inspect filename.
- [x] Confirm Porto franchise label is not `Compreensiva`.

## QA Result

Approved by human QA on 2026-05-01.

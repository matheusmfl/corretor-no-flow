---
id: TASK-0053
title: Criar contrato validado do rascunho de cotacao Saude
status: todo
kind: implementation
lifecycle: open
area: types
owner: claude
reviewer: codex
complexity: medium
risk: medium
tdd_required: true
created_at: 2026-05-13
---

# TASK-0053 - Criar contrato validado do rascunho de cotacao Saude

## Context

A frente urgente de Saude precisa entregar valor rapido sem transformar inferencias de IA em verdade definitiva. O primeiro motor deve ser um contrato de rascunho revisavel, com origem, confianca, evidencia e status de revisao em cada campo sensivel.

Nao devemos plugar Saude direto no fluxo final de AUTO ainda. O objetivo desta task e criar o contrato compartilhado e o validador backend para que as proximas tasks consigam extrair PDFs/planilhas para um `HealthQuoteDraft` seguro.

## Objective

Criar tipos compartilhados e schema Zod para `HealthQuoteDraft`, incluindo campos de procedencia/revisao, vidas, opcoes de plano, faixas etarias e fontes de tabela manual.

## Scope

- Adicionar tipos em `packages/types` para:
  - `DraftFieldSource`;
  - `DraftField<T>`;
  - `HealthMemberLife`;
  - `HealthAgeBandPrice`;
  - `HealthQuoteOption`;
  - `HealthManualTableSource`;
  - `HealthQuoteDraft`.
- Exportar os novos tipos no barrel apropriado.
- Criar schema backend em `apps/api/src/modules/quotes/domain/schemas/health-quote-draft.schema.ts`.
- Criar `parseHealthQuoteDraft(raw)` seguindo o padrao de `parseAutoQuoteData`.
- Aceitar `null` em campos opcionais vindos da IA convertendo para `undefined` quando fizer sentido, mas preservar `DraftField.value = null` quando o campo existe como `not_found`.
- Escrever testes cobrindo:
  - rascunho minimo valido;
  - campos `extracted`, `inferred`, `manual`, `table_lookup`, `not_found`;
  - vida sem nome mas com idade;
  - opcao com valores por vida e total mensal;
  - falha quando campo sensivel inferido nao tem `needsReview: true`;
  - falha quando idade obrigatoria da vida esta ausente;
  - falha quando `confidence` esta fora de 0..1.

## Out Of Scope

- Nao alterar Prisma/schema de banco.
- Nao alterar o job assíncrono de extracao.
- Nao alterar `AiService`.
- Nao gerar XLSX.
- Nao criar UI.
- Nao implementar OCR.
- Nao tentar extrair Amil/SulAmerica nesta task.

## Likely Files

- `packages/types/src/quote.types.ts`
- `packages/types/src/index.ts`
- `apps/api/src/modules/quotes/domain/schemas/auto-quote.schema.ts`
- `apps/api/src/modules/quotes/domain/schemas/auto-quote.schema.spec.ts`
- `apps/api/src/modules/quotes/domain/schemas/health-quote-draft.schema.ts`
- `apps/api/src/modules/quotes/domain/schemas/health-quote-draft.schema.spec.ts`

## Executor Context Pack

Read these files first, in order:

1. `.ai/discovery/HEALTH-QUOTE-ASSISTED-MVP.md`
2. `.ai/brainstorm/2026-05-13-pesquisa-corretora-saude-prototipo-urgente.md`
3. `packages/types/src/quote.types.ts`
4. `packages/types/src/index.ts`
5. `apps/api/src/modules/quotes/domain/schemas/auto-quote.schema.ts`
6. `apps/api/src/modules/quotes/domain/schemas/auto-quote.schema.spec.ts`

Use `rg` only for these terms before opening more files:

- `AutoQuoteData`
- `parseAutoQuoteData`
- `stripNulls`
- `CoverageStatus`
- `InsuranceProduct`
- `HealthQuoteDraft`
- `DraftField`
- `not_found`

Do not use broad Explore/subagent/codebase-map workflows before reading these files. If more than 6 additional files seem necessary, stop and explain why.

## TDD Requirement

Backend work must start with tests. Add `health-quote-draft.schema.spec.ts` first, run the focused failing test when practical, then implement the schema/types.

## Acceptance Criteria

- [ ] Shared Health draft types compile and are exported from `@corretor/types`.
- [ ] `parseHealthQuoteDraft(raw)` validates a minimal reviewed/partially reviewed Health quote draft.
- [ ] Every `DraftField` requires `source`, `confidence`, `needsReview`, and a `value` key.
- [ ] `confidence` is constrained to `0..1`.
- [ ] `source: "not_found"` requires `value: null` and `needsReview: true`.
- [ ] Sensitive fields such as accommodation, coparticipation, reimbursement mode, validity and dental status require review when `source` is `inferred`, `ocr`, or `vision_inferred`.
- [ ] Tests cover the main valid and invalid cases listed in scope.
- [ ] Existing AUTO schema tests still pass.

## Risks

- If the contract is too rigid, the urgent extractor will fail on real PDFs with partial data.
- If the contract is too loose, inferred Saude fields may look final and become dangerous in PDF/link outputs.
- If types are added inside AUTO-specific names, future Health implementation will be coupled to the current Auto pipeline.

## Failure Scenario

The executor creates only a loose `Record<string, unknown>` shape or adds Health fields directly to `AutoQuoteData`, making it impossible to know which values came from PDF, AI inference, table lookup or broker review.

## Human QA Checklist

- [ ] Codex reviews whether the contract preserves draft/provenance/review semantics.
- [ ] Human confirms the contract can represent the Amil, SulAmerica/Cuidado360 and spreadsheet examples before extractor work starts.

## Fix attempt — P0 null normalisation (2026-05-13)

**Finding:** `parseHealthQuoteDraft` chamava `HealthQuoteDraftSchema.safeParse(raw)` direto, sem pré-processar nulos. Campos opcionais como `clientName: null`, `region: null`, `administratorOrChannel: null` vindos da IA falhavam na validação Zod porque `z.string().optional()` não aceita `null`.

**Implementação:** adicionada função `stripNullsExceptDraftFieldValue` que converte `null → undefined` recursivamente, mas detecta objetos `DraftField` pelo shape (`source` em conjunto de valores válidos + chave `value`) e protege o `value` deles — preservando `DraftField.value = null` para `not_found`.

**Testes adicionados (5 novos, total 24):**
- `clientName: null` → `undefined`
- `city: null, state: null` → `undefined`
- `administratorOrChannel: null, region: null` na opção → `undefined`
- `DraftField.value = null` com `not_found` preservado mesmo com null stripping ativo
- Todos os 5 campos sensíveis como `not_found` → `value: null` preservado

**Resultado:** 24/24 health tests passando, 6/6 AUTO tests sem regressão.


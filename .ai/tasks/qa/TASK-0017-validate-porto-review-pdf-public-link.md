---
id: TASK-0017
title: Validar review PDF e link publico com Porto
status: qa
kind: implementation
lifecycle: open
area: dashboard
owner: claude
reviewer: codex
complexity: medium
risk: medium
tdd_required: false
created_at: 2026-05-01
blocked_by: TASK-0016
---

# TASK-0017 - Validar review PDF e link publico com Porto

## Context

Porto extraction is only useful if the broker can review it, generate the proposal PDF, and share the public link without broken labels or missing key values.

## Objective

Validate and adjust the frontend/PDF/public-link surfaces for Porto Seguro AUTO core fields.

## Scope

- Review page displays Porto core fields coherently.
- Generated PDF works with Porto insurer label and core data.
- Public link displays Porto card and core coverage/payment data.
- Download filename remains readable.
- Avoid exposing long legal clauses or noisy extras.

## Out Of Scope

- Do not implement comparison highlights unless `TASK-0004` is active.
- Do not implement Porto extras backlog.
- Do not implement other insurers.

## Likely Files

- `apps/dashboard/src/app/(app)/dashboard/quotes/[processId]/review/page.tsx`
- `apps/dashboard/src/app/(public)/c/[token]/page.tsx`
- `apps/api/src/modules/quotes/application/services/quote-pdf-template.service.ts`

## TDD Requirement

Frontend/PDF validation task. Add tests only if existing patterns support them; otherwise document manual QA.

## Acceptance Criteria

- [x] Porto review screen is readable.
- [x] Porto generated PDF is readable.
- [x] Porto public link card is readable.
- [x] No long legal text is exposed as primary client content.
- [ ] Manual QA checklist is completed.

## Implementation Notes

### Changes made

**`apps/api/src/modules/quotes/application/services/quote-pdf-template.service.ts`**
- Added `hasRcf`, `hasApp`, `hasAssist` helpers that check for at least one meaningful value (positive number or truthy boolean) before rendering each group. A truthy-but-empty object like `coverage.app = {}` or `{ death: 0 }` no longer triggers the group.
- Coverage groups (RCF, APP, Assistências) now use these helpers. Before, all groups rendered unconditionally; in the first pass the condition was only `rcf ?`, which still let `{}` through.

**`apps/api/src/modules/quotes/application/services/quote-pdf-template.service.spec.ts`** *(novo)*
- 12 testes cobrindo: ausente, `{}`, todos-zero/falso, e ao menos um valor positivo — para cada um dos três grupos (APP, RCF, Assistências). Todos passando.

**`apps/dashboard/src/app/(public)/c/[token]/quote/[quoteId]/route.ts`**
- Route handler already existed and proxies `GET /api/public/c/:token/quote/:quoteId/html`. No changes needed.

**Review page and public link listing** — already Porto-compatible, no changes needed.

## Risks

- Existing UI labels may assume Bradesco-style fields.

## Failure Scenario

Porto data extracts correctly but the broker sees confusing labels or the insured client sees noisy legal text.

## Human QA Checklist

## Codex Review

Approved for human QA on 2026-05-01.

Automated check:

```txt
quote-pdf-template.service.spec.ts: 12 passed
```

## Human QA Findings - 2026-05-01

QA executed with one Bradesco quote and one Porto Seguro quote in the same process. Processing, PDF generation, and public link worked, but the task should not move to done yet.

### Immediate issues

- PDF filename should use vehicle name, insurer name, deductible name/type, and premium total in parentheses. It should not use deductible value as the main differentiator.
- Porto PDF shows `Franquia principal: (compreensiva)`. This appears to confuse coverage type with deductible/franchise type. For the tested Porto PDF, the discovery suggests `50% da Obrigatoria`; reduced/normal variations still need more samples.
- Public link greeting uses the process-level `clientName`, but the process can contain quotes extracted with different insured/driver names. In QA, the link greeted Fabiano while one quote belonged to another person.
- Public link cards and PDF still show assistance labels too generically:
  - `Guincho` should be presented as `Assistencia 24h (guincho)` and, when available, include km limit.
  - `Protecao de vidros: Incluso` should identify the insurer-specific glass tier when available.
  - `Veiculo reserva: Incluso` should include days and category/tier when available.
- Porto payment labels are technically parsed, but commercial wording is poor. `Cartao Porto Bank (Aquisicao)` and `Cartao Porto Bank (Outro Titular)` need clearer client-facing labels and discount context.
- Public link is missing useful optional coverages/extras such as pneus/para-brisas, carro reserva, reparo rapido, rodas/suspensao, martelinho and glass tier details. This likely needs a template/display configuration instead of hardcoded chips.

### Technical observations

- Porto still calls Groq for core extraction. Payments are parsed by deterministic code after Groq.
- Bradesco appears slower than Porto and should be instrumented/investigated before optimizing blindly.

### Follow-up tasks created/recommended

- `TASK-0019` - Fix PDF/quote naming and Porto deductible label.
- `TASK-0020` - Investigate Bradesco vs Porto extraction latency and AI usage.
- `TASK-0021` - Brainstorm and define client identity rules for mixed insured/driver names in one quote process.
- `TASK-0022` - Design richer insurer coverage display contract and public/PDF template controls.
- `TASK-0023` - Collect insurer SVG logos for quote cards/PDF.

- [x] Upload Porto PDF.
- [x] Confirm review fields.
- [x] Generate PDF.
- [x] Publish link.
- [x] Open as insured client.
- [x] Confirm WhatsApp CTA remains visible.
- [ ] Resolve or explicitly defer QA findings above.


---
id: TASK-0048
title: Corrigir titulo do card Bradesco e labels de vidros
status: todo
kind: implementation
lifecycle: open
area: dashboard
owner: claude
reviewer: codex
complexity: low
risk: medium
tdd_required: true
created_at: 2026-05-08
---

# TASK-0048 - Corrigir titulo do card Bradesco e labels de vidros

## Context

Human QA for `TASK-0046` found that Bradesco is technically extracting/rendering richer coverage details, but the public card still communicates two things poorly:

1. The quote title is using deductible type/franchise (`Bradesco — Obrigatoria`, `Bradesco — Reduzida`) instead of the Bradesco product/variant.
2. Glass coverage appears as raw-ish labels like `Vidros Vidro Protegido Plus` without explaining what `Vidro Protegido`, `Vidro Protegido Plus`, or `Reparo de Para-Brisa` mean.

This should be fixed in the same implementation slice because both issues affect the same broker/client understanding of Bradesco quote cards and coverage labels.

## Objective

Make Bradesco public/review/PDF presentation distinguish product, franchise, and glass coverage clearly:

- title/product: `Bradesco Tradicional`, `Bradesco Auto Classic`, `Bradesco Auto Lar`;
- franchise/deductible type: separate chip/label when relevant (`Franquia Obrigatoria`, `Franquia Reduzida`, etc.);
- glass: concise label plus catalog explanation/tooltip.

## Scope

- Add Bradesco product label mapping from `AutoQuoteData.segment`.
- Use Bradesco product label when building initial quote labels, instead of falling back to `coverage.vehicle.deductibleType`.
- Keep deductible/franchise type available as a separate visual detail in public card, review page, and/or generated PDF where already appropriate.
- Improve public card glass chip label to avoid repetition:
  - current: `Vidros Vidro Protegido Plus`;
  - preferred examples: `Vidros: Protegido Plus`, `Vidros: Protegido Plus Logomarca`, `Reparo de para-brisa`.
- Add/update Bradesco glass catalog text:
  - `Reparo de Para-Brisa`: repair of the windshield when possible.
  - `Vidro Protegido`: para-brisa + side windows.
  - `Vidro Protegido Plus`: all windows plus headlights, lanterns and sunroof.
  - `Vidro Protegido Plus Logomarca`: Plus coverage with logo application.
  - Premium variants may stay generic unless confirmed by PDF/human catalog.
- Reuse the same catalog wording in API/PDF and public link when possible, or document why duplication remains temporary.
- Update QA checklist if behavior changes.

## Out Of Scope

- Do not implement moto, caminhao, or Auto Lar Caminhao.
- Do not change extraction of `Cia Renovacao`.
- Do not fetch Bradesco catalog at runtime.
- Do not turn Bradesco catalog into closed enums that would make future option replacement hard.
- Do not change Porto/Tokio/Azul/Itau/Mitsui product labels except to preserve existing behavior.

## Likely Files

- `apps/api/src/modules/quotes/application/services/quote-filename.ts`
- `apps/api/src/modules/quotes/jobs/extract-pdf.processor.ts`
- `apps/api/src/modules/quotes/jobs/extract-pdf.processor.spec.ts`
- `apps/api/src/modules/quotes/application/services/coverage-display.ts`
- `apps/api/src/modules/quotes/application/services/coverage-display.spec.ts`
- `apps/api/src/modules/quotes/application/services/quote-pdf-template.service.ts`
- `apps/api/src/modules/quotes/application/services/quote-pdf-template.service.spec.ts`
- `apps/dashboard/src/app/(public)/c/[token]/page.tsx`
- `apps/dashboard/src/app/(app)/dashboard/quotes/[processId]/review/page.tsx`

## Executor Context Pack

Read these files first, in order:

1. `.ai/tasks/qa/TASK-0047-qa-bradesco-auto-coverage-details.md`
2. `.ai/discovery/BRADESCO-AUTO-EXTRA-FIELDS.md`
3. `apps/api/src/modules/quotes/application/services/quote-filename.ts`
4. `apps/api/src/modules/quotes/jobs/extract-pdf.processor.ts`
5. `apps/dashboard/src/app/(public)/c/[token]/page.tsx`
6. `apps/api/src/modules/quotes/application/services/coverage-display.ts`
7. `apps/api/src/modules/quotes/application/services/quote-pdf-template.service.ts`

Use `rg` only for these terms before opening more files:

- `buildQuoteLabel`
- `getBradescoProductLabel`
- `deductibleType`
- `UNRELIABLE_DEDUCTIBLE_TYPES`
- `quote.name`
- `glassTooltip`
- `BRADESCO_GLASS_CATALOG`
- `Vidro Protegido`
- `Reparo de Para-Brisa`
- `Franquia`

Do not use broad Explore/subagent/codebase-map workflows before reading these files. If more than 6 additional files seem necessary, stop and explain why.

## TDD Requirement

Start with tests:

- quote label builder returns product labels for Bradesco segments:
  - `Tradicional` -> `Bradesco Tradicional`;
  - `1583 - BRADESCO SEGURO AUTO CLASSIC` -> `Bradesco Auto Classic`;
  - `1776 - SEGURO AUTO LAR` -> `Bradesco Auto Lar`.
- Bradesco label no longer uses `deductibleType` as title when `segment` is present.
- Existing non-Bradesco label behavior remains unchanged.
- Bradesco glass tooltip/catalog describes `Vidro Protegido` and `Vidro Protegido Plus` accurately.
- Public card helper/formatting avoids `Vidros Vidro...` repetition.

## Acceptance Criteria

- [ ] Public link card title for Bradesco shows product/variant, not franchise type.
- [ ] Bradesco deductible/franchise type remains visible somewhere useful as a separate label/detail.
- [ ] Glass chip/row label is concise and not repetitive.
- [ ] `Vidro Protegido` explanation says para-brisa + side windows.
- [ ] `Vidro Protegido Plus` explanation says all windows + headlights + lanterns + sunroof.
- [ ] `Reparo de Para-Brisa` is represented cleanly.
- [ ] `Logomarca` variants preserve the logomarca detail.
- [ ] Existing Porto/Tokio/Azul/Itau/Mitsui tests remain green.
- [ ] Relevant unit tests pass.

## Risks

- Bradesco segment strings include numeric product codes; mapping must tolerate both code-prefixed and plain labels.
- Deductible type is still useful to brokers, so removing it entirely would reduce comparison value.
- Public link has local tooltip catalog duplication today; keep wording aligned with API/PDF until a shared catalog is extracted.

## Failure Scenario

The client sees multiple Bradesco cards titled only by franchise type and cannot tell whether the quote is Tradicional, Auto Classic, or Auto Lar; glass coverage also looks like unexplained internal catalog wording.

## Human QA Checklist

- [ ] Public card title shows `Bradesco Tradicional` for the Tradicional sample.
- [ ] Public card title shows `Bradesco Auto Classic` for the Classic sample.
- [ ] Public card title shows `Bradesco Auto Lar` for the Auto Lar sample.
- [ ] Franchise/deductible type is still visible as a separate chip/detail.
- [ ] Hover/details for `Vidro Protegido Plus` explain windows, headlights, lanterns and sunroof.
- [ ] `Reparo de Para-Brisa` and `Vidro Protegido` do not look like duplicate or unexplained labels.

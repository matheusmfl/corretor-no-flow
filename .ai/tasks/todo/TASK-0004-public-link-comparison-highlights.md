---
id: TASK-0004
title: Adicionar destaques de comparacao no link publico
status: todo
kind: implementation
lifecycle: open
area: dashboard
owner: claude
reviewer: codex
complexity: medium
risk: medium
tdd_required: false
created_at: 2026-04-30
---

# TASK-0004 - Adicionar destaques de comparacao no link publico

## Context

The public link currently shows quote cards. It should become more useful for conversion by highlighting comparison points without making unsafe absolute recommendations.

## Objective

Show a "Destaques da comparacao" section on the public quote page for AUTO processes.

## Scope

- Compare ready quotes in a process.
- Highlight lower annual premium.
- Highlight better installment option when available.
- Highlight deductible, RCF, towing/assistance, and replacement car when available.
- Group quotes from the same insurer when there are multiple franchise options.
- Keep WhatsApp as the primary CTA.

## Out Of Scope

- Do not implement AI recommendations.
- Do not claim one quote is the best overall.
- Do not change backend extraction.

## Likely Files

- `apps/dashboard/src/app/(public)/c/[token]/page.tsx`
- `packages/types/src/quote.types.ts`

## TDD Requirement

Frontend task. Unit tests are optional unless comparison helpers are extracted.

## Acceptance Criteria

- [ ] Public AUTO link shows "Destaques da comparacao".
- [ ] Highlights use safe language.
- [ ] Works with one quote without awkward comparison text.
- [ ] Works with multiple quotes from the same insurer.
- [ ] Existing Bradesco public link remains usable.

## Risks

- Overstating a recommendation could create sales or compliance risk.

## Failure Scenario

The page says a quote is "the best" even though it is only cheapest, leading the insured client to misunderstand coverage tradeoffs.

## Human QA Checklist

- [ ] Open a public link with one quote.
- [ ] Open a public link with two or more quotes.
- [ ] Confirm WhatsApp button remains prominent.
- [ ] Confirm comparison wording feels helpful but not absolute.

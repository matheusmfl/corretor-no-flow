---
id: TASK-0017
title: Validar review PDF e link publico com Porto
status: todo
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

- [ ] Porto review screen is readable.
- [ ] Porto generated PDF is readable.
- [ ] Porto public link card is readable.
- [ ] No long legal text is exposed as primary client content.
- [ ] Manual QA checklist is completed.

## Risks

- Existing UI labels may assume Bradesco-style fields.

## Failure Scenario

Porto data extracts correctly but the broker sees confusing labels or the insured client sees noisy legal text.

## Human QA Checklist

- [ ] Upload Porto PDF.
- [ ] Confirm review fields.
- [ ] Generate PDF.
- [ ] Publish link.
- [ ] Open as insured client.
- [ ] Confirm WhatsApp CTA remains visible.


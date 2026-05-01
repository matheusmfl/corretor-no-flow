---
id: TASK-0011
title: Desenhar contrato modular para extras por seguradora no AutoQuoteData
status: todo
kind: discovery
lifecycle: open
area: types
owner: codex
reviewer: human
complexity: medium
risk: medium
tdd_required: false
created_at: 2026-05-01
---

# TASK-0011 - Desenhar contrato modular para extras por seguradora no AutoQuoteData

## Context

`AutoQuoteData` is the shared contract used by extraction, review, PDF generation, and public link. Porto Seguro exposes useful extra information such as Porto Bank discounts, legal defense, combined home coverage, benefits, anti-theft devices, and vehicle usage.

We should not expand the MVP implementation with every Porto-specific field immediately, but the data model should have a clear path for insurer-specific extras.

## Objective

Design a small, safe contract proposal for insurer-specific extras in AUTO quotes without breaking the common AUTO core.

## Scope

- Review current `AutoQuoteData`.
- Propose how insurer-specific extras should be represented.
- Decide whether extras should be typed by insurer, generic key/value, or a hybrid.
- Define what belongs in common AUTO core vs Porto extras.
- Document compatibility rules for API, dashboard review, PDF, and public link.

## Out Of Scope

- Do not implement code changes.
- Do not change Prisma schema.
- Do not change extraction prompts.
- Do not change UI.

## Likely Files

- `packages/types/src/quote.types.ts`
- `.ai/discovery/PORTO-FAMILY-AUTO.md`
- `.ai/discovery/AUTOQUOTE-EXTRAS-CONTRACT.md`

## TDD Requirement

No implementation in this task. If this becomes a types/API change later, backend tests become mandatory.

## Acceptance Criteria

- [ ] A proposal document exists for AUTO insurer extras.
- [ ] Common core fields are separated from insurer-specific fields.
- [ ] Porto extras are listed and categorized.
- [ ] Recommendation exists for first implementation approach.
- [ ] Risks for frontend/PDF/public-link compatibility are documented.

## Risks

- Too much flexibility can make downstream UI unreliable.
- Too much strict typing too early can slow insurer expansion.

## Failure Scenario

Each insurer starts adding random JSON fields and the dashboard/PDF cannot safely display or validate quote data.

## Human QA Checklist

- [ ] Human confirms the proposed split between core and extras makes product sense.
- [ ] Codex can create follow-up implementation tasks from the proposal.

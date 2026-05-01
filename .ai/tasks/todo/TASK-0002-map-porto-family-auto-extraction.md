---
id: TASK-0002
title: Mapear estrategia de extracao AUTO familia Porto
status: todo
kind: discovery
lifecycle: open
area: product
owner: codex
reviewer: human
complexity: medium
risk: medium
tdd_required: false
created_at: 2026-04-30
---

# TASK-0002 - Mapear estrategia de extracao AUTO familia Porto

## Context

AUTO currently has a mature Bradesco path. The next insurer group is Porto Seguro, Itau, Sompo, and Azul. These PDFs are expected to be very similar because they belong to the Porto family.

## Objective

Create a technical/product mapping that defines what can be shared across Porto-family PDF extraction and what must be insurer-specific.

## Scope

- Collect or identify sample PDFs needed for Porto, Itau, Sompo, and Azul.
- Compare PDF structure against the current `AutoQuoteData`.
- Define shared extraction fields and insurer-specific exceptions.
- Define test expectations before implementation.
- Recommend the first implementation slice for Porto Seguro.

## Out Of Scope

- Do not implement parser or prompt changes.
- Do not change Prisma schema.
- Do not change dashboard UI.

## Likely Files

- `.ai/roadmap/PRE-SALE-V1.md`
- `.ai/discovery/porto-family-auto.md`
- `packages/types/src/quote.types.ts`

## TDD Requirement

No backend implementation in this task. Future backend tasks must use TDD.

## Acceptance Criteria

- [ ] A mapping document exists for Porto-family AUTO.
- [ ] Required sample PDFs are listed.
- [ ] Shared vs insurer-specific extraction rules are identified.
- [ ] First Porto Seguro implementation task can be written without strategic ambiguity.

## Risks

- The PDFs may look similar visually but differ enough in payment tables or coverage naming to require separate parsers.

## Failure Scenario

Claude implements Porto as a one-off parser, then Itau/Sompo/Azul duplicate logic and create technical debt.

## Human QA Checklist

- [ ] Human confirms whether the listed sample PDFs are available.
- [ ] Human confirms Porto Seguro is still the first target.

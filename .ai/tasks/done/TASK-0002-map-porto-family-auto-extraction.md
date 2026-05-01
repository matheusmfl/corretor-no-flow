---
id: TASK-0002
title: Mapear estrategia de extracao AUTO familia Porto
status: done
kind: discovery
lifecycle: closed
area: product
owner: codex
reviewer: human
complexity: medium
risk: medium
tdd_required: false
created_at: 2026-04-30
---

# TASK-0002 - Mapear estrategia de extracao AUTO familia Porto

## Status

Discovery principal concluido em `.ai/discovery/PORTO-FAMILY-AUTO.md`.

A primeira fatia Porto Seguro foi definida e desdobrada nas tasks `TASK-0013` ate `TASK-0017`. A validacao de Itau, Sompo e Azul permanece dependente de PDFs reais futuros e deve virar discovery/task separada quando houver amostras.

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

- [x] A mapping document exists for Porto-family AUTO.
- [x] Required sample PDFs are listed.
- [x] Shared vs insurer-specific extraction rules are identified.
- [x] First Porto Seguro implementation task can be written without strategic ambiguity.

## Risks

- The PDFs may look similar visually but differ enough in payment tables or coverage naming to require separate parsers.

## Failure Scenario

Claude implements Porto as a one-off parser, then Itau/Sompo/Azul duplicate logic and create technical debt.

## Human QA Checklist

- [x] Human confirms whether the listed sample PDFs are available.
- [x] Human confirms Porto Seguro is still the first target.

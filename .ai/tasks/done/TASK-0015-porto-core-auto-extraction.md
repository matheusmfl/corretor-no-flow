---
id: TASK-0015
title: Implementar extracao core Porto AUTO para AutoQuoteData
status: done
kind: implementation
lifecycle: open
area: api
owner: claude
reviewer: codex
complexity: high
risk: high
tdd_required: true
created_at: 2026-05-01
blocked_by: TASK-0013,TASK-0014
---

# TASK-0015 - Implementar extracao core Porto AUTO para AutoQuoteData

## Context

The first Porto implementation should focus on the agreed MVP core fields, not all Porto-specific extras.

## Objective

Extract Porto Seguro AUTO core fields into the existing `AutoQuoteData` contract.

## Scope

Core fields:

- insurer.
- quote number.
- quote validity.
- policy/quote validity period.
- insured/client name.
- main driver.
- vehicle.
- plate.
- manufacture/model year.
- FIPE data when available.
- vehicle usage.
- bonus class.
- casco/comprehensive coverage.
- FIPE percentage.
- deductible type/value.
- premium total, net premium, IOF.
- RCF material and bodily damage.
- glass coverage summary.
- martelinho/reparo rapido summary.
- assistance/towing summary.
- payment methods from the deterministic parser.

## Out Of Scope

- Do not implement all Porto extras.
- Do not implement Itau/Sompo/Azul.
- Do not change frontend unless required by existing type compatibility.

## Likely Files

- `apps/api/src/modules/quotes/jobs/extract-pdf.processor.ts`
- `apps/api/src/modules/ai/**`
- `apps/api/src/modules/quotes/domain/schemas/auto-quote.schema.ts`
- `packages/types/src/quote.types.ts`

## TDD Requirement

Backend task. Add tests with Porto complete/incomplete fixtures before implementation.

## Acceptance Criteria

- [x] Porto complete fixture maps to valid `AutoQuoteData`.
- [x] Porto incomplete fixture maps to valid `AutoQuoteData`.
- [x] Payment methods come from deterministic parser.
- [x] Existing Bradesco tests still pass.
- [x] Uncertain extras are not forced into core fields.

## Risks

- Current `AutoQuoteData` may need small optional fields for usage/driver/bonus.
- AI may extract extras inconsistently if prompt is too broad.

## Failure Scenario

Porto extraction technically succeeds but maps Porto-only benefits into wrong common fields.

## Human QA Checklist

- [x] Compare extracted Porto core fields with the original PDF.
- [x] Confirm only useful MVP information appears in review/PDF/link.

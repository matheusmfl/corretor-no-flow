---
id: TASK-0016
title: Integrar Porto Seguro no fluxo de processamento
status: todo
kind: implementation
lifecycle: open
area: api
owner: claude
reviewer: codex
complexity: medium
risk: medium
tdd_required: true
created_at: 2026-05-01
blocked_by: TASK-0014,TASK-0015
---

# TASK-0016 - Integrar Porto Seguro no fluxo de processamento

## Context

After Porto parser/extraction works in isolation, the normal upload queue flow must route Porto Seguro quotes through the correct extraction behavior.

## Objective

Make `PORTO_SEGURO` work end-to-end in the existing async processing flow.

## Scope

- Configure Porto-specific extraction behavior.
- Ensure Porto uses deterministic payment parser.
- Ensure quote label/name is generated clearly.
- Preserve existing Bradesco behavior.
- Keep processing asynchronous.

## Out Of Scope

- Do not implement other Porto-family insurers.
- Do not redesign UI.

## Likely Files

- `apps/api/src/modules/quotes/jobs/extract-pdf.processor.ts`
- `apps/api/src/modules/quotes/application/services/**`
- `apps/api/src/modules/quotes/jobs/extract-pdf.processor.spec.ts`

## TDD Requirement

Backend task. Tests must cover routing behavior before implementation.

## Acceptance Criteria

- [ ] Porto upload job reaches Porto extraction path.
- [ ] Porto quote ends in `PENDING_REVIEW` with extracted data when successful.
- [ ] Failure path remains visible and safe.
- [ ] Bradesco behavior is unchanged.

## Risks

- Shared processor changes could regress Bradesco.

## Failure Scenario

Porto quotes are selected in the UI but processed with Bradesco assumptions.

## Human QA Checklist

- [ ] Upload Porto PDF through dashboard.
- [ ] Confirm process reaches review screen.
- [ ] Confirm Bradesco upload still works.


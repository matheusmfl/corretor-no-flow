---
id: TASK-0005
title: Criar score comercial por regras
status: todo
kind: implementation
lifecycle: open
area: api
owner: claude
reviewer: codex
complexity: medium
risk: medium
tdd_required: true
created_at: 2026-04-30
---

# TASK-0005 - Criar score comercial por regras

## Context

Tracking already records sessions, heartbeat, WhatsApp clicks, PDF downloads, and insurer views. The broker needs a simple interpretation of this behavior.

## Objective

Compute a deterministic commercial score for each quote process: cold, warm, or hot.

## Scope

- Add shared types for commercial score.
- Add score computation to process metrics.
- Use fixed event weights.
- Return short insight text for the broker.
- Keep all metrics isolated by process/company access patterns.

## Out Of Scope

- Do not add AI-generated insights.
- Do not send notifications.
- Do not change public UI tracking unless needed by existing event gaps.

## Likely Files

- `packages/types/src/tracking.types.ts`
- `apps/api/src/modules/quotes/application/use-cases/get-process-metrics.use-case.ts`
- `apps/api/src/modules/quotes/application/use-cases/get-process-metrics.use-case.spec.ts`

## TDD Requirement

Backend task. Tests must define score behavior before implementation.

Suggested first rule set:

- Base score from sessions and return visits.
- Strong boost for WhatsApp click.
- Medium boost for PDF download.
- Medium boost for viewing multiple insurers.
- Label: `cold` below 30, `warm` from 30 to 69, `hot` from 70 upward.

## Acceptance Criteria

- [ ] Metrics response includes score value, label, and insight.
- [ ] Tests cover cold, warm, and hot examples.
- [ ] Existing metrics fields remain backward compatible.
- [ ] No AI dependency is introduced.

## Risks

- Score may feel arbitrary until tuned with real outcomes.

## Failure Scenario

A client with a WhatsApp click and repeat visits is shown as cold, causing the broker to miss a hot opportunity.

## Human QA Checklist

- [ ] Open a quote link once and check score.
- [ ] Open multiple times and click WhatsApp.
- [ ] Confirm drawer shows a more urgent score/insight.

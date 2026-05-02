---
id: TASK-0005
title: Criar score comercial por regras
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

# TASK-0005 - Criar score comercial por regras

## Context

Tracking already records sessions, heartbeat, WhatsApp clicks, PDF downloads, and insurer views. The broker needs a simple interpretation of this behavior.

This task was originally written as backend implementation. The direction is valid, but the first rule set and thresholds are still arbitrary. It should now be treated as discovery before implementation.

## Objective

Define a deterministic commercial score v0 for each quote process: cold, warm, or hot.

## Scope

- Fill `.ai/discovery/COMMERCIAL-SCORE-RULES-V0.md`.
- Confirm which tracking events exist and are reliable today.
- Define score inputs, weights/rules, and thresholds.
- Define short insight text examples for the broker.
- Define test scenarios for a future backend task.
- Decide which metrics stay as separate insights instead of entering the score.

## Out Of Scope

- Do not implement backend score calculation in this task.
- Do not add AI-generated insights.
- Do not send notifications.
- Do not change public UI tracking.

## Likely Files

- `.ai/discovery/COMMERCIAL-SCORE-RULES-V0.md`
- `packages/types/src/tracking.types.ts`
- `apps/api/src/modules/quotes/application/use-cases/get-process-metrics.use-case.ts`

## TDD Requirement

No implementation in this task. A future backend task must use TDD.

## Acceptance Criteria

- [ ] Discovery document lists reliable tracking events for score v0.
- [ ] Score thresholds/rules are defined.
- [ ] Insight text examples are defined.
- [ ] Cold, warm, and hot test scenarios are specified.
- [ ] Follow-up backend implementation task can be written without arbitrary product decisions.

## Risks

- Score may feel arbitrary until tuned with real outcomes.

## Failure Scenario

A client with a WhatsApp click and repeat visits is shown as cold, causing the broker to miss a hot opportunity.

## Human QA Checklist

- [ ] Human confirms the score labels feel commercially useful.
- [ ] Human confirms which event should make a lead hot.

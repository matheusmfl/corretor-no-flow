---
id: TASK-0006
title: Criar status comercial e base da agenda de renovacao
status: todo
kind: implementation
lifecycle: open
area: api
owner: claude
reviewer: codex
complexity: high
risk: high
tdd_required: true
created_at: 2026-04-30
---

# TASK-0006 - Criar status comercial e base da agenda de renovacao

## Context

The broker needs to mark whether a quote became a sale, was lost, is still negotiating, or received no response. This outcome should feed an internal agenda for renewal or future follow-up.

## Objective

Add the backend foundation for manual sales outcome and internal agenda items.

## Scope

- Add commercial status: `NEGOTIATING`, `WON`, `LOST`, `NO_RESPONSE`.
- Add an internal agenda/opportunity model linked to company and quote process.
- When a process is marked `WON`, create a renewal agenda item using policy/validity date when available.
- When marked `LOST` or `NO_RESPONSE`, create a future follow-up opportunity.
- Add API endpoints/use-cases to update outcome and list agenda items.

## Out Of Scope

- Do not message the insured client.
- Do not integrate WhatsApp/email notifications.
- Do not build full CRM.
- Do not build the final dashboard UI unless split into a later frontend task.

## Likely Files

- `apps/api/prisma/schema.prisma`
- `packages/types/src/**`
- `apps/api/src/modules/quotes/**`

## TDD Requirement

Backend task. Tests must define status transition and agenda creation before implementation.

Minimum tests:

- Marking `WON` creates a renewal agenda item.
- Marking `LOST` creates a follow-up opportunity.
- Marking `NO_RESPONSE` creates a follow-up opportunity.
- Company isolation is enforced.

## Acceptance Criteria

- [ ] Commercial status can be saved for a process.
- [ ] Agenda items are created according to status.
- [ ] Agenda list is scoped by company.
- [ ] Tests pass.
- [ ] No customer-facing notifications are sent.

## Risks

- Missing policy validity date can make renewal scheduling inaccurate.

## Failure Scenario

A broker marks a sale as won but no renewal reminder is created, losing the future renewal opportunity.

## Human QA Checklist

- [ ] Mark one quote process as won.
- [ ] Confirm an internal renewal item exists.
- [ ] Mark another as lost.
- [ ] Confirm a future follow-up item exists.

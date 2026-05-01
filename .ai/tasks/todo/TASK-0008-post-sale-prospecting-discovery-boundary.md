---
id: TASK-0008
title: Manter pos-venda e prospeccao como discovery separado
status: todo
kind: documentation
lifecycle: open
area: product
owner: codex
reviewer: human
complexity: low
risk: low
tdd_required: false
created_at: 2026-04-30
---

# TASK-0008 - Manter pos-venda e prospeccao como discovery separado

## Context

Post-sale and prospecting are valuable but large enough to distract from Pre-Sale V1.

## Objective

Keep post-sale and prospecting documented as future discovery tracks without creating implementation tasks yet.

## Scope

- Maintain `.ai/discovery/POST-SALE-DISCOVERY.md`.
- Maintain `.ai/discovery/PROSPECTING-DISCOVERY.md`.
- Add future ideas there instead of mixing them into active V1 tasks.

## Out Of Scope

- Do not implement portal, emergency flow, AI triage, email marketing, or landing pages.
- Do not change database schema for post-sale.

## Likely Files

- `.ai/discovery/POST-SALE-DISCOVERY.md`
- `.ai/discovery/PROSPECTING-DISCOVERY.md`

## TDD Requirement

No code in this task.

## Acceptance Criteria

- [ ] Post-sale ideas are documented separately.
- [ ] Prospecting ideas are documented separately.
- [ ] Pre-Sale V1 roadmap remains focused.

## Risks

- If discovery ideas become implementation tasks too early, the V1 scope becomes too wide.

## Failure Scenario

The project starts implementing portal, content marketing, and insurer expansion at the same time, slowing down the core quote product.

## Human QA Checklist

- [ ] Human confirms the documents capture the future vision.
- [ ] Human confirms these tracks are not active implementation scope.

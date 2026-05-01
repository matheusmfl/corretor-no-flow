---
id: TASK-0007
title: Completar mapeamento humano do ramo Saude
status: todo
kind: human
lifecycle: open
area: product
owner: human
reviewer: codex
complexity: medium
risk: medium
tdd_required: false
created_at: 2026-04-30
---

# TASK-0007 - Completar mapeamento humano do ramo Saude

## Context

Health quotes have different comparison logic from Auto. Implementation should not start before the product mapping is clear.

## Objective

Fill `.ai/discovery/HEALTH-MAPPING.md` with real examples and rules.

## Scope

- Review real Health quote PDFs.
- Map important fields.
- Define comparison questions.
- Write client-facing plain-language examples.
- Mark legally or commercially sensitive fields.

## Out Of Scope

- Do not implement Health schema.
- Do not change extraction prompts.
- Do not create Health UI yet.

## Likely Files

- `.ai/discovery/HEALTH-MAPPING.md`

## TDD Requirement

No code in this task.

## Acceptance Criteria

- [ ] At least 3 real Health quote PDFs are reviewed.
- [ ] Required extraction fields are documented.
- [ ] Comparison rules are documented.
- [ ] Client-facing language examples are written.
- [ ] First Health insurer target is chosen.

## Risks

- Health comparisons can be misleading if network, coparticipation, and waiting periods are oversimplified.

## Failure Scenario

The system compares Health only by monthly price and hides important tradeoffs from the insured client.

## Human QA Checklist

- [ ] Human confirms the mapping reflects real broker sales conversation.
- [ ] Codex reviews the mapping before technical tasks are created.

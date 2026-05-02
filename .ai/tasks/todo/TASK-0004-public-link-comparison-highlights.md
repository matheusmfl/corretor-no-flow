---
id: TASK-0004
title: Adicionar destaques de comparacao no link publico
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

# TASK-0004 - Adicionar destaques de comparacao no link publico

## Context

The public link currently shows quote cards. It should become more useful for conversion by highlighting comparison points without making unsafe absolute recommendations.

This task was originally written as an implementation task, but it still contains product decisions. It should now be treated as discovery before Claude implements frontend changes.

## Objective

Define a safe comparison-highlight contract for AUTO public links and prepare one or more small implementation tasks.

## Scope

- Fill `.ai/discovery/PUBLIC-LINK-COMPARISON-HIGHLIGHTS.md`.
- Define which fields enter the first V1 of comparison highlights.
- Define safe wording for each highlight.
- Define behavior for one quote, multiple insurers, and multiple franchise options from the same insurer.
- Define how missing/incomplete fields should be handled.
- Decide whether coverage richness depends on `TASK-0022`.
- Produce a follow-up implementation task only after the rules are clear.

## Out Of Scope

- Do not implement frontend changes in this task.
- Do not implement AI recommendations.
- Do not claim one quote is the best overall.
- Do not change backend extraction.

## Likely Files

- `.ai/discovery/PUBLIC-LINK-COMPARISON-HIGHLIGHTS.md`
- `.ai/discovery/AUTOQUOTE-EXTRAS-CONTRACT.md`
- `.ai/discovery/PORTO-FAMILY-AUTO.md`
- `.ai/tasks/todo/**`

## TDD Requirement

No implementation in this task.

## Acceptance Criteria

- [ ] Discovery document defines first V1 comparison fields.
- [ ] Discovery document defines safe client-facing wording.
- [ ] One-quote and multiple-quote behaviors are clear.
- [ ] Multiple options from the same insurer are handled conceptually.
- [ ] Follow-up implementation task can be written without product ambiguity.

## Risks

- Overstating a recommendation could create sales or compliance risk.

## Failure Scenario

The page says a quote is "the best" even though it is only cheapest, leading the insured client to misunderstand coverage tradeoffs.

## Human QA Checklist

- [ ] Human confirms the selected comparison fields are commercially useful.
- [ ] Human confirms wording is safe and not too assertive.

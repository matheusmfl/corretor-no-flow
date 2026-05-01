---
id: TASK-0013
title: Criar fixtures Porto AUTO completo e incompleto
status: todo
kind: implementation
lifecycle: open
area: api
owner: claude
reviewer: codex
complexity: low
risk: low
tdd_required: true
created_at: 2026-05-01
---

# TASK-0013 - Criar fixtures Porto AUTO completo e incompleto

## Context

Porto Seguro implementation must be tested against both the incomplete and complete PDF variants already extracted in the PDF lab.

## Objective

Create safe test fixtures from the Porto complete and incomplete extraction outputs so parser/extraction tests can run without depending on raw PDFs.

## Scope

- Use the existing PDF lab output as reference.
- Create text fixtures for Porto complete and incomplete PDFs.
- Keep sensitive data minimized or sanitized where practical.
- Add a basic test that loads both fixtures successfully.

## Out Of Scope

- Do not implement extraction logic yet.
- Do not implement payment parser yet.
- Do not commit raw PDF files.

## Likely Files

- `apps/api/src/modules/quotes/application/services/**`
- `apps/api/test/mocks/**`
- `.ai/pdf-lab/output/auto_porto_seguro_completa_incompleta.md`

## TDD Requirement

Backend task. Add fixture-loading tests before parser implementation.

## Acceptance Criteria

- [ ] Porto complete text fixture exists.
- [ ] Porto incomplete text fixture exists.
- [ ] Fixtures do not require raw PDFs.
- [ ] A test confirms fixtures can be loaded.
- [ ] No raw PDF is committed.

## Risks

- Fixtures may retain sensitive real customer data if not sanitized.

## Failure Scenario

Future parser tests depend on local ignored PDF lab files and fail on another machine.

## Human QA Checklist

- [ ] Confirm raw PDFs remain only in ignored PDF lab input.
- [ ] Confirm fixture names clearly identify complete vs incomplete.


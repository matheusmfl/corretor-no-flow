---
id: TASK-0001
title: Corrigir filename do PDF gerado
status: todo
area: api
owner: claude
reviewer: codex
complexity: low
risk: medium
tdd_required: true
created_at: 2026-04-30
---

# TASK-0001 - Corrigir filename do PDF gerado

## Context

The generated quote PDF filename currently uses the extracted vehicle name incorrectly. For a vehicle like `Jeep Compass Turbo 4x4 Diesel`, the filename can become something like `Bradesco_Turbo_Reduzida`, losing the brand and model that make the file recognizable to the broker.

## Objective

Generate a predictable, broker-friendly filename using insurer, vehicle brand, vehicle model, and franchise type.

Expected example:

```txt
Bradesco_Jeep_Compass_Reduzida.pdf
```

## Scope

- Find the filename builder used for generated quote PDFs.
- Adjust vehicle-name handling to keep the first two meaningful words: brand + model.
- Preserve existing sanitization rules for filesystem-safe filenames.
- Preserve existing fallback behavior, or improve it if tests document the expected fallback clearly.

## Out Of Scope

- Do not change PDF layout.
- Do not change quote extraction prompts.
- Do not change public link behavior.
- Do not refactor unrelated quote generation code.

## Likely Files

- `apps/api/src/modules/quotes/**`
- Any existing test file near the PDF generation or filename helper

## TDD Requirement

This is backend work and must follow TDD.

Start by adding or updating unit tests for the filename helper before changing the implementation.

Minimum test cases:

- Vehicle with four or more words keeps only first two words.
- Vehicle with exactly two words keeps both words.
- Vehicle with one word does not produce `undefined` or an empty segment.
- Franchise type remains present in the filename.

## Acceptance Criteria

- [ ] `Jeep Compass Turbo 4x4 Diesel` generates a filename containing `Jeep_Compass`.
- [ ] A one-word vehicle name generates a safe fallback without `undefined`.
- [ ] Franchise type remains in the filename.
- [ ] Relevant unit tests exist and pass.
- [ ] No unrelated quote generation behavior changes.

## Risks

- If the extracted vehicle name is incomplete or malformed, the filename may still be less descriptive.
- If tests lock in the wrong fallback behavior, later extraction improvements may need small adjustments.

## Failure Scenario

A broker downloads several generated PDFs and cannot identify which car or franchise each file belongs to because the filename kept an irrelevant middle token instead of the vehicle brand and model.

## Human QA Checklist

- [ ] Generate a PDF from a Bradesco Auto quote with vehicle `Jeep Compass Turbo 4x4 Diesel`.
- [ ] Confirm the downloaded filename includes `Bradesco`, `Jeep`, `Compass`, and the franchise type.
- [ ] Confirm the PDF content still renders normally.


---
id: TASK-0009
title: Mapear renovacao bonus e uso do veiculo no PDF Bradesco
status: todo
kind: discovery
lifecycle: open
area: product
owner: claude
reviewer: codex
complexity: low
risk: medium
tdd_required: false
created_at: 2026-05-01
---

# TASK-0009 - Mapear renovacao bonus e uso do veiculo no PDF Bradesco

## Context

Bradesco AUTO PDFs may contain additional useful fields that are not currently part of the extracted product view: renewal insurer, insurance bonus class, and vehicle usage type such as personal or commercial use.

These fields may improve quote review, comparison, renewal workflows, and broker confidence.

## Objective

Use the PDF extraction lab to identify whether Bradesco PDFs expose renewal insurer, bonus class, and vehicle usage type, and document where/how these fields appear.

## Scope

- Run `npm run pdf:extract` against available Bradesco AUTO PDFs.
- Search the generated Markdown/JSON for renewal-related text.
- Search for bonus information.
- Search for vehicle usage information.
- Document exact labels/terms found in the PDF text.
- Recommend whether each field should be added to `AutoQuoteData` now, later, or ignored.

## Out Of Scope

- Do not change extraction code.
- Do not change schema/types.
- Do not change PDF template.
- Do not implement renewal automation.

## Likely Files

- `.ai/pdf-lab/input`
- `.ai/pdf-lab/output`
- `.ai/discovery/BRADESCO-AUTO-EXTRA-FIELDS.md`
- `packages/types/src/quote.types.ts`

## TDD Requirement

No backend implementation in this task. If later converted into extraction work, backend TDD becomes mandatory.

## Acceptance Criteria

- [ ] Bradesco PDF extraction output is generated.
- [ ] Renewal insurer field is found or explicitly marked not found.
- [ ] Bonus class field is found or explicitly marked not found.
- [ ] Vehicle usage type is found or explicitly marked not found.
- [ ] Recommendation exists for each field: add now, add later, or ignore.
- [ ] Findings are documented in `.ai/discovery/BRADESCO-AUTO-EXTRA-FIELDS.md`.

## Risks

- These fields may exist in some Bradesco PDFs but not all.
- The labels may vary by quote type or renewal scenario.
- Adding them too early to the public PDF may expose irrelevant broker-only data.

## Failure Scenario

The system ignores renewal and bonus data that could later drive renewal reminders or improve quote context for the broker.

## Human QA Checklist

- [ ] Human provides at least one Bradesco renewal quote PDF if available.
- [ ] Human confirms whether bonus and usage are commercially relevant for the broker-facing review screen.

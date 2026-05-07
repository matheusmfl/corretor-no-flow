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

After the Tokio Marine coverage enrichment work in `TASK-0044`, this Bradesco discovery should also look for richer coverage/service details that can reuse the same `coverageDetails` pattern:

- assistance plan and towing km;
- glass tier/details;
- replacement vehicle details;
- martelinho/reparo rapido;
- lataria/pintura or equivalent repair services;
- roda/pneu/suspensao or equivalent;
- repair shop type and parts type;
- static tooltip/catalog information that should be modeled as insurer knowledge, not expected in the generated PDF.

This does not mean implementing Bradesco in this task. It means documenting whether the Bradesco PDFs expose equivalent fields and whether a follow-up implementation can reuse the Tokio structure safely.

## Objective

Use the PDF extraction lab to identify whether Bradesco PDFs expose renewal insurer, bonus class, vehicle usage type, and richer service/coverage details. Document where/how these fields appear and recommend follow-up implementation scope.

## Scope

- Run `npm run pdf:extract` against available Bradesco AUTO PDFs.
- Search the generated Markdown/JSON for renewal-related text.
- Search for bonus information.
- Search for vehicle usage information.
- Search for coverage/service details that can populate `coverageDetails`.
- Identify which fields are extracted facts vs insurer catalog/tooltips.
- Document exact labels/terms found in the PDF text.
- Recommend whether each field should be added to `AutoQuoteData` now, later, or ignored.

## Out Of Scope

- Do not change extraction code.
- Do not change schema/types.
- Do not change PDF template.
- Do not implement renewal automation.
- Do not implement Bradesco rich coverage extraction/rendering yet.
- Do not create Bradesco-specific fields inside `coverage.assistance`; prefer the `coverageDetails` pattern proven in Tokio.

## Likely Files

- `.ai/pdf-lab/input`
- `.ai/pdf-lab/output`
- `.ai/discovery/BRADESCO-AUTO-EXTRA-FIELDS.md`
- `packages/types/src/quote.types.ts`
- `.ai/tasks/review/TASK-0044-enrich-tokio-coverage-display-details.md`
- `.ai/discovery/AUTOQUOTE-EXTRAS-CONTRACT.md`

## TDD Requirement

No backend implementation in this task. If later converted into extraction work, backend TDD becomes mandatory.

## Acceptance Criteria

- [ ] Bradesco PDF extraction output is generated.
- [ ] Renewal insurer field is found or explicitly marked not found.
- [ ] Bonus class field is found or explicitly marked not found.
- [ ] Vehicle usage type is found or explicitly marked not found.
- [ ] Bradesco service/coverage fields equivalent to Tokio `coverageDetails` are found or explicitly marked not found.
- [ ] Discovery distinguishes PDF-extracted facts from static insurer catalog/tooltips.
- [ ] Recommendation exists for each field: add now, add later, or ignore.
- [ ] Findings are documented in `.ai/discovery/BRADESCO-AUTO-EXTRA-FIELDS.md`.
- [ ] Follow-up implementation task can be created from the findings if evidence is sufficient.

## Risks

- These fields may exist in some Bradesco PDFs but not all.
- The labels may vary by quote type or renewal scenario.
- Adding them too early to the public PDF may expose irrelevant broker-only data.
- Bradesco may express similar services with different commercial labels than Tokio.
- Some benefits may exist only in Bradesco portal/help text, not in the PDF; those must be treated as static catalog knowledge.

## Failure Scenario

The system ignores renewal and bonus data that could later drive renewal reminders or improve quote context for the broker.

## Human QA Checklist

- [ ] Human provides at least one Bradesco renewal quote PDF if available.
- [ ] Human confirms whether bonus and usage are commercially relevant for the broker-facing review screen.

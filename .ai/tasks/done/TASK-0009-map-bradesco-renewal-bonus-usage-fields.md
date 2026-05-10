---
id: TASK-0009
title: Mapear renovacao bonus e uso do veiculo no PDF Bradesco
status: done
kind: discovery
lifecycle: closed
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

Human update on 2026-05-08:

- Bradesco Auto should be treated as a product family with mutable catalog options, not a fixed one-time enum.
- Current target products are Tradicional, Bradesco Seguro Auto Classic (exclusive for account holders), and Seguro Auto Lar + Residencial.
- Motorcycle, truck, and Auto Lar Caminhao are out of this cycle.
- Assistance options change over time; example from human memory: an 800 km assistance option existed before but is not in the current visible list.
- When `Logomarca` is selected, glass plan names/codes change, e.g. `Vidro Protegido Plus (024)` becomes a Logomarca-specific variant like `Vidro Protegido Plus Logomarca (151)`.

## Objective

Use the PDF extraction lab to identify whether Bradesco PDFs expose renewal insurer, bonus class, vehicle usage type, and richer service/coverage details. Document where/how these fields appear and recommend follow-up implementation scope.

## Scope

- Build a Bradesco Auto products inventory with human input before extracting PDFs (see `Bradesco Products Inventory` below).
- Run `npm run pdf:extract` against available Bradesco AUTO PDFs.
- Search the generated Markdown/JSON for renewal-related text.
- Search for bonus information.
- Search for vehicle usage information.
- Search for coverage/service details that can populate `coverageDetails`.
- Identify which fields are extracted facts vs insurer catalog/tooltips.
- Document exact labels/terms found in the PDF text.
- Map each PDF sample to a known Bradesco product/variant from the inventory.
- Recommend whether each field should be added to `AutoQuoteData` now, later, or ignored.
- Document catalog fields as versionable insurer knowledge when they come from the cotador/portal rather than from the PDF.
- Preserve PDF-extracted labels/codes as raw facts so future Bradesco catalog changes require minimal code churn.

## Out Of Scope

- Do not change extraction code.
- Do not change schema/types.
- Do not change PDF template.
- Do not implement renewal automation.
- Do not implement Bradesco rich coverage extraction/rendering yet.
- Do not create Bradesco-specific fields inside `coverage.assistance`; prefer the `coverageDetails` pattern proven in Tokio.

## Bradesco Products Inventory

Before running the PDF lab, list which Bradesco Auto products commercially exist and which ones the brokers using the system actually work with. Without this, findings risk being generalized from a single sample that does not represent a typical product.

Reference pattern from previous insurers:

- Tokio Marine has 5 mapped products (`Auto`, `Auto Classico`, `Auto Roubo + Rastreador`, `Auto Protecao Mensal`, `Assistencia Exclusiva`) - documented in `.ai/discovery/TOKIO-MARINE-AUTO.md`.
- Porto Seguro has a mapped family (Porto, Itau, Mitsui Sumitomo, Azul) - documented in `.ai/discovery/PORTO-FAMILY-AUTO.md`.
- Bradesco currently has no equivalent inventory.

Inventory must answer:

- Which Bradesco Auto products/plans exist commercially (e.g., variants like Total, Compreensivo, Roubo+Furto, etc.)?
- Which products are actually used by the brokers using the system?
- Are there obvious differences between products that change coverage display (e.g., glass included in Total but not in Compreensivo)?
- Are there monthly/reduced-coverage variants similar to Tokio `Protecao Mensal` that need different field handling?
- Which option labels/codes are PDF facts and which ones are current catalog knowledge from the cotador.
- Whether product and assistance catalogs should be represented as open labels/codes rather than closed enums.

The inventory should be filled in `.ai/discovery/BRADESCO-AUTO-EXTRA-FIELDS.md` under the `Bradesco Products Inventory` section. Each PDF sample analyzed later must reference one of these products by name.

Inventory is human input. The executor should request it from the human if it is not yet filled in the discovery doc.

## Execution Command

Expected input folder:

```powershell
.ai\pdf-lab\input\bradesco
```

Preferred command:

```powershell
npm run pdf:extract -- --input-dir .ai/pdf-lab/input/bradesco --output-name auto_bradesco_extra_fields --insurer bradesco --variant extra_fields --include-items
```

Fallback used when local/global `npm` is broken:

```powershell
& 'C:\Users\mathe\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' .ai\scripts\extract-pdf-lab.mjs --input-dir .ai/pdf-lab/input/bradesco --output-name auto_bradesco_extra_fields --insurer bradesco --variant extra_fields --include-items
```

Current generated outputs:

- `.ai/pdf-lab/output/auto_bradesco_extra_fields.md`
- `.ai/pdf-lab/output/auto_bradesco_extra_fields.json`

Current analyzed samples:

- `Bradesco-auto-residencial.pdf` -> `1776 - SEGURO AUTO LAR`
- `bradesco-auto-classic.pdf` -> `1583 - BRADESCO SEGURO AUTO CLASSIC`
- `bradesco-auto-tradicional-completo.pdf` -> `Tradicional`

## Likely Files

- `.ai/pdf-lab/input`
- `.ai/pdf-lab/output`
- `.ai/discovery/BRADESCO-AUTO-EXTRA-FIELDS.md`
- `.ai/discovery/TOKIO-MARINE-AUTO.md` (reference pattern)
- `.ai/discovery/PORTO-FAMILY-AUTO.md` (reference pattern)
- `packages/types/src/quote.types.ts`
- `.ai/tasks/done/TASK-0044-enrich-tokio-coverage-display-details.md`
- `.ai/discovery/AUTOQUOTE-EXTRAS-CONTRACT.md`

## TDD Requirement

No backend implementation in this task. If later converted into extraction work, backend TDD becomes mandatory.

## Acceptance Criteria

- [ ] Bradesco Products Inventory is filled in the discovery doc with at least the products the active brokers use.
- [ ] Each Bradesco PDF sample used in the discovery is mapped to a product from the inventory.
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

- [ ] Human fills the Bradesco Products Inventory section in the discovery doc, or confirms the list provided by the executor.
- [ ] Human places at least one Bradesco Auto PDF in `.ai/pdf-lab/input/bradesco/` covering each main product the brokers use.
- [ ] Human provides at least one Bradesco renewal quote PDF if available.
- [ ] Human confirms whether bonus and usage are commercially relevant for the broker-facing review screen.
- [ ] Human reviews the Findings before the follow-up implementation task is opened.

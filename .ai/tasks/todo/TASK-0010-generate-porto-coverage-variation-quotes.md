---
id: TASK-0010
title: Gerar cotacoes Porto com variacoes de cobertura
status: todo
kind: human
lifecycle: open
area: product
owner: human
reviewer: codex
complexity: medium
risk: low
tdd_required: false
created_at: 2026-05-01
priority: low
---

# TASK-0010 - Gerar cotacoes Porto com variacoes de cobertura

## Context

Porto Seguro allows many coverage and assistance variations. Before implementation, we need to know whether these variations only change price or also introduce new text/fields that should be preserved in extraction, review, PDF, or public link.

## Objective

Generate Porto AUTO quotes with different coverage configurations and compare what changes in the printed PDFs.

## Scope

Generate sample quotes varying:

- Reboque/guincho.
- Ambulancia, if available.
- Taxi or mobility credits.
- Carro reserva duration and vehicle class.
- Vidros completo vs not contracted.
- Martelinho de Ouro.
- Oficina referenciada vs livre escolha.
- Franquia percentages.
- Danos morais e esteticos.
- APP.

## Out Of Scope

- Do not implement parser changes.
- Do not create technical extraction tasks until PDFs are extracted and compared.

## Likely Files

- `.ai/pdf-lab/input/porto-seguro`
- `.ai/pdf-lab/output`
- `.ai/discovery/PORTO-FAMILY-AUTO.md`

## TDD Requirement

No code in this task.

## Acceptance Criteria

- [ ] At least 3 Porto PDFs with different coverage combinations are generated.
- [ ] Each PDF is labeled by variant before extraction.
- [ ] PDF lab extraction is run for each variant or batch.
- [ ] Differences are documented in `.ai/discovery/PORTO-FAMILY-AUTO.md`.
- [ ] Codex can decide which variations require technical tasks.

## Risks

- Cotador UI may show coverage options that do not appear clearly in the printed PDF.
- Some options may only affect price, not extracted text.

## Failure Scenario

We implement Porto extraction using one simple PDF and later discover that common coverage variations produce different text structures.

## Human QA Checklist

- [ ] Human confirms each generated PDF variant name.
- [ ] Human confirms whether each variation matters for client-facing output.

---
id: TASK-0012
title: Mapear extras Porto para backlog posterior
status: todo
kind: discovery
lifecycle: closed
area: product
owner: codex
reviewer: human
complexity: low
risk: low
tdd_required: false
created_at: 2026-05-01
---

# TASK-0012 - Mapear extras Porto para backlog posterior

## Status

Discovery fechado com classificacao inicial em `.ai/discovery/PORTO-EXTRAS-BACKLOG.md`.

## Context

Porto Seguro PDFs and cotador screens expose useful information beyond the current AUTO core. These extras may become valuable later, but should not block the first Porto implementation.

## Objective

Create a categorized backlog of Porto-specific extras and decide which are broker-facing, client-facing, future-tier, or ignored.

## Scope

Categorize at least:

- Porto Bank discounts and payment benefits.
- Legal defense coverage.
- Combined home coverage.
- Benefits and free services.
- Anti-theft device.
- Vehicle usage.
- Main driver vs insured.
- Fiscal exemption.
- Kit gas.
- PCD.
- Tracker/rastreador.
- Office type and repair network.
- Martelinho/Supermartelinho.
- Car replacement options.
- Glass coverage details.

## Out Of Scope

- Do not implement extraction.
- Do not change schema.
- Do not change public link or PDF.

## Likely Files

- `.ai/discovery/PORTO-FAMILY-AUTO.md`
- `.ai/discovery/PORTO-EXTRAS-BACKLOG.md`

## TDD Requirement

No code in this task.

## Acceptance Criteria

- [ ] Porto extras backlog document exists.
- [ ] Each extra is categorized as core now, broker review, client output, future tier, or ignore.
- [ ] Each extra has a short reason.
- [ ] Follow-up implementation tasks can be created later.

## Risks

- Important sales details may be ignored if not categorized now.

## Failure Scenario

Porto core extraction ships, but later the team forgets which extras were discovered and why they mattered.

## Human QA Checklist

- [ ] Human reviews categories and corrects commercial importance.
- [ ] Human marks which extras matter most to real brokers.

---
id: TASK-0014
title: Implementar parser deterministico de pagamentos Porto
status: done
kind: implementation
lifecycle: open
area: api
owner: claude
reviewer: codex
complexity: high
risk: high
tdd_required: true
created_at: 2026-05-01
blocked_by: TASK-0013
---

# TASK-0014 - Implementar parser deterministico de pagamentos Porto

## Context

Porto payment tables mix methods, installments, discounts, interest, and Porto Bank rules. AI-only extraction is too risky for payment values.

## Objective

Parse Porto Seguro payment methods deterministically from extracted PDF text into `AutoQuoteData.paymentMethods`.

## Scope

Support initial methods:

- Cartao de Credito Porto Bank (Aquisicao).
- Cartao de Credito Porto Bank sem desconto (Outro Titular).
- Cartao de Credito - Demais Bandeiras.
- Debito C. Corrente.
- Boleto / Demais Carne.
- Boleto / Demais C. Corrente.
- Debito C. Corrente / Demais Carne.
- Boleto a vista com desconto.

For each installment, parse:

- number.
- amount.
- total when safely calculable.
- whether it is interest-free or has interest.
- discount text when available.

## Out Of Scope

- Do not implement full Porto extraction prompt.
- Do not change public UI.
- Do not parse Itau/Sompo/Azul yet.

## Likely Files

- `apps/api/src/modules/quotes/application/services/porto-payment-parser.ts`
- `apps/api/src/modules/quotes/application/services/porto-payment-parser.spec.ts`
- Porto fixtures from `TASK-0013`

## TDD Requirement

Backend task. Write parser tests before implementation.

Minimum tests:

- Porto Bank acquisition parses 1x to 12x.
- Demais bandeiras handles missing 11x/12x when represented by `-`.
- Debit/boleto methods preserve interest indicators.
- Complete and incomplete fixtures both parse without inventing values.

## Acceptance Criteria

- [x] Payment parser returns valid `paymentMethods`.
- [x] Tests cover complete and incomplete Porto fixtures.
- [x] Parser fails safely or skips uncertain rows instead of inventing values.
- [x] Bradesco payment parser remains unchanged.

## Risks

- PDF text order may vary by variant.
- Interest totals may not always be safely calculable.

## Failure Scenario

The public link shows a wrong installment amount, causing the broker to quote incorrect payment terms.

## Human QA Checklist

- [x] Compare parsed payment values against the Porto PDF.
- [x] Confirm Porto Bank discount/payment options are understandable.

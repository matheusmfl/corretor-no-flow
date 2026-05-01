---
id: TASK-0020
title: Investigar latencia de extracao Bradesco vs Porto e uso de IA
status: todo
kind: implementation
lifecycle: open
area: api
owner: claude
reviewer: codex
complexity: medium
risk: medium
tdd_required: true
created_at: 2026-05-01
---

# TASK-0020 - Investigar latencia de extracao Bradesco vs Porto e uso de IA

## Context

Na QA, Bradesco processou bem mais devagar que Porto. Tambem surgiu a duvida se Porto envia mensagem para Groq ou se roda 100% deterministico.

Leitura inicial do codigo:

- Bradesco e Porto chamam `AiService.extractQuoteData`, portanto ambos usam Groq para extracao core.
- Pagamentos Bradesco e Porto sao sobrescritos por parsers deterministicos depois do retorno do Groq.
- Porto nao e 100% sem IA hoje.

## Objective

Instrumentar e documentar o tempo de cada etapa da extracao para descobrir onde Bradesco fica lento e deixar claro nos logs quando ha chamada de IA.

## Scope

- Adicionar logs temporizados por etapa:
  - extracao de texto PDF;
  - chamada Groq core;
  - parser deterministico de pagamentos;
  - validacao Zod;
  - retry/correcao via Groq, se ocorrer;
  - update no banco.
- Incluir insurer/product/quoteId nos logs.
- Garantir que logs nao exponham texto bruto inteiro em modo normal, ou reduzir log verboso para evitar custo/ruido.
- Documentar conclusao em discovery/implementation notes.

## Out Of Scope

- Nao remover Groq nesta task.
- Nao criar parser deterministico completo para Bradesco.
- Nao otimizar prompt sem medir antes.

## Likely Files

- `apps/api/src/modules/quotes/jobs/extract-pdf.processor.ts`
- `apps/api/src/modules/ai/ai.service.ts`
- `apps/api/src/modules/quotes/jobs/extract-pdf.processor.spec.ts`

## TDD Requirement

Backend task. Tests should cover that instrumentation does not break success/failure flow. If logger timing is hard to assert, keep tests focused on behavior and document manual timing verification.

## Acceptance Criteria

- [ ] Logs show duration per extraction step for Bradesco and Porto.
- [ ] Logs clearly show when Groq is called for extraction and correction.
- [ ] Bradesco vs Porto slowdown has a documented likely cause.
- [ ] No sensitive full raw PDF text is logged by default in normal dev/prod logs.
- [ ] Tests pass or manual verification is documented.

## Risks

- Logging raw quote content can expose personal data.

## Failure Scenario

The team optimizes the wrong part of the pipeline because the perceived Bradesco latency is not measured.

## Human QA Checklist

- [ ] Process one Bradesco quote.
- [ ] Process one Porto quote.
- [ ] Compare timing logs.

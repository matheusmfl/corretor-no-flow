---
id: TASK-0025
title: Criar deteccao e sugestoes de identidade do processo
status: todo
kind: implementation
lifecycle: open
area: api
owner: claude
reviewer: codex
complexity: medium
risk: high
tdd_required: true
created_at: 2026-05-01
blocked_by: TASK-0021
---

# TASK-0025 - Criar deteccao e sugestoes de identidade do processo

## Context

Um processo de cotacao representa um atendimento comercial flexivel. Ele pode conter cotacoes com segurados/condutores diferentes, mas o sistema precisa detectar divergencias e sugerir uma apresentacao segura para o link publico.

## Objective

Criar regra de dominio/API que identifique nomes divergentes no processo e gere sugestoes de nome de apresentacao sem sobrescrever silenciosamente escolhas do corretor.

## Scope

- Ler `.ai/discovery/CLIENT-IDENTITY-QUOTE-PROCESS.md`.
- Mapear onde nomes de segurado/condutor/clientName sao armazenados hoje.
- Implementar helper/servico para normalizar nomes e detectar identidade unica vs multiplas identidades.
- Gerar sugestoes como `Familia Sobrenome`, `Nome e Nome`, `Cliente` ou saudacao neutra.
- Garantir que processamento de PDF nao sobrescreva nome manual/confirmado do processo.
- Expor para o dashboard dados suficientes para alertar e sugerir nome de apresentacao.

## Out Of Scope

- Nao redesenhar a tela de review.
- Nao alterar layout do link publico.
- Nao bloquear upload/processamento de PDFs com nomes divergentes.

## Likely Files

- `apps/api/src/modules/quotes/jobs/extract-pdf.processor.ts`
- `apps/api/src/modules/quotes/application/use-cases/upload-quote.use-case.ts`
- `apps/api/src/modules/quotes/application/use-cases/get-quote-process.use-case.ts`
- `packages/types/src/quote.types.ts`

## TDD Requirement

Backend task. Comecar por testes cobrindo:

- processo com um unico nome;
- processo com dois nomes e sobrenome comum;
- processo com dois primeiros nomes sem sobrenome comum;
- nome manual existente nao e sobrescrito;
- divergencia e reportada para a camada consumidora.

## Acceptance Criteria

- [ ] API consegue informar se o processo tem identidade unica ou multiplas identidades.
- [ ] API gera sugestoes de nome de apresentacao para multiplos nomes.
- [ ] Nome manual/confirmado pelo corretor nao e sobrescrito pelo processamento.
- [ ] Nomes divergentes nao bloqueiam processamento.
- [ ] Tests pass.

## Risks

- Normalizacao fraca pode considerar nomes iguais como diferentes ou diferentes como iguais.

## Failure Scenario

O sistema publica ou sugere saudacao com nome de apenas uma cotacao, mesmo quando o processo contem varias pessoas.

## Human QA Checklist

- [ ] Criar processo com uma cotacao e confirmar fluxo simples.
- [ ] Criar processo com Maria Fonteles e Joao Fonteles e confirmar sugestao familiar.
- [ ] Confirmar que nome manual do processo nao muda apos novo upload.


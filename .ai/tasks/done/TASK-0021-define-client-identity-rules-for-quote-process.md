---
id: TASK-0021
title: Definir regras de identidade do cliente no processo de cotacao
status: done
kind: discovery
lifecycle: closed
area: product
owner: codex
reviewer: human
complexity: medium
risk: high
tdd_required: false
created_at: 2026-05-01
---

# TASK-0021 - Definir regras de identidade do cliente no processo de cotacao

## Context

O processo de cotacao agrupa varias cotacoes e gera um link publico unico. Hoje `process.clientName` pode ser preenchido manualmente na criacao ou sobrescrito pelo nome extraido de cada PDF no processamento.

Na QA, duas cotacoes de nomes diferentes ficaram no mesmo processo. O link saudou `Ola, Fabiano`, mas uma das cotacoes era de outra pessoa.

Existe um caso real em que o corretor testa variacoes de segurado/principal condutor para o mesmo atendimento, entao bloquear todo nome divergente pode ser ruim. Mas enviar link com nome errado ou dados misturados e risco comercial/LGPD.

## Objective

Definir a regra de produto para quando um processo pode conter cotacoes com nomes divergentes e como isso deve aparecer no dashboard/link publico.

## Scope

- Ler `.ai/brainstorm/2026-05-01-qa-public-link-client-identity.md`.
- Definir se processo representa segurado unico, atendimento comercial, ou grupo flexivel.
- Decidir quando bloquear, alertar ou permitir publicacao com confirmacao.
- Decidir saudacao do link publico quando ha conflito de nomes.
- Decidir se `process.clientName` pode ser sobrescrito automaticamente pelo processamento.
- Criar follow-up implementation task se a decisao estiver madura.

## Out Of Scope

- Nao implementar alteracao de schema nesta task.
- Nao alterar UI nesta task.

## Likely Files

- `.ai/brainstorm/2026-05-01-qa-public-link-client-identity.md`
- `.ai/discovery/CLIENT-IDENTITY-QUOTE-PROCESS.md`
- `.ai/DECISIONS.md`

## TDD Requirement

No code in this task.

## Acceptance Criteria

- [x] Discovery document exists.
- [x] Recommended rule for mixed insured/driver names is documented.
- [x] Public-link greeting rule is documented.
- [x] Review/publish warning rule is documented.
- [x] Follow-up implementation tasks can be created without ambiguity.

## Risks

- Wrong handling can expose one client's data to another or confuse the insured.

## Failure Scenario

The broker publishes a link with a greeting for one client and quote details from another.

## Human QA Checklist

- [x] Human confirms the chosen rule matches real broker workflow.

## Decision

Approved direction on 2026-05-01:

- A quote process represents a flexible commercial service, not strictly one insured person.
- Divergent names are allowed because brokers may quote spouse/husband/family variants in one sales context.
- Simple one-name processes should keep the current low-friction experience.
- When multiple identities exist, the system should suggest a presentation name such as `Familia Fonteles`, `Maria e Joao`, or `Cliente`.
- The broker can edit/confirm this presentation name.
- The public link greeting must use the confirmed presentation name or a neutral greeting, not automatically pick one quote's name.
- Quote cards should discreetly show insured/main driver when commercially useful.

Discovery document:

- `.ai/discovery/CLIENT-IDENTITY-QUOTE-PROCESS.md`

Follow-up tasks:

- `TASK-0025` - Criar deteccao e sugestoes de identidade do processo.
- `TASK-0026` - Adicionar UX de confirmacao de identidade no review/publicacao.
- `TASK-0027` - Ajustar link publico para identidade flexivel.

---
id: TASK-0023
title: Coletar SVGs oficiais das seguradoras para PDF e link
status: todo
kind: discovery
lifecycle: open
area: product
owner: human
reviewer: codex
complexity: low
risk: low
tdd_required: false
created_at: 2026-05-01
priority: low
---

# TASK-0023 - Coletar SVGs oficiais das seguradoras para PDF e link

## Context

Foi anotada a necessidade de exibir logomarca das seguradoras nos PDFs e links publicos.

## Objective

Coletar ou confirmar SVGs oficiais das seguradoras suportadas para uso visual no produto.

## Scope

- Bradesco Seguros.
- Porto Seguro.
- Itau.
- Sompo.
- Azul.
- Registrar origem/arquivo e restricoes de uso quando houver.

## Out Of Scope

- Nao implementar UI nesta task.
- Nao redesenhar PDF/link.

## Likely Files

- `.ai/discovery/INSURER-BRAND-ASSETS.md`
- futuros assets em `apps/dashboard/public/insurers/`

## TDD Requirement

No code.

## Acceptance Criteria

- [ ] Lista de logos desejadas existe.
- [ ] Arquivos/origens oficiais estao documentados.
- [ ] Riscos de uso de marca estao anotados.

## Risks

- Usar logo nao oficial ou em formato ruim pode prejudicar credibilidade.

## Failure Scenario

O produto exibe nomes textuais quando poderia reforcar confianca com marcas reconheciveis.

## Human QA Checklist

- [ ] Human confirma se pode usar as marcas nos materiais gerados.

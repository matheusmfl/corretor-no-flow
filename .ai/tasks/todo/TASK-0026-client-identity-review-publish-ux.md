---
id: TASK-0026
title: Adicionar UX de confirmacao de identidade no review/publicacao
status: todo
kind: implementation
lifecycle: open
area: dashboard
owner: claude
reviewer: codex
complexity: medium
risk: medium
tdd_required: false
created_at: 2026-05-01
blocked_by: TASK-0025
---

# TASK-0026 - Adicionar UX de confirmacao de identidade no review/publicacao

## Context

Quando um processo contem nomes diferentes, o corretor precisa de uma experiencia simples para escolher como o cliente sera cumprimentado no link publico. Corretor nao deve ser obrigado a inventar nomes do zero quando o sistema pode sugerir opcoes.

## Objective

Adicionar no dashboard uma experiencia intuitiva para revisar e confirmar o nome de apresentacao do processo quando houver multiplos nomes.

## Scope

- Usar os dados/sugestoes expostos pela `TASK-0025`.
- Manter o fluxo atual sem friccao quando houver identidade unica.
- Mostrar alerta claro quando houver nomes divergentes.
- Oferecer sugestoes prontas, por exemplo:
  - `Familia Fonteles`;
  - `Maria e Joao`;
  - `Cliente`;
  - campo editavel.
- Salvar/confirmar o nome de apresentacao escolhido pelo corretor.
- Evitar publicacao com multiplos nomes e saudacao personalizada nao confirmada.

## Out Of Scope

- Nao alterar parser de PDF.
- Nao redesenhar toda a pagina de review.
- Nao implementar comparacao comercial ou destaques do link publico.

## Likely Files

- `apps/dashboard/src/app/(app)/dashboard/quotes/[processId]/review/page.tsx`
- `apps/dashboard/src/components/**`
- `apps/dashboard/src/lib/**`
- `apps/api/src/modules/quotes/**` somente para endpoint de update se necessario.

## TDD Requirement

Adicionar testes se houver padrao existente para componentes/hooks envolvidos. Se nao houver cobertura viavel, documentar QA manual.

## Acceptance Criteria

- [ ] Processo com nome unico continua sem nova etapa obrigatoria.
- [ ] Processo com multiplos nomes exibe alerta antes da publicacao.
- [ ] Sugestoes de nome de apresentacao aparecem para o corretor.
- [ ] Corretor pode editar e confirmar o nome de apresentacao.
- [ ] Publicacao nao usa automaticamente nome de uma unica cotacao quando ha conflito.

## Risks

- UX pesada pode atrapalhar corretor em momento de envio rapido.

## Failure Scenario

O corretor ve um alerta confuso, ignora a informacao e publica link com saudacao errada.

## Human QA Checklist

- [ ] Testar processo com apenas um segurado e confirmar ausencia de friccao.
- [ ] Testar processo com casal/familia e confirmar sugestoes.
- [ ] Editar nome manualmente e publicar link.
- [ ] Confirmar que novo upload nao sobrescreve nome escolhido.


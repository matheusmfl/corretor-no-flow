---
id: TASK-0044
title: Enriquecer detalhes de coberturas Tokio Marine no review PDF e link
status: todo
kind: implementation
lifecycle: open
area: api
owner: claude
reviewer: codex
complexity: medium
risk: medium
tdd_required: true
created_at: 2026-05-07
blocked_by: TASK-0022
---

# TASK-0044 - Enriquecer detalhes de coberturas Tokio Marine no review PDF e link

## Context

Na validacao humana de Tokio Marine, os 5 produtos e labels foram aprovados. Mesmo assim, a exibicao de coberturas ainda esta parcial:

- Assistencia/guincho aparece como `Incluso`, mas nao mostra limite de km.
- Protecao de vidros aparece como `Incluso` ou `Nao contratado`, mas precisa ser mais precisa quando houver detalhe.
- Carro reserva funcionou parcialmente, por exemplo `15 dias`.
- Em Protecao Mensal, vidro apareceu como nao contratado, guincho incluso, mas carro reserva nem foi citado.

Isso confirma a direcao da `TASK-0022`: o contrato rico deve existir, mas a implementacao pratica precisa ser fatiada por seguradora/produto para reduzir risco.

## Objective

Melhorar a exibicao das principais coberturas Tokio Marine no review, PDF e link publico, sem inventar dados ausentes.

## Scope

- Mapear, a partir dos PDFs Tokio ja extraidos, quais detalhes podem ser exibidos com seguranca:
  - limite de guincho/assistencia;
  - dias de carro reserva;
  - vidro contratado vs nao contratado;
  - cobertura sem casco/nao aplicavel;
  - produto mensal/90% FIPE.
- Popular detalhes no contrato de exibicao quando ja existirem no `AutoQuoteData` ou forem extraiveis de forma segura.
- Garantir que campo ausente nao seja mostrado como contratado nem como erro.
- Atualizar review/PDF/link para usar a representacao enriquecida quando disponivel.

## Out Of Scope

- Nao redesenhar todo o contrato generico de extras por seguradora.
- Nao implementar Bradesco/Porto nesta task.
- Nao criar comparativo automatico.
- Nao incluir dados sem evidencia nos PDFs reais.

## Likely Files

- `apps/api/src/modules/quotes/application/services/coverage-display.ts`
- `apps/api/src/modules/quotes/application/services/coverage-display.spec.ts`
- `apps/api/src/modules/quotes/application/services/quote-pdf-template.service.ts`
- `apps/dashboard/src/app/(app)/dashboard/quotes/[processId]/review/page.tsx`
- `apps/api/src/modules/public/application/use-cases/get-public-process.use-case.ts`
- `packages/types/src/quote.types.ts`

## Executor Context Pack

Read these files first, in order:

1. `.ai/tasks/review/TASK-0022-design-rich-auto-coverage-display-contract.md`
2. `.ai/discovery/TOKIO-MARINE-AUTO.md`
3. `apps/api/src/modules/quotes/application/services/coverage-display.spec.ts`
4. `apps/api/src/modules/quotes/application/services/coverage-display.ts`
5. `apps/api/src/modules/quotes/application/services/quote-pdf-template.service.ts`
6. `apps/dashboard/src/app/(app)/dashboard/quotes/[processId]/review/page.tsx`

Use `rg` only for:

- `ASSISTÊNCIA EXCLUSIVA`
- `AUTO PROTEÇÃO MENSAL`
- `towing`
- `replacementDays`
- `glassProtection`
- `coverage.assistance`
- `buildCoverageDisplay`
- `Assistências`

If more than 6 additional files seem necessary, stop and explain why before continuing.

## TDD Requirement

Required. Start with tests that express Tokio-specific display expectations before changing renderer behavior.

## Acceptance Criteria

- [ ] Tokio Auto mostra carro reserva com dias quando extraido.
- [ ] Tokio Auto/Classico/Protecao Mensal nao exibem vidro como contratado quando `glassProtection=false`.
- [ ] Guincho/assistencia nao inventa KM quando limite nao estiver extraido.
- [ ] Se limite de KM estiver extraido/documentado com seguranca, ele aparece no detalhe.
- [ ] Protecao Mensal nao omite silenciosamente carro reserva se houver estado `not_contracted` conhecido.
- [ ] Assistencia Exclusiva nao mostra casco/FIPE fantasma.
- [ ] Testes focados passam.

## Risks

- Mostrar `Nao contratado` demais pode deixar a cotacao visualmente negativa; omitir demais pode esconder diferencas importantes.
- Tokio pode variar textos de assistencia por impressao, exigindo nova amostra antes de afirmar KM.

## Failure Scenario

O cliente compara Tokio Protecao Mensal com outro produto, ve apenas "Guincho incluso" e nao percebe que vidro/carro reserva nao foram contratados ou nao se aplicam.

## Human QA Checklist

- [ ] Abrir review de Tokio Auto e confirmar carro reserva em dias.
- [ ] Abrir review de Tokio Protecao Mensal e confirmar vidro/carro reserva como nao contratado quando aplicavel.
- [ ] Gerar PDF e conferir as mesmas mensagens.
- [ ] Abrir link publico e confirmar que a informacao nao polui o card.

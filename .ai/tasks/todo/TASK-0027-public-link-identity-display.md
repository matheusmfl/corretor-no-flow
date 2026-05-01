---
id: TASK-0027
title: Ajustar link publico para identidade flexivel
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
blocked_by: TASK-0025,TASK-0026
---

# TASK-0027 - Ajustar link publico para identidade flexivel

## Context

O link publico deve cumprimentar o cliente usando o nome de apresentacao confirmado do processo. Quando as cotacoes tiverem segurados/condutores diferentes, cada card deve mostrar esses nomes de forma discreta para apoiar a comparacao comercial.

## Objective

Atualizar o link publico para usar a saudacao correta do atendimento e exibir, quando util, segurado e condutor principal por cotacao.

## Scope

- Usar nome de apresentacao confirmado/sugerido para a saudacao.
- Usar saudacao neutra quando nao houver nome confiavel.
- Exibir em cada card, de forma secundaria:
  - segurado;
  - condutor principal;
  - apenas quando existir e fizer sentido.
- Evitar repetir informacao quando todos os cards tiverem o mesmo nome.
- Garantir que WhatsApp CTA continue visivel e prioritario.

## Out Of Scope

- Nao criar destaques de comparacao da `TASK-0004`.
- Nao implementar contrato rico de coberturas da `TASK-0022`.
- Nao adicionar logos de seguradoras.

## Likely Files

- `apps/dashboard/src/app/(public)/c/[token]/page.tsx`
- `apps/dashboard/src/app/(public)/c/[token]/quote/[quoteId]/route.ts`
- `apps/api/src/modules/public/application/use-cases/get-public-process.use-case.ts`
- `packages/types/src/quote.types.ts`

## TDD Requirement

Adicionar testes se houver padrao existente para public link ou use-case publico. Se nao houver, documentar QA manual.

## Acceptance Criteria

- [ ] Link com identidade unica usa saudacao atual/personalizada sem regressao.
- [ ] Link com multiplas identidades usa nome de apresentacao confirmado ou saudacao neutra.
- [ ] Cards mostram segurado/condutor de forma discreta quando houver divergencia.
- [ ] Cards nao ficam visualmente poluidos quando todos os nomes sao iguais.
- [ ] WhatsApp CTA permanece claro.

## Risks

- Exibir nomes por card pode gerar ruido se aparecer com destaque excessivo.

## Failure Scenario

Cliente recebe link com saudacao familiar correta, mas nao entende que uma cotacao esta em outro segurado/condutor.

## Human QA Checklist

- [ ] Abrir link publico com uma identidade.
- [ ] Abrir link publico com Maria/Joao no mesmo processo.
- [ ] Confirmar saudacao escolhida.
- [ ] Confirmar nomes discretos por card.
- [ ] Confirmar que CTA de WhatsApp segue visivel.


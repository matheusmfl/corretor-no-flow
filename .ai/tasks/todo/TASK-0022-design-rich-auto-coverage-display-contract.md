---
id: TASK-0022
title: Desenhar contrato rico de coberturas AUTO para PDF e link publico
status: todo
kind: discovery
lifecycle: open
area: product
owner: codex
reviewer: human
complexity: medium
risk: medium
tdd_required: false
created_at: 2026-05-01
---

# TASK-0022 - Desenhar contrato rico de coberturas AUTO para PDF e link publico

## Context

QA mostrou que os campos atuais de assistencia sao pobres para venda:

- `Guincho` deveria ser `Assistencia 24h (guincho)` e incluir limite de km quando extraido.
- `Protecao de vidros: Incluso` precisa distinguir niveis por seguradora.
- `Veiculo reserva: Incluso` precisa mostrar dias e categoria/tier.
- Porto pode trazer pneus/para-brisas, carro reserva, reparo rapido, rodas/suspensao, martelinho e outros detalhes.
- Bradesco possui niveis de vidro como reparo de para-brisas, vidro protegido e vidro protegido plus.

Tambem surgiu a necessidade futura de permitir que o corretor personalize quais informacoes aparecem no PDF/link.

## Objective

Definir um contrato de exibicao de coberturas AUTO que seja comum o suficiente para comparar seguradoras, mas permita detalhes especificos por seguradora.

## Scope

- Mapear categorias de exibicao:
  - assistencia 24h/guincho;
  - vidros;
  - carro reserva;
  - reparo rapido/martelinho;
  - rodas/pneus/suspensao;
  - oficina/tipo de peca;
  - beneficios/descontos.
- Definir quais campos entram no core comum vs extras por seguradora.
- Propor como PDF/link devem mostrar campos ausentes, contratados e detalhados.
- Propor base para template personalizavel pelo corretor.
- Usar Bradesco e Porto como primeiros exemplos.

## Out Of Scope

- Nao implementar schema nesta task.
- Nao alterar parser nesta task.
- Nao criar UI de personalizacao ainda.

## Likely Files

- `.ai/discovery/AUTOQUOTE-EXTRAS-CONTRACT.md`
- `.ai/discovery/PORTO-FAMILY-AUTO.md`
- `.ai/discovery/BRADESCO-AUTO-EXTRA-FIELDS.md`
- `packages/types/src/quote.types.ts`

## TDD Requirement

No implementation in this task.

## Acceptance Criteria

- [ ] Proposal document defines rich coverage display categories.
- [ ] Bradesco glass tiers are represented conceptually.
- [ ] Porto assistance/car replacement/glass/reparo rapido are represented conceptually.
- [ ] Recommendation exists for first implementation slice.
- [ ] Risks for public-link clarity and overexposure of noisy extras are documented.

## Risks

- Too much detail can make the proposal less clear for the insured.

## Failure Scenario

The product keeps showing `Incluso` for important coverage differences and fails to help the client compare real value.

## Human QA Checklist

- [ ] Human confirms which coverage details matter most in real sales conversation.

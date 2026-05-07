---
id: TASK-0045
title: Discovery de seguro Moto por seguradora e principais diferencas
status: todo
kind: discovery
lifecycle: open
area: product
owner: claude
reviewer: codex
complexity: medium
risk: medium
tdd_required: false
created_at: 2026-05-07
---

# TASK-0045 - Discovery de seguro Moto por seguradora e principais diferencas

## Context

Hoje o fluxo principal esta focado em AUTO. Futuramente o produto deve abranger Moto, e possivelmente Caminhao depois do lancamento.

Antes de implementar suporte a Moto por seguradora, precisamos entender:

- se os PDFs de Moto seguem o mesmo formato de AUTO ou outro layout;
- quais seguradoras suportam Moto no contexto do corretor;
- quais coberturas e assistencias mudam;
- quais campos devem entrar no core do produto e quais devem ficar em detalhes por seguradora;
- se o public link/PDF/review precisam de copy ou comparacao especifica para Moto.

## Objective

Mapear as principais diferencas de cotacoes Moto em relacao a AUTO e documentar uma estrategia segura de suporte futuro por seguradora.

## Scope

- Listar seguradoras candidatas para Moto:
  - Bradesco;
  - Tokio Marine;
  - Porto family, se aplicavel;
  - Azul;
  - Itau;
  - Mitsui;
  - outras seguradoras disponiveis no cotador.
- Coletar ou solicitar pelo menos uma amostra PDF de Moto por seguradora prioritaria, quando possivel.
- Extrair PDFs no PDF lab.
- Comparar com AUTO:
  - produto/comercial label;
  - casco/FIPE;
  - roubo/furto/incendio;
  - RCF;
  - APP;
  - assistencia/guincho;
  - km;
  - danos a terceiros;
  - franquias;
  - servicos especificos de moto;
  - exclusoes/condicoes especiais;
  - formas de pagamento.
- Identificar quais campos podem reutilizar `AutoQuoteData` e quais exigem um contrato novo ou discriminador de produto.
- Recomendar se Moto deve ser:
  - novo `QuoteProduct = MOTO`;
  - extensao do contrato AUTO;
  - contrato proprio compartilhando componentes de review/PDF/link.

## Out Of Scope

- Nao implementar processamento de Moto.
- Nao alterar schema/types ainda.
- Nao alterar prompt de seguradoras.
- Nao alterar detector.
- Nao alterar PDF/link/review.
- Nao implementar Caminhao nesta task.

## Likely Files

- `.ai/pdf-lab/input`
- `.ai/pdf-lab/output`
- `.ai/discovery/PORTO-FAMILY-AUTO.md`
- `.ai/discovery/BRADESCO-AUTO-EXTRA-FIELDS.md`
- `.ai/discovery/AUTOQUOTE-EXTRAS-CONTRACT.md`
- `packages/types/src/quote.types.ts`

## Executor Context Pack

Read these files first, in order:

1. `.ai/discovery/PORTO-FAMILY-AUTO.md`
2. `.ai/discovery/BRADESCO-AUTO-EXTRA-FIELDS.md`
3. `.ai/discovery/AUTOQUOTE-EXTRAS-CONTRACT.md`
4. `.ai/tasks/done/TASK-0022-design-rich-auto-coverage-display-contract.md`
5. `.ai/tasks/review/TASK-0044-enrich-tokio-coverage-display-details.md`

Use `rg` only for:

- `moto`
- `motocicleta`
- `seguro moto`
- `QuoteProduct`
- `AUTO`
- `coverageDetails`
- `assistencia`
- `guincho`
- `RCF`
- `APP`

If more than 6 additional files seem necessary, stop and explain why before continuing.

## TDD Requirement

No implementation. If discovery becomes implementation, create insurer-specific tests first.

## Acceptance Criteria

- [ ] Seguradoras candidatas para Moto estao listadas.
- [ ] Amostras necessarias estao listadas, com status: existente, solicitada ou ausente.
- [ ] Pelo menos uma estrategia de contrato para Moto esta recomendada.
- [ ] Diferencas principais entre Moto e AUTO estao documentadas.
- [ ] Riscos de reaproveitar `AutoQuoteData` diretamente estao documentados.
- [ ] Follow-up implementation tasks por seguradora podem ser criadas.

## Risks

- Moto pode parecer simples, mas ter regras de produto, assistencia e franquia bem diferentes de AUTO.
- Reutilizar `AutoQuoteData` sem discriminador pode gerar PDF/link com linguagem errada.
- Seguradoras podem usar layouts diferentes para Moto mesmo quando o nome da seguradora e detector sao iguais.

## Failure Scenario

Implementar Moto como se fosse AUTO e acabar exibindo coberturas, assistencias ou comparativos incorretos para o cliente.

## Human QA Checklist

- [ ] Humano confirma quais seguradoras de Moto existem no cotador.
- [ ] Humano fornece pelo menos uma amostra real de PDF Moto quando disponivel.
- [ ] Humano valida se as diferencas comerciais documentadas fazem sentido para venda.

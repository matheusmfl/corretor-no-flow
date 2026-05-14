---
id: TASK-0055
title: Criar motor de tabela manual por faixa etaria Saude
status: todo
kind: implementation
lifecycle: open
area: api
owner: claude
reviewer: codex
complexity: medium
risk: medium
tdd_required: true
created_at: 2026-05-13
---

# TASK-0055 - Criar motor de tabela manual por faixa etaria Saude

## Context

Nem toda fonte de Saude gera PDF. Unimed, Hapvida, Qualicorp/Solbene e outras podem chegar como tabela recebida por WhatsApp ou planilha. A amostra `UNIMED - OTORRINOS.xlsx` mostra uma aba de faixa etaria com valores por acomodacao, usada para calcular valores por vida.

## Objective

Criar um motor puro que aplica uma `HealthManualTableSource` a um grupo de vidas e produz uma `HealthQuoteOption` com valores por vida e total.

## Scope

- Criar servico/funcoes de calculo para:
  - encontrar faixa etaria por idade;
  - aplicar tabela por plano/opcao;
  - gerar `perLifePrices`;
  - gerar `monthlyTotal`;
  - preservar `source: "table_lookup"` e evidencia da faixa usada.
- Suportar nomes de faixas comuns:
  - `0 a 18`, `ate 18`, `19 a 23`, ..., `59+`, `59 ou mais`.
- Exigir validade da tabela como campo revisavel quando ausente.
- Criar testes com a tabela Unimed da amostra:
  - enfermaria;
  - apartamento;
  - vida sem nome mas com idade;
  - vida manual criada/confirmada pela corretora;
  - erro para idade sem faixa correspondente;
  - erro ou warning para tabela sem validade.

## Out Of Scope

- Nao importar XLSX ainda.
- Nao criar tela de cadastro.
- Nao persistir tabela em banco.
- Nao gerar arquivo Excel.

## Likely Files

- `packages/types/src/quote.types.ts`
- `apps/api/src/modules/quotes/domain/schemas/health-quote-draft.schema.ts`
- `apps/api/src/modules/quotes/application/services/health-manual-table-pricing.service.ts`
- `apps/api/src/modules/quotes/application/services/health-manual-table-pricing.service.spec.ts`
- `.ai/discovery/HEALTH-QUOTE-ASSISTED-MVP.md`

## Executor Context Pack

Read these files first, in order:

1. `.ai/discovery/HEALTH-QUOTE-ASSISTED-MVP.md`
2. `.ai/brainstorm/2026-05-13-pesquisa-corretora-saude-prototipo-urgente.md`
3. `packages/types/src/quote.types.ts`
4. `apps/api/src/modules/quotes/domain/schemas/health-quote-draft.schema.ts`
5. `apps/api/src/modules/quotes/domain/schemas/health-quote-draft.schema.spec.ts`

Use `rg` only for these terms before opening more files:

- `HealthManualTableSource`
- `HealthAgeBandPrice`
- `HealthMemberLife`
- `HealthQuoteOption`
- `table_lookup`
- `FAIXA ETARIA`
- `UNIMEDE PE ENFER`

Do not use broad Explore/subagent/codebase-map workflows before reading these files. If more than 6 additional files seem necessary, stop and explain why.

## TDD Requirement

Write pricing tests first.

## Acceptance Criteria

- [ ] Given lives and a valid table, service returns a quote option with per-life values.
- [ ] Manual/confirmed lives can be priced without requiring another extraction pass.
- [ ] Total equals the sum of per-life values.
- [ ] Each calculated cell keeps table source/evidence.
- [ ] Common age-band labels are normalized.
- [ ] Missing age-band returns a clear error or reviewable warning.
- [ ] Missing validity creates a review warning rather than silently accepting.

## Risks

- Age-band parsing can create wrong prices if inclusive boundaries are wrong.
- Tables without validity can produce expired quotes.
- Qualicorp-like sources may represent administrator/channel, not final operator.

## Failure Scenario

The system calculates manual-table prices but loses which table/faixa produced each value, making broker review and audit impossible.

## Human QA Checklist

- [ ] Human confirms the Unimed age-band mapping matches the spreadsheet.
- [ ] Codex reviews inclusive age boundaries.

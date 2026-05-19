---
id: TASK-0070
title: Descobrir catalogo minimo de operadora e produtos Saude por PDFs reais
status: todo
kind: discovery
lifecycle: open
area: product, api
owner: unassigned
reviewer: codex
complexity: medium
risk: medium
tdd_required: false
created_at: 2026-05-19
---

# TASK-0070 - Descobrir catalogo minimo de operadora e produtos Saude por PDFs reais

## Context

O extrator Saude fica com `Operadora nao identificada` em PDFs como `MARAVILHA CESTAS LTDA EFETIVO ENF.COM DESC..pdf`. O texto extraido ate agora mostra produto, codigo e regiao, mas nem sempre traz a marca da operadora de forma explicita.

Sem uma fonte confiavel, hardcodar `Saude Efetivo IV` como Amil pode ser perigoso. Ao mesmo tempo, para o corretor, pelo menos o nome da operadora e uma informacao central.

## Objective

Mapear um catalogo minimo e auditavel de sinais de operadora/produto para Saude, baseado em PDFs reais do projeto, para reduzir `Operadora nao identificada` sem inventar dados.

## Scope

- Levantar nos PDFs reais:
  - nomes de produtos;
  - codigos de produto;
  - administradora/canal;
  - operadora/seguradora;
  - evidencias textuais e nomes de arquivo.
- Criar uma tabela de descoberta em Markdown com:
  - `productName`
  - `productCode`
  - `operator`
  - `confidence`
  - `evidence`
  - `sourceFile`
  - `needsHumanValidation`
- Identificar quais mapeamentos podem virar regra automatica e quais precisam de confirmacao humana.
- Propor formato de fixture/teste para uma etapa futura de resolver operadora por catalogo.

## Out Of Scope

- Implementar o catalogo em runtime nesta task.
- Consultar bases externas pagas ou privadas.
- Inferir operadora sem evidencia.
- Resolver rede credenciada, carencia ou reembolso detalhado.

## Executor Context Pack

Read these files first, in order:

1. `.ai/discovery/HEALTH-QUOTE-ASSISTED-MVP.md`
2. `.ai/pdf-lab/output/health_varied_quotes_2026_05_13.md`
3. `.ai/tasks/todo/TASK-0052-discover-health-varied-pdfs-and-spreadsheets.md`
4. `apps/api/src/modules/quotes/application/services/health-quote-draft-extractor.service.ts`
5. `apps/api/src/modules/ai/ai.service.ts`
6. `packages/types/src/health-quote-draft.types.ts`

Use `rg` only for these terms before opening more files:

- `Saúde Efetivo IV`
- `Dental Conjugado`
- `TRWE`
- `Amil`
- `SulAmérica`
- `Cuidado360`
- `carrierOrOperator`
- `productCode`
- `Operadora`
- `Saude Efetivo`

Do not use broad Explore/subagent/codebase-map workflows before reading these files. If more than 6 additional files seem necessary, stop and explain why.

## Deliverable

Create a Markdown discovery file under `.ai/discovery/`, for example:

- `.ai/discovery/HEALTH-OPERATOR-PRODUCT-CATALOG-V0.md`

Include:

- evidence table;
- uncertain mappings;
- recommended implementation task;
- sample test cases.

## Acceptance Criteria

- [ ] The discovery explicitly answers whether `Saude Efetivo IV` / `TRWE` can be mapped to an operator from current evidence.
- [ ] Each proposed mapping includes source evidence, not only filename intuition.
- [ ] Uncertain mappings are labelled as requiring human validation.
- [ ] The next implementation task can use the catalog without rereading every PDF.

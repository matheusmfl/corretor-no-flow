---
id: TASK-0056
title: Criar matriz e exportacao XLSX da cotacao Saude
status: done
kind: implementation
lifecycle: done
area: api
owner: claude
reviewer: codex
complexity: medium
risk: medium
tdd_required: true
created_at: 2026-05-13
---

# TASK-0056 - Criar matriz e exportacao XLSX da cotacao Saude

## Context

A saida mais urgente para a corretora e uma planilha parecida com o fluxo atual: uma linha por vida, uma coluna por opcao de plano e totais por plano. Antes de PDF/link, o sistema precisa conseguir transformar um `HealthQuoteDraft` revisado em uma matriz exportavel.

## Objective

Criar um builder de matriz de planilha Saude e uma exportacao XLSX v0, com testes focados em estrutura e totais.

## Scope

- Criar um servico que recebe `HealthQuoteDraft` e produz uma matriz intermediaria:
  - cabecalhos: nome/identificador, idade, parentesco, opcoes de plano;
  - linhas por vida;
  - valores por vida/opcao;
  - linha de total;
  - notas de validade/origem/warnings.
- Criar exportador XLSX v0 a partir dessa matriz.
- Se nao houver biblioteca XLSX no projeto, documentar a escolha minima e adicionar dependencia de forma explicita no `package.json` apropriado.
- Preservar formato monetario quando possivel.
- Testar:
  - linhas e colunas geradas corretamente;
  - total por opcao;
  - vida sem nome usa label fallback;
  - opcoes ocultas/excluidas nao entram;
  - warnings/validade aparecem em uma aba ou bloco de notas.

## Out Of Scope

- Nao criar UI.
- Nao criar endpoint HTTP se isso expandir demais; um servico testado basta para esta task.
- Nao replicar todos os estilos visuais das planilhas da corretora.
- Nao criar PDF/link.

## Likely Files

- `apps/api/package.json`
- `apps/api/src/modules/quotes/application/services/health-spreadsheet-matrix.service.ts`
- `apps/api/src/modules/quotes/application/services/health-spreadsheet-matrix.service.spec.ts`
- `apps/api/src/modules/quotes/application/services/health-xlsx-export.service.ts`
- `apps/api/src/modules/quotes/application/services/health-xlsx-export.service.spec.ts`
- `apps/api/src/modules/quotes/domain/schemas/health-quote-draft.schema.ts`

## Executor Context Pack

Read these files first, in order:

1. `.ai/discovery/HEALTH-QUOTE-ASSISTED-MVP.md`
2. `.ai/brainstorm/2026-05-13-pesquisa-corretora-saude-prototipo-urgente.md`
3. `apps/api/src/modules/quotes/domain/schemas/health-quote-draft.schema.ts`
4. `apps/api/src/modules/quotes/application/services/quote-pdf-template.service.ts`
5. `apps/api/package.json`

Use `rg` only for these terms before opening more files:

- `HealthQuoteDraft`
- `HealthQuoteOption`
- `perLifePrices`
- `monthlyTotal`
- `generated`
- `pdf-renderer`
- `xlsx`
- `excel`

Do not use broad Explore/subagent/codebase-map workflows before reading these files. If more than 6 additional files seem necessary, stop and explain why.

## TDD Requirement

Start with matrix builder tests. Add XLSX export tests after matrix behavior is stable.

## Acceptance Criteria

- [ ] Matrix builder returns deterministic rows/columns for a draft.
- [ ] Totals are calculated from visible options.
- [ ] Fallback labels work for unnamed lives.
- [ ] Warnings/validity/source notes are included.
- [ ] XLSX export returns a buffer/file payload that can be saved.
- [ ] Tests do not depend on external services.

## Risks

- Adding a spreadsheet dependency may affect install/build if chosen carelessly.
- Trying to make the XLSX visually perfect in v0 can delay the urgent prototype.
- Export must not hide warnings about inferred/stale fields.

## Failure Scenario

The exported file looks like a spreadsheet but drops validity/source warnings, causing the broker to send expired or unreviewed values.

## Human QA Checklist

- [ ] Human opens generated XLSX and confirms it resembles the current broker workflow enough for a prototype.
- [ ] Codex reviews totals and warning placement.

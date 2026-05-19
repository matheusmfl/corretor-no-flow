---
id: TASK-0071
title: Corrigir falha de extracao do PDF Saude Amil longo
status: todo
kind: bugfix
lifecycle: open
area: api, dashboard
owner: unassigned
reviewer: codex
complexity: medium
risk: high
tdd_required: true
created_at: 2026-05-19
---

# TASK-0071 - Corrigir falha de extracao do PDF Saude Amil longo

## Context

No upload real de Saude, o arquivo `CotacaoAmil_MARAVILHA_CESTAS_LTDA_COT-3426700.pdf` voltou a falhar com a mensagem:

> Nao consegui montar uma cotacao de Saude confiavel a partir desse PDF. Confira se ele e uma proposta de plano de saude com texto selecionavel.

O mesmo lote processou `MARAVILHA CESTAS LTDA EFETIVO ENF.COM DESC..pdf`, mas o PDF Amil mais longo ficou como erro. Esse arquivo ja tinha sido usado em investigacoes anteriores e deve ser considerado um fixture real do fluxo Saude.

## Objective

Reproduzir a falha do PDF Amil longo, identificar se o problema vem de extracao textual, prompt/IA, normalizacao do draft ou schema, e corrigir sem reduzir a seguranca do parser.

## Scope

- Criar/reusar fixture textual do PDF Amil longo para teste automatizado.
- Rodar a extracao textual e registrar:
  - tamanho do texto;
  - primeiras/ultimas secoes relevantes;
  - sinais de produto Saude;
  - opcoes Saude/Odonto detectaveis.
- Descobrir a causa real:
  - resposta da IA fora do schema;
  - texto longo demais/truncado;
  - campos `null` nao normalizados;
  - `ageBandCounts` ou `ageBandPrices` invalidos;
  - resposta misturando marketing e cotacao.
- Corrigir no menor ponto possivel:
  - normalizador;
  - prompt;
  - schema com fallback seguro;
  - pre-processamento de texto;
  - mensagem de erro especifica.
- Manter a regra de nao inventar campos sensiveis.

## Out Of Scope

- Implementar OCR.
- Mapear todas as operadoras Saude.
- Forcar sucesso se o PDF nao tiver dados minimos de cotacao.

## Executor Context Pack

Read these files first, in order:

1. `.ai/discovery/HEALTH-QUOTE-ASSISTED-MVP.md`
2. `.ai/pdf-lab/output/health_varied_quotes_2026_05_13.md`
3. `apps/api/src/modules/quotes/application/services/pdf-extractor.service.ts`
4. `apps/api/src/modules/quotes/application/services/health-quote-draft-extractor.service.ts`
5. `apps/api/src/modules/quotes/application/services/health-quote-draft-extractor.service.spec.ts`
6. `apps/api/src/modules/quotes/domain/schemas/health-quote-draft.schema.ts`
7. `apps/api/src/modules/ai/ai.service.ts`

Use `rg` only for these terms before opening more files:

- `CotacaoAmil`
- `MARAVILHA_CESTAS`
- `COT-3426700`
- `AMIL S450`
- `DENTAL BRONZE`
- `ageBandCounts`
- `ageBandPrices`
- `parseHealthQuoteDraft`
- `extractHealthQuoteDraft`
- `UnprocessableEntityException`

Do not use broad Explore/subagent/codebase-map workflows before reading these files. If more than 6 additional files seem necessary, stop and explain why.

## TDD Requirement

- Add a failing test that reproduces the normalized AI response or extracted-text failure mode from the Amil long PDF.
- Prefer mocking the AI response once the failure shape is known.
- If text pre-processing is the issue, add a pure test for the pre-processor.

## Acceptance Criteria

- [ ] The Amil long PDF no longer fails with the generic unreliable-draft message when it contains extractable Health quote data.
- [ ] The resulting draft includes the Amil medical option and dental addon without turning dental into a medical plan.
- [ ] Per-life or age-band prices are preserved/derived.
- [ ] If some fields are missing, they become reviewable warnings instead of aborting the whole PDF.
- [ ] If the PDF genuinely lacks required data, the frontend shows a specific reason.
- [ ] Existing Health extractor/schema tests keep passing.

## QA Notes

- Test a batch with:
  - `CotacaoAmil_MARAVILHA_CESTAS_LTDA_COT-3426700.pdf`
  - `MARAVILHA CESTAS LTDA EFETIVO ENF.COM DESC..pdf`
- Expected: both Saude PDFs process or the Amil failure explains the exact missing requirement.

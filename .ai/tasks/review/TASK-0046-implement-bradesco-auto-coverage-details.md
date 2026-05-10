---
id: TASK-0046
title: Implementar enriquecimento Bradesco Auto com catalogo versionavel
status: todo
kind: implementation
lifecycle: open
area: api
owner: claude
reviewer: codex
complexity: medium
risk: medium
tdd_required: true
created_at: 2026-05-08
---

# TASK-0046 - Implementar enriquecimento Bradesco Auto com catalogo versionavel

## Context

`TASK-0009` confirmou que os PDFs Bradesco Auto trazem dados suficientes para enriquecer a revisao, PDF e link publico alem do core atual:

- produto/variante (`Tradicional`, `1583 - BRADESCO SEGURO AUTO CLASSIC`, `1776 - SEGURO AUTO LAR`);
- bonus (`Bonus: 02`);
- seguradora/codigo de renovacao (`Cia Renovacao: 544`);
- uso do veiculo (`Uso Veiculo: Particular`);
- clausulas com codigos/nomes de assistencia, vidros, carro reserva e reparos;
- valores de franquia/premio por servico.

O humano tambem confirmou que o catalogo Bradesco muda com o tempo. Exemplo: ja existiu assistencia de 800 km, mas a lista atual visivel mostra 100 km, 200 km, 400 km e ilimitado. Quando `Logomarca` e contratado, o nome/codigo do plano de vidros muda para variantes especificas como `Vidro Protegido Plus Logomarca (151)`.

Portanto, a implementacao nao deve fechar Bradesco em enums rigidos. O PDF deve fornecer fatos brutos; um catalogo estatico versionavel deve fornecer apenas tooltip/descricao e agrupamento.

## Objective

Finalizar Bradesco Auto para carros de passeio, cobrindo Tradicional, Auto Classic e Seguro Auto Lar, com `coverageDetails` preenchido para assistencia, vidros, carro reserva e servicos opcionais, sem incluir moto/caminhao neste ciclo.

## Scope

- Atualizar prompt/extracao Bradesco para retornar:
  - `segment`/produto bruto quando disponivel;
  - `bonusClass`;
  - `vehicleUsage`;
  - dados de renovacao quando seguros;
  - `coverageDetails.assistance` com nome/codigo/plano e km quando extraivel;
  - `coverageDetails.glass` com tier/label bruto;
  - `coverageDetails.replacementVehicle` com label/categoria/dias;
  - `coverageDetails.services` com martelinho, reparo rapido, troca de para-choque, rodas/pneus/suspensao e logomarca vidros quando provado pelo PDF.
- Criar ou adaptar catalogo Bradesco para tooltips/descricoes, aberto a substituicao futura por codigo/nome.
- Atualizar schema/tipos apenas no necessario para representar fatos comprovados.
- Atualizar `buildCoverageDisplay` para renderizar os detalhes Bradesco usando o mesmo padrao Tokio.
- Atualizar PDF gerado e link publico quando eles dependerem de `buildCoverageDisplay`.
- Adicionar testes com amostras derivadas do output `auto_bradesco_extra_fields`.
- Preservar comportamento de Porto, Azul, Itau, Mitsui e Tokio.

## Out Of Scope

- Nao implementar moto, caminhao ou Auto Lar Caminhao.
- Nao criar automacao de renovacao.
- Nao inferir seguradora anterior a partir de `Cia Renovacao` sem tabela/codigo confiavel.
- Nao transformar opcoes Bradesco em enum fechado.
- Nao buscar catalogo atualizado em runtime; catalogo deste ciclo deve ser estatico e versionavel no codigo.
- Nao mudar o fluxo de upload/deteccao de seguradora.

## Likely Files

- `apps/api/src/modules/ai/ai.service.ts`
- `apps/api/src/modules/quotes/domain/schemas/auto-quote.schema.ts`
- `packages/types/src/quote.types.ts`
- `apps/api/src/modules/quotes/application/services/coverage-display.ts`
- `apps/api/src/modules/quotes/application/services/coverage-display.spec.ts`
- `apps/api/src/modules/quotes/application/services/quote-pdf-template.service.ts`
- `apps/dashboard/src/app/(public)/c/[token]/page.tsx`
- `apps/dashboard/src/app/(app)/dashboard/quotes/[processId]/review/page.tsx`

## Executor Context Pack

Read these files first, in order:

1. `.ai/discovery/BRADESCO-AUTO-EXTRA-FIELDS.md`
2. `.ai/pdf-lab/output/auto_bradesco_extra_fields.md`
3. `apps/api/src/modules/quotes/application/services/coverage-display.spec.ts`
4. `apps/api/src/modules/quotes/application/services/coverage-display.ts`
5. `packages/types/src/quote.types.ts`
6. `apps/api/src/modules/ai/ai.service.ts`
7. `apps/api/src/modules/quotes/domain/schemas/auto-quote.schema.ts`

Use `rg` only for these terms before opening more files:

- `coverageDetails`
- `getBradescoAutoPrompt`
- `buildCoverageDisplay`
- `logoMarcaVidros`
- `replacementVehicle`
- `repairShopType`
- `bonusClass`
- `vehicleUsage`
- `Cia Renovacao`
- `Vidro Protegido`
- `Assist Dia/Noite`
- `Auto Reserva`
- `Repare Facil`
- `Rodas Pneus`
- `Troca de Para`

Do not use broad Explore/subagent/codebase-map workflows before reading these files. If more than 6 additional files seem necessary, stop and explain why.

## TDD Requirement

Start by updating/adding tests for Bradesco coverage details before implementation:

- schema accepts the new Bradesco fields;
- `buildCoverageDisplay` renders Bradesco details from `coverageDetails`;
- Bradesco without optional details keeps existing generic behavior;
- catalog tooltip/footnote appears only when backed by known Bradesco catalog entry;
- non-Bradesco fixtures remain unchanged.

## Acceptance Criteria

- [ ] `bonusClass` remains extracted for Bradesco and has regression coverage.
- [ ] `vehicleUsage` or chosen equivalent is represented and validated.
- [ ] Renewal data from `Cia Renovacao` is either represented conservatively or explicitly left as raw/not implemented with tests/documentation.
- [ ] Bradesco Tradicional full sample can express assistencia 200 km, vidro plus logomarca, auto reserva plus 7 dias, martelinho, reparo rapido, troca de para-choque, rodas/pneus/suspensao.
- [ ] Bradesco Classic sample can express assistencia 200 km, vidro plus, martelinho/reparo rapido, and no carro reserva.
- [ ] Bradesco Seguro Auto Lar sample can express assistencia 400 km, vidro plus, auto reserva 7 dias, and residential premium/section is not confused with Auto core coverages.
- [ ] Catalog is open/versionable by code/name and does not require code churn for future assistance km labels like old 800 km.
- [ ] PDF/review/public link show enriched Bradesco details without mixing facts and tooltip/catalog text.
- [ ] Moto/caminhao remain out of scope and unsupported by this task.
- [ ] Relevant unit tests pass.

## Risks

- PDF text order is dense; prompt-only extraction may hallucinate service flags if not constrained to clause names/codes.
- `Cia Renovacao` may be only a code, not human-readable insurer name.
- Auto Lar has residential fields that must not pollute Auto coverage totals.
- Bradesco catalog options change over time; rigid enums would create avoidable maintenance.
- Current sample data contains personal information and must stay in ignored lab/output files, not committed as fixtures with PII.

## Failure Scenario

The generated comparison shows Bradesco as a generic quote even when the PDF proves richer coverages, or worse, shows stale/incorrect service names because catalog options were hardcoded too narrowly.

## Review Findings — Codex P2 (2026-05-08)

Three P2 findings reported: `repareFacil` and `trocaParaChoque` were modeled in types/schema/`buildCoverageDisplay` but never rendered in PDF, public link, or review screen.

### Fix attempt (same session)

- `quote-pdf-template.service.ts`: added `repareFacil` ("Reparo rápido") and `trocaParaChoque` ("Troca de para-choque") to `richServicesGroup()` items array, between `martelinho` and `latariaEPintura`.
- `c/[token]/page.tsx`: added `repareFacil` and `trocaParaChoque` badge spans, same conditional pattern as existing service badges.
- `review/page.tsx`: added `repareFacil` and `trocaParaChoque` `DataRow` entries, same conditional pattern as existing service rows.
- TypeScript compilation clean for both `apps/api` and `apps/dashboard`.
- 105 unit tests passing.

The `not_found` filter in `richServicesGroup` means fields absent from non-Bradesco PDFs remain invisible — no regression for Tokio/Porto.

## Human QA Checklist

- [ ] Upload Bradesco Tradicional completo and confirm enriched details in review.
- [ ] Upload Bradesco Auto Classic and confirm no false carro reserva.
- [ ] Upload Bradesco Auto Lar and confirm residential section does not break Auto display.
- [ ] Generate PDF and confirm assistencia, vidros/logomarca, carro reserva and reparos are readable.
- [ ] Open public link and confirm client-facing labels are useful but do not expose confusing broker-only catalog noise.

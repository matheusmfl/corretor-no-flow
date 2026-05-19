---
id: TASK-0067
title: Agrupar odonto como adicional e reduzir warnings acionaveis no review Saude
status: todo
kind: implementation
lifecycle: open
area: api, dashboard
owner: unassigned
reviewer: codex
complexity: high
risk: medium
tdd_required: true
created_at: 2026-05-19
---

# TASK-0067 - Agrupar odonto como adicional e reduzir warnings acionaveis no review Saude

## Context

No teste real com dois PDFs da Amil para `MARAVILHA CESTAS LTDA`, o review de Saude mostrou 4 opcoes:

- `AMIL S450 QC NAC R COPART TP PJ_PME`
- `DENTAL BRONZE PJ PROMO`
- `Saude Efetivo IV`
- `Dental Conjugado`

Para a corretora, isso parece "4 seguros", mas os itens dentais devem aparecer como adicionais/beneficios da propria cotacao de Saude, nao como opcoes medicas concorrentes na matriz principal.

O mesmo teste gerou 19 avisos, misturando problemas realmente acionaveis com ruido:

- campos `not_found` irrelevantes para dental-only, como acomodacao, coparticipacao e reembolso;
- `Odonto nao identificado` em opcoes medicas, quando isso pode ser apenas ausencia de adicional;
- disclaimers comerciais/atuariais tratados como pendencias urgentes;
- `perLifePrices` ausente mesmo quando o PDF trouxe `ageBandPrices`, deixando a matriz com `--`;
- operadora ausente em `Saude Efetivo IV` / `Dental Conjugado`.

Observacao importante: a TASK-0054 pedia separar Saude e Odonto quando um PDF trouxesse ambos. Essa regra foi util para o primeiro prototipo, mas agora deve ser substituida por uma regra de apresentacao/contrato em que Odonto entra como adicional da cotacao principal, salvo quando o corretor explicitamente tratar como produto dental avulso.

## Objective

Fazer o review Saude apresentar opcoes medicas principais de forma limpa, com Odonto agrupado como adicional, warnings separados por prioridade e matriz preenchida por vida quando houver tabela por faixa etaria suficiente.

## Scope

- Definir uma representacao para adicionais Odonto extraidos de PDF:
  - preferivel: adicionar campo explicito no contrato, por exemplo `addons` ou `dentalAddons`, preservando fonte, total mensal, validade, plano e warnings;
  - aceitavel no MVP: criar helper normalizador que agrupe opcoes dental-only ao renderizar/exportar, sem quebrar dados salvos existentes.
- Detectar `quoteOptions` dental-only com heuristica conservadora:
  - `dental.value` presente ou `planName` claramente dental/odonto;
  - campos medicos principais ausentes ou nao aplicaveis;
  - mesmo arquivo/fonte, mesma operadora ou grupo de upload compativel.
- Exibir os dentais como adicionais da opcao medica correspondente no review, nao como colunas concorrentes da matriz principal.
- Ajustar contadores e textos:
  - "opcoes de plano" deve contar opcoes medicas principais;
  - dentais devem aparecer como adicionais/beneficios, com preco proprio quando houver.
- Reduzir warnings acionaveis:
  - nao gerar alerta urgente para campo medico ausente em dental-only;
  - nao gerar alerta urgente para `dental not_found` em plano medico quando nao houver evidencia de odonto;
  - separar disclaimers comerciais/atuariais de pendencias, exibindo-os como observacoes do plano;
  - manter pendencias reais: base de vidas, operadora desconhecida, validade ausente, inferencias sensiveis usadas como fato.
- Derivar `perLifePrices` a partir de `ageBandPrices` + `lives.age` quando possivel, para preencher matriz e XLSX mesmo quando a IA nao trouxer valores por vida.
- Melhorar resolucao de `carrierOrOperator`:
  - usar texto extraido e nome do arquivo quando houver evidencia forte;
  - se nao houver evidencia forte, manter "Operadora nao identificada" com um unico aviso claro;
  - nao rotular silenciosamente `Saude Efetivo IV` como Amil sem regra validada.
- Garantir que XLSX, PDF e link publico usem a mesma interpretacao ou, no minimo, nao comparem dental-only como plano medico.

## Out Of Scope

- Mapeamento completo de operadoras por produto/codigo.
- OCR ou visao para PDFs sem texto selecionavel.
- Cadastro definitivo de catalogo de produtos Saude/Odonto.
- Detalhamento de rede, carencia, reembolso e analise de risco alem do que ja aparece no PDF.

## Executor Context Pack

Read these files first, in order:

1. `.ai/discovery/HEALTH-QUOTE-ASSISTED-MVP.md`
2. `.ai/tasks/done/TASK-0054-create-health-text-extractor-to-draft.md`
3. `packages/types/src/health-quote-draft.types.ts`
4. `apps/api/src/modules/quotes/application/services/health-quote-draft-extractor.service.ts`
5. `apps/api/src/modules/quotes/application/services/health-spreadsheet-matrix.service.ts`
6. `apps/dashboard/src/app/(app)/dashboard/quotes/health/upload/health-upload.helpers.ts`
7. `apps/dashboard/src/app/(app)/dashboard/quotes/health/review/page.tsx`

Use `rg` only for these terms before opening more files:

- `quoteOptions`
- `dental`
- `ageBandPrices`
- `perLifePrices`
- `carrierOrOperator`
- `AlertsPanel`
- `ComparisonMatrix`
- `buildHealthSpreadsheetMatrix`
- `HealthQuoteDraft`
- `sourceFiles`

Do not use broad Explore/subagent/codebase-map workflows before reading these files. If more than 6 additional files seem necessary, stop and explain why.

## TDD Requirement

Start with tests around pure helpers/services before touching UI:

- dental-only option is grouped as an addon and excluded from main medical option count;
- missing medical fields on dental-only do not become urgent warnings;
- missing dental on medical-only does not become urgent warning unless there is conflicting evidence;
- legal/commercial disclaimers are classified separately from action-required warnings;
- `ageBandPrices` derive `perLifePrices` for all lives covered by the bands;
- unknown operator produces one concise review warning, not repeated noisy labels.

## Implementation Notes (2026-05-19)

### Files created
- `apps/api/src/modules/quotes/application/services/health-dental-classifier.ts` — pure helpers: `isDentalOnlyOption`, `derivePerLifePricesFromAgeBands`, `classifyWarnings`
- `apps/api/src/modules/quotes/application/services/health-dental-classifier.spec.ts` — 28 unit tests (all passing)

### Files modified
- `health-spreadsheet-matrix.service.ts` — dental-only options filtered from plan columns; appear in notes section as `Adicional Odonto —`
- `health-spreadsheet-matrix.service.spec.ts` — 5 new tests for dental filtering (all passing)
- `health-quote-draft-extractor.service.ts` — derives `perLifePrices` from `ageBandPrices` + lives when AI omits per-life values
- `health-quote-draft-extractor.service.spec.ts` — 4 new tests (all passing)
- `apps/dashboard/src/app/(app)/dashboard/quotes/health/review/page.tsx`:
  - `isDentalOnlyOption` helper inline (same heuristic as backend)
  - `isObservationWarning` helper (IOF, SUSEP, ANS, reajuste atuarial, sujeito a…)
  - `AlertsPanel` — skips medical field alerts for dental-only; skips dental-not-found for medical; separates observations into grey "Observações do contrato" section
  - `ComparisonMatrix` — filters dental-only from columns
  - `DentalAddonCard` — new card for dental addons with blue badge
  - `countPendingItems` — excludes irrelevant fields from pending count
  - Option section — "X opções de plano médico" + "Y adicionais odonto" separate sections

### Test results
- 199 health-related API tests passing
- 768 total API tests passing, 0 regressions
- TypeScript compilation: 0 errors

### Fix attempt — Codex review findings (2026-05-19)

**P1a resolved (round 2)** — `buildDraftForExport` reverted to only removing life-composition warnings; it no longer touches `quoteOptions`. Each output does its own grouping via `isDentalOnlyOption`/`isDentalOnlyHealthOption`:
- PDF template: `medicalOptions`/`dentalAddons` split at render time
- Public link page: same split at render time
- XLSX: split in `buildHealthSpreadsheetMatrix`
This ensures dental addons are preserved in the payload and rendered in their correct section in every output.

**P1a (previous attempt, superseded)** — `buildDraftForExport` filtered dental-only from `quoteOptions`. This correctly prevented dental from appearing as competing medical columns, but the dental data never reached the PDF/link renderers. Reverted.
- `health-pdf-template.service.ts`: splits `medicalOptions`/`dentalAddons`, renders dental section separately with all warnings preserved
- `apps/dashboard/.../c/[token]/page.tsx`: same split, dental shown as compact row cards below medical options
- `buildDraftForExport` in review/page.tsx: filters dental-only before passing to PDF/link API calls

**P1b resolved** — Option warnings classified as observations no longer disappear:
- `AlertsPanel`: observation-classified `option.warnings` now collected in `optionObservations` and rendered in the grey "Observações do contrato" section
- `DentalAddonCard`: renders `option.warnings` inline (all, not filtered — dental addon warnings are always relevant to the broker)
- `health-spreadsheet-matrix.service.ts`: already added `opt.warnings` to XLSX notes for dental-only options

**P2 (public link dental card) resolved (round 2)** — Dental addon card in public link page now shows cobertura, validade, e warnings inline.

**P2 (partial derivation) resolved** — Partial derivation now adds a warning to the option:
- `health-quote-draft-extractor.service.ts`: when `derived.length < allLives.length`, pushes "Preço derivado para X de Y beneficiários — Z beneficiário(s) sem faixa etária correspondente; confirme os valores." to `opt.warnings`
- New test covers this scenario (derives partial, checks warning is present)

**Test delta**: 774 API tests passing (6 new vs. previous run), 0 regressions, TypeScript compilation clean.

## Acceptance Criteria

- [ ] Uploading the two MARAVILHA/Amil PDFs shows 2 main medical options, with their dental entries nested as addons or clearly labelled optional dental benefits.
- [ ] The main comparison matrix does not create standalone dental columns unless the broker explicitly chooses to compare dental as a separate product.
- [ ] Matrix rows show per-life values when `ageBandPrices` cover the lives, even if `perLifePrices` was absent from the AI response.
- [ ] The warning count drops to actionable items only; legal/atuarial notes remain visible as plan observations.
- [ ] `Operadora nao identificada` appears at most once per truly unresolved option/group, with a clear call to confirm.
- [ ] XLSX export does not treat dental-only items as competing medical plans.
- [ ] Public link and generated PDF either show the same grouped structure or explicitly hide dental-only comparison until supported.
- [ ] Existing Health MVP tests keep passing.

## QA Notes

- Test with the two PDFs reported by the user:
  - `CotacaoAmil_MARAVILHA_CESTAS_LTDA_COT-3426700.pdf`
  - `MARAVILHA CESTAS LTDA EFETIVO ENF.COM DESC..pdf`
- Test with a PDF that has only medical plan and no dental.
- Test with a genuinely standalone dental quote, if available; if unavailable, create a fixture and keep it out of the main medical matrix by default.
- Test with an unresolved operator and confirm the UI asks for validation without multiplying warnings.

## Open Product Questions

- Confirm whether `Saude Efetivo IV` / product code `TRWE` belongs to Amil or another operator. The sample text seen so far did not contain a strong operator signal, so this should not be hardcoded without validation.
- Decide whether the broker needs a toggle to compare standalone dental products separately later, or whether dental should always be attached to the medical quote in this flow.

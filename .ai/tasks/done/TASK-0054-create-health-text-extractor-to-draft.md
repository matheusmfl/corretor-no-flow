---
id: TASK-0054
title: Criar extrator textual Saude v0 para HealthQuoteDraft
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

# TASK-0054 - Criar extrator textual Saude v0 para HealthQuoteDraft

## Context

Depois da `TASK-0053`, o sistema passa a ter um contrato validado para `HealthQuoteDraft`. O proximo passo do motor e transformar texto extraido de PDFs de Saude em um rascunho revisavel, sem plugar ainda no fluxo final de upload/processamento.

As amostras atuais mostram PDFs textuais de Amil e SulAmerica/Cuidado360 com vidas por faixa, planos, validade, totais, coparticipacao/acomodacao e, as vezes, Saude + Odonto no mesmo PDF.

## Objective

Criar um servico backend puro que recebe texto bruto de PDF de Saude e retorna um `HealthQuoteDraft` validado.

## Scope

- Criar um servico de extracao textual v0, por exemplo `HealthQuoteDraftExtractorService`.
- O servico deve aceitar `rawText` e metadados minimos da fonte.
- Integrar com `AiService` ou criar metodo dedicado nele para extrair `HealthQuoteDraft`, seguindo o padrao atual de extracao/correcao por IA.
- Validar a resposta com `parseHealthQuoteDraft`.
- Preservar `source`, `confidence`, `evidence` e `needsReview` em campos sensiveis.
- Quando o PDF trouxer apenas contagem por faixa etaria, criar vidas placeholder com `source: "inferred"` e `needsReview: true`; nomes/idades/papeis confirmados manualmente entram depois como `source: "manual"`.
- Criar fixtures/snippets de teste baseados em:
  - Amil com `Valor por vida`, `Subtotal`, `TOTAL GERAL`;
  - SulAmerica/Cuidado360 com `Vidas Saude`, `SEM COPARTICIPACAO`, `Direto Nacional Enfermaria`, Saude + Odonto.
- Testar que o PDF com Saude + Odonto vira opcoes/subprodutos separados no draft quando a IA retornar essa estrutura.

## Out Of Scope

- Nao alterar upload/queue.
- Nao salvar em banco.
- Nao gerar planilha.
- Nao criar UI.
- Nao implementar OCR.
- Nao tentar cobrir todas as seguradoras de Saude.

## Likely Files

- `apps/api/src/modules/ai/ai.service.ts`
- `apps/api/src/modules/ai/ai.service.spec.ts`
- `apps/api/src/modules/quotes/domain/schemas/health-quote-draft.schema.ts`
- `apps/api/src/modules/quotes/domain/schemas/health-quote-draft.schema.spec.ts`
- `apps/api/src/modules/quotes/application/services/health-quote-draft-extractor.service.ts`
- `apps/api/src/modules/quotes/application/services/health-quote-draft-extractor.service.spec.ts`
- `.ai/pdf-lab/output/health_varied_quotes_2026_05_13.md`

## Executor Context Pack

Read these files first, in order:

1. `.ai/discovery/HEALTH-QUOTE-ASSISTED-MVP.md`
2. `.ai/pdf-lab/output/health_varied_quotes_2026_05_13.md`
3. `apps/api/src/modules/quotes/domain/schemas/health-quote-draft.schema.ts`
4. `apps/api/src/modules/ai/ai.service.ts`
5. `apps/api/src/modules/ai/ai.service.spec.ts`
6. `apps/api/src/modules/quotes/application/services/porto-auto-extraction.spec.ts`

Use `rg` only for these terms before opening more files:

- `extractQuoteData`
- `correctExtractedData`
- `parseHealthQuoteDraft`
- `Valor por vida`
- `Vidas Saude`
- `SEM COPARTICIPACAO`
- `Direto Nacional Enfermaria`
- `TOTAL GERAL`

Do not use broad Explore/subagent/codebase-map workflows before reading these files. If more than 6 additional files seem necessary, stop and explain why.

## TDD Requirement

Start with tests for the new service and/or `AiService` method. Mock AI responses rather than calling external APIs.

## Acceptance Criteria

- [ ] New service converts mocked AI output into a valid `HealthQuoteDraft`.
- [ ] Prompt/method asks the IA to return `not_found`/`null` when there is no evidence.
- [ ] Sensitive inferred fields require review.
- [ ] Lives derived from age-band counts or OCR/vision are marked for broker review.
- [ ] Amil-style fixture covers age-band values and total.
- [ ] SulAmerica-style fixture covers Saude + Odonto separation.
- [ ] Invalid AI output fails through `parseHealthQuoteDraft`.
- [ ] No current AUTO extraction tests regress.

## Risks

- The extractor may overfit current PDFs if the prompt assumes exact layouts.
- Treating marketing text as contracted benefit can mislead users.
- Adding Health to `AiService` must not make `SUPPORTED_PRODUCTS` imply full upload support yet.

## Failure Scenario

The service returns a loose object or directly creates final quotes, skipping the draft/review layer and making later UX/export work unsafe.

## Human QA Checklist

- [ ] Codex reviews prompt wording for "do not invent" behavior.
- [ ] Human confirms the extracted Amil and SulAmerica fields match the sample PDFs at a high level.

## Fix attempt — revisão Codex P1/P2/P3 (2026-05-13)

**P1 — ageBandCounts validado antes de expandir**
Adicionado `AgeBandCountSchema` (Zod) com `count: z.number().int().min(0)` e refinement `maxAge >= minAge`. O serviço valida o array antes de chamar `buildAgeBandPlaceholders`. Entradas inválidas (count negativo, decimal, inversão de faixa) lançam `UnprocessableEntityException` com mensagem estruturada. Testes adicionados para os 3 casos.

**P2a — guard contra null/primitivo da IA**
O serviço verifica `raw === null || typeof raw !== 'object' || Array.isArray(raw)` antes de acessar `.ageBandCounts`. Se não for objeto plano, passa direto para `parseHealthQuoteDraft(raw)`, que lança `UnprocessableEntityException` com mensagem padronizada (não `TypeError`). Teste adicionado para `raw = null`.

**P2b — HealthMemberLife com source sensível exige needsReview**
`HealthMemberLifeSchema` recebeu `superRefine` reutilizando `isSensitiveSource`. Vida com `source: "inferred"|"ocr"|"vision_inferred"` e `needsReview: false` agora falha no schema. 3 testes adicionados no schema spec.

**P3 — sourceMeta param opcional**
Assinatura mudou para `extract(rawText, sourceMeta?: { sourceFiles?: string[] })`. Quando fornecido, `sourceFiles` do chamador sobrescreve o que a IA devolveu. 2 testes adicionados.

**Resultado:** 74/74 testes passando (extractor: 36, schema Saúde: 27, AiService: 8, schema AUTO: 6, porto-extraction: 7 — incluindo regressões verificadas).

## Fix attempt 2 — findings adicionais (2026-05-13)

**P2 — lives não-array causa TypeError antes do parser**
`raw.lives` podia ser `{}` (ou outro não-array), causando `TypeError` no spread antes de chegar ao `parseHealthQuoteDraft`. Fix: checar `!Array.isArray(raw.lives)` antes do spread; se não for array, passar `merged` (sem `ageBandCounts`) direto ao parser, que rejeita com `UnprocessableEntityException`. Teste adicionado.

**P3 — sourceFiles vazio não sobrescrevia**
`sourceMeta?.sourceFiles?.length` ignorava `[]`, deixando valor inventado pela IA no draft. Fix: condição alterada para `sourceMeta?.sourceFiles !== undefined` — sobrescreve sempre que o parâmetro for fornecido, inclusive com array vazio. Teste adicionado.

**Resultado:** 76/76 testes passando.

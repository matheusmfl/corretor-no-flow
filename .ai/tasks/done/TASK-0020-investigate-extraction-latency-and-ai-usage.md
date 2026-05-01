---
id: TASK-0020
title: Instrumentar tempos da extracao de PDF por seguradora
status: review
kind: implementation
lifecycle: open
area: api
owner: claude
reviewer: codex
complexity: medium
risk: medium
tdd_required: true
created_at: 2026-05-01
---

# TASK-0020 - Instrumentar tempos da extracao de PDF por seguradora

## Context

Na QA, Bradesco processou bem mais devagar que Porto. Tambem surgiu a duvida se Porto envia mensagem para Groq ou se roda 100% deterministico.

Leitura inicial do codigo:

- Bradesco e Porto chamam `AiService.extractQuoteData`, portanto ambos usam Groq para extracao core.
- Pagamentos Bradesco e Porto sao sobrescritos por parsers deterministicos depois do retorno do Groq.
- Porto nao e 100% sem IA hoje.

Esta task nao deve tentar "descobrir" a causa apenas por opiniao. Claude deve entregar instrumentacao de codigo para que a diferenca seja medida em QA.

## Objective

Adicionar instrumentacao de performance no pipeline de extracao para medir, por quote/seguradora, quanto tempo cada etapa leva e quando Groq e usado.

## Scope

- Adicionar timers/logs estruturados por etapa:
  - extracao de texto PDF;
  - chamada Groq core;
  - parser deterministico de pagamentos;
  - validacao Zod;
  - retry/correcao via Groq, se ocorrer;
  - update no banco.
- Incluir insurer/product/quoteId nos logs.
- Incluir tempo total do job.
- Deixar explicito no log quando a chamada Groq e de extracao core vs correcao de JSON.
- Reduzir ou remover log de texto bruto completo do PDF em modo normal para evitar vazamento de dados pessoais; manter no maximo contagem de caracteres/paginas ou log debug seguro.
- Atualizar implementation notes da propria task com exemplos esperados de log.

## Out Of Scope

- Nao remover Groq nesta task.
- Nao criar parser deterministico completo para Bradesco.
- Nao otimizar prompt sem medir antes.
- Nao escrever uma conclusao final sobre a causa da lentidao sem logs reais de QA. Codex/humano farao a analise depois que os logs forem coletados.

## Likely Files

- `apps/api/src/modules/quotes/jobs/extract-pdf.processor.ts`
- `apps/api/src/modules/ai/ai.service.ts`
- `apps/api/src/modules/quotes/jobs/extract-pdf.processor.spec.ts`

## TDD Requirement

Backend task. Tests should cover that instrumentation does not break success/failure flow. If logger timing is hard to assert, keep tests focused on behavior and document manual timing verification.

Minimum expectation:

- Existing extractor processor tests keep passing.
- If a helper/timer function is extracted, add focused unit tests for it.

## Acceptance Criteria

- [ ] Logs show duration per extraction step.
- [ ] Logs include quoteId, insurer, product, step name, durationMs, and totalDurationMs where appropriate.
- [ ] Logs clearly show when Groq is called for extraction and correction.
- [ ] Full raw PDF text is not logged by default.
- [ ] Existing extractor behavior remains unchanged.
- [ ] Tests pass or manual verification is documented.

## Implementation Notes

Instrumentacao adicionada em dois arquivos:

### `ai.service.ts`

`callGroq` agora aceita `label: 'extraction' | 'correction'`. Loga em nivel `LOG` apos cada chamada Groq:

```
[Groq][extraction] durationMs=2341 tokens_in=1823 tokens_out=412
[Groq][correction] durationMs=1987 tokens_in=2100 tokens_out=380
```

`extractQuoteData` passa `label='extraction'`; `correctExtractedData` passa `label='correction'`.
O log verboso do texto bruto do Groq foi removido (era `debug` com o JSON completo da resposta).

### `extract-pdf.processor.ts`

O log antigo que imprimia o rawText completo (`\n${rawText}`) foi substituido por contagem de chars.
Cada etapa agora loga em nivel `DEBUG`:

```
[q1] pdfExtract durationMs=312 chars=8420 maxPage=3
[q1] deterministicParser durationMs=4 found=true
[q1] zodValidate durationMs=2 retried=false
[q1] dbWrite durationMs=18
[TIMING] quoteId=q1 insurer=BRADESCO product=AUTO totalMs=2677
```

Quando retry ocorre (Zod falha e IA corrige):

```
[q1] zodValidate failed durationMs=1 — triggering Groq correction. Error: ...
[q1] groqCorrection durationMs=1987
[q1] zodValidateRetry durationMs=1 retried=true
```

O `[TIMING]` summary e em nivel `LOG` (visivel em producao); os steps individuais sao `DEBUG` (apenas dev/verbose).

### Testes

10/10 testes existentes passando. Nenhuma mudanca de comportamento — apenas adicao de logs.

## Risks

- Logging raw quote content can expose personal data.

## Failure Scenario

The team optimizes the wrong part of the pipeline because the perceived Bradesco latency is not measured.

## Human QA Checklist

- [ ] Process one Bradesco quote.
- [ ] Process one Porto quote.
- [ ] Capture timing logs for both.
- [ ] Ask Codex to compare logs and propose a separate optimization task if needed.

---
id: TASK-0041
title: Sincronizar status do processo apos extracao assíncrona de PDFs
status: todo
kind: implementation
lifecycle: open
area: api
owner: claude
reviewer: codex
complexity: medium
risk: medium
tdd_required: true
created_at: 2026-05-07
---

# TASK-0041 - Sincronizar status do processo apos extracao assíncrona de PDFs

## Context

Quando a API volta a subir, jobs BullMQ pendentes de `extract-pdf` sao executados automaticamente. Isso e bom: a cotacao pode sair de `PROCESSING` para `PENDING_REVIEW` mesmo se o corretor fechou o navegador.

O problema e que o worker persiste `rawText`, `extractedData`, `name` e `Quote.status = PENDING_REVIEW`, mas o `QuoteProcess.status` pode continuar desatualizado. A lista do dashboard roteia por `QuoteProcess.status`, entao o corretor pode nao perceber claramente que existe uma revisao pronta esperando confirmacao.

## Objective

Garantir que o status agregado do processo reflita o estado real das cotacoes apos processamento assíncrono, especialmente quando jobs pendentes rodam depois que o servidor reinicia.

## Scope

- Criar ou reutilizar uma regra de dominio para recalcular `QuoteProcess.status` a partir das quotes do processo.
- Chamar essa regra apos o worker marcar uma quote como `PENDING_REVIEW` ou `FAILED`.
- Garantir que a lista do dashboard consiga levar o corretor para a tela correta quando a extracao terminou em background.
- Cobrir com testes o caso de jobs pendentes processados fora da tela de processamento.

## Out Of Scope

- Nao alterar o parser de PDF.
- Nao alterar prompts de IA.
- Nao redesenhar a tela de processamento ou review.
- Nao implementar notificacoes.
- Nao mexer na `TASK-0022` de rich coverage.

## Likely Files

- `apps/api/src/modules/quotes/jobs/extract-pdf.processor.ts`
- `apps/api/src/modules/quotes/jobs/extract-pdf.processor.spec.ts`
- `apps/api/src/modules/quotes/application/use-cases/list-quotes.use-case.ts`
- `apps/dashboard/src/app/(app)/dashboard/quotes/page.tsx`
- `apps/dashboard/src/lib/quotes/quote-flow-guards.ts`

## Executor Context Pack

Read these files first, in order:

1. `apps/api/src/modules/quotes/jobs/extract-pdf.processor.spec.ts`
2. `apps/api/src/modules/quotes/jobs/extract-pdf.processor.ts`
3. `apps/api/src/modules/quotes/domain/value-objects/quote-status.vo.ts`
4. `apps/api/src/modules/quotes/application/use-cases/list-quotes.use-case.ts`
5. `apps/dashboard/src/app/(app)/dashboard/quotes/page.tsx`
6. `apps/dashboard/src/lib/quotes/quote-flow-guards.ts`

Use `rg` only for these terms before opening more files:

- `QuoteProcessStatus`
- `PENDING_REVIEW`
- `PROCESSING`
- `FAILED`
- `shouldProcessingAutoRedirect`
- `getProcessHref`
- `quoteProcess.update`
- `prisma.quote.update`

Do not use broad Explore/subagent/codebase-map workflows before reading these files. If more than 6 additional files seem necessary, stop and explain why.

## TDD Requirement

Required. Start by adding or updating tests around the worker/process status behavior.

Suggested test cases:

- Quando uma quote termina em `PENDING_REVIEW` e nao ha mais quotes `PROCESSING`, o processo vira `PENDING_REVIEW`.
- Quando uma quote falha e ainda existe outra quote `PROCESSING`, o processo continua `PROCESSING`.
- Quando todas as quotes terminaram e pelo menos uma esta `PENDING_REVIEW`, o processo vira `PENDING_REVIEW`.
- Quando todas as quotes falharam, o processo nao deve ficar em `PROCESSING`; escolher um estado que continue visivel e acionavel para o corretor.
- A regra nao deve sobrescrever `PUBLISHED` ou `ARCHIVED`.

## Acceptance Criteria

- [ ] Worker atualiza o status agregado do processo apos sucesso (`PENDING_REVIEW`).
- [ ] Worker atualiza o status agregado do processo apos falha (`FAILED`) sem deixar processo preso em `PROCESSING`.
- [ ] Processo com qualquer quote ainda `PROCESSING` continua `PROCESSING`.
- [ ] Processo com pelo menos uma quote `PENDING_REVIEW` e nenhuma em `PROCESSING` aparece como `PENDING_REVIEW`.
- [ ] Processo todo falho fica em estado navegavel para o corretor revisar/remover/refazer, sem sumir como `DRAFT`.
- [ ] `PUBLISHED` e `ARCHIVED` nao sao reabertos pelo worker.
- [ ] Testes focados passam.

## Risks

- Atualizar status agregado de forma agressiva pode reabrir processo ja publicado ou arquivado.
- Um processo com todas as cotacoes falhas precisa de comportamento de UI claro, mesmo sem novo enum de status.
- Corrigir apenas backend pode ainda deixar alguma mensagem da UI pouco clara, mas deve melhorar o roteamento principal.

## Failure Scenario

O corretor sobe o servidor depois de uma fila pendente, as cotacoes sao extraidas e ficam salvas em `PENDING_REVIEW`, mas o processo continua com status antigo. Na lista, ele nao percebe que precisa confirmar os dados e o trabalho fica invisivel.

## Human QA Checklist

- [ ] Criar/uploadar um processo com multiplos PDFs e interromper a API antes da fila terminar.
- [ ] Subir a API novamente e aguardar os jobs pendentes terminarem.
- [ ] Abrir a lista de cotacoes e confirmar que o processo aparece como `Revisar`.
- [ ] Entrar no processo e confirmar que os dados extraidos persistiram.
- [ ] Confirmar uma cotacao e seguir para gerar PDF/link sem reprocessar.

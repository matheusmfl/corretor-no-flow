---
id: TASK-0037
title: Corrigir erro ao adicionar PDFs em processo existente e revisar novamente
status: todo
kind: bugfix
lifecycle: open
area: frontend
owner: codex
reviewer: human
complexity: medium
risk: medium
tdd_required: true
created_at: 2026-05-05
blocked_by: TASK-0036
---

# TASK-0037 - Corrigir erro ao adicionar PDFs em processo existente e revisar novamente

## Context

Durante QA humano da `TASK-0036`, o fluxo principal Azul foi validado. Porem apareceu um bug separado:

1. Corretor cria um processo e sobe PDFs Azul Roubo/Furto e Azul Seguro Auto.
2. Avanca para revisao/confirmacao.
3. Volta para a etapa anterior.
4. Sobe mais dois PDFs no mesmo processo.
5. Ao tentar confirmar os dados novamente, a tela mostra `Cotações não encontrada`.

Esse erro parece estar no ciclo de vida/navegacao do processo ou no recarregamento das cotacoes do processo, nao na extracao Azul.

## Objective

Permitir que o corretor volte para upload, adicione mais PDFs ao mesmo processo e retorne para revisao sem cair em `Cotações não encontrada`.

## Scope

- Reproduzir o fluxo de voltar para upload e adicionar PDFs no mesmo processo.
- Verificar se o frontend usa rota/processId/token antigo, cache stale, lista vazia, polling parado ou estado finalizado indevidamente.
- Verificar se o backend permite adicionar quotes a um processo ja existente no status atual.
- Garantir que a tela de review recarrega as cotacoes novas e antigas do mesmo processo.
- Garantir que mensagens de vazio/erro diferenciem `processo inexistente` de `processo existe, mas cotacoes ainda carregando`.

## Out Of Scope

- Alterar extracao Azul.
- Alterar nomenclatura de produto Azul.
- Implementar Mitsui Sumitomo ou Itau.
- Redesenhar o fluxo completo de criacao de processo.

## Likely Files

- `apps/dashboard/src/app/(app)/dashboard/quotes/[processId]/upload/page.tsx`
- `apps/dashboard/src/app/(app)/dashboard/quotes/[processId]/review/page.tsx`
- `apps/dashboard/src/hooks/quotes/use-quote-process.ts`
- `apps/dashboard/src/hooks/quotes/use-upload-quote.ts`
- `apps/api/src/modules/quotes/presentation/quote.controller.ts`
- `apps/api/src/modules/quotes/application/use-cases/upload-auto-quote.use-case.ts`
- `apps/api/src/modules/quotes/application/use-cases/get-quote-process.use-case.ts`

## Executor Context Pack

Do not use broad Explore/subagent/codebase-map workflows before reading these files.

Read these files first, in order:

1. `apps/dashboard/src/app/(app)/dashboard/quotes/[processId]/upload/page.tsx`
2. `apps/dashboard/src/app/(app)/dashboard/quotes/[processId]/review/page.tsx`
3. `apps/dashboard/src/hooks/quotes/use-quote-process.ts`
4. `apps/dashboard/src/hooks/quotes/use-upload-quote.ts`
5. `apps/api/src/modules/quotes/presentation/quote.controller.ts`
6. `apps/api/src/modules/quotes/application/use-cases/upload-auto-quote.use-case.ts`
7. `apps/api/src/modules/quotes/application/use-cases/get-quote-process.use-case.ts`

Use `rg` only for these terms before opening more files:

- `Cotações não encontrada`
- `quotes.length`
- `processId`
- `router.back`
- `router.push`
- `invalidateQueries`
- `refetchInterval`
- `upload`

If more than 6 additional files seem necessary, stop and explain why before continuing.

## TDD Requirement

Obrigatorio. Adicionar ou ajustar testes antes da correcao, preferindo teste de hook/use-case quando o bug estiver isolado.

## Acceptance Criteria

- [ ] Usuario consegue voltar para upload e adicionar PDFs ao mesmo processo.
- [ ] Ao retornar para review, cotacoes antigas e novas aparecem.
- [ ] A tela nao mostra `Cotações não encontrada` para processo existente com cotacoes carregando/processando.
- [ ] Cache/polling/refetch atualizam depois do upload adicional.
- [ ] Erro real de processo inexistente continua aparecendo corretamente.

## Risks

- Corrigir apenas no frontend pode mascarar um estado invalido no backend.
- Cache stale pode reaparecer em navegacao rapida.
- Upload adicional pode criar duplicidade se o usuario reenviar o mesmo PDF.

## Human QA Checklist

- [ ] Criar processo com 2 PDFs Azul.
- [ ] Ir para review.
- [ ] Voltar para upload.
- [ ] Adicionar mais 2 PDFs no mesmo processo.
- [ ] Voltar para review e confirmar que as 4 cotacoes aparecem.
- [ ] Repetir uma vez com Porto ou Bradesco para garantir regressao basica.

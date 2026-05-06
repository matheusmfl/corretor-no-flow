---
id: TASK-0037
title: Corrigir erro ao adicionar PDFs em processo existente e revisar novamente
status: done
kind: bugfix
lifecycle: done
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

- [x] Usuario consegue voltar para upload e adicionar PDFs ao mesmo processo.
- [x] Ao retornar para review, cotacoes antigas e novas aparecem (sem `resetBatch` implicito; cache atualizado apos upload).
- [x] A tela nao mostra estado enganoso de “vazio” como erro fatal — mensagens diferenciadas (processo 404 vs lista vazia).
- [x] Cache/polling/refetch atualizam depois do upload adicional (`invalidateQueries` + `refetchQueries`, `refetchOnMount: 'always'` em processing/review).
- [x] Erro real de processo inexistente continua aparecendo corretamente (404 na review).

## Risks

- Corrigir apenas no frontend pode mascarar um estado invalido no backend.
- Cache stale pode reaparecer em navegacao rapida.
- Upload adicional pode criar duplicidade se o usuario reenviar o mesmo PDF.

## Human QA Checklist

- [x] Criar processo com 2 PDFs Azul.
- [x] Ir para review.
- [x] Voltar para upload.
- [x] Adicionar mais 2 PDFs no mesmo processo.
- [x] Voltar para review e confirmar que as 4 cotacoes aparecem.
- [x] Repetir uma vez com Porto ou Bradesco para garantir regressao basica.

## Implementation notes (ready for review)

**Causa raiz (alinhada ao Codex):** `resetBatch` rodava quando `doneCount === 0` ao voltar na upload (lista local vazia), apagando cotações no servidor; o cache React Query (`staleTime` 60s) mantinha snapshot antigo, levando redirect/review com IDs/listas inconsistentes e confirmações falhando.

**Mudanças:**

- `upload/page.tsx`: padrão é **adicionar** PDFs ao processo. `resetBatch` só se o usuário marcar **“Substituir todas as cotações anteriores por este lote”**. Após uploads OK: `invalidateQueries` + `refetchQueries` antes de `router.push` para processing.
- `use-quote-process.ts`: opção `refetchOnMount` repassada ao `useQuery`.
- `processing/page.tsx`: `refetchOnMount: 'always'`; auto-redirect para review só se `shouldProcessingAutoRedirect` (`!isLoading && !isFetching && allDone && !hasFailures`) para não redirecionar com cache stale durante refetch.
- `review/page.tsx`: `refetchOnMount: 'always'`; estado vazio amigável; erro **404** vs falha genérica.
- `lib/quotes/quote-flow-guards.ts` + `quote-flow-guards.spec.mjs`: testes Node (padrão `base-url.spec.mjs`).

**Testes:** `node src/lib/quotes/quote-flow-guards.spec.mjs` (a partir de `apps/dashboard`). **Build:** `npm run build` em `@corretor/dashboard`.

**Backend:** sem alteração — `upload-auto` já suporta novas cotações no processo.

## Done notes

- QA humano aprovado em 2026-05-05.
- Revisao Codex: fluxo principal coerente com a causa raiz; sem `resetBatch` implicito e com refetch ao retornar para processing/review.
- Ajuste de revisao: ao fechar o aviso de cotacoes existentes, `replaceExisting` volta para `false` para evitar substituicao escondida.

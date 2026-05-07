---
id: TASK-0042
title: Permitir escolher cotacoes incluidas no PDF e link publico
status: todo
kind: implementation
lifecycle: open
area: dashboard
owner: claude
reviewer: codex
complexity: medium
risk: medium
tdd_required: false
created_at: 2026-05-07
---

# TASK-0042 - Permitir escolher cotacoes incluidas no PDF e link publico

## Context

Depois da revisao das cotacoes, o corretor pode nao querer incluir todas as opcoes no PDF/link final. Hoje o fluxo tende a gerar o material com todas as cotacoes confirmadas (`READY`), sem uma etapa clara de curadoria.

Tambem surgiram ideias futuras para checkboxes de comportamento do link, como "mostrar comparativo", mas isso ainda depende de regras de comparacao seguras.

## Objective

Adicionar uma etapa simples antes de gerar PDF/link para o corretor selecionar quais cotacoes confirmadas devem entrar no material final.

## Scope

- Mostrar lista de cotacoes `READY` com checkbox.
- Deixar todas selecionadas por padrao.
- Exigir pelo menos uma cotacao selecionada.
- Enviar ao backend quais quoteIds devem ser usados na geracao.
- Garantir que PDF e link publico usem apenas as cotacoes selecionadas.
- Preparar a UI para opcoes futuras sem implementar comparativo agora.

## Out Of Scope

- Nao implementar destaque comparativo nesta task.
- Nao calcular melhor preco ou melhor cobertura.
- Nao alterar parser/extracao.
- Nao permitir selecionar cotacoes `PENDING_REVIEW` sem confirmacao.

## Likely Files

- `apps/dashboard/src/app/(app)/dashboard/quotes/[processId]/generate/page.tsx`
- `apps/dashboard/src/lib/api/quote-process.api.ts`
- `apps/api/src/modules/quotes/application/use-cases/generate-pdf.use-case.ts`
- `apps/api/src/modules/quotes/application/use-cases/generate-link.use-case.ts`
- `packages/types/src/quote.types.ts`

## Executor Context Pack

Read these files first, in order:

1. `apps/dashboard/src/app/(app)/dashboard/quotes/[processId]/generate/page.tsx`
2. `apps/api/src/modules/quotes/application/use-cases/generate-pdf.use-case.ts`
3. `apps/api/src/modules/quotes/application/use-cases/generate-link.use-case.ts`
4. `apps/api/src/modules/public/application/use-cases/get-public-process.use-case.ts`
5. `apps/dashboard/src/lib/api/quote-process.api.ts`

Use `rg` only for:

- `generatePdf`
- `publishProcess`
- `READY`
- `publicToken`
- `quoteIds`
- `Gerar PDF`

If more than 6 additional files seem necessary, stop and explain why before continuing.

## TDD Requirement

Add backend tests if API payload/use-case behavior changes. Frontend tests are optional if no local component test pattern exists; document manual QA when absent.

## Acceptance Criteria

- [ ] Corretor ve uma lista de cotacoes confirmadas antes de gerar material final.
- [ ] Todas as cotacoes `READY` aparecem selecionadas por padrao.
- [ ] Corretor pode desmarcar cotacoes que nao quer enviar.
- [ ] Nao e possivel gerar PDF/link com zero cotacoes selecionadas.
- [ ] PDF gerado inclui apenas as cotacoes selecionadas.
- [ ] Link publico inclui apenas as cotacoes selecionadas.
- [ ] Espaco para opcoes futuras existe sem ativar comparativo ainda.

## Risks

- Se a selecao for persistida de forma confusa, o corretor pode achar que removeu uma cotacao do processo quando apenas ocultou do material final.
- Alterar `originalFileKey` ou status das quotes erradas pode quebrar download de PDF individual.

## Failure Scenario

O corretor revisa cinco cotacoes, quer enviar apenas tres, mas o sistema publica todas e confunde o cliente.

## Human QA Checklist

- [ ] Confirmar tres cotacoes e gerar material com apenas duas selecionadas.
- [ ] Abrir link publico e confirmar que a terceira nao aparece.
- [ ] Baixar PDF e confirmar que so as selecionadas aparecem.
- [ ] Tentar gerar com zero selecionadas e confirmar bloqueio claro.

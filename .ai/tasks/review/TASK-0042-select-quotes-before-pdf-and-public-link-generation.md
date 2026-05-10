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

## UX Direction

This selection is a valid product decision because it turns the final PDF/public link from "everything that is ready" into a curated sales material. The broker may intentionally hide quotes that are duplicated, commercially weak, confusing, too expensive, or not part of the intended recommendation.

The interaction must be careful not to suggest that a quote is being deleted from the process. A deselected quote should remain visible as an available quote, but clearly marked as not included in the client material.

Important constraint: this control can become visually large when a process has many quotes. Avoid making quote selection dominate the main generation screen. Prefer a compact default experience with the selection available in a settings/advanced area, such as:

- a collapsed section named `Opcoes avancadas do envio`;
- a compact summary like `5 cotacoes prontas - 5 selecionadas`;
- an edit action such as `Escolher cotacoes`;
- a modal, drawer, or expandable panel for the full quote checklist.

The default path should stay fast: all `READY` quotes selected by default, one primary action to generate/publish, and advanced selection only when the broker needs curation.

Suggested micro-interactions:

- Live counter: `3 de 5 cotacoes selecionadas`.
- Disabled generate/publish action when zero quotes are selected.
- Deselected quote remains visible with muted styling and label `Nao sera enviada ao cliente`.
- Quick actions: `Selecionar todas`, `Limpar selecao`.
- Final summary before generation/publication listing the selected insurers/products.
- Reserved space for future link options such as showing comparison, highlighting lowest price, or highlighting broader coverage, without implementing these rules in this task.

## Scope

- Mostrar lista de cotacoes `READY` com checkbox.
- Deixar todas selecionadas por padrao.
- Exigir pelo menos uma cotacao selecionada.
- Enviar ao backend quais quoteIds devem ser usados na geracao.
- Garantir que PDF e link publico usem apenas as cotacoes selecionadas.
- Preparar a UI para opcoes futuras sem implementar comparativo agora.
- Manter a selecao em uma area compacta/avancada para nao gerar uma experiencia pesada com muitas cotacoes.

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
- [ ] A selecao nao domina visualmente a tela quando existem muitas cotacoes; ela aparece como configuracao/opcao avancada, drawer, modal ou painel recolhivel.
- [ ] Cotacoes desmarcadas continuam claramente presentes no processo e sao comunicadas apenas como ocultas do material do cliente.

## Risks

- Se a selecao for persistida de forma confusa, o corretor pode achar que removeu uma cotacao do processo quando apenas ocultou do material final.
- Alterar `originalFileKey` ou status das quotes erradas pode quebrar download de PDF individual.

## Failure Scenario

O corretor revisa cinco cotacoes, quer enviar apenas tres, mas o sistema publica todas e confunde o cliente.

## Review findings addressed

**Finding 1 — Selecao pode divergir entre PDFs e link (P1)**
Corrigido: `QuoteSelector` recebe `locked={pdfsGenerated}`. Apos gerar os PDFs, o componente exibe a selecao como somente-leitura (sem botao "Escolher cotacoes", sem checkboxes interativos, borda verde + label "confirmado"). A selecao nao pode mais mudar antes da publicacao.
Arquivo: `apps/dashboard/src/app/(app)/dashboard/quotes/[processId]/generate/page.tsx`

**Finding 2 — Body de quoteIds nao validado em runtime (P2)**
Corrigido: criado `SelectQuotesDto` com `@IsOptional()`, `@IsArray()`, `@IsString({ each: true })` via class-validator. Controller agora recebe `@Body() body: SelectQuotesDto` nos endpoints `generate` e `publish`. Um body malformado retorna 400 antes de chegar ao use case.
Arquivo: `apps/api/src/modules/quotes/application/dtos/select-quotes.dto.ts`

## Human QA Checklist

- [ ] Confirmar tres cotacoes e gerar material com apenas duas selecionadas.
- [ ] Abrir link publico e confirmar que a terceira nao aparece.
- [ ] Baixar PDF e confirmar que so as selecionadas aparecem.
- [ ] Tentar gerar com zero selecionadas e confirmar bloqueio claro.

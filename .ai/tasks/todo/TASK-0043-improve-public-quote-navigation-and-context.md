---
id: TASK-0043
title: Melhorar navegacao e contexto da cotacao no link publico
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

# TASK-0043 - Melhorar navegacao e contexto da cotacao no link publico

## Context

No link publico final, o cliente consegue abrir uma cotacao, mas pode ficar sem contexto: nao ha uma forma clara de voltar para a lista/comparacao ou navegar para a proxima cotacao. Tambem falta destacar o nome do produto/cotacao na capa ou topo da visualizacao, deixando o cliente sem certeza de qual opcao esta vendo.

## Objective

Melhorar a experiencia do link publico para que o cliente saiba em qual cotacao/produto esta, consiga voltar e consiga transitar entre opcoes sem se perder.

## Scope

- Adicionar nome da cotacao/produto no topo/capa da visualizacao publica de cada cotacao.
- Adicionar acao clara de voltar para a lista/resumo do link publico.
- Adicionar navegacao para cotacao anterior/proxima quando houver multiplas cotacoes.
- Manter CTA de WhatsApp visivel e prioritario.
- Garantir comportamento bom em mobile.

## Out Of Scope

- Nao implementar comparativo automatico.
- Nao alterar extracao/parsers.
- Nao resolver identidade flexivel da `TASK-0027`.
- Nao redesenhar todo o link publico.

## Likely Files

- `apps/dashboard/src/app/(public)/c/[token]/page.tsx`
- `apps/dashboard/src/app/(public)/c/[token]/quote/[quoteId]/route.ts`
- `apps/api/src/modules/public/application/use-cases/get-public-process.use-case.ts`
- `apps/api/src/modules/public/application/use-cases/get-public-quote-html.use-case.ts`

## Executor Context Pack

Read these files first, in order:

1. `apps/dashboard/src/app/(public)/c/[token]/page.tsx`
2. `apps/dashboard/src/app/(public)/c/[token]/quote/[quoteId]/route.ts`
3. `apps/api/src/modules/public/application/use-cases/get-public-process.use-case.ts`
4. `apps/api/src/modules/public/application/use-cases/get-public-quote-html.use-case.ts`
5. `apps/api/src/modules/quotes/application/services/quote-pdf-template.service.ts`

Use `rg` only for:

- `publicToken`
- `quoteId`
- `WhatsApp`
- `quote.name`
- `originalFileKey`
- `html`
- `c/[token]`

If more than 6 additional files seem necessary, stop and explain why before continuing.

## TDD Requirement

Add tests if existing public use-case tests cover response shape. For visual/navigation behavior, document manual QA if no frontend test pattern exists.

## Acceptance Criteria

- [ ] Cliente ve claramente o nome da cotacao/produto que esta aberta.
- [ ] Cliente consegue voltar para a lista/resumo do link publico.
- [ ] Cliente consegue navegar para cotacao anterior/proxima quando houver multiplas.
- [ ] Em link com uma unica cotacao, navegacao anterior/proxima nao aparece ou fica desabilitada.
- [ ] CTA de WhatsApp continua facil de encontrar.
- [ ] Layout mobile nao corta nem sobrepoe botoes/texto.

## Risks

- Excesso de controles pode competir com o CTA principal de WhatsApp.
- Nome de produto ruim/ausente pode expor label tecnica em vez de texto comercial claro.

## Failure Scenario

O cliente abre uma cotacao Tokio Protecao Mensal, nao percebe qual produto esta vendo e nao encontra como voltar para comparar com as outras opcoes.

## Human QA Checklist

- [ ] Abrir link publico com tres cotacoes.
- [ ] Entrar na primeira cotacao e confirmar nome/produto visivel.
- [ ] Navegar para proxima/anterior.
- [ ] Voltar para a lista.
- [ ] Repetir em mobile.

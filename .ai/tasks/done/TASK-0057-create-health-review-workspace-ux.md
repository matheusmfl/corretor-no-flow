---
id: TASK-0057
title: Criar workspace de revisao Saude no dashboard
status: done
kind: implementation
lifecycle: done
area: dashboard
owner: claude
reviewer: codex
complexity: high
risk: medium
tdd_required: false
created_at: 2026-05-13
---

# TASK-0057 - Criar workspace de revisao Saude no dashboard

## Context

O UX final de Saude deve parecer uma mesa de montagem de cotacao, nao uma tela de erro de IA. A corretora deve revisar vidas, opcoes e campos destacados antes de gerar planilha/PDF/link.

Esta task cria uma primeira interface com dados mockados ou fixture local de `HealthQuoteDraft`, antes de integrar upload real.

## Objective

Criar uma tela de revisao Saude v0 no dashboard com:

- resumo das fontes;
- revisao de vidas;
- revisao de opcoes;
- matriz comparativa;
- alertas antes de gerar.

## Scope

- Criar rota/tela isolada de prototipo autenticado ou mock interno.
- Usar dados fixture compatíveis com `HealthQuoteDraft`.
- UX principal:
  - cards de fontes processadas;
  - tabela de vidas editavel visualmente;
  - indicacao visual para vidas criadas por faixa/contagem ou OCR que precisam confirmacao;
  - cards/chips de opcoes de plano;
  - matriz vidas x planos;
  - painel de alertas/warnings;
  - botoes desabilitados/placeholder para gerar planilha, PDF e link.
- Linguagem de produto:
  - "Encontramos X vidas";
  - "Montamos Y opcoes";
  - "Revise os pontos destacados";
  - evitar "erro", "falha", "confidence baixa" como copy principal.

## Out Of Scope

- Nao conectar upload real.
- Nao salvar alteracoes.
- Nao gerar XLSX real.
- Nao criar PDF/link real.
- Nao remodelar o fluxo AUTO.

## Likely Files

- `apps/dashboard/src/app/(app)/dashboard/quotes/new/page.tsx`
- `apps/dashboard/src/app/(app)/dashboard/quotes/[processId]/review/page.tsx`
- `apps/dashboard/src/app/globals.css`
- `apps/dashboard/src/lib/api/quote-process.api.ts`
- `apps/dashboard/src/hooks/quotes/use-quote-process.ts`

## Executor Context Pack

Read these files first, in order:

1. `.ai/discovery/HEALTH-QUOTE-ASSISTED-MVP.md`
2. `.ai/brainstorm/2026-05-13-pesquisa-corretora-saude-prototipo-urgente.md`
3. `apps/dashboard/src/app/(app)/dashboard/quotes/new/page.tsx`
4. `apps/dashboard/src/app/(app)/dashboard/quotes/[processId]/review/page.tsx`
5. `apps/dashboard/src/app/globals.css`
6. `node_modules/next/dist/docs/app/getting-started/project-structure.mdx`

Use `rg` only for these terms before opening more files:

- `Nova cotacao`
- `review`
- `pending_review`
- `useQuoteProcess`
- `Gerar`
- `Upload`
- `HEALTH`
- `Saude`

Do not use broad Explore/subagent/codebase-map workflows before reading these files. If more than 6 additional files seem necessary, stop and explain why.

## TDD Requirement

Frontend task. Add focused tests only if the surrounding dashboard already has a practical test pattern for these pages. Otherwise document manual QA.

## Acceptance Criteria

- [ ] A broker can see the full review workspace using fixture data.
- [ ] Vidas are displayed as rows with name/label, age and relationship.
- [ ] Placeholder/inferred lives are visibly presented as items to confirm, not as final people.
- [ ] Options are displayed as cards/chips with source and review status.
- [ ] Matrix shows values per life and totals per option.
- [ ] Alerts make validity/inference/manual-table risks visible.
- [ ] Buttons for XLSX/PDF/link exist but do not pretend completed integrations.
- [ ] UI is mobile-usable and desktop-readable.

## Risks

- UI can become too complex if it tries to solve every Saude detail at once.
- Mock route can be mistaken for production integration.
- Copy that exposes raw confidence can make the product feel fragile.

## Failure Scenario

The corretora sees a technical extraction screen instead of a fast approval workspace, making the prototype feel like more work than the spreadsheet.

## Human QA Checklist

- [ ] Open the workspace on desktop and mobile.
- [ ] Confirm the flow reads as "aprovar montagem pronta".
- [ ] Confirm warnings are visible but not scary.

## Codex review (pendente fechamento)

Findings originais:

- [P1] `AlertsPanel` recebia só `draft` — após "Confirmar base de vidas", o aviso de vida por faixa continuava. **Corrigido:** `livesConfirmed` + filtro `isLifeBaseCompositionWarning` em `draft.warnings` (mantém avisos de plano/IOF/validade/reembolso/odonto em `quoteOptions` e campos `needsReview`).
- [P2] `ComparisonMatrix` pintava por `life.needsReview` sem saber se a base foi confirmada. **Corrigido:** `livesConfirmed`; highlight âmbar só quando `needsReview && !livesConfirmed`; após confirmação, check verde discreto nas vidas que ainda eram inferidas na matriz.

## Implementation notes

- Rota: `apps/dashboard/src/app/(app)/dashboard/quotes/health/review/page.tsx` (fixture local `FIXTURE`).
- Heurística de aviso de base de vidas: `isLifeBaseCompositionWarning` (PT-BR: faixa/contagem/PDF/beneficiário + criada a partir). Ajustar lista se novos textos de backend entrarem.
- Edição local de vida (`LifeEditForm`) já existia; confirmação em lote desliga highlight na matriz e remove avisos de composição no painel.

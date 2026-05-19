---
id: TASK-0060
title: Criar link navegavel Saude a partir do draft revisado
status: qa
kind: implementation
lifecycle: qa
area: dashboard
owner: claude
reviewer: codex
complexity: high
risk: medium
tdd_required: true
created_at: 2026-05-13
---

# TASK-0060 - Criar link navegavel Saude a partir do draft revisado

## Context

O link navegavel e a terceira saida desejada. Ele deve vir depois da planilha/PDF e usar o mesmo draft revisado, com linguagem consultiva e CTA para a corretora.

## Objective

Criar uma primeira pagina publica Saude baseada em `HealthQuoteDraft`, com comparativo simples, detalhes de vidas/opcoes e avisos.

## Scope

- Criar ou adaptar rota publica para processo/cotacao Saude.
- Renderizar:
  - identidade da corretora;
  - resumo de vidas;
  - cards/opcoes de plano;
  - comparativo de total mensal;
  - detalhes de validade/origem;
  - avisos de campos nao confirmados;
  - CTA de WhatsApp.
- Reusar conceitos do mock `health-preview`, mas usando dados do draft.
- Garantir mobile-first.

## Out Of Scope

- Nao criar simulador de reembolso real.
- Nao listar rede referenciada real sem fonte validada.
- Nao adicionar tracking novo alem do que ja existir.
- Nao resolver OCR.

## Likely Files

- `apps/dashboard/src/app/(public)/health-preview/page.tsx`
- `apps/dashboard/src/app/(public)/health-preview/health-client.tsx`
- `apps/dashboard/src/app/(public)/c/[token]/page.tsx`
- `apps/api/src/modules/public/application/use-cases/get-public-process.use-case.ts`
- `apps/api/src/modules/public/application/dtos/public-process-response.dto.ts`
- `apps/api/src/modules/public/presentation/public.controller.ts`

## Executor Context Pack

Read these files first, in order:

1. `.ai/discovery/BRADESCO-HEALTH-PUBLIC-PREVIEW-MVC.md`
2. `.ai/discovery/HEALTH-QUOTE-ASSISTED-MVP.md`
3. `apps/dashboard/src/app/(public)/health-preview/page.tsx`
4. `apps/dashboard/src/app/(public)/health-preview/health-client.tsx`
5. `apps/dashboard/src/app/(public)/c/[token]/page.tsx`
6. `apps/api/src/modules/public/application/use-cases/get-public-process.use-case.ts`
7. `node_modules/next/dist/docs/app/getting-started/project-structure.mdx`

Use `rg` only for these terms before opening more files:

- `health-preview`
- `public`
- `token`
- `WhatsApp`
- `QuoteProcess`
- `HealthQuoteDraft`
- `warnings`
- `validUntil`

Do not use broad Explore/subagent/codebase-map workflows before reading these files. If more than 6 additional files seem necessary, stop and explain why.

## TDD Requirement

Backend public DTO/use-case changes require tests. Frontend should add focused tests when existing pattern allows; otherwise create a human QA checklist.

## Acceptance Criteria

- [ ] Public Health page renders from reviewed draft data.
- [ ] Mobile layout is usable.
- [ ] Totals and plan options match the reviewed draft.
- [ ] Warnings/validity are visible.
- [ ] CTA to broker is present.
- [ ] No unconfirmed network/reimbursement/carencia is presented as fact.

## Risks

- The link can drift from XLSX/PDF if it recomputes values separately.
- Health UI can become too text-heavy.
- Client-facing copy can imply guarantees not present in the source.

## Failure Scenario

The public link looks helpful but says more than the reviewed draft supports, creating sales and compliance risk.

## Human QA Checklist

- [ ] Open link on mobile viewport.
- [ ] Compare totals with XLSX/PDF.
- [ ] Confirm warning/caution copy is present but not overwhelming.

## Implementation notes (2026-05-14)

- **Public page:** ramo `process.product === 'HEALTH'` em `apps/dashboard/src/app/(public)/c/[token]/page.tsx` — `HealthPublicView` com `draft` de `quotes[0]?.extractedData`, header/footer alinhados ao fluxo auto, WhatsApp e validade.
- **Publicar draft:** backend `publish-health-draft` + `quoteProcessApi.publishHealthDraft` + hook `usePublishHealthDraft` (ja existentes).
- **Dashboard:** `ActionBar` em `apps/dashboard/src/app/(app)/dashboard/quotes/health/review/page.tsx` — botao **Gerar link** chama `publishLink(buildDraftForExport(draft, livesConfirmed))` (mesmo payload conceitual que XLSX/PDF); estados loading/success/error; apos sucesso mostra URL com **Copiar** e **Abrir**.
- **Testes:** `npx eslint src/app/(app)/dashboard/quotes/health/review/page.tsx` no pacote `@corretor/dashboard` (exit 0). Criterios de aceitacao e checklist humano permanecem para revisao/QA.

## Codex follow-up (2026-05-14)

- [P1 corrigido] `HealthOptionCard` agora trata os 5 campos sensiveis (`accommodation`, `coparticipation`, `reimbursementMode`, `dental`, `validUntil`) como nao confirmados quando `needsReview=true`.
- [P1 corrigido] Campos sensiveis pendentes nao entram mais como chips factuais no link publico; aparecem em copy de consulta ao corretor.
- [P2 corrigido] O ramo publico de Saude agora faz um guard estrutural minimo antes de renderizar `quotes[0].extractedData` como `HealthQuoteDraft`.

## Codex final review (2026-05-14)

**Veredito:** mover para `qa`.

**Findings:** nenhum P0/P1/P2 de código ficou aberto após os fixes acima. O link público renderiza a partir do draft publicado, mostra identidade da corretora, vidas, opções, origem, totais, avisos, validade quando confirmada, CTA de WhatsApp e cautela sobre rede/carência/reembolso.

**Motivo para QA:** os critérios "mobile layout is usable", "totals match reviewed draft" e "CTA/link público abre sem login" precisam de validação em browser com servidor/API local e um token publicado real.

**QA checklist:**

- [ ] Abrir um link Saúde gerado por `publishHealthDraft`.
- [ ] Validar mobile viewport e desktop estreito.
- [ ] Conferir que campos `needsReview=true` aparecem como "não confirmados" e não como chips factuais.
- [ ] Comparar totais do link com a review e com XLSX/PDF.
- [ ] Confirmar CTA WhatsApp com telefone e texto corretos.

**Validação técnica:** lint direcionado de `apps/dashboard/src/app/(public)/c/[token]/page.tsx` passou; testes API relacionados a publish passaram.

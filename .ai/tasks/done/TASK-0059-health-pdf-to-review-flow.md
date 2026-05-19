---
id: TASK-0059
title: Caminho PDF da seguradora ate Review Saude
status: done
kind: implementation
lifecycle: done
area: api, dashboard
owner: claude
reviewer: codex
complexity: high
risk: medium
tdd_required: true
created_at: 2026-05-13
---

# TASK-0059 - Caminho PDF → Review Saúde

## Objective

Conectar o fluxo principal: upload de PDF → extração → workspace de revisão com dados reais.

## Acceptance Criteria

- [x] Backend: `ExtractHealthDraftUseCase` (TDD, 5 testes) + endpoint `POST /quotes/health/extract-draft`.
- [x] Arquivo PDF deletado após extração (LGPD, finally block).
- [x] Frontend: página `/health/upload` com dropzone para PDF único.
- [x] API client: `quoteProcessApi.extractHealthDraft(file)` via fetch raw.
- [x] Draft retornado salvo em `sessionStorage` sob chave `health-draft-pending`.
- [x] Review page lê sessionStorage ao montar; remove a chave após leitura; cai na fixture se ausente.
- [x] Nota de protótipo só aparece quando review usa fixture.

## Implementation Notes (2026-05-13)

**Backend:**
- `extract-health-draft.use-case.ts` — chains `PdfExtractorService` + `HealthQuoteDraftExtractorService`
- `extract-health-draft.use-case.spec.ts` — 5 testes
- `quote.controller.ts` — `POST quotes/health/extract-draft` (FileInterceptor, finally unlink)
- `quotes.module.ts` — provider registrado
- `quote.controller.spec.ts` — mock adicionado; 706/706 passando

**Frontend:**
- `apps/dashboard/src/app/(app)/dashboard/quotes/health/upload/page.tsx` — dropzone single-file, estados idle/extracting/error
- `apps/dashboard/src/lib/api/quote-process.api.ts` — `extractHealthDraft()`
- `apps/dashboard/src/app/(app)/dashboard/quotes/health/review/page.tsx` — `loadDraftFromSession()`, `baseDraft` state, nota de fixture condicional

**Fluxo:**
`/health → /health/upload → POST /quotes/health/extract-draft → sessionStorage → /health/review`

## Codex review (2026-05-13)

**Veredito:** escopo da TASK-0059 atendido (use case + 5 testes, `finally` com `unlink`, upload → `sessionStorage` → review, `extractHealthDraft` via fetch, nota de fixture condicional).

**Correção aplicada na revisão (P1):** o review usava `removeItem` dentro do inicializador do `useState` com `loadDraftFromSession`. Em **React Strict Mode (dev)**, inicializadores podem executar mais de uma vez, esgotando o `sessionStorage` na primeira passagem e fazendo a segunda cair na **fixture**. Ajuste: `readDraftFromSessionStorage` só lê; `useEffect` com `[]` remove a chave após montar.

**P2 (manutenção):** constante `health-draft-pending` duplicada entre `upload/page.tsx` e `review/page.tsx` — considerar um módulo `health-draft-session.ts` compartilhado.

**P3:** `extractHealthDraft` não reutiliza `getDashboardEnvironmentHeaders()` (inconsistência com o restante do client); PDF só validado por extensão no browser — aceitável para o protótipo.

**Fora de escopo (0060+):** link público Saúde, persistência de processo, validação client com Zod do draft.

## Codex final review (2026-05-14)

**Veredito:** aprovado para `done`.

**Findings:** nenhum P0/P1/P2 novo. O endpoint `POST /quotes/health/extract-draft` descarta o arquivo no `finally`, o use case encadeia `PdfExtractorService` + `HealthQuoteDraftExtractorService`, o upload salva o draft em `sessionStorage`, e a review lê sem consumir a chave no inicializador do React.

**Notas residuais:** a chave `health-draft-pending` segue duplicada entre upload e review como P2 de manutenção, mas não bloqueia o MVP.

**Validação:** `extract-health-draft.use-case.spec.ts` passou; lint direcionado de `health/upload/page.tsx` e `health/review/page.tsx` passou.

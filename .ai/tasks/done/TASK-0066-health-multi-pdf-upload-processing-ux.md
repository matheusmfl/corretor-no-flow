---
id: TASK-0066
title: Melhorar upload multipdf Saude com etapa de processamento e erros claros
status: done
kind: implementation
lifecycle: done
area: dashboard
owner: codex
reviewer: codex
complexity: medium
risk: medium
tdd_required: true
created_at: 2026-05-14
---

# TASK-0066 - Melhorar upload multipdf Saude com etapa de processamento e erros claros

## Context

O fluxo atual de upload Saude aceita apenas um PDF, dispara extração diretamente e mostra mensagens técnicas quando a API falha. Para demonstração do MVP, a corretora precisa conseguir soltar vários PDFs, acompanhar o processamento e entender falhas sem ler erro bruto de backend.

## Objective

Transformar `/dashboard/quotes/health/upload` em um fluxo de upload múltiplo com etapa de processamento visível, mensagens de erro mais humanas e envio do draft combinado para a review.

## Scope

- Aceitar seleção/drag-and-drop de múltiplos arquivos PDF.
- Listar arquivos selecionados com remoção individual.
- Exibir etapa de processamento com status por arquivo.
- Processar cada PDF pelo endpoint existente `quoteProcessApi.extractHealthDraft(file)`.
- Combinar drafts extraídos em um único `HealthQuoteDraft` para a tela de review.
- Melhorar mensagens de erro no frontend, evitando expor mensagens técnicas como `property draft should not exist`.

## Out Of Scope

- Criar endpoint backend multiparte novo.
- Persistência definitiva de batch/processamento.
- OCR de PDF imagem.
- Resolver divergência complexa de vidas entre PDFs; para MVP, usar a primeira base de vidas e adicionar warnings quando outros PDFs divergirem.

## Executor Context Pack

Read these files first, in order:

1. `.ai/discovery/HEALTH-QUOTE-ASSISTED-MVP.md`
2. `.ai/tasks/done/TASK-0059-health-pdf-to-review-flow.md`
3. `apps/dashboard/src/app/(app)/dashboard/quotes/health/upload/page.tsx`
4. `apps/dashboard/src/app/(app)/dashboard/quotes/health/review/page.tsx`
5. `apps/dashboard/src/lib/api/quote-process.api.ts`

Use `rg` only for these terms before opening more files:

- `HEALTH_DRAFT_SESSION_KEY`
- `extractHealthDraft`
- `sessionStorage`
- `HealthUploadPage`
- `quoteOptions`
- `warnings`

## Acceptance Criteria

- [x] Dropzone and file picker accept more than one PDF.
- [x] Invalid non-PDF files produce a friendly inline warning.
- [x] Selected PDFs are visible before processing and can be removed.
- [x] Processing step shows per-file status: pending, processing, done, error.
- [x] Successful multiple drafts are merged and sent to review.
- [x] If one or more files fail, the user sees which failed and can retry or continue with successful files.
- [x] Error copy is product-friendly and avoids raw backend jargon.

## Review Notes

- Confirm this task does not implement the manual table/todo flow.
- Confirm it does not create a new backend endpoint.

## Implementation Notes (2026-05-14)

- `apps/dashboard/src/app/(app)/dashboard/quotes/health/upload/health-upload.helpers.ts`
  - `describeFileSelection` aceita múltiplos PDFs, ignora duplicados e rejeita não-PDF com aviso amigável.
  - `buildCombinedHealthDraft` combina opções de múltiplos drafts, preserva a primeira base de vidas e adiciona warning se outra base divergir.
  - `friendlyHealthUploadError` traduz erros técnicos em mensagens de produto.
- `apps/dashboard/src/app/(app)/dashboard/quotes/health/upload/page.tsx`
  - Dropzone e input agora usam `multiple`.
  - Lista arquivos selecionados com remoção individual.
  - Exibe status por arquivo: fila, processando, pronto, atenção.
  - Processa PDFs sequencialmente pelo endpoint existente `extractHealthDraft`.
  - Permite tentar falhas novamente ou continuar com PDFs processados.

## Codex self-review (2026-05-14)

**Findings:** nenhum P0/P1/P2 após revisão.

- Escopo respeitado: não criou endpoint novo, não implementou task de cotação manual/tabela.
- UX melhorada: a tela agora tem etapa explícita de processamento e não despeja erro técnico cru para a corretora.
- Risco residual: merge de múltiplos PDFs usa a primeira base de vidas como referência. Quando outra base diverge, adiciona warning para confirmação na review, em vez de tentar resolver automaticamente.

**Validação:**

- `tsc --noEmit --project apps/dashboard/tsconfig.json` passou.
- `eslint` direcionado de `health/upload/page.tsx` e `health-upload.helpers.ts` passou.

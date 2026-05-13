---
id: TASK-0058
title: Conectar rascunho Saude a geracao de planilha no dashboard
status: todo
kind: implementation
lifecycle: open
area: dashboard
owner: claude
reviewer: codex
complexity: high
risk: medium
tdd_required: true
created_at: 2026-05-13
---

# TASK-0058 - Conectar rascunho Saude a geracao de planilha no dashboard

## Context

Com o contrato, extrator, motor de tabela e exportador XLSX criados, o fluxo urgente precisa permitir que a corretora gere uma planilha a partir do rascunho revisado.

## Objective

Criar o caminho minimo para disparar geracao/download de XLSX Saude a partir do workspace de revisao.

## Scope

- Criar endpoint/use-case backend para gerar XLSX a partir de um `HealthQuoteDraft` recebido ou fixture persistida conforme arquitetura existente.
- Criar hook/API client no dashboard.
- Conectar botao `Gerar planilha`.
- Exibir estado de loading/sucesso/erro.
- Garantir que warnings/review pendente bloqueiem ou peçam confirmacao antes de gerar, conforme regra definida no contrato.

## Out Of Scope

- Nao criar persistencia completa de HealthQuoteDraft se ainda nao existir decisao de banco.
- Nao integrar upload real se isso exigir mexer no processor.
- Nao gerar PDF/link.
- Nao resolver OCR.

## Likely Files

- `apps/api/src/modules/quotes/presentation/quote.controller.ts`
- `apps/api/src/modules/quotes/quotes.module.ts`
- `apps/api/src/modules/quotes/application/services/health-xlsx-export.service.ts`
- `apps/dashboard/src/lib/api/quote-process.api.ts`
- `apps/dashboard/src/hooks/quotes/use-generate-pdf.ts`
- `apps/dashboard/src/app/(app)/dashboard/quotes/[processId]/review/page.tsx`

## Executor Context Pack

Read these files first, in order:

1. `.ai/tasks/todo/TASK-0056-build-health-spreadsheet-matrix-and-xlsx-export.md`
2. `apps/api/src/modules/quotes/presentation/quote.controller.ts`
3. `apps/api/src/modules/quotes/application/use-cases/generate-pdf.use-case.ts`
4. `apps/dashboard/src/lib/api/quote-process.api.ts`
5. `apps/dashboard/src/hooks/quotes/use-generate-pdf.ts`
6. `apps/dashboard/src/app/(app)/dashboard/quotes/[processId]/review/page.tsx`

Use `rg` only for these terms before opening more files:

- `generate-pdf`
- `Blob`
- `download`
- `review`
- `HealthQuoteDraft`
- `health-xlsx`
- `needsReview`
- `warnings`

Do not use broad Explore/subagent/codebase-map workflows before reading these files. If more than 6 additional files seem necessary, stop and explain why.

## TDD Requirement

Backend endpoint/use-case must have tests. Frontend hook should follow existing testing pattern if present.

## Acceptance Criteria

- [ ] Backend can return an XLSX download payload for a valid Health draft.
- [ ] Drafts with required unresolved review warnings are blocked or require explicit confirmation.
- [ ] Dashboard button downloads a file with a sensible filename.
- [ ] Loading/error/success states are visible.
- [ ] AUTO PDF generation remains unaffected.

## Risks

- Implementing download against unpersisted draft may need a temporary API shape.
- Blocking too aggressively may hurt prototype speed; allowing too much may send unreviewed data.

## Failure Scenario

The user clicks "Gerar planilha" and gets a file that excludes warnings or includes unreviewed inferred values without any confirmation.

## Human QA Checklist

- [ ] Generate XLSX from the workspace.
- [ ] Open the XLSX and compare totals against the on-screen matrix.
- [ ] Confirm warnings are represented before or inside the output.


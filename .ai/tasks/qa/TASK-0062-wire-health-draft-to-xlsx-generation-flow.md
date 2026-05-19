---
id: TASK-0062
title: Conectar rascunho Saude a geracao de planilha no dashboard
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

# TASK-0062 - Conectar rascunho Saude a geracao de planilha no dashboard

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

## Acceptance Criteria

- [x] Backend can return an XLSX download payload for a valid Health draft.
- [x] Drafts with required unresolved review warnings are blocked or require explicit confirmation.
- [x] Dashboard button downloads a file with a sensible filename.
- [x] Loading/error/success states are visible.
- [x] AUTO PDF generation remains unaffected.

## Implementation Notes (2026-05-13)

Arquivos criados/modificados:

**Backend**
- `apps/api/src/modules/quotes/application/use-cases/generate-health-xlsx.use-case.ts` — valida pendências, delega para `HealthXlsxExportService`; 9 testes TDD passando
- `apps/api/src/modules/quotes/application/use-cases/generate-health-xlsx.use-case.spec.ts`
- `apps/api/src/modules/quotes/application/dtos/generate-health-xlsx.dto.ts`
- `apps/api/src/modules/quotes/presentation/quote.controller.ts` — `POST /quotes/health/generate-xlsx`, exige `body.draft` explicitamente (P2 corrigido)
- `apps/api/src/modules/quotes/quotes.module.ts` — provider registrado
- `apps/api/src/modules/quotes/presentation/quote.controller.spec.ts` — mock adicionado

**Frontend**
- `apps/dashboard/src/lib/api/quote-process.api.ts` — `generateHealthXlsx()` via fetch raw com `credentials: include`, retorna Blob
- `apps/dashboard/src/hooks/quotes/use-generate-health-xlsx.ts` — hook com estados `idle|loading|success|error`; anchor appendado ao body antes do click e URL revogada com `setTimeout(10s)` (P3 corrigido)
- `apps/dashboard/src/app/(app)/dashboard/quotes/health/review/page.tsx` — `ActionBar` conectada; `buildDraftForExport` respeita `livesConfirmed` (P1 corrigido); `draft.warnings` filtrado ao exportar quando base confirmada (P1 corrigido)

**Correções Codex (P1/P2/P3)**

- [P1] `livesConfirmed=true` agora marca todas as vidas como `needsReview: false` via `buildDraftForExport` antes do export; `countPendingItems` zera pendências de vidas quando base confirmada
- [P1] `draft.warnings` (avisos de composição de base) removidos do draft exportado quando `livesConfirmed=true`; `quoteOption.warnings` de plano permanecem
- [P2] Controller agora exige `body.draft` explicitamente e lança `BadRequestException` se ausente
- [P3] `<a>` é appendado ao `document.body` antes do click e removido após; URL revogada com `setTimeout(10_000)` em vez de imediatamente

## Codex final review (2026-05-14)

**Veredito:** mover para `qa`.

**Findings:** nenhum P0/P1/P2 de código ficou aberto. O bug de auditoria foi corrigido: confirmar a base não transforma vidas `inferred|ocr|vision_inferred` em `manual`; o XLSX usa `forceGenerate=true` quando a base foi aceita e ainda há vidas tecnicamente pendentes.

**Motivo para QA:** o aceite inclui download no browser e abertura do XLSX para comparar abas/valores/notas. Os testes cobrem o use case e matriz, mas não substituem a validação do arquivo baixado pelo botão real.

**QA checklist:**

- [ ] Na review, clicar "Confirmar base de vidas" e depois "Gerar planilha".
- [ ] Confirmar que o download `.xlsx` acontece.
- [ ] Abrir a planilha e conferir aba "Cotação", aba "Notas", totais e labels das vidas.
- [ ] Confirmar que warnings de composição de vidas somem quando a base foi confirmada.
- [ ] Confirmar que warnings de plano/validade/reembolso/odonto permanecem.

**Validação técnica:** `generate-health-xlsx.use-case.spec.ts`, schema de Saúde e controller spec passaram; lint direcionado do dashboard passou.

## Human QA Checklist

## Codex follow-up (2026-05-14)

- [P1 corrigido] A versão revisada preserva `source` e `needsReview` das vidas confirmadas para auditoria. A confirmação em lote agora só remove warnings de composição da base do payload exportado e envia `forceGenerate=true` ao XLSX quando existem vidas aceitas que continuam tecnicamente marcadas como `needsReview`.
- Observação: as notas de implementação antigas acima mencionam marcar vidas como `needsReview:false`; considere essa descrição substituída por este follow-up.

- [ ] Generate XLSX from the workspace.
- [ ] Open the XLSX and compare totals against the on-screen matrix.
- [ ] Confirm warnings are represented before or inside the output.
- [ ] Confirm that after clicking "Confirmar base de vidas", "Gerar planilha" gera sem pedir forceGenerate para vidas.
- [ ] Confirm que warnings de composição de vidas NÃO aparecem na aba Notas do XLSX após confirmação.
- [ ] Confirm que campos de plano pendentes (ex: reimbursementMode inferred) ainda pedem confirmação.

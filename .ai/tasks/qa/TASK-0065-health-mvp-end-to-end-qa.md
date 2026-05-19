---
id: TASK-0065
title: QA end-to-end do MVP Saude
status: qa
kind: qa
lifecycle: open
area: api, dashboard
owner: unassigned
reviewer: codex
complexity: medium
risk: high
tdd_required: false
created_at: 2026-05-14
---

# TASK-0065 - QA end-to-end do MVP Saude

## Context

As tarefas de contrato, extracao, review, XLSX, PDF e link publico foram implementadas em etapas separadas. Antes de demonstrar o produto, precisamos validar o caminho inteiro como uma corretora usaria.

## Objective

Executar QA funcional do MVP Saude do upload ate as tres saidas: planilha, PDF e link publico.

## Scope

- Subir API e dashboard em ambiente local.
- Fazer upload de fixture PDF Saude.
- Validar tela de review com vidas, planos, warnings e confirmacao de base.
- Gerar XLSX e abrir/verificar conteudo basico.
- Gerar PDF e verificar linguagem/valores.
- Gerar link publico e validar mobile/desktop.
- Registrar bugs com prioridade e evidencia.

## Out Of Scope

- Corrigir todos os bugs encontrados dentro desta task.
- Testar OCR de PDF imagem.
- Validar tabelas comerciais reais de todas as operadoras.
- Criar automacao Playwright completa, salvo se ja houver harness pronto.

## Executor Context Pack

Read these files first, in order:

1. `.ai/discovery/HEALTH-QUOTE-ASSISTED-MVP.md`
2. `.ai/tasks/review/TASK-0058-health-assistant-start-page.md`
3. `.ai/tasks/review/TASK-0059-health-pdf-to-review-flow.md`
4. `.ai/tasks/review/TASK-0060-create-health-public-link-from-reviewed-draft.md`
5. `.ai/tasks/review/TASK-0062-wire-health-draft-to-xlsx-generation-flow.md`
6. `apps/dashboard/src/app/(app)/dashboard/quotes/health/review/page.tsx`
7. `apps/api/src/modules/quotes/presentation/quote.controller.ts`

Use `rg` only for these terms before opening more files:

- `extractHealthDraft`
- `generateHealthXlsx`
- `generateHealthPdf`
- `publishHealthDraft`
- `health/upload`
- `buildDraftForExport`
- `process.product === 'HEALTH'`

## Acceptance Criteria

- [ ] Upload PDF Saude chega na review sem fixture fallback indevido.
- [ ] Confirmar base de vidas remove alertas de composicao, sem esconder warnings de plano.
- [ ] XLSX baixa e abre com aba de cotacao e notas.
- [ ] PDF baixa e nao apresenta campos pendentes como fatos.
- [ ] Link publico abre sem login e mostra warnings/validade/CTA.
- [ ] Mobile viewport nao apresenta sobreposicao visual relevante.
- [ ] Bugs encontrados sao registrados com prioridade e caminho de reproducao.

## QA Notes

- Incluir pelo menos um caso com vida inferida por faixa.
- Incluir pelo menos um campo sensivel `needsReview=true`.
- Comparar total mensal na review, XLSX, PDF e link publico.

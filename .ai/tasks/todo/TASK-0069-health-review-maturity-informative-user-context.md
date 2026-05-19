---
id: TASK-0069
title: Maturar review Saude com contexto util e campos ausentes explicaveis
status: todo
kind: implementation
lifecycle: open
area: dashboard, api
owner: unassigned
reviewer: codex
complexity: high
risk: medium
tdd_required: true
created_at: 2026-05-19
---

# TASK-0069 - Maturar review Saude com contexto util e campos ausentes explicaveis

## Context

Depois dos primeiros testes reais, a tela de review Saude ja monta vidas, totais, matriz e adicionais odonto. Ainda assim, o usuario sente que "informa muito pouco" porque a interface mostra varios `nao identificado` sem explicar se aquilo e:

- um dado ausente no PDF;
- um dado nao aplicavel para aquele produto;
- uma inferencia insegura;
- uma observacao comercial normal;
- uma pendencia que realmente precisa de acao.

Exemplo real: `Saude Efetivo IV` mostra preco por vida e total, mas continua com acomodacao/coparticipacao ausentes, operadora desconhecida e pouco contexto sobre o que falta confirmar.

## Objective

Transformar o review Saude de uma tela de campos crus em um workspace de revisao assistida: mostrar ao corretor o que foi extraido com confianca, o que nao veio no PDF, o que e opcional, e quais acoes precisam ser tomadas antes de gerar saidas.

## Scope

- Criar um modelo de apresentacao para campos de Saude:
  - `confirmed`: valor extraido/confiavel;
  - `needs_confirmation`: valor inferido/sensivel;
  - `missing_in_pdf`: campo relevante, mas nao encontrado;
  - `not_applicable`: campo nao aplicavel ao tipo de opcao;
  - `optional_absent`: ausencia normal, sem warning urgente.
- Revisar `AlertsPanel`, `OptionCard`, `DentalAddonCard` e `ComparisonMatrix` para usar essa classificacao.
- Trocar chips genericos `nao identificado` por mensagens mais informativas:
  - `Nao veio no PDF`
  - `Confirmar com a operadora`
  - `Nao aplicavel ao adicional odonto`
  - `Odonto nao informado`
- Criar um resumo por opcao:
  - `Pronto para comparar`
  - `Precisa confirmar operadora`
  - `Faltam dados comerciais`
  - `Valores por vida derivados por faixa`
- Separar visualmente:
  - pendencias que bloqueiam confianca;
  - observacoes comerciais/legais;
  - lacunas normais do PDF.
- Corrigir textos e pluralizacao, incluindo o caso `2 opçãoões`.

## Out Of Scope

- Mapear rede credenciada/carencia real de cada operadora.
- Criar cadastro de produtos.
- Resolver OCR.
- Alterar o contrato persistido se helpers de apresentacao resolverem o MVP.

## Executor Context Pack

Read these files first, in order:

1. `.ai/discovery/HEALTH-QUOTE-ASSISTED-MVP.md`
2. `.ai/tasks/review/TASK-0067-health-dental-addons-and-actionable-review-warnings.md`
3. `packages/types/src/health-quote-draft.types.ts`
4. `apps/api/src/modules/quotes/application/services/health-dental-classifier.ts`
5. `apps/dashboard/src/app/(app)/dashboard/quotes/health/review/page.tsx`
6. `apps/dashboard/src/app/(public)/c/[token]/page.tsx`
7. `apps/api/src/modules/quotes/application/services/health-pdf-template.service.ts`

Use `rg` only for these terms before opening more files:

- `AlertsPanel`
- `OptionCard`
- `DentalAddonCard`
- `FieldChip`
- `not_found`
- `needsReview`
- `SENSITIVE_OPTION_FIELDS`
- `isObservationWarning`
- `opção`
- `ComparisonMatrix`

Do not use broad Explore/subagent/codebase-map workflows before reading these files. If more than 6 additional files seem necessary, stop and explain why.

## TDD Requirement

Start with pure helper tests for field/pending classification. Then cover rendering behavior with focused component/helper tests where feasible.

## Acceptance Criteria

- [ ] Review no longer shows `2 opçãoões`.
- [ ] Plan cards explain why each important field is missing or pending.
- [ ] Missing dental on a medical plan is not presented as an urgent problem.
- [ ] Missing accommodation/coparticipation on medical plan is grouped as "dados comerciais nao encontrados no PDF" instead of many noisy warnings.
- [ ] Unknown operator remains prominent and actionable.
- [ ] Legal/commercial disclaimers remain visible but not counted as blockers.
- [ ] Values derived from age bands are explicitly labelled as derived.
- [ ] Public link and PDF do not expose internal review jargon, but preserve important observations.

## QA Notes

- Test with the MARAVILHA Saude PDFs.
- Test with a clean medical-only Health PDF.
- Test with Health + Dental.
- Test with unknown operator.
- Test mobile width for long plan names and warnings.

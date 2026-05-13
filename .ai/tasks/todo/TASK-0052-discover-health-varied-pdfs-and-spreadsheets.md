---
id: TASK-0052
title: Descobrir PDFs e planilhas variadas de Saude para cotacao assistida
status: todo
kind: discovery
lifecycle: open
area: product
owner: claude
reviewer: codex
complexity: medium
risk: medium
tdd_required: false
created_at: 2026-05-13
---

# TASK-0052 - Descobrir PDFs e planilhas variadas de Saude para cotacao assistida

## Context

O humano trouxe uma pesquisa urgente com uma corretora de Saude. A dor principal e montar planilhas de cotacao com vidas, idades e valores individuais por plano. Foram adicionados PDFs e planilhas reais/operacionais em `.ai/pdf-lab/input/pdfs-saude-variados`.

Ja existe uma extracao inicial em `.ai/pdf-lab/output/health_varied_quotes_2026_05_13.md`, mas ela precisa ser consolidada em discovery de produto antes de virar implementacao.

## Objective

Completar a discovery do MVP de cotacao assistida de Saude, usando os PDFs e planilhas variadas para definir:

- campos extraiveis com seguranca;
- campos que devem ficar como inferencia/revisao;
- estrutura minima de rascunho revisavel;
- formato esperado da planilha exportada;
- lacunas para PDF, link navegavel e OCR.

## Scope

- Revisar os PDFs extraidos em `health_varied_quotes_2026_05_13.md`.
- Revisar as duas planilhas da pasta `pdfs-saude-variados`.
- Atualizar `.ai/discovery/HEALTH-QUOTE-ASSISTED-MVP.md` com achados mais detalhados.
- Atualizar `.ai/discovery/HEALTH-MAPPING.md` com referencia para a nova discovery.
- Documentar campos por fonte: Amil, SulAmerica/Cuidado360, Unimed/tabela e planilhas manuais.
- Documentar uma proposta de formato de planilha gerada.
- Documentar o que precisa de OCR/vision futuramente.

## Out Of Scope

- Nao implementar backend.
- Nao criar UI.
- Nao gerar planilha final ainda.
- Nao criar prompt definitivo de extracao.
- Nao assumir que Qualicorp/Sobene/Solbene sao operadoras sem validacao humana.

## Likely Files

- `.ai/discovery/HEALTH-QUOTE-ASSISTED-MVP.md`
- `.ai/discovery/HEALTH-MAPPING.md`
- `.ai/brainstorm/2026-05-13-pesquisa-corretora-saude-prototipo-urgente.md`
- `.ai/pdf-lab/output/health_varied_quotes_2026_05_13.md`
- `.ai/pdf-lab/input/pdfs-saude-variados/UNIMED - OTORRINOS.xlsx`
- `.ai/pdf-lab/input/pdfs-saude-variados/` file starting with `cotac` and containing `CTO ATUALIZADO.xlsx`

## Executor Context Pack

Read these files first, in order:

1. `.ai/discovery/HEALTH-QUOTE-ASSISTED-MVP.md`
2. `.ai/brainstorm/2026-05-13-pesquisa-corretora-saude-prototipo-urgente.md`
3. `.ai/pdf-lab/output/health_varied_quotes_2026_05_13.md`
4. `.ai/discovery/HEALTH-MAPPING.md`
5. `.ai/discovery/BRADESCO-HEALTH.md`

Use `rg` only for these terms before opening more files:

- `Valor por vida`
- `TABELA DE PRE`
- `TOTAL GERAL`
- `Vidas Saude`
- `NOMES FUNCION`
- `FAIXA ETARIA`
- `source:`
- `needsReview`

Do not use broad Explore/subagent/codebase-map workflows before reading these files. If more than 6 additional files seem necessary, stop and explain why.

## TDD Requirement

No code in this task.

## Acceptance Criteria

- [ ] Amil PDFs are summarized with extractable fields, values by age band, totals and validity behavior.
- [ ] SulAmerica/Cuidado360 PDF is summarized, including separation between Saude and Odonto.
- [ ] Current spreadsheet formats are documented, including rows, columns, totals, age table tabs and manual price-table behavior.
- [ ] The minimum `HealthQuoteDraft`/field-provenance contract is refined enough to create implementation tasks.
- [ ] OCR/image-PDF need is documented as future task, not blocker for textual MVP.
- [ ] The recommended implementation task split is listed in priority order.

## Risks

- The discovery may overfit one broker's spreadsheet and miss broader Saude patterns.
- Sensitive fields such as coparticipacao, reembolso, carencia and rede can mislead clients if treated as certain without evidence.
- OCR/image PDFs may be underestimated if all current samples happen to have text.

## Failure Scenario

Claude turns this into implementation guidance without preserving review/provenance, causing the product to save inferred Saude fields as facts and generate misleading client-facing material.

## Human QA Checklist

- [ ] Human confirms the spreadsheet format matches how the corretora actually sends quotes today.
- [ ] Human confirms whether "Sobene" was meant to be "Solbene" or another source.
- [ ] Human confirms which output matters first: XLSX, PDF or link.
- [ ] Codex reviews the discovery before implementation tasks are created.

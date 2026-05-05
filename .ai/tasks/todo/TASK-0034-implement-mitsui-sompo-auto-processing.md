---
id: TASK-0034
title: Implementar suporte Mitsui/Sompo AUTO
status: todo
kind: implementation
lifecycle: open
area: backend
owner: codex
reviewer: human
complexity: high
risk: high
tdd_required: true
created_at: 2026-05-05
blocked_by: TASK-0032
---

# TASK-0034 - Implementar suporte Mitsui/Sompo AUTO

## Context

A `TASK-0032` reconhece Mitsui Sumitomo/Sompo como seguradora da familia Porto, mas bloqueia o processamento por falta de parser suportado. As amostras indicam estrutura muito proxima da Porto e texto de cosseguro com Porto lider e Mitsui Sumitomo como cosseguradora.

Antes de habilitar processamento, precisamos decidir como nomear e representar essa seguradora no produto: `Mitsui Sumitomo`, `Sompo`, ou `Mitsui/Sompo`.

## Objective

Adicionar suporte real a processamento AUTO Mitsui/Sompo com identidade correta, sem exibir Porto Seguro como seguradora final.

## Scope

- Confirmar nome de produto/seguradora a exibir:
  - `Mitsui Sumitomo`;
  - `Sompo`;
  - `Mitsui/Sompo`.
- Decidir enum/contrato de seguradora.
- Criar fixtures anonimizadas a partir de:
  - `auto_mitsui_discovery.md`;
  - amostras completas e reduzidas disponiveis.
- Validar se parser/prompt Porto pode ser reaproveitado.
- Garantir que textos de cosseguro com Porto nao alterem a seguradora exibida.
- Integrar ao fluxo AUTO:
  - detector;
  - processamento;
  - review;
  - PDF;
  - link publico.
- Mapear assistencia observada, exemplo `Rede Referenciada - 400km`, sem quebrar core comum.

## Out Of Scope

- Implementar Azul.
- Implementar Itau.
- Resolver contrato completo de cosseguro.
- Interpretar juridicamente lideranca de cosseguro alem do necessario para exibir a proposta corretamente.

## Likely Files

- `apps/api/prisma/schema.prisma`
- `packages/types/src/quote.types.ts`
- `apps/api/src/modules/quotes/application/services/insurer-detector.ts`
- `apps/api/src/modules/quotes/application/services/insurer-detector.spec.ts`
- `apps/api/src/modules/quotes/jobs/extract-pdf.processor.ts`
- `apps/api/src/modules/ai/ai.service.ts`
- `apps/api/src/modules/quotes/application/services/fixtures/**`
- `apps/dashboard/src/**`
- `.ai/pdf-lab/output/auto_mitsui_discovery.md`
- `.ai/discovery/PORTO-FAMILY-AUTO.md`

## TDD Requirement

Obrigatorio. Comecar por testes que provem que Mitsui/Sompo nao vira Porto e que o core AUTO e extraido corretamente das fixtures.

## Acceptance Criteria

- [ ] Nome de exibicao Mitsui/Sompo e validado pelo humano.
- [ ] Detector retorna a seguradora suportada correta para amostra Mitsui/Sompo.
- [ ] Texto/CNPJ/beneficios Porto aparecem como sinais de familia/cosseguro, nao como seguradora final.
- [ ] Extracao retorna `AutoQuoteData` valido para pelo menos uma amostra Mitsui/Sompo.
- [ ] Review, PDF e link publico exibem Mitsui/Sompo conforme decisao de produto.
- [ ] Bradesco, Porto e Azul, se ja suportada, nao sofrem regressao.

## Risks

- Nome comercial errado pode gerar desconfiança no corretor/cliente.
- Cosseguro pode confundir parser e UI se tratado como seguradora unica sem contexto.
- Estrutura parecida com Porto pode esconder diferencas de cobertura ou assistencia.

## Human QA Checklist

- [ ] Confirmar nome correto: Mitsui Sumitomo, Sompo ou Mitsui/Sompo.
- [ ] Subir PDF Mitsui/Sompo e confirmar seguradora exibida.
- [ ] Comparar premio, FIPE, franquia, RCF, assistencia e pagamentos contra PDF original.
- [ ] Confirmar que nenhuma tela mostra Porto Seguro como seguradora da proposta Mitsui/Sompo.

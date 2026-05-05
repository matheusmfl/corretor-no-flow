---
id: TASK-0033
title: Implementar suporte inicial Azul AUTO
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

# TASK-0033 - Implementar suporte inicial Azul AUTO

## Context

A `TASK-0032` passou a reconhecer PDFs Azul da familia Porto como nao processaveis para evitar que sejam roteados como Porto Seguro. As amostras da `TASK-0030` mostram que Azul compartilha grande parte do core de documento Porto, mas possui produto/headline propria e variacoes como `Azul Tradicional` e `Azul Auto Roubo`.

Azul parece ser a proxima seguradora mais segura para implementar porque a estrutura observada e muito proxima da Porto e as variacoes iniciais estao bem mapeadas.

## Objective

Adicionar suporte real a processamento AUTO Azul, sem confundir Azul com Porto Seguro e sem mascarar diferencas de produto/cobertura.

## Scope

- Decidir como representar Azul no enum/contrato de seguradoras.
- Atualizar detector para retornar Azul como seguradora suportada quando parser estiver pronto.
- Criar fixtures anonimizadas a partir das extracoes Azul existentes:
  - `auto_azul_discovery.md`
  - variantes compreensiva/completa, compreensiva/reduzida, incendio/roubo/furto quando disponiveis.
- Reaproveitar parser/prompt Porto apenas quando os testes provarem compatibilidade.
- Garantir suporte minimo para:
  - `Azul Tradicional e Protecao Combinada`;
  - `Azul Auto Roubo`;
  - cobertura compreensiva;
  - incendio/roubo/furto sem franquia tradicional quando aplicavel;
  - percentual FIPE diferente de 100% quando aparecer.
- Integrar Azul ao fluxo de processamento AUTO:
  - upload unico;
  - fila de extracao;
  - review;
  - PDF gerado;
  - link publico.
- Adicionar label/logotipo textual seguro para Azul no frontend/backend, sem depender de SVG se `TASK-0023` ainda estiver aberta.

## Out Of Scope

- Implementar Itau.
- Implementar Mitsui/Sompo.
- Resolver contrato completo de extras por seguradora.
- Adicionar comparacao comercial avancada ou score.

## Likely Files

- `apps/api/prisma/schema.prisma`
- `packages/types/src/quote.types.ts`
- `apps/api/src/modules/quotes/application/services/insurer-detector.ts`
- `apps/api/src/modules/quotes/application/services/insurer-detector.spec.ts`
- `apps/api/src/modules/quotes/jobs/extract-pdf.processor.ts`
- `apps/api/src/modules/ai/ai.service.ts`
- `apps/api/src/modules/quotes/application/services/porto-payment-parser.ts`
- `apps/api/src/modules/quotes/application/services/fixtures/**`
- `apps/dashboard/src/app/(app)/dashboard/quotes/[processId]/upload/page.tsx`
- `apps/dashboard/src/lib/**`
- `.ai/pdf-lab/output/auto_azul_discovery.md`

## TDD Requirement

Obrigatorio. Comecar por testes de detector, parser/reuse de pagamentos e extracao core Azul antes de habilitar como suportada.

## Acceptance Criteria

- [ ] Azul aparece como seguradora suportada no detector somente apos parser/testes passarem.
- [ ] PDF Azul Tradicional nao e processado como Porto Seguro.
- [ ] PDF Azul Auto Roubo nao exige franquia/casco tradicional quando nao aplicavel.
- [ ] Extracao retorna `AutoQuoteData` valido para pelo menos uma amostra reduzida e uma completa.
- [ ] Pagamentos sao extraidos com confianca ou falham visivelmente em teste.
- [ ] Review, PDF e link publico exibem Azul, nao Porto.
- [ ] Bradesco e Porto continuam passando nos testes existentes.

## Risks

- O compartilhamento de CNPJ/template Porto pode induzir regressao visual ou de label.
- `Azul Auto Roubo` pode ter semantica diferente de cobertura e franquia.
- Reaproveitar prompt/parser Porto sem testes pode gerar dados plausiveis, mas errados.

## Human QA Checklist

- [ ] Subir PDF Azul Tradicional e confirmar que processa como Azul.
- [ ] Subir PDF Azul Auto Roubo e confirmar que ausencias esperadas nao aparecem como erro.
- [ ] Conferir review, PDF final e link publico com nome Azul.
- [ ] Comparar premio, FIPE, franquia, RCF e pagamento contra PDF original.

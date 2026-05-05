---
id: TASK-0035
title: Descobrir e implementar produtos Itau AUTO
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

# TASK-0035 - Descobrir e implementar produtos Itau AUTO

## Context

A `TASK-0032` reconhece Itau como seguradora da familia Porto, mas bloqueia processamento por falta de parser suportado. As amostras Itau parecem mais arriscadas que Azul e Mitsui/Sompo porque incluem produtos com semanticas diferentes:

- `Itau Tradicional`;
- `Itau Assistencia 24h`;
- `Itau Seguro Auto Compacto`;
- compacto com indenizacao integral parcial, exemplo observado: 85% da FIPE.

Implementar Itau como simples clone Porto pode gerar review enganosa, principalmente em ausencia de casco/franquia ou percentual FIPE reduzido.

## Objective

Implementar suporte Itau AUTO por produto comercial, preservando diferencas de cobertura e evitando interpretar ausencias esperadas como erro de extracao.

## Scope

- Revalidar amostras Itau da `TASK-0030` antes da implementacao:
  - compreensiva completa/reduzida;
  - assistencia 24h completa/reduzida;
  - compacto 85% FIPE completo/reduzido.
- Decidir se a task deve ser quebrada antes de implementar tudo:
  - `Itau Tradicional` primeiro;
  - `Itau Compacto` depois;
  - `Itau Assistencia 24h` por ultimo.
- Decidir enum/contrato de seguradora Itau.
- Criar fixtures anonimizadas para cada produto.
- Adicionar campo/estrutura minima para produto comercial se necessario, por exemplo `commercialProduct`.
- Mapear semantica de cobertura:
  - compreensiva;
  - indenizacao integral parcial;
  - assistencia 24h sem casco tradicional;
  - ausencia de franquia/casco/RCF quando aplicavel.
- Integrar ao fluxo AUTO:
  - detector;
  - processamento;
  - review;
  - PDF;
  - link publico.

## Out Of Scope

- Implementar Azul.
- Implementar Mitsui/Sompo.
- Criar comparador comercial avancado.
- Resolver todos os produtos Itau nao presentes nas amostras.

## Likely Files

- `apps/api/prisma/schema.prisma`
- `packages/types/src/quote.types.ts`
- `apps/api/src/modules/quotes/application/services/insurer-detector.ts`
- `apps/api/src/modules/quotes/application/services/insurer-detector.spec.ts`
- `apps/api/src/modules/quotes/jobs/extract-pdf.processor.ts`
- `apps/api/src/modules/ai/ai.service.ts`
- `apps/api/src/modules/quotes/application/services/fixtures/**`
- `apps/dashboard/src/**`
- `.ai/pdf-lab/output/auto_itau_discovery.md`
- `.ai/discovery/PORTO-FAMILY-AUTO.md`
- `.ai/tasks/todo/TASK-0022-design-rich-auto-coverage-display-contract.md`

## TDD Requirement

Obrigatorio. Comecar com testes por produto Itau. Nao habilitar Itau como suportado globalmente ate pelo menos um produto ter fixture e extracao confiavel.

## Acceptance Criteria

- [ ] Decisao documentada: implementar todos os produtos Itau nesta task ou quebrar em subtasks.
- [ ] Detector identifica Itau sem retornar Porto.
- [ ] Itau Tradicional, se implementado, extrai `AutoQuoteData` valido.
- [ ] Itau Compacto, se implementado, exibe percentual FIPE reduzido com label clara.
- [ ] Itau Assistencia 24h, se implementado, nao trata ausencia de casco tradicional como erro automatico.
- [ ] Review/PDF/link publico exibem Itau como seguradora.
- [ ] Ausencias de cobertura sao classificadas como `nao contratado`, `nao aplicavel` ou `nao encontrado` quando houver contrato para isso.
- [ ] Bradesco, Porto e seguradoras da familia ja suportadas nao sofrem regressao.

## Risks

- Itau tem mais variacao de produto que Azul e Mitsui/Sompo.
- Sem `commercialProduct`, a UI pode esconder diferencas relevantes para o segurado.
- Processar Compacto/Assistencia 24h como compreensiva tradicional pode gerar proposta enganosa.

## Human QA Checklist

- [ ] Confirmar quais produtos Itau devem entrar primeiro.
- [ ] Subir PDF Itau Tradicional e comparar valores principais.
- [ ] Subir PDF Itau Compacto e confirmar label de FIPE reduzida.
- [ ] Subir PDF Itau Assistencia 24h e confirmar que ausencias esperadas nao aparecem como erro.
- [ ] Confirmar que nenhuma tela mostra Porto Seguro como seguradora da proposta Itau.

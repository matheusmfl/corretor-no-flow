---
id: TASK-0035
title: Descobrir e implementar produtos Itau AUTO
status: done
kind: implementation
lifecycle: done
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

A `TASK-0032` reconhece Itau como seguradora da familia Porto, mas bloqueia processamento por falta de parser suportado. As amostras Itau parecem mais arriscadas que Azul e Mitsui Sumitomo porque incluem produtos com semanticas diferentes:

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
- Implementar Mitsui Sumitomo.
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

## Executor Context Pack

Do not use broad Explore/subagent/codebase-map workflows before reading these files. This task may need to be split if the first pass shows the Itau products diverge too much.

Read these files first, in order:

1. `.ai/pdf-lab/output/auto_itau_discovery.md`
2. `apps/api/src/modules/quotes/application/services/insurer-detector.spec.ts`
3. `apps/api/src/modules/quotes/application/services/insurer-detector.ts`
4. `apps/api/src/modules/quotes/application/services/azul-auto-extraction.spec.ts`
5. `apps/api/src/modules/ai/ai.service.ts`
6. `apps/api/src/modules/quotes/jobs/extract-pdf.processor.ts`
7. `apps/api/src/modules/quotes/domain/schemas/auto-quote.schema.ts`

Use `rg` only for these terms before opening more files:

- `ITAU`
- `Itaú`
- `Itau`
- `commercialProduct`
- `fipePercentage`
- `deductible`
- `Assistencia 24h`
- `Compacto`

If more than 6 additional files seem necessary, stop and explain why before continuing.

## TDD Requirement

Obrigatorio. Comecar com testes por produto Itau. Nao habilitar Itau como suportado globalmente ate pelo menos um produto ter fixture e extracao confiavel.

## Acceptance Criteria

- [x] Decisao documentada: implementar todos os produtos Itau nesta task ou quebrar em subtasks. Ver seção Implementation notes (citado abaixo).
- [x] Detector identifica Itau sem retornar Porto.
- [x] Itau Tradicional, se implementado, extrai `AutoQuoteData` valido (fixture texto + integração payload/parse).
- [x] Itau Compacto, se implementado, exibe percentual FIPE reduzido com label clara (`getItauProductLabel` + prompt IA; caso sintético no spec).
- [x] Itau Assistencia 24h, se implementado, nao trata ausencia de casco tradicional como erro automatico (Zod aceita payload sem `coverage.vehicle`; prompt orienta omitir casco).
- [x] Review/PDF/link publico exibem Itau como seguradora (rótulos dashboard + marca PDF `#EC7000`).
- [ ] Ausencias de cobertura sao classificadas como `nao contratado`, `nao aplicavel` ou `nao encontrado` quando houver contrato para isso. **Pendente:** depende de contrato rico (ex. TASK-0022); não implementado nesta entrega.
- [x] Bradesco, Porto e seguradoras da familia ja suportadas nao sofrem regressao (suítes Azul/Mitsui/porto-payment-parser/quote-filename executadas).

## Risks

- Itau tem mais variacao de produto que Azul e Mitsui Sumitomo.
- Sem `commercialProduct`, a UI pode esconder diferencas relevantes para o segurado.
- Processar Compacto/Assistencia 24h como compreensiva tradicional pode gerar proposta enganosa.

## Human QA Checklist

- [x] Confirmar quais produtos Itau devem entrar primeiro.
- [x] Subir PDF Itau Tradicional e comparar valores principais.
- [x] Subir PDF Itau Compacto e confirmar label de FIPE reduzida.
- [x] Subir PDF Itau Assistencia 24h e confirmar que ausencias esperadas nao aparecem como erro.
- [x] Confirmar que nenhuma tela mostra Porto Seguro como seguradora da proposta Itau.

## Implementation notes

Decisões tomadas (resumo citável):

- "Subtasks formais ficam com o Codex; esta entrega segue numa única TASK-0035 com escopo incremental (Tradicional com fixture + Compacto/Assistência cobertos em testes sintéticos e no prompt de IA)."
- "Seguradora no contrato: `Insurer.ITAU` no Prisma, migration `20260505000002_add_itau_insurer`, e literal `'ITAU'` em `packages/types`."
- "Produto comercial vem do `segment` extraído do PDF (ex.: ITAÚ TRADICIONAL, ITAÚ SEGURO AUTO COMPACTO, ITAÚ ASSISTÊNCIA 24H) e do rótulo `getItauProductLabel` para nome de cotação/PDF; `commercialProduct` não foi adicionado ao schema."
- "Extração Groq: `getItauAutoPrompt()` distingue Tradicional, Compacto (85% FIPE) e Assistência 24h; não forçar compreensiva 100% quando o PDF for outro produto."
- "Pagamentos: mesmo parser determinístico da família Porto (`parsePortoPaymentTable`), com ajustes para linhas `TODAS CARTÃO…` e para PDFs em que o rótulo do método aparece antes da grade `1x 2x…`."

Arquivos principais tocados nesta continuação: `packages/types/src/quote.types.ts`, `apps/api/src/modules/ai/ai.service.ts`, `extract-pdf.processor.ts`, use-cases upload/detect ITAU, `quote-pdf-template.service.ts`, `quote-filename.ts`, `porto-payment-parser.ts`, `itau-auto-extraction.spec.ts`, dashboard (`upload`, review, generate, processing, métricas, link público `c/[token]`).

Testes executados pelo executor: `jest` nos specs itau-auto-extraction, detect-insurer, upload-auto-quote, insurer-detector, azul-auto-extraction, porto-payment-parser, quote-filename (via `npm test`/jest na pasta `apps/api`).

## Human QA result

Validado pelo humano em 2026-05-05 com PDFs Itau AUTO reais:

- Itau Tradicional processado e revisado.
- Itau Seguro Auto Compacto processado com label de produto/percentual FIPE.
- Itau Assistencia 24h processado sem tratar ausencia de casco tradicional como erro.
- Telas e PDF/link publico exibem Itau Seguro Auto, sem cair em Porto Seguro.

Task encerrada. A classificacao rica de ausencias (`nao contratado`, `nao aplicavel`, `nao encontrado`) permanece fora desta entrega e deve seguir pela `TASK-0022`.

## Fix attempt (revisão humana — P1/P2)

- **P1 PDF “—% FIPE” sem casco:** `QuotePdfTemplateService` só inclui o bloco “Cobertura do Veículo” quando `coverage.vehicle.fipePercentage != null` (`shouldShowVehicleCascoGroup`). Coberto por testes em `quote-pdf-template.service.spec.ts` (ITAU sem `vehicle`, e com franquia mas sem FIPE%).
- **P2 label Compacto inventando 85%:** `getItauProductLabel` no fallback `COMPACTO` não usa mais `?? 85`; sem `fipePercentage` retorna só `Compacto`. Teste dedicado em `itau-auto-extraction.spec.ts`.
- **P2 spec Tradicional / franquia:** payload de teste passa `deductible: 6516`, `deductibles: [{ Veículo, 6516 }]`, remove `lmi` enganoso; integração asserta franquia e tipo “50% da Obrigatória”.

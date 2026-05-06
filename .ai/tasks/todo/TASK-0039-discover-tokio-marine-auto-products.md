---
id: TASK-0039
title: Descobrir produtos Tokio Marine AUTO
status: todo
kind: discovery
lifecycle: open
area: backend
owner: codex
reviewer: human
complexity: medium
risk: high
tdd_required: false
created_at: 2026-05-05
blocked_by: TASK-0030
---

# TASK-0039 - Descobrir produtos Tokio Marine AUTO

## Context

Apos Bradesco, Porto Seguro, Azul, Mitsui Sumitomo e Itau, Tokio Marine parece ser a principal seguradora AUTO restante com acesso do corretor. O detector ja reconhece `TOKIO_MARINE` como seguradora, mas o fluxo de processamento ainda nao possui parser/prompt/QA dedicado para PDFs Tokio.

Antes de habilitar processamento, precisamos entender se o PDF Tokio segue estrutura propria ou reaproveita algum padrao ja conhecido, quais produtos comerciais aparecem, como pagamentos e coberturas sao representados, e quais campos do `AutoQuoteData` podem ser extraidos com confianca.

## Objective

Mapear PDFs Tokio Marine AUTO reais e produzir recomendacao tecnica para implementar suporte com baixo risco de proposta enganosa.

## Scope

- Coletar ou localizar amostras Tokio Marine AUTO disponiveis ao corretor.
- Extrair texto dos PDFs com o pdf-lab, registrando completo/reduzido quando houver.
- Mapear estrutura do documento:
  - cabecalho/razao social/CNPJ;
  - produto comercial/segmento;
  - dados do segurado/condutor;
  - veiculo/FIPE/franquia;
  - coberturas RCF/APP/assistencias/vidros/carro reserva;
  - formas de pagamento;
  - clausulas e paginas que podem ser ignoradas.
- Comparar Tokio Marine com os parsers atuais:
  - Bradesco;
  - Porto-family (`parsePortoPaymentTable`);
  - necessidade de parser deterministico proprio.
- Avaliar impacto no detector:
  - confirmar sinais fortes atuais de `TOKIO_MARINE`;
  - verificar se ha risco de falso positivo com HDI, Aliro, Allianz ou textos de grupo.
- Propor fatia de implementacao:
  - fixtures anonimizadas necessarias;
  - prompt Tokio;
  - parser de pagamentos;
  - labels no dashboard/PDF/link;
  - criterios de QA humano.

## Out Of Scope

- Implementar parser Tokio nesta task.
- Habilitar `TOKIO_MARINE` como seguradora processavel.
- Alterar UI de review/public link alem de recomendacoes.
- Resolver contrato rico de coberturas AUTO (`TASK-0022`).

## Likely Files

- `.ai/pdf-lab/input/tokio/**`
- `.ai/pdf-lab/output/auto_tokio_discovery.md`
- `.ai/discovery/TOKIO-MARINE-AUTO.md`
- `.ai/discovery/AUTO-PDF-INSURER-DETECTION.md`
- `apps/api/src/modules/quotes/application/services/insurer-detector.ts`
- `apps/api/src/modules/quotes/application/services/insurer-detector.spec.ts`
- `.ai/tasks/todo/TASK-0040-implement-tokio-marine-auto-processing.md`

## Executor Context Pack

Read these files first, in order:

1. `.ai/discovery/AUTO-PDF-INSURER-DETECTION.md`
2. `.ai/discovery/PORTO-FAMILY-AUTO.md`
3. `apps/api/src/modules/quotes/application/services/insurer-detector.ts`
4. `apps/api/src/modules/quotes/application/services/insurer-detector.spec.ts`
5. `apps/api/src/modules/ai/ai.service.ts`
6. `apps/api/src/modules/quotes/domain/schemas/auto-quote.schema.ts`

Use `rg` only for these terms before opening more files:

- `TOKIO_MARINE`
- `Tokio`
- `Tokio Marine`
- `HDI`
- `detectedProduct`
- `AUTO_PRODUCT_PATTERNS`
- `parseBradescoPaymentTable`
- `parsePortoPaymentTable`

If more than 6 additional files seem necessary, stop and explain why before continuing.

## TDD Requirement

No implementation in this task. Se a discovery revelar bug no detector atual, criar task separada ou converter follow-up com TDD.

## Acceptance Criteria

- [ ] Ha pelo menos uma amostra Tokio Marine AUTO extraida em texto, ou a task documenta claramente que faltam PDFs.
- [ ] Discovery identifica se Tokio usa layout proprio ou algum layout parecido com seguradoras ja implementadas.
- [ ] Discovery mapeia sinais fortes para detector e riscos de falso positivo.
- [ ] Discovery descreve coberturas e pagamentos com exemplos anonimizados.
- [ ] Recomendacao existe para implementar ou adiar suporte Tokio.
- [ ] Follow-up tecnico `TASK-0040` e criado se houver amostra suficiente para implementacao.

## Risks

- Tokio pode ter layout muito diferente e exigir parser/prompt proprio.
- Habilitar Tokio sem parser de pagamentos confiavel pode gerar comparacao ruim.
- Produtos comerciais Tokio podem ter coberturas ausentes que parecem erro, repetindo o risco visto em Itau Assistencia 24h.
- Sem amostras completas, a implementacao pode ficar enviesada para um unico tipo de proposta.

## Human QA Checklist

- [ ] Human fornecer PDFs Tokio Marine AUTO reais.
- [ ] Confirmar se existem versoes reduzida/completa.
- [ ] Confirmar quais produtos Tokio aparecem no portal/cotador.
- [ ] Confirmar se formas de pagamento e coberturas exibidas no PDF batem com o cotador.

---
id: TASK-0039
title: Descobrir produtos Tokio Marine AUTO
status: done
kind: discovery
lifecycle: closed
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

- [x] Ha pelo menos uma amostra Tokio Marine AUTO extraida em texto, ou a task documenta claramente que faltam PDFs.
- [x] Discovery identifica se Tokio usa layout proprio ou algum layout parecido com seguradoras ja implementadas.
- [x] Discovery mapeia sinais fortes para detector e riscos de falso positivo.
- [x] Discovery descreve coberturas e pagamentos com exemplos anonimizados.
- [x] Recomendacao existe para implementar ou adiar suporte Tokio.
- [x] Follow-up tecnico `TASK-0040` e criado se houver amostra suficiente para implementacao.

## Risks

- Tokio pode ter layout muito diferente e exigir parser/prompt proprio.
- Habilitar Tokio sem parser de pagamentos confiavel pode gerar comparacao ruim.
- Produtos comerciais Tokio podem ter coberturas ausentes que parecem erro, repetindo o risco visto em Itau Assistencia 24h.
- Sem amostras completas, a implementacao pode ficar enviesada para um unico tipo de proposta.

## Human QA Checklist

- [x] Human iniciou discovery manual com PDFs Tokio Marine AUTO reais gerados como renovacao.
- [x] Human fornecer/confirmar local dos PDFs `renovacao_tokio_{nome_do_produto}` para extracao via pdf-lab.
- [ ] Confirmar se existem versoes reduzida/completa.
- [x] Confirmar que o portal/cotador possui 5 produtos Tokio Marine AUTO.
- [x] Confirmar que Auto, Auto Classico e Auto Protecao Mensal possuem edicao de coberturas.
- [x] Confirmar se formas de pagamento e coberturas exibidas no PDF batem com o cotador.

## Manual discovery notes - 2026-05-06

- Amostras foram geradas como renovacao de seguro, cobrindo uma lacuna das discoveries anteriores.
- Prefixo dos arquivos: `renovacao_tokio_{nome_do_produto}`.
- Todas as amostras foram geradas com franquia obrigatoria/basica; por enquanto nao parece necessario gerar franquia reduzida para a primeira discovery.
- Portal mostra 5 produtos possiveis:
  - Auto;
  - Auto Classico;
  - Auto Protecao Mensal;
  - Auto Roubo + Rastreador;
  - Assistencia Exclusiva.
- Produtos com edicao de coberturas observada:
  - Auto;
  - Auto Classico;
  - Auto Protecao Mensal.
- Tipos de cobertura observados para Auto e Auto Classico:
  - Colisao, Incendio e Roubo/Furto;
  - Colisao e Incendio;
  - Incendio e Roubo/Furto;
  - Indenizacao Integral-Colisao,Incendio,Roubo/Furto;
  - Sem Casco.
- Tipos de cobertura observados para Auto Protecao Mensal:
  - Colisao, Incendio e Roubo/Furto;
  - Colisao e Incendio;
  - Incendio e Roubo/Furto;
  - Sem Casco.
- Diferencas relevantes entre Auto / Auto Classico / Auto Protecao Mensal:
  - Auto e Auto Classico com ajuste 100%; Protecao Mensal com ajuste 90%.
  - RCF de Auto/Classico observado em R$ 50.000; Protecao Mensal em R$ 25.000.
  - Auto tem oficina livre escolha; Classico e Protecao Mensal usam rede referenciada.
  - Protecao Mensal usa pecas compativeis, nao possui vidro, reboque adicional, nem carro reserva nos dados observados.
  - Auto tem carro reserva 15 diarias; Auto Classico 7 diarias.
- Risco de implementacao: "Sem Casco" e Assistencia Exclusiva devem ser tratados como estados comerciais validos, nao como falha de extracao.
- Documento de discovery criado em `.ai/discovery/TOKIO-MARINE-AUTO.md`.

## PDF lab extraction - 2026-05-06

- PDFs movidos/organizados em `.ai/pdf-lab/input/tokio/`.
- Saidas geradas:
  - `.ai/pdf-lab/output/auto_tokio_discovery.md`
  - `.ai/pdf-lab/output/auto_tokio_discovery.json`
- Comando executado:
  - `node .ai/scripts/extract-pdf-lab.mjs --input-dir .ai/pdf-lab/input/tokio --output-name auto_tokio_discovery --insurer tokio --variant renovacao`
- PDFs extraidos:
  - `renovacao_tokio_assistencia_exclusiva.pdf` - 3 paginas.
  - `renovacao_tokio_auto.pdf` - 4 paginas.
  - `renovacao_tokio_auto_classico.pdf` - 4 paginas.
  - `renovacao_tokio_auto_roubo+rastreador.pdf` - 4 paginas.
  - `renovacao_tokio_protecao_mensal.pdf` - 3 paginas.
- Sexto produto do portal ainda sem PDF extraido/confirmacao nominal.
- Conclusao parcial: Tokio usa layout proprio; precisa prompt e parser de pagamento dedicados.
- Risco de detector encontrado: por serem renovacoes, o texto traz `Nome da Congenere` com `BRADESCO SEGUROS S/A`; isso deve ser tratado como seguradora anterior, nunca emissora atual.
- Observacao de pagamento: os PDFs extraidos usam o padrao de impressao com Cartao de Credito. O corretor pode optar por incluir tambem carne e debito em conta; isso deve entrar como variacao de parser ou ficar pendente ate haver amostra.

## Human acceptance - 2026-05-07

- Discovery aprovada junto da implementacao `TASK-0040`.
- Produtos reais e labels foram validados em QA humano.
- Discovery fechada.

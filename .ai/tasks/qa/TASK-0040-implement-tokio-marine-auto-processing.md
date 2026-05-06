---
id: TASK-0040
title: Implementar processamento Tokio Marine AUTO
status: qa
kind: feature
lifecycle: qa
area: backend
owner: codex
reviewer: human
complexity: high
risk: high
tdd_required: true
created_at: 2026-05-06
blocked_by: TASK-0039
---

# TASK-0040 - Implementar processamento Tokio Marine AUTO

## Context

Discovery manual e PDF lab da `TASK-0039` confirmaram 5 PDFs reais de renovacao Tokio Marine AUTO:

- `renovacao_tokio_assistencia_exclusiva.pdf`
- `renovacao_tokio_auto.pdf`
- `renovacao_tokio_auto_classico.pdf`
- `renovacao_tokio_auto_roubo+rastreador.pdf`
- `renovacao_tokio_protecao_mensal.pdf`

Os PDFs foram extraidos em:

- `.ai/pdf-lab/output/auto_tokio_discovery.md`
- `.ai/pdf-lab/output/auto_tokio_discovery.json`

Tokio usa layout proprio, diferente da familia Porto. O detector ja reconhece `TOKIO_MARINE`, mas o processamento ainda nao tem prompt, parser de pagamentos e testes dedicados.

## Objective

Habilitar processamento AUTO para Tokio Marine com extracao segura de dados essenciais, labels de produto e pagamentos, sem gerar coberturas enganosas para produtos sem casco, assistencia-only ou protecao mensal.

## Scope

- Adicionar fixture textual Tokio a partir dos PDFs extraidos.
- Criar prompt Tokio AUTO em `AiService`.
- Implementar parser deterministico de pagamentos Tokio.
- Integrar `TOKIO_MARINE` no job de extracao.
- Garantir upload/processamento `TOKIO_MARINE` na API.
- Garantir labels no filename/PDF/dashboard/link publico.
- Criar testes para os 5 produtos extraidos:
  - Auto;
  - Auto Classico;
  - Auto Protecao Mensal;
  - Auto Roubo + Rastreador;
  - Assistencia Exclusiva.
- Adicionar teste de detector para renovacao Tokio com `Nome da Congenere` contendo `BRADESCO SEGUROS S/A`, garantindo que o resultado continua `TOKIO_MARINE`.
- Considerar que os PDFs atuais foram gerados com pagamento padrao em Cartao de Credito. O corretor pode incluir `carne` e `debito em conta` na impressao; se nao houver amostra dessas variantes, o parser deve ser conservador e nao inventar metodos.

## Out Of Scope

- Suportar variantes de pagamento Tokio sem amostra real, como carne/debito, alem de documentar pendencia ou criar fixture quando fornecida.
- Resolver contrato rico de tri-estado de coberturas (`nao contratado` / `nao aplicavel` / `nao encontrado`).
- Criar UI nova para produto mensal alem de label seguro.
- Expandir contrato `AutoQuoteData` sem necessidade minima.
- Gerar ou validar PDF humano final nesta task sem amostras processadas no ambiente.

## Key Product Rules

- `Assistencia Exclusiva`:
  - nao tem casco tradicional;
  - `Casco`, RCF e APP aparecem como `Nao contratada`;
  - deve omitir `coverage.vehicle` se nao houver casco;
  - nao pode renderizar FIPE/casco fantasma;
  - pagamento observado ate 6x sem juros.
- `Auto`:
  - cobertura `Colisao, Incendio e Roubo/Furto`;
  - VMR 100%;
  - RCF danos materiais/corporais R$ 50.000;
  - carro reserva 15 dias;
  - oficina livre escolha;
  - pecas novas originais.
- `Auto Classico`:
  - VMR 100%;
  - RCF R$ 50.000;
  - carro reserva 7 dias;
  - oficina rede referenciada;
  - pecas novas originais.
- `Auto Roubo + Rastreador`:
  - cobertura `Incendio e Roubo/Furto`;
  - VMR 100%;
  - exige rastreador em comodato;
  - dispositivo observado `ITURAN`;
  - nao rotular como compreensiva.
- `Auto Protecao Mensal`:
  - VMR 90%;
  - RCF R$ 25.000;
  - sem vidros/carro reserva/reboque adicional nos PDFs observados;
  - pecas `Novas Compativeis`;
  - produto comercial mensal, embora tabela exponha linha 12x.

## Executor Context Pack

Read these files first, in order:

1. `.ai/discovery/TOKIO-MARINE-AUTO.md`
2. `.ai/pdf-lab/output/auto_tokio_discovery.md`
3. `apps/api/src/modules/ai/ai.service.ts`
4. `apps/api/src/modules/quotes/application/services/porto-payment-parser.ts`
5. `apps/api/src/modules/quotes/application/services/quote-filename.ts`
6. `apps/api/src/modules/quotes/jobs/extract-pdf.processor.ts`
7. `apps/api/src/modules/quotes/application/services/insurer-detector.spec.ts`

Use `rg` only for these terms before opening more files:

- `TOKIO_MARINE`
- `getItauAutoPrompt`
- `getMitsuiSumitomoAutoPrompt`
- `parsePortoPaymentTable`
- `parseBradescoPaymentTable`
- `getItauProductLabel`
- `INSURER_SHORT`
- `shouldShowVehicleCascoGroup`
- `Renovacao Congenere`
- `Nome da Congenere`
- `Auto Protecao Mensal`
- `Assistencia Exclusiva`
- `Auto Roubo + Rastreador`

If more than 6 additional files seem necessary, stop and explain why before continuing.

## TDD Requirement

Required. Suggested red-green path:

1. Add detector spec for Tokio renewal with Bradesco as previous insurer.
2. Add `tokio-payment-parser.spec.ts` from extracted text snippets.
3. Add `tokio-auto-extraction.spec.ts` for labels, product semantics and Zod-valid payloads.
4. Implement parser/prompt/routing.
5. Run focused API tests.

## Acceptance Criteria

- [ ] Detector returns `TOKIO_MARINE` for Tokio renewal PDFs even when `Nome da Congenere` contains Bradesco.
- [ ] API upload accepts `TOKIO_MARINE` for AUTO processing.
- [ ] Extraction job uses Tokio prompt and Tokio payment parser.
- [ ] Payment parser extracts discounted upfront row and credit-card installments for annual products.
- [ ] Payment parser does not misclassify future carne/debito rows as credit card when those variants appear.
- [ ] Payment parser handles Assistencia Exclusiva up to 6x and Protecao Mensal without inventing annual product semantics.
- [ ] Quote label distinguishes all 5 supported Tokio products.
- [ ] `Assistencia Exclusiva` does not render casco/FIPE coverage when vehicle casco is absent.
- [ ] `Auto Protecao Mensal` label includes 90% FIPE only when `fipePercentage` is extracted.
- [ ] Tests cover the 5 extracted products.
- [ ] Human QA checklist is prepared for real processing validation.

## Human QA Checklist

- [ ] Processar `renovacao_tokio_auto.pdf`.
- [ ] Processar `renovacao_tokio_auto_classico.pdf`.
- [ ] Processar `renovacao_tokio_protecao_mensal.pdf`.
- [ ] Processar `renovacao_tokio_auto_roubo+rastreador.pdf`.
- [ ] Processar `renovacao_tokio_assistencia_exclusiva.pdf`.
- [ ] Conferir se Bradesco aparece apenas como congenere anterior, nao seguradora da cotacao.
- [ ] Conferir pagamentos no review/PDF contra a tabela do PDF original.
- [ ] Se o corretor gerar PDFs Tokio com carne/debito, anexar como nova amostra e validar parser antes de marcar suporte amplo de pagamentos.
- [ ] Conferir que Assistencia Exclusiva nao mostra casco fantasma.
- [ ] Conferir que Protecao Mensal fica claramente identificada como produto mensal/90% FIPE.

## Implementation Notes — 2026-05-06

### Arquivos criados
- `apps/api/src/modules/quotes/application/services/tokio-payment-parser.ts` — parser determinístico de pagamentos Tokio
- `apps/api/src/modules/quotes/application/services/tokio-payment-parser.spec.ts` — testes para os 5 produtos
- `apps/api/src/modules/quotes/application/services/tokio-auto-extraction.spec.ts` — testes de labels e validação Zod

### Arquivos modificados
- `apps/api/src/modules/quotes/application/services/insurer-detector.ts` — `suppressCongenereSignals()`: downgrade de `BRADESCO` razao_social para `weak` quando `Renovação Congênere` aparece no texto e outro insurer tem sinal strong (fix para PDFs de renovação Tokio com Bradesco como congênere anterior)
- `apps/api/src/modules/quotes/application/services/insurer-detector.spec.ts` — 2 novos testes: renovação Tokio com Bradesco como congênere
- `apps/api/src/modules/ai/ai.service.ts` — `getTokioMarineAutoPrompt()` com instrução para os 5 produtos; Assistência Exclusiva sem coverage.vehicle/rcf/app
- `apps/api/src/modules/quotes/application/services/quote-filename.ts` — `getTokioProductLabel()` + wire em `buildQuotePdfFilename`
- `apps/api/src/modules/quotes/jobs/extract-pdf.processor.ts` — routing `parseTokioPaymentTable` + label Tokio em `buildQuoteLabel`
- `apps/api/src/modules/quotes/application/use-cases/upload-auto-quote.use-case.ts` — `Insurer.TOKIO_MARINE` adicionado a `SUPPORTED_INSURERS`
- `apps/api/src/modules/quotes/application/use-cases/detect-insurer.use-case.ts` — `TOKIO_MARINE` adicionado a `SUPPORTED_INSURERS`
- `apps/api/src/modules/quotes/application/use-cases/upload-auto-quote.use-case.spec.ts` — TOKIO_MARINE agora aceito; seguradora insuportada mudada para SULAMERICA
- `apps/api/src/modules/quotes/application/use-cases/detect-insurer.use-case.spec.ts` — teste existente atualizado; novo teste TOKIO_MARINE supported: true

### Resultado dos testes
- 394 testes passando, 0 falhas (suite completa apps/api)
- Novos testes: 89 nos arquivos Tokio + detector + upload

### Pendências para QA humano
- Processar os 5 PDFs reais e conferir extração/pagamentos contra os PDFs originais
- Confirmar que Bradesco não aparece como seguradora no dashboard
- Confirmar Assistência Exclusiva sem casco fantasma
- Confirmar Proteção Mensal rotulada como produto mensal/90% FIPE
- Se corretor gerar PDF Tokio com carnê/débito: fornecer como nova amostra antes de habilitar suporte

## Codex Review — Findings Resolution — 2026-05-06

### P1 · Detector: supressão de congênere muito ampla → risco de falso positivo bidirecional

**Finding**: A implementação inicial de `suppressCongenereSignals` usava comparação de posição `tokioIdx >= bradescoIdx`, o que falhava quando Bradesco emitia PDF com Tokio como congênere. Com `strongInsurerSet = {BRADESCO, TOKIO_MARINE}` o detector retornava `null` em vez de `BRADESCO`.

**Fix aplicado**: Substituída pela âncora de label "Nome da Congênere". Qualquer sinal `razao_social` strong que apareça APÓS a posição de "Nome da Congênere" no texto é rebaixado para `weak` — independentemente de qual seguradora é. Isso funciona bidirecionalmente:
- Tokio emite, Bradesco é congênere → "BRADESCO SEGUROS S/A" após o label → rebaixado → TOKIO_MARINE vence
- Bradesco emite, Tokio é congênere → "Tokio Marine Seguros" após o label → rebaixado → BRADESCO vence

**Testes adicionados**: `insurer-detector.spec.ts` — dois fixtures bidirecionais (Tokio emite / Bradesco emite), ambos passando.

### P1 · Prompt: instrução errada para `premium.total` do Proteção Mensal

**Finding**: Prompt original dizia para usar o valor da capa (R$ 227,56/mês) como `premium.total`, produzindo prêmio mensal em vez de anualizado.

**Fix aplicado**: Instrução atualizada em `getTokioMarineAutoPrompt()`:
```
"total": para produtos anuais use o valor 'à vista' da capa; para Auto Proteção Mensal use o total anualizado da tabela de pagamento (coluna 'Total (R$)' da linha 12x — ex: 2.731,41), NÃO o valor mensal da capa (ex: NÃO usar R$ 227,56)
```

### P2 · Parser: coluna `total` descartada das parcelas

**Finding**: O regex do `tokio-payment-parser.ts` capturava o 4º grupo (Total R$) mas não o armazenava nas parcelas.

**Fix aplicado**: `total: parseBRL(match[4]!)` adicionado a ambos os pushes (`antecipados` e `semJuros`). Testes em `tokio-payment-parser.spec.ts` verificam `total` para Auto, Antecipado, Assistência Exclusiva e Proteção Mensal.

### P2 · Parser: janela de scan ilimitada poderia absorver linhas de carnê/débito

**Finding**: O parser escaneava do marcador `Primeira parcela à vista` até o fim do texto. Se o PDF incluir seções de Carnê, Débito em Conta ou Boleto no mesmo formato `<n> <valor> Sem Juros <total>`, essas linhas seriam agregadas em `cartao-credito`.

**Fix aplicado**: `ALT_METHOD_HEADER_RE` (`^Carnê|Débito em conta|Boleto Bancário$` com flag `m`) detecta o início de seção alternativa e trunca `section` nesse ponto antes do scan de linhas.

**Testes adicionados** (`tokio-payment-parser.spec.ts`): 3 casos — carnê após Auto (12 parcelas, não 14), débito após Auto (12, não 14), boleto após Assistência Exclusiva (6, não 8). Todos passando.

### Resultado final

105 testes passando nas 5 suites afetadas (insurer-detector, tokio-payment-parser, tokio-auto-extraction, detect-insurer.use-case, upload-auto-quote.use-case). Nenhuma regressão.

## QA notes - 2026-05-06

- Movida para QA aguardando validacao humana E2E com os 5 PDFs reais Tokio.
- QA E2E nao foi executado agora porque os creditos Gemini acabaram.
- Suspeita observada pelo humano: uma cotacao pode ter sido lida como Bradesco, mas ainda nao ha evidencia suficiente para documentar bug; pode ter sido upload acidental de PDF Bradesco.
- Antes de marcar done, validar:
  - se os 5 PDFs Tokio processam sem falha;
  - se Bradesco aparece apenas como congenere anterior, nunca como seguradora da cotacao Tokio;
  - se pagamentos batem com o PDF original;
  - se Assistencia Exclusiva nao exibe casco fantasma;
  - se Auto Protecao Mensal usa total anualizado no premium e label mensal/90% FIPE.

### Codex QA review

- Rodado em 2026-05-06:
  - `tokio-payment-parser.spec.ts`
  - `tokio-auto-extraction.spec.ts`
  - `insurer-detector.spec.ts`
  - `upload-auto-quote.use-case.spec.ts`
  - `detect-insurer.use-case.spec.ts`
  - `remove-quote-from-process.use-case.spec.ts`
- Resultado: 109 testes passando, 0 falhas.
- Nenhum finding aberto apos a correcao de janela do parser para carne/debito/boleto.

## Risks

- Protecao Mensal pode precisar de representacao melhor que `paymentMethods` atual.
- Alguns campos comerciais importantes, como tipo de peca/oficina, podem nao ter lugar no contrato atual.
- Carne/debito podem exigir extensao do parser Tokio assim que houver PDF real dessas variantes.
- A presenca de Bradesco na renovacao pode causar falso positivo se o detector pesar razao social sem contexto.

---
id: TASK-0036
title: QA Azul AUTO - corrigir identificacao, FIPE e nomes dos PDFs
status: done
kind: qa
lifecycle: closed
area: product
owner: codex
reviewer: human
complexity: medium
risk: high
tdd_required: true
created_at: 2026-05-05
blocked_by: TASK-0033
---

# TASK-0036 - QA Azul AUTO - corrigir identificacao, FIPE e nomes dos PDFs

## Context

Durante QA humano da `TASK-0033`, foram enviados quatro PDFs Azul:

- Azul Auto Roubo/Furto reduzido.
- Azul Auto Roubo/Furto completo.
- Azul Tradicional/Compreensivo reduzido.
- Azul Tradicional/Compreensivo completo.

Deteccao, processamento inicial e confirmacao geral dos dados funcionaram. O link publico tambem exibiu taglines importantes corretamente, incluindo `90% FIPE` no produto de roubo/furto.

Mesmo assim, surgiram problemas de usabilidade e dados que podem afetar a confianca do corretor na etapa de confirmacao e na entrega dos PDFs.

## Findings De QA

### 1. Valor FIPE parece receber valor de franquia

Na etapa de confirmar cotacao, o campo `Valor FIPE` apareceu como `R$ 6.516,00`.

Esse valor parece ser franquia, nao valor FIPE do veiculo. A suspeita e que o parser/prompt esteja confundindo `franquia` com `fipeValue` ou `lmi`.

Precisamos confirmar se:

- acontece apenas na Azul;
- acontece tambem na Porto, Bradesco ou outras seguradoras;
- ocorre apenas em produto compreensivo;
- ocorre tambem em Azul Auto Roubo/Furto.

### 2. Valor da franquia nao aparece na confirmacao

No mesmo fluxo, o campo `Valor da franquia` nao apareceu. Para produto compreensivo, a franquia deveria aparecer quando existir no PDF.

Para Azul Auto Roubo/Furto, a ausencia pode ser esperada, mas precisa ser tratada como `nao aplicavel`, nao como dado perdido.

### 3. Titulo da cotacao nao identifica produto/servico

Na tela de confirmar cotacoes, o card aparece como:

```txt
AZUL - aguardando confirmacao
```

Isso e insuficiente quando o corretor sobe varios PDFs da mesma seguradora. A dor do usuario: como confirmar os dados se ele nao sabe a referencia exata do PDF?

O titulo deveria incluir pelo menos o produto/servico, por exemplo:

- `Azul Tradicional`
- `Azul Roubo e Furto`
- `Bradesco Compreensivo`
- `Porto Auto Senior`

Quando o produto nao for confiavel, considerar usar o nome original do arquivo como apoio visual.

### 4. Nome dos PDFs gerados fica apenas `Azul`

Ao gerar os PDFs finais, todos os arquivos ficaram com nome `Azul`, sem diferenciar produto, veiculo, tipo de cobertura ou arquivo original.

Isso prejudica operacao real, principalmente quando ha multiplas cotacoes da mesma seguradora no mesmo processo.

## Objective

Corrigir os problemas encontrados no QA Azul para que o corretor consiga identificar, revisar e exportar cada cotacao com seguranca.

## Scope

- Investigar origem do `Valor FIPE = R$ 6.516,00`.
- Corrigir mapeamento de `fipeValue`, `coverage.vehicle.deductible`, `deductibles` e/ou `lmi` conforme necessario.
- Garantir que franquia aparece na confirmacao quando aplicavel.
- Garantir que produto sem franquia tradicional nao exibe dado falso.
- Melhorar titulo/nome da cotacao na etapa de review para incluir produto/servico ou fallback com nome do arquivo.
- Melhorar nome do PDF gerado para diferenciar cotacoes Azul.
- Avaliar se a melhoria de titulo/nome deve ser generica para todas as seguradoras, nao apenas Azul.

## Out Of Scope

- Implementar Mitsui/Sompo.
- Implementar Itau.
- Criar comparador comercial avancado.
- Resolver todo o contrato de cobertura rica da `TASK-0022`.

## Likely Files

- `apps/api/src/modules/ai/ai.service.ts`
- `apps/api/src/modules/quotes/jobs/extract-pdf.processor.ts`
- `apps/api/src/modules/quotes/application/services/quote-filename.ts`
- `apps/api/src/modules/quotes/application/services/quote-pdf-template.service.ts`
- `apps/dashboard/src/app/(app)/dashboard/quotes/[processId]/review/page.tsx`
- `apps/dashboard/src/app/(public)/c/[token]/page.tsx`
- `packages/types/src/quote.types.ts`
- `apps/api/src/modules/quotes/application/services/azul-auto-extraction.spec.ts`

## Executor Context Pack

Do not use broad Explore/subagent/codebase-map workflows before reading these files. This task already contains the human QA findings.

Read these files first, in order:

1. `apps/api/src/modules/quotes/application/services/azul-auto-extraction.spec.ts`
2. `apps/api/src/modules/quotes/application/services/quote-filename.spec.ts`
3. `apps/api/src/modules/ai/ai.service.ts`
4. `apps/api/src/modules/quotes/jobs/extract-pdf.processor.ts`
5. `apps/api/src/modules/quotes/application/services/quote-filename.ts`
6. `apps/dashboard/src/app/(app)/dashboard/quotes/[processId]/review/page.tsx`
7. `apps/api/src/modules/quotes/application/services/quote-pdf-template.service.ts`

Use `rg` only for these terms before opening more files:

- `fipeValue`
- `deductible`
- `Valor FIPE`
- `quote-filename`
- `buildQuote`
- `originalFile`
- `AZUL`
- `quote.name`

If more than 6 additional files seem necessary, stop and explain why before continuing.

## TDD Requirement

Obrigatorio para bug de dados e nomeacao. Adicionar testes antes de corrigir:

- Azul Tradicional nao deve colocar franquia em `vehicle.fipeValue`.
- Azul Tradicional deve preencher franquia quando presente.
- Azul Auto Roubo/Furto deve aceitar ausencia de franquia.
- Nome gerado para multiplas cotacoes Azul deve diferenciar produto/cobertura.

## Acceptance Criteria

- [ ] `Valor FIPE` nao recebe valor de franquia.
- [ ] Franquia aparece na confirmacao quando aplicavel.
- [ ] Azul Auto Roubo/Furto nao exibe franquia falsa.
- [ ] Card de confirmacao identifica produto/servico ou usa fallback com nome do arquivo.
- [ ] Link publico diferencia cards da mesma seguradora de forma compreensivel.
- [ ] PDFs gerados possuem nomes distintos e uteis, nao apenas `Azul`.
- [ ] Regressao verificada em Porto e Bradesco para FIPE, franquia e nome de PDF.

## Fix attempt — 2026-05-05

### Finding 1: Valor FIPE = R$ 6.516,00 (confusão fipeValue/franquia)

Causa raiz: O LLM colocava o valor da franquia (6516) em `vehicle.fipeValue` por ambiguidade no prompt.

Correção: `ai.service.ts` — prompt Azul agora especifica que `fipeValue` é o valor de mercado "(normalmente acima de R$ 20.000; NÃO confundir com franquia)" e acrescenta nota crítica: "Nunca coloque o valor da franquia em fipeValue."

Teste: fixture `AZUL_TRADICIONAL_AI_RESPONSE` atualizado com `fipeValue: 125400.00`; novos testes verificam `vehicle.fipeValue ≈ 125400` e `vehicle.fipeValue ≠ coverage.vehicle.deductible`.

### Finding 2: Franquia não aparece na confirmação

Causa raiz: consequência direta do finding 1. Quando o LLM coloca a franquia em `fipeValue`, `coverage.vehicle.deductible` fica null e o campo não renderiza na review page.

Correção: a melhoria do prompt (finding 1) resolve. O campo de franquia na review page já estava correto.

### Finding 3: Título do card não identifica produto

Correção:
- `review/page.tsx`: adicionado `AZUL: 'Azul Seguro Auto'` ao `INSURER_LABELS`; header do card exibe `quote.name` como subtítulo abaixo do nome da seguradora.
- `extract-pdf.processor.ts`: `buildQuoteLabel` usa `getAzulProductLabel` para AZUL, produzindo "Azul — Tradicional (R$ X)" ou "Azul — Roubo (R$ X)".

### Finding 4: Nome dos PDFs gerados fica apenas "Azul"

Causa raiz: `INSURER_SHORT` em `quote-filename.ts` não continha 'AZUL', caindo no fallback raw. Sem produto, arquivos Azul não se diferenciavam.

Correção: `quote-filename.ts` — adicionado `AZUL: 'Azul'`; exportada `getAzulProductLabel(data)` (90% FIPE → "Roubo", 100% → "Tradicional"); `buildQuotePdfFilename` usa esta função para AZUL em vez de `deductibleType`.

### Testes

- `quote-filename.spec.ts`: +4 testes Azul. 15/15 passando.
- `azul-auto-extraction.spec.ts`: +3 testes fipeValue/franquia. 25/25 passando.
- Regressão completa API: 294/294 passando.

### Observação sobre reprocessamento

PDFs já processados e salvos no banco com dados errados precisam ser reprocessados manualmente para refletir as correções do prompt. A melhoria do prompt afeta apenas novos processamentos.

## Review findings — 2026-05-05

### Finding 1: Titulo principal da review ainda e seguradora generica

No QA humano, FIPE/franquia ficaram corretos. A pendencia atual e de identificacao comercial: a review ainda mostra `Azul Seguro Auto` como titulo principal fixo do card. Isso nao resolve totalmente a dor original de diferenciar dois PDFs Azul na confirmacao.

Esperado:

- produto roubo/furto: `Azul Roubo e Furto`;
- produto compreensivo/tradicional: `Azul Seguro Auto`;
- se o produto nao for confiavel, usar `quote.name` ou nome original do arquivo como apoio visual.

### Finding 2: Label tecnico usa `Roubo`/`Tradicional`, mas QA validou outra linguagem

`getAzulProductLabel` diferencia por `coverage.vehicle.fipePercentage`, mas retorna `Roubo` para 90% e `Tradicional` para 100%/franquia. O QA humano pediu nomenclatura mais clara:

- 90% FIPE / sem franquia tradicional: `Roubo e Furto`;
- 100% FIPE / compreensivo com franquia: `Seguro Auto`.

Atualizar tambem os testes para exigir esses nomes, nao apenas que os nomes sejam distintos.

### Finding 3: Link publico e PDF devem usar a mesma nomenclatura

A task pede identificacao consistente em review, link publico e PDFs gerados. A correcao deve garantir que a mesma regra alimente:

- `quote.name` salvo no processamento;
- titulo/subtitulo do card de review;
- card do link publico;
- nome do PDF gerado.

### Finding 4: Familia Porto deve priorizar o campo Segmento do PDF

O produto comercial nao deve ser inferido primeiro por `fipePercentage` quando o PDF traz `Segmento` explicitamente. Isso vale para Azul e deve virar regra reaproveitavel para a familia Porto.

Exemplos observados:

- `Segmento: Azul Auto Roubo` deve gerar label `Azul Roubo e Furto`;
- `Segmento: Azul Tradicional` deve gerar label `Azul Seguro Auto`;
- outros PDFs da familia Porto devem seguir o padrao `Nome da seguradora + Segmento`, quando o segmento estiver disponivel e confiavel.

Fallbacks continuam importantes, mas so quando `Segmento` nao estiver disponivel:

- `90% FIPE` / sem franquia tradicional pode indicar `Roubo e Furto`;
- `100% FIPE` / compreensivo com franquia pode indicar `Seguro Auto` ou produto compreensivo equivalente.

Atualizar prompt, parser e testes para extrair/preservar `Segmento` como fonte primaria de identificacao comercial.

## Fix attempt 2 — 2026-05-05

### Finding 1: Título principal ainda era seguradora genérica

`review/page.tsx`: header do card agora usa `quote.name` como título primário. Com `quote.name = "Azul Roubo e Furto — (R$ 1.705,05)"`, o corretor diferencia os cards sem abrir o PDF. Fallback para `INSURER_LABELS` quando `quote.name` é null (ex: FAILED).

### Finding 2: Labels atualizados para nomenclatura comercial

`quote-filename.ts` — `getAzulProductLabel` retorna agora "Roubo e Furto" (antes "Roubo") e "Seguro Auto" (antes "Tradicional"). `buildQuoteLabel` em `extract-pdf.processor.ts` produz: "Azul Roubo e Furto — (R$ 1.705,05)" e "Azul Seguro Auto — (R$ 3.673,00)".

### Finding 3: Consistência em todos os pontos

Fonte única `getAzulProductLabel` alimenta `buildQuoteLabel` (→ `quote.name` no DB) e `buildQuotePdfFilename` (→ nome do arquivo). Card de review e link público leem `quote.name`.

### Finding 4: Campo Segmento como fonte primária

- `packages/types/src/quote.types.ts`: `segment?: string` adicionado a `AutoQuoteData`.
- `auto-quote.schema.ts`: `segment: z.string().optional()`.
- `ai.service.ts` (prompt Azul): campo `"segment"` instruindo LLM a copiar exatamente o campo 'Segmento' do PDF.
- `quote-filename.ts` — mapa `AZUL_SEGMENT_LABEL_MAP`: `'AZUL TRADICIONAL' → 'Seguro Auto'`, `'AZUL AUTO ROUBO' → 'Roubo e Furto'`. Fallback: `fipePercentage`.

### Testes — Fix attempt 2

- `quote-filename.spec.ts`: +1 teste (segment prioridade sobre fipePercentage); atualizados: Tradicional testa "Seguro", Roubo testa "Furto". 17/17 passando.
- `azul-auto-extraction.spec.ts`: +2 testes segment. 29/29 passando.
- Regressão completa API: 297/297 passando.

## Review findings 2 — 2026-05-05

### Finding 1: Nome comercial nao propagou para link publico

QA humano validou que o nome correto aparece na etapa de confirmar dados, mas nao aparece corretamente na geracao/link publico. Isso ainda pertence a esta task porque o acceptance criteria exige que o link publico diferencie cards da mesma seguradora de forma compreensivel.

Esperado:

- card do link publico deve mostrar `Azul Roubo e Furto` ou `Azul Seguro Auto` de forma visivel;
- header/tag da seguradora nao deve cair em `AZUL` cru nem esconder o produto;
- a mesma regra usada na review deve alimentar a experiencia publica.

### Finding 2: Nome do PDF gerado ainda sai apenas `Azul`

QA humano validou que o PDF baixado/gerado para Azul ainda fica nomeado apenas como `Azul`, sem veiculo, produto e premio total. Isso tambem ainda pertence a esta task porque o acceptance criteria exige PDFs gerados com nomes distintos e uteis, nao apenas `Azul`.

Investigar:

- se `buildQuotePdfFilename` esta recebendo `extractedData` sem `segment`, `coverage.vehicle.fipePercentage`, `vehicle.model` ou `premium.total`;
- se o endpoint de download esta usando dados antigos/salvos antes do reprocessamento;
- se a geracao de PDF usa outro caminho que nao passa por `buildQuotePdfFilename`;
- se o nome confirmado (`quote.name`) deveria ser usado como fallback para filename quando o extractedData estiver incompleto.

Esperado para Azul:

- `JEEP_COMPASS_Azul_Roubo_e_Furto(1705.05).pdf` ou equivalente limpo;
- `JEEP_COMPASS_Azul_Seguro_Auto(3673).pdf` ou equivalente limpo;
- nunca apenas `Azul.pdf` ou nome sem produto quando os dados estao disponiveis.

## Fix attempt 3 — 2026-05-05

### Finding 1: Nome comercial não propagou para link público

Causa raiz: `INSURER_LABELS` em `apps/dashboard/src/app/(public)/c/[token]/page.tsx` não continha `AZUL`, caindo em `quote.insurer` raw ("AZUL").

Correção: adicionado `AZUL: 'Azul Seguro Auto'` ao mapa. O header do card público exibe agora "Azul Seguro Auto" (insurer label) e `quote.name` aparece como subtítulo no corpo (ex: "Azul Roubo e Furto — (R$ 1.705,05)"), diferenciando os dois produtos Azul.

### Finding 2: Nome do PDF gerado ainda sai apenas "Azul"

Investigação: `buildQuotePdfFilename` no endpoint de download não recebia `quote.name`. Para cotações antigas (processadas antes do Fix attempt 2), `extractedData` não contém `segment` nem `fipePercentage`, então `getAzulProductLabel` retorna `undefined` → filename cai em `Azul.pdf`.

Correção:
- `quote-filename.ts`: `buildQuotePdfFilename` aceita novo parâmetro opcional `quoteName?: string | null`. Quando `deductibleType`/produto não puder ser determinado pelo `extractedData`, usa `quoteName` (nome confirmado pelo corretor) com sanitização: remove sufixo "— (R$ X.XXX,XX)", prefixa com `shortModel` se disponível. Ex: `JEEP_COMPASS_Azul_Roubo_e_Furto.pdf`.
- `quote.controller.ts`: endpoint `/pdf` passa `quote.name` como terceiro argumento.

Testes (TDD):
- "usa quoteName como fallback quando extractedData não tem segment nem fipePercentage" → espera Roubo, Furto.
- "fallback com extractedData null usa quoteName" → espera Seguro.
- "extractedData válido com fipePercentage ignora quoteName" → quoteName não deve interferir.
- "sem quoteName e extractedData incompleto retorna pelo menos 'Azul'" → fallback mínimo.

Todos os 4 novos testes passando (20/20 em `quote-filename.spec.ts`).
Regressão completa API: 301/301 passando.

## Review findings 3 — 2026-05-05

### Finding 1: Link publico ainda prioriza label fixo da seguradora

QA humano confirmou que no link publico o PDF de roubo/furto aparece como `Azul Seguro Auto`. O codigo adicionou `AZUL: 'Azul Seguro Auto'` em `INSURER_LABELS`, mas o header do card publico continua renderizando `INSURER_LABELS[quote.insurer]` como destaque principal. Para Azul, isso transforma qualquer produto em `Azul Seguro Auto`, inclusive roubo/furto.

Esperado:

- Para Azul, o card publico deve priorizar `quote.name` ou um helper derivado de `segment`/`fipePercentage`.
- `INSURER_LABELS.AZUL` nao pode ser usado como label principal quando o produto comercial importa.
- O texto `Azul Seguro Auto` so deve aparecer para segmento/tradicional/compreensivo.

### Finding 2: Tela de geracao de PDFs ainda exibe apenas seguradora

Na tela de gerar PDFs, o item de download usa `INSURER_LABELS[quote.insurer] ?? quote.insurer` como label. Isso ignora `quote.name`, entao Azul aparece como `AZUL` ou label generico, mesmo quando a cotacao ja tem `quote.name = "Azul Roubo e Furto — (...)"`.

Esperado:

- Lista de PDFs gerados deve usar `quote.name` como label principal.
- Fallback para seguradora so quando `quote.name` estiver ausente.
- Incluir `AZUL` no mapa dessa tela nao resolve sozinho; o produto precisa aparecer.

### Finding 3: Filename do download ainda nao esta coberto por teste de endpoint/use-case

`buildQuotePdfFilename` ganhou fallback com `quoteName`, mas o bug real continua aparecendo como PDF `Azul`. Falta um teste no caminho que o usuario usa, nao so no helper isolado.

Cobrir pelo menos um destes caminhos:

- controller `GET /quotes/:processId/quotes/:quoteId/pdf` passando `quote.name` e `extractedData` para `buildQuotePdfFilename`;
- ou use-case/integração que prove que uma cotacao Azul READY com `quote.name`, `segment`, `vehicle.model` e `premium.total` nao baixa/mostra `Azul.pdf`.

Enquanto esse teste nao existir, o helper pode passar isoladamente e o fluxo real continuar exibindo/baixando `Azul`.

## Final QA decision — 2026-05-05

QA humano validou o fluxo completo depois do Fix attempt 3:

- etapa de confirmar dados mostra `Azul Roubo e Furto` e `Azul Seguro Auto` corretamente;
- link publico propaga o nome comercial correto;
- tela de geracao de PDFs usa o nome comercial correto;
- download do PDF gerado nao fica mais apenas `Azul`;
- FIPE, codigo FIPE e franquia seguem corretos.

Task encerrada. O bug intermitente de delay ao voltar/subir PDFs no mesmo processo nao bloqueou esta task e fica separado em `TASK-0037` se reaparecer.

## Fix attempt 4 — 2026-05-05

### Finding 1: Link público priorizava label fixo da seguradora

Causa raiz: o header do card público usava `INSURER_LABELS[quote.insurer]` como texto primário. Após adicionar `AZUL: 'Azul Seguro Auto'` no Fix attempt 3, qualquer cotação Azul (inclusive Roubo e Furto) exibia "Azul Seguro Auto" no destaque.

Correção: `c/[token]/page.tsx` — header agora usa `quote.name` como primário, com strip do sufixo de prêmio `— (R$ X.XXX,XX)`. Resultado: "Azul Roubo e Furto" ou "Azul Seguro Auto" no header. Fallback para `INSURER_LABELS` apenas quando `quote.name` é nulo (ex: cotações FAILED ou sem processamento).

`INSURER_LABELS.AZUL = 'Azul Seguro Auto'` permanece como fallback de último recurso.

### Finding 2: Tela de geração de PDFs ignorava quote.name

Causa raiz: label do item de download montado com `INSURER_LABELS[quote.insurer] ?? quote.insurer`, ignorando `quote.name`.

Correção: `generate/page.tsx` — label agora usa `quote.name?.replace(/\s*—\s*\(R\$[^)]*\)\s*$/, '').trim()` como primário. Fallback: `INSURER_LABELS[quote.insurer] ?? quote.insurer`. Adicionado `AZUL: 'Azul Seguro Auto'` para cobertura de fallback.

### Finding 3: Teste do caminho real do download

Criado `quote.controller.spec.ts` (novo arquivo) com 3 testes cobrindo `downloadPdf`:
- Azul sem segment/fipePercentage: `quote.name` é passado para `buildQuotePdfFilename` → filename contém "Roubo", não é "Azul.pdf".
- Azul com segment completo: filename usa extractedData (segment primário), contém "Roubo", "Furto", "Azul".
- Sem `originalFileKey`: lança `NotFoundException`.

Testes: 304/304 passando (30 suites).

## Human QA Checklist

- [x] Reprocessar Azul Tradicional completo/reduzido.
- [x] Reprocessar Azul Roubo/Furto completo/reduzido.
- [x] Confirmar FIPE, franquia, premio total, RCF e forma de pagamento contra PDF original.
- [x] Confirmar que cada card de review e link publico pode ser identificado sem abrir o PDF original.
- [x] Baixar PDFs gerados e confirmar nomes distintos.
- [x] Rodar regressao rapida com Porto e Bradesco.

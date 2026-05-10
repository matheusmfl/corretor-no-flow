---
id: TASK-0044
title: Enriquecer detalhes de coberturas Tokio Marine no review PDF e link
status: done
kind: implementation
lifecycle: closed
area: api
owner: claude
reviewer: codex
complexity: medium
risk: medium
tdd_required: true
created_at: 2026-05-07
closed_at: 2026-05-07
blocked_by: TASK-0022
---

# TASK-0044 - Enriquecer detalhes de coberturas Tokio Marine no review PDF e link

## Context

Na validacao humana de Tokio Marine, os 5 produtos e labels foram aprovados. Mesmo assim, a exibicao de coberturas ainda esta parcial:

- Assistencia/guincho aparece como `Incluso`, mas nao mostra limite de km.
- Protecao de vidros aparece como `Incluso` ou `Nao contratado`, mas precisa ser mais precisa quando houver detalhe.
- Carro reserva funcionou parcialmente, por exemplo `15 dias`.
- Em Protecao Mensal, vidro apareceu como nao contratado, guincho incluso, mas carro reserva nem foi citado.
- Servicos importantes da aba/trecho de servicos nao aparecem no PDF gerado nem no link: `Martelinho e para-choque`, `Lataria e pintura`, `Roda, pneu e suspensao`, `Logomarca (vidros)`.
- Condicoes especiais comerciais aparecem no PDF/portal, mas ainda nao sao preservadas de forma clara.

Isso confirma a direcao da `TASK-0022`: o contrato rico deve existir, mas a implementacao pratica precisa ser fatiada por seguradora/produto para reduzir risco.

Nova decisao de produto:

- Coberturas podem ter tooltip/detalhe explicativo reutilizavel, para manter padrao de exibicao com baixo acoplamento.
- O valor mostrado no card/linha deve vir da cotacao extraida.
- O texto do tooltip vem de catalogo estatico por seguradora/plano. No caso da Tokio, os prints enviados sao tooltips do cotador Tokio e devem ser tratados como informacao constante do nosso sistema, nao como texto esperado no PDF.
- Tokio deve ser a primeira implementacao desse padrao, mas o desenho precisa permitir Bradesco/Porto/Azul depois.
- Decisao humana em 2026-05-07: `Martelinho e para-choque`, `Lataria e pintura`, `Roda, pneu e suspensao`, `Logomarca (vidros)` e servicos similares sao opcionais/assinalaveis em diferentes tipos de produto. Nao inferir estado pelo produto. O estado deve vir do PDF/cotacao (`Possui`, `Nao possui`, tier ou valor textual equivalente).

## Objective

Melhorar a exibicao das principais coberturas Tokio Marine no review, PDF e link publico, sem inventar dados ausentes, e criar um padrao de detalhes/tooltip de cobertura que possa ser reaproveitado por outras seguradoras.

## Scope

- Mapear, a partir dos PDFs Tokio ja extraidos, quais detalhes podem ser exibidos com seguranca:
  - assistencia 24h contratada e plano/tipo, por exemplo `Completa` ou futuramente `VIP`;
  - limite base de guincho/reboque;
  - km adicional de reboque;
  - total de reboque calculado quando o PDF trouxer a formula, por exemplo `200 km (padrao) + 100 km (adicional) = 300 KM`;
  - dias e categoria de carro reserva, por exemplo `15 diarias Basico (Mecanico)`;
  - vidro contratado vs nao contratado;
  - tipo de vidro/servico de vidros, por exemplo `Basico` ou `Completo`;
  - logomarca de vidros;
  - martelinho e para-choque;
  - lataria e pintura;
  - roda, pneu e suspensao;
  - tipo de oficina para reparo;
  - tipo de peca para reparo;
  - cobertura sem casco/nao aplicavel;
  - produto mensal/90% FIPE;
  - condicoes especiais/observacoes comerciais quando forem citadas no PDF.
- Popular detalhes no contrato de exibicao quando ja existirem no `AutoQuoteData` ou forem extraiveis de forma segura.
- Garantir que campo ausente nao seja mostrado como contratado nem como erro.
- Atualizar review/PDF/link para usar a representacao enriquecida quando disponivel.
- Criar um modelo simples de tooltip/detalhe para cobertura, evitando acoplar texto de UI ao parser da Tokio.
- Separar claramente:
  - `extracted`: fatos vindos do PDF/cotacao;
  - `catalog/static`: explicacao da seguradora ou guia de servicos;
  - `not_found`: ausente/desconhecido;
  - `not_contracted`: presente na cotacao como nao contratado/nao possui.

## Tokio Facts Already Found

Os PDFs de descoberta ja mostram estes exemplos:

- `Assistencia 24 horas Completa`.
- `Km adicional de reboque 100 km` em Auto, Auto Classico e Auto Roubo + Rastreador.
- `Km adicional de reboque Nao contratada` em Assistencia Exclusiva e Auto Protecao Mensal.
- `Km adicional reboque 200 km (padrao) + 100 km (adicional) = 300 KM`.
- `Km adicional reboque 200 km (padrao) + Nao possui (adicional) = 200 KM`.
- `Vidros Completo` em Auto/Auto Classico/Auto Roubo + Rastreador.
- `Vidros Nao possui` em Auto Protecao Mensal e Assistencia Exclusiva.
- `Carro reserva 15 diarias Basico (Mecanico)` em Auto.
- `Carro reserva 7 diarias Basico (Mecanico)` em Auto Classico e Auto Roubo + Rastreador.
- `Carro reserva Nao possui` em Auto Protecao Mensal e Assistencia Exclusiva.
- `Tipo de oficina para reparo Livre Escolha` em Auto.
- `Tipo de oficina para reparo Rede Referenciada` em Auto Classico, Auto Roubo + Rastreador e Auto Protecao Mensal.
- `Tipo de peca para reparo Novas originais` em Auto, Auto Classico e Auto Roubo + Rastreador.
- `Tipo de peca para reparo Novas Compativeis` em Auto Protecao Mensal.
- `Martelinho e para-choque`, `Lataria e pintura`, `Roda, pneu e suspensao`, `Logomarca (vidros)` aparecem na tabela de servicos, mas nas amostras atuais aparecem como `Nao possui`.
- O PDF cita condicao de pagamento a vista com desconto e links para Condicoes Gerais/Guia de Servicos.

Referencia positiva extraida em 2026-05-07:

- Input: `.ai/pdf-lab/input/tokio-lataria+pintura-martelinho-roda+pneu+suspensao-logomarca+vidros.pdf`.
- Output: `.ai/pdf-lab/output/auto_tokio_services_positive_reference.md`.
- JSON: `.ai/pdf-lab/output/auto_tokio_services_positive_reference.json`.
- Produto observado: `Auto`.
- `Assistencia 24 horas Completa`.
- `Km adicional de reboque 100 km`.
- `Km adicional reboque 200 km (padrao) + 100 km (adicional) = 300 KM`.
- `Vidros Completo`.
- `Martelinho e para-choque Possui`.
- `Lataria e pintura Possui`.
- `Roda, pneu e suspensao Possui`.
- `Logomarca (vidros) Nao possui`.
- `Carro reserva 15 diarias Basico (Mecanico)`.
- `Tipo de oficina para reparo Livre Escolha`.
- `Tipo de peca para reparo Novas originais`.
- Franquia observada nessa amostra: `Indenizacao Parcial - 50% da Basica | R$ 2.582,00`.
- O PDF tambem lista franquias/valores de servicos, por exemplo `Martelinho (teto) R$ 300,00`, `Martelinho (demais pecas) R$ 80,00`, `Para-choque (troca) R$ 450,00`, `Para-choque (reparo) R$ 195,00`, `Lataria e pintura R$ 155,00`, `Roda, Pneu e Suspensao R$ 175,00`.

Conclusao da referencia positiva:

- Implementar parser/display de estados positivos para esses servicos, nao apenas `Nao possui`.
- Nao usar `Auto`, `Auto Classico` ou `Protecao Mensal` como regra para decidir se servico existe.
- Quando o PDF trouxer `Possui`, exibir como contratado.
- Quando o PDF trouxer `Nao possui` ou `Nao contratada`, exibir como nao contratado quando o contexto de comparacao pedir essa clareza.
- Quando o PDF nao trouxer o campo, tratar como `not_found`, nao como `Nao possui`.

## Tooltip / Detail Copy

Importante: as informacoes desta secao vieram dos tooltips do cotador Tokio, nao do PDF gerado pela Tokio. Portanto:

- nao esperar esses textos no parser de PDF;
- nao falhar extracao se o PDF nao trouxer esses textos;
- salvar/modelar isso como catalogo constante do sistema;
- usar o catalogo apenas para enriquecer tooltip/ajuda contextual para corretor e cliente;
- manter a contratacao real dependente dos campos extraidos do PDF, por exemplo plano `Completa`, plano `VIP`, vidro `Basico`, vidro `Completo`, `Nao possui`, etc.

Implementar como catalogo de texto por seguradora/plano, nao como dado extraido da cotacao.

Para Tokio, a copy inicial conhecida pelo portal:

- Assistencia 24h `Completa`: 200 km de reboque com possibilidade de ampliacao da km, mecanico, meio de transporte para retorno ao domicilio, hospedagem, chaveiro, entre outros.
- Assistencia 24h `VIP`: mesma cobertura do plano Completa + 2 utilizacoes para pane, 2 dias de carro reserva basico para pane, higienizacao do veiculo, servico de leva e traz do carro reserva, reparos residenciais, entre outros.
- Vidros `Basico`: reparo do para-brisa quando possivel ou reposicao dos vidros laterais, para-brisa e traseiro.
- Vidros `Completo`: garantias do plano Basico + farois, lanternas, retrovisores, maquina dos vidros, teto solar e panoramico.

Regras:

- Tooltip nao deve transformar plano ausente em cobertura contratada.
- Tooltip deve aparecer apenas quando houver um plano/tier conhecido ou quando a UI tiver uma razao clara para mostrar ajuda contextual.
- PDF pode renderizar uma versao curta do tooltip como nota abaixo da cobertura, sem poluir o card principal.
- Link publico deve priorizar legibilidade: mostrar resumo curto e deixar detalhe em tooltip/expandivel.
- Testes de parser nao devem procurar a copy dos tooltips no PDF.
- Testes de UI/PDF gerado podem validar que, dado um plano/tier extraido, a copy constante correta e apresentada.

## Reference PDF Needed

PDF de referencia ja fornecido pelo humano e extraido:

- `.ai/pdf-lab/input/tokio-lataria+pintura-martelinho-roda+pneu+suspensao-logomarca+vidros.pdf`
- `.ai/pdf-lab/output/auto_tokio_services_positive_reference.md`
- `.ai/pdf-lab/output/auto_tokio_services_positive_reference.json`

Esse PDF nao precisa conter os textos dos tooltips do cotador. Ele serve para:

- confirmar os campos/valores exatos que a Tokio imprime quando os itens estao contratados;
- evitar parser baseado apenas em exemplos `Nao possui`;
- criar fixture/teste unico de "servicos contratados" para o PDF gerado citar corretamente as coberturas.

Ainda nao ha amostra positiva de `Assistencia 24h VIP` nem de `Logomarca (vidros) Possui`. Esses itens devem ficar preparados no contrato/catalogo, mas o parser nao deve inventar estado positivo sem PDF.

## Out Of Scope

- Nao redesenhar todo o contrato generico de extras por seguradora.
- Nao implementar Bradesco/Porto nesta task.
- Nao criar comparativo automatico.
- Nao incluir dados sem evidencia nos PDFs reais.
- Nao prometer beneficios de tooltip como contratados se eles vierem apenas do guia/portal.
- Nao implementar moto/caminhao nesta task.

## Likely Files

- `apps/api/src/modules/quotes/application/services/coverage-display.ts`
- `apps/api/src/modules/quotes/application/services/coverage-display.spec.ts`
- `apps/api/src/modules/quotes/application/services/quote-pdf-template.service.ts`
- `apps/dashboard/src/app/(app)/dashboard/quotes/[processId]/review/page.tsx`
- `apps/api/src/modules/public/application/use-cases/get-public-process.use-case.ts`
- `packages/types/src/quote.types.ts`

## Executor Context Pack

Read these files first, in order:

1. `.ai/tasks/done/TASK-0022-design-rich-auto-coverage-display-contract.md`
2. `.ai/discovery/TOKIO-MARINE-AUTO.md`
3. `apps/api/src/modules/quotes/application/services/coverage-display.spec.ts`
4. `apps/api/src/modules/quotes/application/services/coverage-display.ts`
5. `apps/api/src/modules/quotes/application/services/quote-pdf-template.service.ts`
6. `apps/dashboard/src/app/(app)/dashboard/quotes/[processId]/review/page.tsx`

Use `rg` only for:

- `ASSIST`
- `PROTECAO MENSAL`
- `Assistencia 24 horas`
- `Km adicional reboque`
- `Tipo de oficina para reparo`
- `Tipo de peca para reparo`
- `Martelinho e para-choque`
- `Lataria e pintura`
- `Roda, pneu e suspensao`
- `towing`
- `replacementDays`
- `glassProtection`
- `coverage.assistance`
- `buildCoverageDisplay`
- `Assistencias`

If more than 6 additional files seem necessary, stop and explain why before continuing.

## TDD Requirement

Required. Start with tests that express Tokio-specific display expectations before changing renderer behavior.

## Acceptance Criteria

- [ ] Tokio Auto mostra carro reserva com dias quando extraido.
- [ ] Tokio Auto/Classico/Protecao Mensal nao exibem vidro como contratado quando `glassProtection=false`.
- [ ] Guincho/assistencia nao inventa KM quando limite nao estiver extraido.
- [ ] Se limite de KM estiver extraido/documentado com seguranca, ele aparece no detalhe.
- [ ] Quando houver base/adicional/total de reboque, a UI mostra resumo claro, por exemplo `Guincho ate 300 km`.
- [ ] Quando houver plano de assistencia conhecido, tooltip/detalhe explica o plano sem misturar com fato extraido.
- [ ] Vidros mostra `Basico`, `Completo`, `Nao possui` ou `Nao contratado` conforme extraido.
- [ ] Martelinho/para-choque, lataria/pintura, roda/pneu/suspensao e logomarca vidros sao preservados quando presentes no PDF.
- [ ] A amostra positiva `auto_tokio_services_positive_reference` extrai `Possui` para martelinho/para-choque, lataria/pintura e roda/pneu/suspensao.
- [ ] Servicos opcionais nao sao inferidos por produto; o estado vem do PDF/cotacao.
- [ ] Campo ausente vira `not_found`, campo presente como `Nao possui` vira `not_contracted`, campo presente como `Possui` vira `included`.
- [ ] Tipo de oficina e tipo de peca aparecem como detalhe comercial relevante.
- [ ] Condicoes especiais/observacoes comerciais extraidas aparecem como notas, sem virar cobertura principal.
- [ ] Protecao Mensal nao omite silenciosamente carro reserva se houver estado `not_contracted` conhecido.
- [ ] Assistencia Exclusiva nao mostra casco/FIPE fantasma.
- [ ] Link publico e PDF recebem os mesmos detalhes enriquecidos, com apresentacao mais enxuta quando necessario.
- [ ] Existe teste/fixture cobrindo pelo menos um PDF Tokio com servicos contratados, se o PDF de referencia for fornecido.
- [ ] Testes focados passam.

## Risks

- Mostrar `Nao contratado` demais pode deixar a cotacao visualmente negativa; omitir demais pode esconder diferencas importantes.
- Tokio pode variar textos de assistencia por impressao, exigindo nova amostra antes de afirmar KM.
- Tooltip estatico pode parecer dado da cotacao se nao houver separacao visual e tecnica.
- `Assistencia 24h VIP` e `Logomarca (vidros) Possui` ainda nao tem amostra positiva; implementar suporte estrutural sem fingir evidencia de PDF.

## Failure Scenario

O cliente compara Tokio Protecao Mensal com outro produto, ve apenas "Guincho incluso" e nao percebe que vidro/carro reserva nao foram contratados ou nao se aplicam.

## Human QA Checklist

- [ ] Abrir review de Tokio Auto e confirmar carro reserva em dias.
- [ ] Abrir review de Tokio Protecao Mensal e confirmar vidro/carro reserva como nao contratado quando aplicavel.
- [ ] Confirmar que o tooltip de assistencia `Completa` aparece como explicacao, nao como cobertura nova.
- [ ] Confirmar que o resumo de guincho soma corretamente 200 km padrao + adicional quando o PDF trouxer a formula.
- [ ] Confirmar que tipo de oficina e tipo de peca aparecem no review/link/PDF.
- [ ] Se houver PDF de referencia com servicos contratados, confirmar que martelinho, lataria/pintura, roda/pneu/suspensao e logomarca vidros aparecem corretamente.
- [ ] Gerar PDF e conferir as mesmas mensagens.
- [ ] Abrir link publico e confirmar que a informacao nao polui o card.

## Implementation Notes — 2026-05-07

### Arquivos alterados

- `packages/types/src/quote.types.ts` — `AutoQuoteData.coverage.assistance` ganhou 12 campos novos: `assistancePlan`, `towingKmBase/Additional/Total`, `glassTier`, `replacementCategory`, `martelinho`, `latariaEPintura`, `rodaPneuSuspensao`, `logoMarcaVidros`, `repairShopType`, `partsType`. `RichCoverage` expandida: `towing` tem `kmTotal/planName/tooltip`; `glass` tem `tier` (string genérico) e `tooltip`; `replacementVehicle` tem `category`; `fastRepair` removido e substituído por `martelinho/latariaEPintura/rodaPneuSuspensao/logoMarcaVidros`.
- `apps/api/src/modules/quotes/domain/schemas/auto-quote.schema.ts` — Zod `AssistanceCoverageSchema` aceita todos os novos campos.
- `apps/api/src/modules/quotes/application/services/coverage-display.ts` — função `triState`, catálogo estático `TOKIO_ASSISTANCE_TOOLTIP`/`TOKIO_GLASS_TOOLTIP`, e mapeamento de todos os novos campos para `RichCoverage`. Tooltips populados apenas quando insurer = `TOKIO_MARINE` e plan/tier conhecido.
- `apps/api/src/modules/quotes/application/services/coverage-display.spec.ts` — 28 novos testes + correção `fastRepair→martelinho` (65 total).
- `apps/api/src/modules/quotes/application/services/quote-pdf-template.service.ts` — importa e chama `buildCoverageDisplay` no `render()`. Três funções puras novas: `richAssistGroup`, `richServicesGroup`, `richRepairConditionsGroup`. Bloco Assistências usa plano+km, tier de vidro, dias+categoria. Novos blocos "Serviços" e "Condições de Reparo".
- `apps/api/src/modules/quotes/application/services/quote-pdf-template.service.spec.ts` — 10 novos testes Tokio (33 total).
- `apps/dashboard/src/app/(app)/dashboard/quotes/[processId]/review/page.tsx` — seção de coberturas expandida: uma linha por campo extraído (assistência 24h, vidros com tier, veículo reserva com categoria, 4 serviços opcionais, oficina, peça). Só aparece quando o campo não é null.
- `apps/dashboard/src/app/(public)/c/[token]/page.tsx` — chips da `QuoteCard` enriquecidos: "Assistência 24h · Completa · 300 km", chip de vidros com tier, chip de reserva com dias.
- `apps/api/src/modules/ai/ai.service.ts` — prompt Tokio `getTokioMarineAutoPrompt()` expandido para extrair todos os novos campos da `assistance`. Regra explícita: serviços opcionais devem ser omitidos (não `false`) quando o campo não aparece no PDF.
- `apps/api/src/modules/quotes/application/services/tokio-auto-extraction.spec.ts` — fixture `SERVICES_POSITIVE_AI_RESPONSE` baseada no PDF de referência positiva. 9 novos testes validando Zod para os campos extraídos (28 total).

### Testes

128 testes passando, 0 falhas. TypeScript limpo em `apps/api` e `apps/dashboard`.

### O que NÃO foi feito (out of scope confirmado)

- Parser determinístico adicional para os novos campos: os valores vêm da IA via prompt atualizado. Um parser regex para os campos de serviço seria mais confiável, mas adiciona complexidade para uma tarefa futura.
- Assistência 24h VIP e Logomarca (vidros) Possui: suporte estrutural criado (campos no tipo, catálogo VIP no tooltip), mas sem PDF de referência positiva para criar fixture de extração.
- Bradesco/Porto/Azul: sem alteração nos prompts — apenas a estrutura do tipo foi estendida de forma compatível.

## Review Findings — 2026-05-07

Quatro achados P2 reportados pelo revisor humano. Nenhum aprovado ainda; tarefa permanece em review até re-avaliação.

**P2-1** — 12 campos insurer-specific colocados em `AutoQuoteData.coverage.assistance` em vez de uma chave de enriquecimento separada. `coverage` deveria ficar cross-insurer (4 flags básicos: `towing`, `glassProtection`, `replacementVehicle`, `replacementDays`).

**P2-2** — `richAssistGroup` usa `anyContracted` para decidir se renderiza o bloco de assistências. Isso oculta linhas "Não contratado" quando nenhum item é contratado, por exemplo vidro/reserva explicitamente `false` em Proteção Mensal com guincho `true`.

**P2-3** — `rich.towing.tooltip` e `rich.glass.tooltip` são calculados em `buildCoverageDisplay` mas nunca renderizados — nem no template HTML do PDF nem na página de review.

**P2-4** — `QuoteCard` no link público só mostra chips de itens `contracted`. Estados `not_contracted` de vidro e reserva (diferenciais importantes entre produtos) não aparecem. Seção de serviços (martelinho, lataria, roda/pneu) e condições de reparo (oficina, peça) ausentes do card.

## Fix Attempt — 2026-05-07

### P2-1: Mover campos para `coverageDetails`

`AutoQuoteData` agora tem `coverageDetails?` como chave top-level com sub-objetos:

```ts
coverageDetails?: {
  assistance?: { planName?; towingKmBase?; towingKmAdditional?; towingKmTotal? }
  glass?: { tier? }
  replacementVehicle?: { category? }
  services?: { martelinho?; latariaEPintura?; rodaPneuSuspensao?; logoMarcaVidros? }
  repair?: { shopType?; partsType? }
}
```

`coverage.assistance` revertida para apenas 4 flags universais. Todos os 12 campos removidos de lá.

Arquivos alterados: `packages/types/src/quote.types.ts`, `auto-quote.schema.ts`, `coverage-display.ts`, `coverage-display.spec.ts`, `quote-pdf-template.service.spec.ts`, `tokio-auto-extraction.spec.ts`, `ai.service.ts` (prompt Tokio), review page, public page.

### P2-2: anyKnown em vez de anyContracted

`richAssistGroup` agora usa:
```ts
const known = (s: CoverageStatus) => s !== 'not_found' && s !== 'not_applicable';
const anyKnown = known(rich.towing.status) || known(rich.glass.status) || known(rich.replacementVehicle.status);
if (!anyKnown) return '';
```

Itens `not_contracted` explícitos (ex.: vidro = false em Proteção Mensal) agora aparecem no bloco Assistências como "Não contratado". O teste antigo ("não renderiza quando todos são false") foi atualizado para refletir o novo comportamento correto.

### P2-3: Renderização de tooltips

PDF template: `richAssistGroup` agora injeta `<div class="cob-note">` abaixo das linhas de guincho e vidros quando `rich.towing.tooltip` / `rich.glass.tooltip` estão presentes.

Review page: `coverageDetails.assistance.planName` e `coverageDetails.glass.tier` já aparecem inline na linha de detalhe (sem nota separada — a página de review é dados brutos, o tooltip é mais relevante no PDF/link público).

### P2-4: QuoteCard enriquecido (link público)

Chips agora incluem:
- Vidros `not_contracted` → chip "Vidros não contratado" com texto riscado (line-through).
- Veículo reserva `not_contracted` → chip "Sem veículo reserva" riscado.
- Martelinho, lataria/pintura, roda/pneu — chips por estado (contracted normal, not_contracted riscado).
- Tipo de oficina como chip informativo.

### Testes

122 testes passando (coverage-display: 65, tokio-auto-extraction: 28, quote-pdf-template: 33). TypeScript limpo em `apps/api` e `apps/dashboard`.

## Review Findings — Segunda rodada — 2026-05-07

Dois achados P2 remanescentes após a primeira tentativa.

**P2-Badge** — `richAssistGroup` renderizava badge "Contratado" fixo mesmo quando o bloco existia apenas por itens `not_contracted`. Contraditório para o cliente: o cabeçalho dizia Contratado mas todas as linhas diziam Não contratado.

**P2-Link** — QuoteCard omitia `logoMarcaVidros`, `repair.partsType` e nenhum detalhe/tooltip de catálogo para assistência/vidros era propagado para o link público.

## Fix Attempt 2 — 2026-05-07

### P2-Badge: badge dinâmico

`richAssistGroup` agora calcula `anyContractedAssist` (pelo menos um item com status `contracted`) e usa:

```ts
const assistBadge = anyContractedAssist ? 'Contratado' : 'Detalhes';
```

Quando só existem itens `not_contracted`, o bloco aparece com badge "Detalhes" — sem contradição. Quando ao menos um item está contratado, badge permanece "Contratado".

Spec atualizado: teste "quando todos são false" agora verifica `badge=Detalhes` e ausência de `badge=Contratado`. Teste separado verifica `badge=Contratado` quando `towing=true`.

### P2-Link: QuoteCard completo

Adicionados ao card:
- `logoMarcaVidros` — chip por estado (normal ou riscado).
- `repair.partsType` — chip informativo.
- Catálogo de tooltips (`TOKIO_ASSIST_TOOLTIP`, `TOKIO_GLASS_TOOLTIP`) inline no componente de servidor (sem import do API). Chips de assistência e vidros recebem `title=` com o texto do catálogo quando o insurer é `TOKIO_MARINE` e o plan/tier é conhecido.

### Testes

122 testes passando. TypeScript limpo em `apps/api` e `apps/dashboard`.

## Codex Review Status — 2026-05-07

Revisao tecnica aprovada apos a segunda rodada de ajustes.

Checks verificados pelo revisor:

- `coverage.assistance` voltou a ficar restrito aos campos universais.
- `coverageDetails` concentra enriquecimentos especificos/variaveis por seguradora.
- PDF renderiza assistencias conhecidas mesmo quando sao `not_contracted`.
- Badge do PDF alterna entre `Contratado` e `Detalhes` para evitar contradicao visual.
- Link publico recebeu chips para logomarca, tipo de peca, tipo de oficina e servicos opcionais.
- Link publico recebeu `title` com catalogo estatico Tokio para assistencia e vidros.
- Testes focados da API passaram: `122 passed`.
- TypeScript limpo em `apps/api`.
- TypeScript limpo em `apps/dashboard`.

Status: tecnicamente pronto, mas nao mover para `done` ainda.

## Human QA Required Before Done

Esta task mexe na apresentacao que o cliente final e o corretor veem. Antes de mover para `done`, executar QA humano visual/funcional.

Checklist minimo:

- [ ] Abrir uma cotacao Tokio Auto usando a amostra positiva de servicos.
- [ ] Confirmar no review: assistencia 24h, 300 km, vidros Completo, carro reserva 15 dias, martelinho, lataria/pintura, roda/pneu, logomarca, oficina e tipo de peca.
- [ ] Gerar PDF e conferir se os mesmos detalhes aparecem com leitura clara, sem excesso visual.
- [ ] Conferir que o badge de Assistencias no PDF nao diz `Contratado` quando o bloco so tiver itens `Nao contratado`.
- [ ] Abrir link publico e conferir chips positivos e riscados.
- [ ] Conferir tooltip/title de assistencia e vidros no link publico.
- [ ] Testar/abrir Tokio Protecao Mensal e confirmar vidro/carro reserva como nao contratados quando aplicavel.
- [ ] Confirmar que dados ausentes nao aparecem como `Nao contratado`.

Se o QA humano passar, mover a task para `done`.

## Fix Attempt 4 — 2026-05-07 — Notas fora do grupo + cor verde Tokio + ⓘ público

### PDF: bloco Notas após todos os cob-groups

`richAssistGroup` refatorado para retornar `{ html: string; notes: string[] }`:
- O grupo de Assistências não contém mais notas no interior.
- `render()` coleta `coverageNotes` do resultado e renderiza `<div class="cob-notes">` **após** todos os grupos de cobertura, dentro da mesma section.
- O bloco tem label "Notas" (`cob-notes-label`) e claramente não pertence ao grupo de Veículo Reserva.
- CSS atualizado: `.cob-notes`, `.cob-notes-label`, `sup.cob-fn`, `.cob-fn-text`.

### Tokio Marine: cor verde institucional

`INSURER_CONFIG.TOKIO_MARINE.brand` alterado de `#d4001a` (vermelho) para `#005C35` (verde floresta institucional Tokio Marine).

### Link público: ⓘ + title rico já implementados (Fix Attempt 3)

Chips de assistência e vidros já mostram ` ⓘ` quando há tooltip. O atributo `title=` exibe a explicação completa no hover — o texto nunca aparece como bloco/parágrafo visível.

### Testes

516 testes passando (0 falhas). TypeScript limpo em `apps/api` e `apps/dashboard`.
Novos testes adicionados (40 em quote-pdf-template.service.spec):
- `<div class="cob-notes">` aparece APÓS `Veículo Reserva` (posição verificada).
- Label "Notas" presente.
- Tokio Marine brand contém `#005C35`, não `#d4001a`.
- Ausência de elemento `class="cob-note"` inline antigo.

## Fix Attempt 3 — 2026-05-07 — Tooltip inline → nota de rodapé + indicador visual

### PDF: nota de rodapé em vez de texto inline

`richAssistGroup` no `quote-pdf-template.service.ts` refatorado:
- Removido `<div class="cob-note">` inline após as linhas de guincho e vidros.
- Introduzido padrão de rodapé: quando `rich.towing.footnote` existe, o valor da linha recebe `<sup class="cob-fn">1</sup>` e a nota aparece em `<div class="cob-footnotes">` ao final do grupo.
- CSS adicionado: `sup.cob-fn`, `.cob-footnotes`, `.cob-fn-text`.

### Texto do rodapé com breakdown de km

`coverage-display.ts` ganhou `buildTowingFootnote()` e campo `footnote` em `RichCoverage.towing`:
- Quando `towingKmBase + towingKmAdditional + towingKmTotal` presentes: gera texto "Plano Completa: inclui 200 km padrão de reboque. Esta cotação possui 100 km adicional, totalizando 300 km. Também contempla mecânico, ..."
- Quando apenas `kmTotal` disponível: fallback para "Plano Completa: {catalogText}".
- Sem catálogo: `footnote = undefined` → sem rodapé.

Também adicionado `TOKIO_ASSISTANCE_SERVICES` (catálogo de serviços sem km) e campos `kmBase`, `kmAdditional` em `RichCoverage.towing`.

### Link público: indicador visual `ⓘ` e title rico

`page.tsx` público atualizado:
- Adicionada função `buildAssistTitle()` que gera title com breakdown de km quando base/adicional/total disponíveis.
- Chip de assistência: label `Assistência 24h · Completa · 300 km ⓘ`, title com explicação completa no hover.
- Chip de vidros: `Vidros Completo ⓘ` quando tier tem catálogo Tokio.

### Testes

513 testes passando (0 falhas). TypeScript limpo em `apps/api` e `apps/dashboard`.
Novos testes adicionados:
- `coverage-display.spec.ts`: 7 novos testes para `towing.footnote`, `towing.kmBase`, `towing.kmAdditional` (72 total).
- `quote-pdf-template.service.spec.ts`: 4 novos testes verificando ausência de `cob-note` inline e presença de rodapé com breakdown (37 total).

## Human QA Finding — 2026-05-07 — Tooltip de assistencia confunde km

Status: precisa ajuste antes de `done`.

Durante QA humano no PDF gerado, a linha de assistencia mostrou:

- dado contratado: `Assistencia 24h — Completa — 300 km`;
- texto de catalogo renderizado logo abaixo: `200 km de reboque com possibilidade de ampliacao...`.

Problema:

- `300 km` vem do PDF/cotacao: `200 km (padrao) + 100 km (adicional) = 300 km`.
- `200 km de reboque...` vem do tooltip constante do cotador Tokio, nao do PDF.
- Renderizar os dois textos juntos, em linha/bloco continuo, faz parecer contradicao para o cliente: "afinal o guincho e 200 km ou 300 km?".

Decisao de UX:

- Review/link publico: textos de catalogo devem aparecer como ajuda contextual, preferencialmente icone `?`/`i` ao lado da cobertura, com tooltip/popover no hover/focus.
- PDF: nao existe hover. Usar marcador discreto (`*`, `**` ou nota numerada) na linha da cobertura e renderizar a explicacao em legenda/notas no fim do bloco ou da secao.
- O dado principal deve continuar sendo o contratado/extraido: `Completa — 300 km`.
- A legenda do PDF deve explicar a composicao: plano Completa inclui 200 km padrao; esta cotacao possui 100 km adicional, totalizando 300 km.
- A copy de catalogo deve complementar, nao competir com o dado extraido.

Exemplo desejado no PDF:

```txt
Assistencia 24h        Completa — 300 km*

* Plano Completa: inclui 200 km padrao de reboque. Esta cotacao possui 100 km adicional, totalizando 300 km. Tambem contempla mecanico, transporte para retorno ao domicilio, hospedagem, chaveiro, entre outros, conforme guia de servicos Tokio.
```

Exemplo desejado no review/link:

```txt
Assistencia 24h        Completa — 300 km  (?)
```

O tooltip do `?` deve conter a explicacao do catalogo/plano e, quando houver `towingKmBase`, `towingKmAdditional` e `towingKmTotal`, deve explicitar a soma.

Acceptance extra:

- [ ] Texto de catalogo da assistencia nao aparece mais como paragrafo inline logo abaixo da linha principal no PDF.
- [ ] PDF usa marcador/nota para explicar o plano e a soma de km.
- [ ] Review/link publico usam ajuda contextual para a copy de catalogo, nao texto corrido.
- [ ] Quando houver base/adicional/total, a explicacao diferencia base do plano e total contratado.
- [ ] Cliente nao deve ver `Completa — 300 km` seguido de `200 km de reboque...` sem contexto de soma.

## Human QA Finding — 2026-05-07 — Nota ainda parece texto do bloco e cor Tokio incorreta

Status: precisa ajuste antes de `done`.

No QA visual, a nota numerada ficou renderizada logo abaixo de `Veiculo Reserva`, ainda dentro do bloco de `Assistencias`. Mesmo sem o texto contraditorio inline antigo, a apresentacao ainda pode confundir porque parece uma continuidade das linhas de cobertura, nao uma ajuda contextual discreta.

Decisao de UX:

- Em pagina dinamica/review/link publico: usar icone de ajuda (`?`, `i` ou equivalente) ao lado da cobertura. O conteudo deve abrir em hover/focus/click, nao ficar como texto sempre visivel.
- No PDF: nota pode existir, mas deve parecer legenda/rodape de bloco, com separacao visual clara e menor destaque. Se possivel, agrupar em uma area `Notas` no fim da secao de coberturas, nao imediatamente colada abaixo de `Veiculo Reserva`.
- A linha principal deve ser escaneavel sem a nota: `Assistencia 24h — Completa — 300 km`.
- A nota deve ser secundaria: explica `200 km padrao + 100 km adicional = 300 km` e lista beneficios do plano.

Acceptance extra:

- [ ] Review/link publico mostram ajuda por icone, nao texto visivel permanente.
- [ ] PDF diferencia visualmente nota/legenda das linhas de cobertura.
- [ ] Nota da assistencia nao parece valor/cobertura adicional de `Veiculo Reserva`.
- [ ] Conferir se a experiencia final fica clara para cliente leigo.

Cor da Tokio:

- O PDF/link esta usando Tokio Marine em vermelho. QA humano apontou que Tokio deve usar verde institucional.
- Ajustar brand color de `TOKIO_MARINE` no template/link quando aplicavel.
- Conferir se o verde nao conflita com badges de contratado.

Observacao Bradesco:

- Esta task continua restrita a Tokio.
- Ha discovery/contrato geral relacionado a Bradesco (`BRADESCO-AUTO-EXTRA-FIELDS`, `TASK-0022`, `TASK-0011`), mas nao foi identificada uma task de implementacao especifica para enriquecer coberturas Bradesco com o mesmo padrao de `coverageDetails`, tooltips, servicos e PDF/link.
- Criar task propria para Bradesco antes de implementar esse escopo nele.

## Human QA Passed - 2026-05-07

QA visual aprovado pelo humano orquestrador apos a Fix Attempt 4.

Evidencia:

- Print do link publico com card Tokio Marine Protecao Mensal mostrando:
  - cabecalho em verde institucional Tokio (`#005C35`);
  - chip `Assistencia 24h Completa 200 km` com indicador `i` para tooltip;
  - chips positivos `90% FIPE`, `RCF R$ 25.000,00`, `Rede Referenciada`,
    `Novas Compativeis`;
  - chips riscados `Vidros nao contratado`, `Sem veiculo reserva`, `Martelinho`,
    `Lataria e pintura`, `Roda/pneu`, `Logomarca`;
  - valor de 200 km na Protecao Mensal esta correto: nao soma adicional porque
    `Km adicional de reboque Nao contratada` neste produto.

Itens validados:

- Cor da Tokio em verde, conforme decisao de UX.
- Tooltip por icone, sem texto inline poluindo o card.
- Estados `not_contracted` riscados e claros.
- Tipo de oficina e tipo de peca como chips informativos.
- Diferencas entre Auto e Protecao Mensal aparecem corretamente.

Item levantado durante o QA, fora do escopo desta task:

- Em produtos enxutos como Protecao Mensal o card pode ficar visualmente dominado
  por chips riscados de "nao contratado". Isso virou pergunta de produto e foi
  documentada em `.ai/brainstorm/2026-05-07-mostrar-nao-contratado-link-publico.md`
  para discovery posterior. Nao bloqueia esta task porque a apresentacao atual
  esta tecnicamente correta e fiel ao PDF; a duvida e se faz sentido mostrar
  "nao contratado" sempre ou apenas quando ha diferencial entre cotacoes.

Decisao: task aprovada e movida para `.ai/tasks/done`.

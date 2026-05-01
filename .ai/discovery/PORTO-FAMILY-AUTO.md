# Discovery - AUTO Familia Porto

## Objetivo

Entender como os PDFs AUTO da Porto Seguro, Itau, Sompo e Azul se comportam antes de criar tasks tecnicas de extracao.

## Hipotese Inicial

Porto Seguro sera a base tecnica. Itau, Sompo e Azul podem reaproveitar parte do parser/prompt se os PDFs forem realmente parecidos.

Essa hipotese precisa ser validada com PDFs reais.

## Perguntas De Maturacao

- Quais seguradoras da familia Porto vamos suportar primeiro?
- Quais variacoes existem no PDF da Porto?
- Existe PDF reduzido e extendido?
- As tabelas de pagamento aparecem sempre no mesmo formato?
- Franquia normal/reduzida aparece em campo fixo ou texto solto?
- Vidros, carro reserva, guincho e assistencias aparecem de forma padronizada?
- Itau, Sompo e Azul usam a mesma estrutura ou apenas visual parecido?
- Quais campos sao obrigatorios para o corretor confiar na comparacao?
- Quais campos podem ficar ausentes sem quebrar o fluxo?
- Quais informacoes o corretor ve no cotador, mas nao devem ir para o PDF final?
- Quais informacoes sao relevantes apenas para tiers futuros ou comparacao avancada?

## PDFs Necessarios

Colocar amostras em `.ai/pdf-lab/input` e extrair com `npm run pdf:extract`.

### Porto Seguro

- [x] PDF de impressao completa
- [x] PDF de impressao incompleta
- [ ] AUTO reduzido
- [ ] AUTO extendido
- [ ] Franquia reduzida
- [ ] Franquia normal
- [ ] Cobertura com vidros/carro reserva
- [ ] Cobertura sem algum adicional importante

### Itau

- [ ] Pelo menos 1 PDF AUTO
- [ ] Comparar estrutura com Porto

### Sompo

- [ ] Pelo menos 1 PDF AUTO
- [ ] Comparar estrutura com Porto

### Azul

- [ ] Pelo menos 1 PDF AUTO
- [ ] Comparar estrutura com Porto

## Comandos Sugeridos

```bash
npm run pdf:extract -- --output-name auto_porto_seguro_reduzido --insurer porto_seguro --variant reduzido
npm run pdf:extract -- --output-name auto_porto_seguro_extendido --insurer porto_seguro --variant extendido
npm run pdf:extract -- --input-dir .ai/pdf-lab/input/porto-seguro --output-name auto_porto_seguro_completa_incompleta --insurer porto_seguro --variant completa_incompleta
npm run pdf:extract -- --output-name auto_itau_auto_discovery --insurer itau --variant discovery
npm run pdf:extract -- --output-name auto_sompo_auto_discovery --insurer sompo --variant discovery
npm run pdf:extract -- --output-name auto_azul_auto_discovery --insurer azul --variant discovery
```

## Campos Para Conferir Contra `AutoQuoteData`

- [x] Dados do veiculo
- [x] Dados do condutor
- [x] Numero da cotacao
- [x] Vigencia da proposta
- [x] Franquia
- [x] Tipo de franquia
- [x] Premio total
- [x] Formas de pagamento
- [x] Parcelas sem juros
- [x] RCF danos materiais
- [x] RCF danos corporais
- [ ] Danos morais
- [ ] APP
- [x] Guincho/assistencia
- [x] Vidros
- [ ] Carro reserva
- [x] Assistencia 24h

## Findings Do PDF Lab - Completo vs Incompleto

Output analisado:

```txt
.ai/pdf-lab/output/auto_porto_seguro_completa_incompleta.md
```

Arquivos:

- `auto_porto_seguro_completa.pdf`: 5 paginas.
- `auto_porto_seguro_incompleta.pdf`: 2 paginas.

### Conclusao Inicial

O PDF incompleto ja traz a maior parte dos dados essenciais para cotacao e comparacao. O PDF completo traz mais texto legal, detalhes de franquias, clausulas e explicacoes, mas os dois parecem compartilhar a mesma base de dados.

Para implementacao inicial da Porto, o PDF incompleto pode ser suficiente para extrair o core. O completo deve ser usado como fixture adicional para garantir robustez e capturar detalhes extras.

Decisao final para primeira implementacao:

- Fixture principal: PDF incompleto.
- Fixture de robustez: PDF completo.
- Primeiro objetivo tecnico: extrair core AUTO com confianca.
- Segundo objetivo tecnico: parser deterministico de pagamentos Porto.
- Extras Porto ficam mapeados, mas nao bloqueiam MVP.

## Core Now - Porto MVP

Estes campos entram no primeiro escopo Porto:

- Seguradora.
- Numero da cotacao.
- Validade da cotacao.
- Vigencia.
- Segurado.
- Principal condutor.
- Veiculo.
- Placa.
- Ano fabricacao/modelo.
- FIPE/codigo FIPE quando disponivel.
- Uso do veiculo.
- Bonus.
- Casco/compreensiva.
- Percentual FIPE.
- Franquia.
- Premio total.
- Premio liquido.
- IOF.
- RCF danos materiais.
- RCF danos corporais.
- Vidros contratado ou nao.
- Martelinho/reparo rapido contratado ou nao.
- Assistencia 24h/guincho.
- Formas de pagamento.
- Melhor parcelamento sem juros.

## Fora Do Core Now - Extras Porto

Estes campos ficam para backlog, review avancada ou tiers futuros:

- Porto Bank como beneficio detalhado.
- Cashback.
- Descontos detalhados fora do pagamento.
- Custos de defesa auto.
- Protecao combinada residencial.
- Beneficios gratuitos longos.
- Antifurto.
- Isencao fiscal.
- Kit gas.
- PCD.
- Rastreador.
- Clausulas legais.
- Servicos residenciais detalhados.
- Observacoes extensas do questionario.

## Estrategia De Pagamento Porto

Pagamentos Porto devem ser parseados deterministicamente.

Metodos iniciais a suportar:

- Cartao de Credito Porto Bank (Aquisicao).
- Cartao de Credito Porto Bank sem desconto (Outro Titular).
- Cartao de Credito - Demais Bandeiras.
- Debito C. Corrente.
- Boleto / Demais Carne.
- Boleto / Demais C. Corrente.
- Debito C. Corrente / Demais Carne.
- Boleto a vista com desconto.

Cada parcela deve tentar carregar:

- numero da parcela.
- valor da parcela.
- total, quando calculavel com seguranca.
- indicacao sem juros/com juros.
- texto de desconto quando existir.

Regra de seguranca: se o parser nao conseguir entender uma tabela com confianca, deve falhar de forma visivel em teste/discovery em vez de inventar valores.

### Dados Gerais Encontrados

- Orcamento: `5634702819-0-1`.
- Validade do orcamento: `16/05/2026`.
- Realizado em: `01/05/2026`.
- Produto/segmento: `AUTO SENIOR e PROTECAO COMBINADA`.
- Tipo de operacao: `Seguro novo`.
- Vigencia: `01/05/2026 ate 01/05/2027`.
- Bonus: `Classe 0`.
- Origem do bonus: `-`.
- Segurado: `MARGARETE OLIVEIRA PEREIRA`.
- Segurado e principal condutor: `Sim`.

### Veiculo E Risco

- Veiculo: `15476 - COMPASS SPORT 1.3 T 270 FLEX`.
- Ano fabricacao/modelo: `2025 / 2026`.
- Placa: `PCI4A59`.
- Chassi aparece no PDF.
- Fipe: `170720`.
- Categoria: `22 - PICKUPS SUV PESADAS`.
- Veiculo 0 KM: no PDF completo aparece `N`; no incompleto aparece `Nao`.
- Portas/combustivel: `5 / GASOLINA/ALCOOL`.
- Isencao fiscal: `SEM ISENCAO`.
- Blindagem: `NAO POSSUI BLINDAGEM`.
- Passageiros: `5`.
- Cambio automatico: `SIM`.
- Kit gas: `NAO`.
- Veiculo de pessoa com deficiencia: `NAO`.
- CEP pernoite: `51021-320`.
- Tipo de uso: `PARTICULAR`.
- Dispositivo antifurto/anti-roubo: `OUTROS DISPOSITIVOS`.

### Coberturas Encontradas

- Casco: `COMPREENSIVA`.
- Indenizacao: `100.00%` ou `100,00% da FIPE`.
- Franquia: `50% da Obrigatoria`.
- Valor da franquia: `R$ 6.205,00`.
- Premio casco: `R$ 2.402,33`.
- Vidros: `76 - VIDROS, RETROVISORES, LANTERNAS E FAROIS - REFERENCIADA`.
- LMI vidros no completo: `R$ 25.000,00`.
- Premio vidros: `R$ 686,99`.
- Reparo Rapido e Supermartelinho de Ouro: `R$ 1.500,00 - Referenciada`.
- Premio reparos: `R$ 164,91`.
- RCF-V danos materiais: `R$ 100.000,00`.
- Premio RCF materiais: `R$ 383,29`.
- RCF-V danos corporais: `R$ 100.000,00`.
- Premio RCF corporais: `R$ 55,35`.
- Custos de defesa auto: `R$ 20.000,00`.
- Premio custos de defesa: `R$ 30,59`.
- Assistencia: `31 - Essencial - Assistencia Km ilimitado / Servicos a residencia`.
- Assistencia aparece como gratuita.

### Cobertura Residencial Combinada

O PDF traz `Coberturas RE` e `Plano 2 Casa / Apartamento`, incluindo:

- Incendio, explosao e fumaca.
- Subtracao de bens.
- Quebra de vidros.
- Responsabilidade civil familiar.
- Perda ou pagamento de aluguel.

Decisao pendente: isso deve ser ignorado no MVP AUTO, exibido como beneficio adicional, ou virar estrutura modular de protecao combinada no futuro.

### Beneficios E Descontos

Foram encontrados:

- Desconto Cartao Porto Bank - Aquisicao: `10.00%`, limitado a `R$ 500,00`.
- Desconto a vista - Primeira Compra: `5.00%`.
- Desconto Auto+Residencial: `5.00%`.
- Desconto a vista - Demais formas de Pagamento: `5.00%`.
- Taxa especial na Porto Seguro Financeira.
- PortoPlus.
- Estapar.
- Desconto de 20% na franquia casco.
- Coleta de documentos.
- Troca de lampadas.
- Higienizacao de ar-condicionado no mes de aniversario.
- Leva e traz.
- Cristalizacao do para-brisa.
- Extensao de perimetro basico.
- Reparo em furo de pneu.
- Alinhamento de direcao.
- Desconto de 20% na mao de obra.

Decisao pendente: no MVP, beneficios gratuitos devem aparecer apenas como lista resumida, nao como comparaveis principais.

### Premio

- Premio total liquido: `R$ 3.935,93`.
- IOF: `R$ 290,47`.
- Premio total: `R$ 4.226,40`.

### Formas De Pagamento

O PDF traz varias tabelas:

- Cartao de Credito Porto Bank (Aquisicao).
- Cartao de Credito Porto Bank sem desconto (Outro Titular).
- Cartao de Credito - Demais Bandeiras.
- Debito C. Corrente.
- Boleto / Demais Carne.
- Boleto / Demais C. Corrente.
- Debito C. Corrente / Demais Carne.
- Boleto a vista com desconto.

Observacoes:

- Porto Bank Aquisicao chega a 12x sem juros com desconto.
- Demais bandeiras parecem ir ate 10x sem juros e depois `- -` para 11x/12x no PDF incompleto.
- Debito e boleto passam a ter juros a partir de certas parcelas.
- O texto extraido mistura valores e juros em linhas separadas, entao pagamento provavelmente precisa de parser deterministico.

### Diferenca Completo vs Incompleto

PDF completo:

- Traz mais clausulas.
- Traz explicacoes de franquias de vidros.
- Traz explicacoes de reparo rapido/supermartelinho.
- Traz avisos legais e detalhes de questionario.
- Traz todas as paginas de texto legal.

PDF incompleto:

- Traz dados gerais, veiculo, coberturas, descontos, premios e pagamentos.
- Mostra `Esta folha e uma versao resumida do orcamento`.
- Parece mais direto e provavelmente mais facil de extrair para MVP.

### Implicacoes Para `AutoQuoteData`

Campos atuais provavelmente cobrem:

- veiculo
- condutor/driver basico
- quoteNumber
- validUntil
- bonusClass
- coverage.vehicle
- coverage.rcf
- coverage.assistance
- deductibles
- premium
- paymentMethods

Campos que talvez precisem entrar depois:

- `vehicleUsage`: particular/comercial/etc.
- `mainDriverIsInsured`: boolean.
- `antiTheftDevice`: string.
- `operationType`: seguro novo/renovacao.
- `bonusOrigin`: origem do bonus.
- `discounts`: lista de descontos aplicados.
- `legalDefenseCoverage`: custos de defesa auto.
- `combinedHomeCoverage`: protecao combinada residencial.
- `benefits`: lista de beneficios gratuitos.

Para MVP Porto, a recomendacao inicial e nao expandir tudo de uma vez. Primeiro extrair core AUTO e pagamentos com confianca; depois decidir quais extras aparecem na review e PDF.

Decisao tomada em 2026-05-01:

- Pagamentos Porto devem ter parser deterministico.
- `AutoQuoteData` deve manter um core AUTO comum.
- Extras especificos da Porto devem ficar mapeados agora e virar task separada depois.
- Ainda vale investigar uma estrutura modular para extras por seguradora, desde que nao quebre o contrato comum usado por review, PDF e link publico.

## Informacoes Observadas No Cotador Porto

Estas informacoes foram levantadas a partir da visao do corretor no cotador. Nem tudo precisa aparecer no PDF/link publico.

### Perguntas e dados de risco

- Tipo de cambio.
- Kit gas.
- Isencao fiscal.
- Dispositivo anti-roubo.
- Nome do dispositivo anti-roubo.
- Se o segurado e o principal condutor.
- Possivel diferenca entre segurado e condutor.
- Estado civil aparece ligado ao condutor.
- Tipo de uso do veiculo pode ser relevante se aparecer no PDF.
- Rastreador obrigatorio pode aparecer no portal/cotador, mas talvez nao seja comum em cenario inicial.

### Pagamento

- Porto Bank pode oferecer desconto percentual.
- Porto Bank pode permitir parcelamento em 12x.
- Precisamos mapear se o desconto aparece no PDF impresso e como entra em `paymentMethods`.

### Coberturas e adicionais observados

- Custos de defesa de auto: reembolso de despesas com defesa legal, honorarios advocaticios e custas processuais.
- Rodas, pneus e suspensao.
- Danos morais e esteticos.
- Acidentes pessoais passageiros.
- Martelinho de Ouro.
- Vidros completo ou nao contratado.
- Oficina referenciada ou livre escolha.
- Tag Porto Bank.
- Protecao combinada com carro, casa e celular.

Alguns itens podem ser uteis para tiers futuros, mas nao necessariamente entram no MVP de PDF/link.

### Assistencia observada

Pacote "KM ilimitado essencial" citado:

- Creditos em app de mobilidade ou desconto na franquia.
- Em caso de sinistro, cliente pode optar por credito de R$ 400,00 no app Va de Taxi, credito de R$ 350,00 no app Uber, ou 25% de desconto na franquia limitado a R$ 400,00.
- Assistencia 24h.
- Guincho sem limite de KM e 5 acionamentos na vigencia no Brasil.
- Guincho ate 400 KM no Mercosul.
- Servicos para residencia: reparos hidraulicos e eletricos, desentupimento, chaveiro, descarte ecologico e consertos de eletrodomesticos.
- Servicos para residencia podem ter limite de 1 acionamento durante a vigencia da apolice.

### Coberturas editaveis observadas

- Sem casco, apenas RCF.
- Compreensiva.
- Incendio, roubo e furto.
- Franquias: 25%, 50%, 75%, obrigatoria, 125%, 150%, 175%, 200% da obrigatoria.
- Danos morais e esteticos.
- Vidros completo ou nao contratado.
- Martelinho de Ouro: referenciada ou livre escolha.

### Carro reserva observado

Opcoes vistas:

- Nao contratar.
- 7 dias - Porte basico.
- 15 dias - Porte basico.
- 30 dias - Porte basico.
- VIP prazo indeterminado - Porte basico.
- 7 dias - Porte medio ou automatico.
- 15 dias - Porte medio ou automatico.
- 30 dias - Porte medio ou automatico.
- VIP prazo indeterminado - Porte medio ou automatico.

## Transcricao Da Imagem - Comparativo Portfolio Auto

O cotador mostra um comparativo de coberturas entre marcas/produtos operados pela Porto.

Produtos tradicionais:

- Azul Tradicional.
- Itau Tradicional.
- Mitsui/Sompo Tradicional.
- Porto Tradicional.

Produtos alternativos:

- Itau Compacto.
- Itau Assistencia 24h.
- Azul Compacto.
- Azul Roubo.

Linhas comparadas:

- Colisao parcial.
- Colisao total.
- Incendio.
- Roubo e furto.
- Franquia.
- RCF-V Danos Materiais.
- RCF-V Danos Corporais.
- Acidentes Pessoais Passageiros.
- Reparo rapido e Super Martelinho de Ouro.
- Vidros.
- Carro Reserva.
- Tipo de oficina.
- Tipo de peca.

Observacao do cotador:

```txt
Ao personalizar os dados da oferta, as coberturas serao ajustadas conforme os valores disponiveis para cada produto.
```

## Riscos

- PDFs visualmente parecidos podem ter texto extraido em ordem diferente.
- Tabela de pagamento pode exigir parser deterministico.
- Algumas coberturas podem aparecer apenas como texto livre.
- IA pode confundir assistencias opcionais com contratadas.
- Implementar Porto isolado pode dificultar reaproveitar Itau/Sompo/Azul depois.
- Cotador pode exibir informacoes que nao aparecem no PDF impresso.
- PDF completo e incompleto podem ter diferencas relevantes de cobertura, pagamento ou texto legal.
- Informacoes como rastreador, dispositivo anti-roubo e isencao fiscal podem ser importantes para underwriting, mas irrelevantes ou sensiveis demais para o segurado final.

## Saida Esperada Do Discovery

Ao final, este documento deve permitir criar tasks tecnicas pequenas como:

- Criar configuracao base da familia Porto.
- Implementar parser de pagamentos Porto.
- Adaptar prompt Porto AUTO.
- Adicionar fixtures/testes Porto.
- Validar Itau contra base Porto.
- Validar Sompo contra base Porto.
- Validar Azul contra base Porto.

## Status

Maturacao principal concluida para primeira implementacao Porto.

PDFs completo e incompleto da Porto ja foram extraidos. Proxima etapa recomendada:

1. Criar fixtures Porto completo/incompleto para testes.
2. Implementar parser deterministico de pagamentos Porto.
3. Implementar extracao core Porto para `AutoQuoteData`.
4. Integrar Porto no fluxo de processamento.
5. Validar review, PDF e link publico com Porto.
6. Gerar mais variacoes de Porto quando possivel, principalmente carro reserva, vidros e franquias.

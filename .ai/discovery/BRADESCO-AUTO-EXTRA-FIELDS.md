# Discovery - Bradesco AUTO Extra Fields

## Objetivo

Mapear campos adicionais do PDF Bradesco AUTO que podem ser uteis para revisao, comparacao, renovacao e enriquecimento de coberturas.

## Contexto Atual

`TASK-0044` criou, a partir da Tokio Marine, um primeiro padrao pratico para enriquecer coberturas sem poluir o core:

- `coverage.assistance` fica com flags universais.
- `coverageDetails` concentra detalhes variaveis por seguradora/produto.
- Textos de portal/cotador viram catalogo/tooltip estatico, nao dado esperado no PDF.
- PDF/link/review devem renderizar fatos extraidos e ajuda contextual de forma separada.

Esta discovery de Bradesco deve verificar se Bradesco possui campos equivalentes e quais deles podem reutilizar esse padrao.

## Bradesco Products Inventory

Antes de extrair PDFs, listar os produtos Bradesco Auto que existem comercialmente e quais sao realmente usados pelos corretores do sistema. Sem esse inventario, qualquer Findings corre o risco de generalizar a partir de uma amostra que nao representa um produto tipico.

Padrao de referencia em outras seguradoras ja mapeadas:

- Tokio Marine - 5 produtos (`Auto`, `Auto Classico`, `Auto Roubo + Rastreador`, `Auto Protecao Mensal`, `Assistencia Exclusiva`) em `TOKIO-MARINE-AUTO.md`.
- Porto Seguro - familia mapeada (Porto, Itau, Mitsui Sumitomo, Azul) em `PORTO-FAMILY-AUTO.md`.
- Bradesco - sem inventario equivalente ate hoje.

Preencher (input humano):

### Produtos Bradesco Auto - lista comercial

- Produto 1: Tradicional
  - nome comercial no PDF: `Produto: Tradicional`
  - resumo: produto Auto principal; amostra atual gerada com cobertura compreensiva e todas as coberturas/servicos contratados.
  - usado por algum corretor do sistema: sim, confirmado pelo humano.
  - amostra de PDF disponivel: `.ai/pdf-lab/input/bradesco/bradesco-auto-tradicional-completo.pdf`
- Produto 2: Bradesco Seguro Auto Classic
  - nome comercial no PDF: `Produto: 1583 - BRADESCO SEGURO AUTO CLASSIC`
  - resumo: variante exclusiva para correntista, segundo input humano.
  - usado por algum corretor do sistema: sim, confirmado pelo humano.
  - amostra de PDF disponivel: `.ai/pdf-lab/input/bradesco/bradesco-auto-classic.pdf`
- Produto 3: Seguro Auto Lar
  - nome comercial no PDF: `Produto: 1776 - SEGURO AUTO LAR`
  - resumo: combinacao Auto + Residencial, com bloco residencial no demonstrativo.
  - usado por algum corretor do sistema: sim, confirmado pelo humano.
  - amostra de PDF disponivel: `.ai/pdf-lab/input/bradesco/Bradesco-auto-residencial.pdf`

Observacao de produto: moto, caminhao e Auto Lar Caminhao ficam fora deste ciclo. A discovery deve tratar Bradesco Auto como familia com variantes e catalogo mutavel, porque assistencias/codigos mudam no tempo (ex.: humano relata que ja existiu opcao 800 km, ausente no catalogo atual).

### Diferencas conhecidas entre produtos

- Vidros: varia por clausula/codigo. Exemplos observados no cotador: `Reparo de Para-Brisa (098)`, `Vidro Protegido (025)`, `Vidro Protegido Plus (024)`, `Vidro Protegido Premium (158)`. Quando Logomarca esta marcado, o nome/codigo muda para variantes como `Vidro Protegido Logomarca (150)`, `Vidro Protegido Plus Logomarca (151)`, `Vidro Protegido Premium Logomarca (159)`.
- Carro reserva: varia por plano/dias/categoria. Exemplos observados no cotador: `Auto Reserva 07 Dias (060)`, `Auto Reserva 15 dias (111)`, `Auto Reserva 30 Dias (061)`, `Auto Reserva Plus 07 Dias (030)`, `Auto Reserva Plus 15 dias (115)`, `Auto Reserva Plus 30 Dias (085)`, `Auto Reserva Premium 7/15/30 Dias (144/145/146)`, alem de `Nao desejo contratar`.
- Assistencia/guincho: varia por plano e km. Exemplos observados no cotador/PDF: `Assist Dia/Noite 200Km (043)`, `Assist Auto Dia/Noite - Passeio 400 KM (113)`, e no cotador tambem `Assist. Dia/Noite Ilimitado (108)` e `Assist Dia/Noite 100Km (063)`.
- Tipo de oficina/peca: pendente nos PDFs desta amostra; procurar se aparece em outra variante ou se e catalogo/portal.
- Outras coberturas/servicos: `Repare Facil - Sup. Martelinho (125)`, `Repare Facil - Rep. Rapido (126)`, `Troca de Para-Choque (128)`, `Rodas Pneus e Suspensao (163)`, `Despesas Medicas e Hospitalares (157)`, `Desp. Extraordinarias (080)`, `Danos Morais (056)`, `Auto Reserva`, `CCB`.

Catalogo deve ser versionavel por codigo/nome, nao hardcoded como lista fechada. O parser deve extrair o texto/codigo presente no PDF e usar catalogo estatico apenas para tooltip/explicacao.

### Variantes mensais ou de cobertura reduzida

Existe variante mensal ou de cobertura reduzida na Bradesco, similar a Tokio `Protecao Mensal`?

- Encontrado: pendente
- Nome:
- Diferencas em relacao ao produto principal:
- Risco para apresentacao: pendente.

### Mapeamento amostra <-> produto

Cada PDF analisado nesta discovery deve ser identificado por produto:

- amostra: `Bradesco-auto-residencial.pdf` -> produto: `1776 - SEGURO AUTO LAR`
- amostra: `bradesco-auto-classic.pdf` -> produto: `1583 - BRADESCO SEGURO AUTO CLASSIC`
- amostra: `bradesco-auto-tradicional-completo.pdf` -> produto: `Tradicional`

Output gerado:

- `.ai/pdf-lab/output/auto_bradesco_extra_fields.md`
- `.ai/pdf-lab/output/auto_bradesco_extra_fields.json`

## Campos A Procurar

- Seguradora de renovacao.
- Classe de bonus.
- Tipo de uso do veiculo: particular, comercial, aplicativo, taxi ou similar.
- Qualquer indicio de vigencia anterior ou renovacao.
- Assistencia/guincho e limite de km.
- Vidros e possiveis tiers/planos.
- Carro reserva e quantidade de diarias/categoria.
- Martelinho, reparo rapido, lataria/pintura, roda/pneu/suspensao ou nomes equivalentes.
- Tipo de oficina/rede referenciada/livre escolha.
- Tipo de peca.
- Beneficios ou condicoes especiais que sejam texto de portal/catálogo, nao fato extraido do PDF.

## Como Mapear

1. Colocar PDFs Bradesco em `.ai/pdf-lab/input/bradesco`.
2. Rodar:

```bash
npm run pdf:extract -- --input-dir .ai/pdf-lab/input/bradesco --output-name auto_bradesco_extra_fields --insurer bradesco --variant extra_fields
```

3. Procurar termos como:

```txt
renovacao
seguradora anterior
bonus
classe de bonus
uso
utilizacao
particular
comercial
assistencia
guincho
km
vidros
carro reserva
martelinho
reparo rapido
lataria
pintura
roda
pneu
suspensao
oficina
peca
rede referenciada
```

## Findings

PDF lab rodado em 2026-05-08/2026-05-09 com 3 amostras Bradesco Auto.

Comando executado:

```powershell
& 'C:\Users\mathe\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' .ai\scripts\extract-pdf-lab.mjs --input-dir .ai/pdf-lab/input/bradesco --output-name auto_bradesco_extra_fields --insurer bradesco --variant extra_fields --include-items
```

Comando equivalente quando `npm` local estiver funcionando:

```powershell
npm run pdf:extract -- --input-dir .ai/pdf-lab/input/bradesco --output-name auto_bradesco_extra_fields --insurer bradesco --variant extra_fields --include-items
```

### Renovacao

- Encontrado: sim, como codigo/nome da companhia anterior, nao como nome legivel completo na amostra.
- Label no PDF: `Cia Renovacao`
- Exemplo de texto: `Cia Renovacao: 544`
- Recomendacao: adicionar campo estruturado de renovacao depois de validar tabela/codigo ou quando PDF trouxer nome. Nao inferir seguradora anterior sem catalogo confiavel.

### Bonus

- Encontrado: sim.
- Label no PDF: `Bonus`
- Exemplo de texto: `Bonus: 02`
- Recomendacao: `bonusClass` ja existe em `AutoQuoteData`; atualizar prompt/testes Bradesco para garantir extracao consistente.

### Uso Do Veiculo

- Encontrado: sim.
- Label no PDF: `Uso Veiculo`
- Exemplo de texto: `Uso Veiculo: Particular`
- Recomendacao: adicionar campo `vehicleUsage` ou equivalente em `AutoQuoteData`, porque e fato extraido do PDF e util para revisao/renovacao. Manter valor bruto inicialmente.

### Coberturas Enriquecidas / Servicos

- Encontrado: sim.
- Labels no PDF: `CLAUSULAS`, `FRANQUIAS (R$)`, `PREMIOS (R$)`, `Vidros`, `Assis. Dia Noite`, `Carro Reserva`, `Repare Facil`, `Super Martelinho`, `Reparo Rapido`, `Troca de Para-choque`, `Rodas, Pneus e Suspensao`.
- Exemplo de texto: `(151) Vidro Protegido Plus Logomarca`, `(030) Auto Reserva Plus 07 Dias`, `(043) Assist Dia/Noite 200Km`, `(163) Rodas Pneus e Suspensao`.
- Campos candidatos para `coverageDetails`: `assistance.planName`, `assistance.towingKmTotal`, `glass.tier`, `replacementVehicle.category`, `replacementVehicle.days`, `services.martelinho`, `services.repareFacil`, `services.trocaParaChoque`, `services.rodaPneuSuspensao`, `services.logoMarcaVidros`.
- O que e fato extraido do PDF: produto, codigo/nome da clausula, uso do veiculo, bonus, cia renovacao, premios por servico, franquias por servico.
- O que parece catalogo/tooltip estatico: explicacao de cada assistencia, lista completa de opcoes vigentes no cotador, significado comercial de Plus/Premium/Logomarca, coberturas inclusas em cada codigo.
- Recomendacao: implementar Bradesco com `coverageDetails` e catalogo estatico versionavel por codigo/nome. O PDF deve mandar o fato; catalogo so enriquece tooltip.

### Assistencia / Guincho

- Encontrado: sim.
- Limite de km: 200 km e 400 km nas amostras; cotador tambem mostra 100 km e ilimitado.
- Texto de plano: `Assist Dia/Noite 200Km (043)`, `Assist Auto Dia/Noite - Passeio 400 KM (113)`.
- Recomendacao: extrair nome/codigo e km total. Nao fechar enum; historico humano indica que opcoes mudam com o tempo.

### Vidros

- Encontrado: sim.
- Tier/plano: `Vidro Protegido Plus (024)`, `Vidro Protegido Plus Logomarca (151)` nas amostras; cotador mostra tambem Reparo de Para-Brisa, Protegido, Premium e variantes Logomarca.
- Recomendacao: extrair `glass.tier` como label bruto e `services.logoMarcaVidros` a partir do label/codigo `Logomarca`, porque o nome do vidro muda quando logomarca esta contratada.

### Reparo / Servicos Opcionais

- Encontrado: sim.
- Martelinho/reparo rapido: `(125) Repare Facil - Sup. Martelinho`, `(126) Repare Facil - Rep. Rapido`; franquias/premios aparecem em `Super Martelinho` e `Reparo Rapido`.
- Lataria/pintura: nao encontrado com esse nome nas amostras Bradesco; pode ser catalogo de outra seguradora ou nome diferente.
- Roda/pneu/suspensao: `(163) Rodas Pneus e Suspensao`, com franquia/premio quando contratado.
- Troca de para-choque: `(128) Troca de Para-Choque`, presente no Tradicional completo.
- Recomendacao: expandir `coverageDetails.services` para permitir labels Bradesco sem forcar todos no vocabulario Tokio.

### Condicoes De Reparo

- Encontrado: nao nas 3 amostras.
- Oficina: nao encontrado.
- Peca: nao encontrado.
- Recomendacao: marcar como `not_found` para Bradesco nesta implementacao, a menos que nova amostra prove o campo.

## Recomendacao Final

Criar task de implementacao para finalizar Bradesco Auto usando:

- fatos extraidos do PDF em `AutoQuoteData`/`coverageDetails`;
- catalogo Bradesco versionavel por codigo/nome para tooltips e descricoes;
- suporte a variantes Tradicional, Auto Classic e Seguro Auto Lar;
- exclusao explicita de moto/caminhao neste ciclo;
- testes com as 3 amostras do PDF lab.

Nota: esta discovery deve virar task de implementacao propria antes de alterar prompt/schema/renderizadores para Bradesco.


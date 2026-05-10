# Bradesco Saude - Rede Referenciada Pernambuco

Discovery inicial da rede referenciada de Pernambuco a partir dos PDFs enviados para o PDF Lab.

Arquivos analisados:

- `.ai/pdf-lab/input/bradesco-health-materials/PE__Hospitais_Abril_26.pdf`
- `.ai/pdf-lab/input/bradesco-health-materials/PE__Lab_Abril_26.pdf`

Outputs locais gerados:

- `.ai/pdf-lab/output/bradesco_health_pe_network_inventory.md`
- `.ai/pdf-lab/output/bradesco_health_pe_network_inventory.json`

Lista extraida para leitura:

- `.ai/discovery/BRADESCO-HEALTH-PE-NETWORK-LIST.md`

Observacao: os arquivos de entrada e saida do PDF Lab ficam ignorados pelo Git. Este documento registra somente descoberta de produto, sem dados sensiveis de clientes, corretora ou cotacao.

## O que esses PDFs sao

Os dois PDFs sao tabelas de rede referenciada para Pernambuco com referencia de abril/2026.

- `PE__Hospitais_Abril_26.pdf`: lista de hospitais por linha de planos.
- `PE__Lab_Abril_26.pdf`: lista de laboratorios por linha de planos.

As linhas trazem cidade, nome do referenciado e marcadores por plano/linha. No PDF de hospitais, o valor da celula tambem indica a modalidade de atendimento habilitada.

Legenda hospitalar encontrada:

- `H`: Hospital
- `P.S`: Pronto Socorro
- `M`: Maternidade
- `A`: Ambulatorio
- `HDIA`: Hospital Dia

O proprio PDF avisa que a rede hospitalar e referencia da Bradesco Saude e pode ser alterada a qualquer tempo. Para uso comercial ou no link publico, a interface deve tratar esses dados como "rede de referencia" e, idealmente, orientar validacao na busca oficial de referenciados da Bradesco.

## Planos/linhas encontrados

Nos PDFs de Pernambuco aparecem as seguintes linhas:

- Efetivo
- Efetivo Plus
- Flex
- Ideal
- Nacional II
- Nacional III
- Nacional Plus
- Premium

Nota de alinhamento com o escopo atual: o usuario citou Efetivo, Flex, Ideal, Nacional, Nacional Plus e Premium. O PDF de Pernambuco usa explicitamente `Nacional II` e `Nacional III`; por enquanto, a documentacao deve manter o nome do PDF e depois mapear isso para a nomenclatura da UI/cotacao.

## A+H+OB nao deve guiar este mapeamento

Correto: estes PDFs de rede de Pernambuco nao estao organizados por `A+H+OB`.

Pelo material de condicoes gerais, `A+H+OB` significa Ambulatorial + Hospitalar com Obstetricia e `H+OB` significa Hospitalar com Obstetricia. Isso parece ser segmentacao/cobertura assistencial do contrato ou produto, nao a melhor chave para ler esses PDFs de rede.

Para estes PDFs, a chave pratica e:

- Estado/regiao: Pernambuco
- Tipo de rede: hospitais ou laboratorios
- Linha/plano: Efetivo, Efetivo Plus, Flex, Ideal, Nacional II, Nacional III, Nacional Plus, Premium
- Acomodacao/coluna quando existir no PDF
- Modalidade habilitada no referenciado, no caso de hospitais: H, P.S, M, A, HDIA

Ponto pendente: confirmar na UI/cotacao onde aparece a escolha ou derivacao de `A+H+OB`/`H+OB`. A cotacao de saude analisada ate agora nao trouxe esse campo de forma clara, entao nao da para inferir so pelo PDF de rede.

## Qualidade da extracao

O PDF nao parece escaneado. A extracao atual consegue ler texto e posicoes `x/y`.

Conclusao tecnica:

- Para leitura humana e discovery, o Markdown gerado ja ajuda bastante.
- Para transformar em dado confiavel, nao devemos depender do texto bruto, porque ele mistura cidade, nome e colunas quando a linha e longa.
- O JSON com `items` e coordenadas e bom o suficiente para criar um parser por posicao.
- Python pode ajudar se usarmos `pdfplumber`/`camelot`, mas nao parece necessario neste momento. O caminho mais controlado no repo e aproveitar a extracao atual por coordenadas e criar um parser pequeno especifico para esses PDFs.

## Estrutura da tabela de hospitais

Cabecalhos principais detectados:

- Cidade
- Nome do referenciado
- Colunas por linha/plano

Subcolunas detectadas por posicao:

- Efetivo: Enfermaria, Quarto
- Efetivo Plus: Enfermaria, Quarto
- Flex: Enfermaria, Quarto
- Ideal: Enfermaria, Quarto
- Nacional II / Nacional III / Nacional Plus / Premium: colunas finais de acomodacao aparecem comprimidas no PDF e precisam validacao visual antes de virar contrato de dados

Risco de interpretacao:

- O cabecalho dos planos nacionais fica muito apertado na tabela.
- A leitura por coordenada mostra colunas consistentes, mas ainda precisamos validar visualmente qual coluna final pertence a `Nacional II`, `Nacional III`, `Nacional Plus` e `Premium`.
- Isso e especialmente importante porque a UI observada anteriormente sugere acomodacoes a partir de Nacional III em diante, enquanto o PDF resume as colunas finais como `Quarto`.

Exemplos de uso futuro:

- "Este plano possui Hospital Portugues em Recife?"
- "O plano atende pronto socorro nesse hospital ou apenas hospital/ambulatorio?"
- "Quais hospitais de Recife aparecem para Nacional II?"
- "Existe maternidade na rede desse plano?"
- "Quais hospitais aparecem nos planos superiores e nao aparecem nos planos basicos?"

## Estrutura da tabela de laboratorios

Cabecalhos detectados:

- Cidade
- Bairro
- Nome do referenciado
- Efetivo
- Efetivo Plus Enfermaria
- Efetivo Plus Quarto
- Flex
- Ideal
- Nacional II
- Nacional III
- Nacional Plus
- Premium

As celulas usam bolinha/marcador para indicar que o laboratorio esta contemplado naquela linha/plano.

O PDF de laboratorios e mais longo, mas a estrutura e mais facil de transformar em dados porque as colunas sao marcadores por plano e nao trazem legenda de modalidade como hospitais.

## Primeira leitura quantitativa aproximada

Estimativa automatica inicial baseada nas linhas com marcadores:

- Hospitais: cerca de 62 linhas de referenciados.
- Laboratorios: cerca de 389 linhas de referenciados.

Esses numeros ainda sao aproximados porque algumas cidades aparecem em linhas separadas e precisam ser carregadas como contexto da linha seguinte.

## Implicacoes para o produto

No link de preview do cliente, esses dados podem enriquecer a cotacao de saude com perguntas que o PDF de preco nao responde:

- rede por cidade;
- hospitais relevantes por plano;
- laboratorios por cidade/bairro;
- modalidades de atendimento por hospital;
- diferenca de rede entre plano atual e plano superior;
- avisos de que rede e referencia e deve ser validada na consulta oficial.

Para o caso de cotacao ja analisado, o plano extraido foi `Nacional II`, regiao `Pernambuco`, reembolso `Especifico`. A rede de Pernambuco pode enriquecer a experiencia, mas ainda falta confirmar a acomodacao/coluna correta do `Nacional II` antes de mostrar uma lista fechada como "rede do plano contratado".

## Proximo passo recomendado

Criar um parser especifico para esses PDFs de Pernambuco com saida intermediaria em JSON/CSV:

- `sourceFile`
- `referenceMonth`
- `networkType`: hospital/laboratorio
- `city`
- `district` quando existir
- `providerName`
- `planLine`
- `accommodation`
- `available`
- `hospitalCapabilities`: H, PS, M, A, HDIA quando existir

Antes de usar em UI, validar manualmente uma amostra de linhas criticas, principalmente Recife e os planos Nacional II, Nacional III, Nacional Plus e Premium.

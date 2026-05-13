# Pesquisa com corretora de saude - prototipo urgente

Data: 2026-05-13

## Contexto

O humano conversou com uma corretora de saude e trouxe uma dor operacional urgente: a corretora perde tempo montando planilhas de cotacao para enviar ao cliente. A necessidade imediata nao e resolver toda a complexidade de Saude, rede referenciada, reembolso, carencia e comparacao consultiva. A necessidade imediata e transformar PDFs e tabelas de preco em uma matriz de vidas x planos parecida com a planilha que ela ja usa hoje.

Essa frente tem carater de urgencia. A arquitetura deve permitir um prototipo funcional rapido sem transformar inferencias de IA em verdade definitiva do produto.

## Dor observada

- A corretora monta planilhas com nome, idade e preco individual por plano.
- Nem sempre existem nomes; as vezes existem apenas idades, parentesco ou papeis como filho, filha, marido, socio, funcionario.
- PDFs de seguradoras podem trazer vidas por faixa etaria, nao por pessoa.
- No caso citado de Bradesco Saude, o PDF pode trazer algo como 3 vidas de 18 a 24 anos por R$ 1.600, exigindo rateio para criar valor individual.
- Algumas operadoras/seguradoras possuem portal de cotacao proprio e geram PDF.
- Outras fontes sao tabelas de preco recebidas por WhatsApp ou planilhas, com validade.
- A corretora precisa manter o fluxo de trabalho proximo do atual: planilha para cliente, mas com menos trabalho manual.

## Fontes citadas

### Fontes com PDF/portal de cotacao

- SulAmerica Saude.
- Bradesco Saude.
- Amil.

### Fontes de tabela/manual

- Unimed.
- Hapvida.
- Qualicorp.
- Sobene/Solbene ou fonte similar ainda pendente de confirmacao.

Observacao: pesquisa rapida indicou que Qualicorp deve ser tratada como administradora/corretora de beneficios/coletivo por adesao, nao como operadora unica. "Sobene" nao ficou claro; apareceu "Solbene" como provedora/corretora de beneficios em Pernambuco. No produto, esses nomes devem entrar inicialmente como `fonte/tabela/canal`, nao como seguradora final ate validacao humana.

## Hipotese de produto

O primeiro produto de Saude deve ser um montador de cotacao assistida:

1. Importa PDFs e planilhas.
2. Extrai ou sugere campos comuns.
3. Cria um rascunho revisavel.
4. Permite corrigir vidas, idades, parentesco, plano, acomodacao, coparticipacao, valores e validade.
5. Gera uma planilha no formato que a corretora ja usa.
6. Depois gera PDF e link navegavel a partir do mesmo rascunho revisado.

O coracao do fluxo nao e a seguradora; e o grupo de vidas reutilizavel entre opcoes.

## Principio arquitetural

O prototipo pode ser generalista desde que todo campo carregue origem e confianca.

Campos extraidos/inferidos devem diferenciar:

- `extracted`: apareceu claramente no PDF/planilha.
- `inferred`: IA inferiu a partir de evidencia textual.
- `manual`: corretora confirmou ou editou.
- `table_lookup`: valor calculado a partir de uma tabela cadastrada.
- `not_found`: nao encontrado e nao inferido.

Exemplo de contrato de campo:

```ts
{
  field: "accommodation",
  label: "Acomodacao",
  value: "Enfermaria",
  source: "extracted",
  confidence: 0.94,
  evidence: "Direto Nacional Enfermaria",
  needsReview: false
}
```

Inferencias devem ser publicaveis apenas depois de revisao quando forem sensiveis:

- acomodacao;
- coparticipacao;
- modalidade de reembolso;
- rede;
- carencia;
- cobertura/segmentacao assistencial;
- validade da tabela/cotacao.

Quando a IA nao encontrar evidencia suficiente, deve retornar `null`/`not_found`, nao inventar.

## Amostras adicionadas ao PDF lab

Pasta:

```txt
.ai/pdf-lab/input/pdfs-saude-variados
```

Arquivos observados:

- `CotacaoAmil_MARAVILHA_CESTAS_LTDA_COT-3426700.pdf`
- `CotacaoAmil_MARAVILHA_CESTAS_LTDA_COT-3426700 (2).pdf`
- `MARAVILHA CESTAS LTDA EFETIVO ENF.COM DESC..pdf`
- `PropostaComercialCuidado360_7673186-1.pdf`
- `UNIMED - OTORRINOS.xlsx`
- arquivo `.xlsx` iniciado por `cotac...` e contendo `CTO ATUALIZADO`

Extracao gerada:

```txt
.ai/pdf-lab/output/health_varied_quotes_2026_05_13.md
.ai/pdf-lab/output/health_varied_quotes_2026_05_13.json
```

Comando usado:

```bash
node .ai/scripts/extract-pdf-lab.mjs --input-dir .ai/pdf-lab/input/pdfs-saude-variados --output-name health_varied_quotes_2026_05_13 --include-items
```

Nota: `npm run pdf:extract` falhou neste ambiente por caminho global de npm quebrado. O script foi executado com o Node bundled do Codex.

Nota adicional: o output do PDF lab aparece com `Product: auto` por default do script. Para esta pesquisa, tratar o caso como Saude; o metadata do lab nao representa o produto real das amostras.

## Primeiros achados das amostras

### Amil

Os PDFs Amil trazem texto extraivel com:

- protocolo;
- data da cotacao;
- validade;
- dados da corretora;
- dados da empresa;
- plano medico;
- distribuicao de vidas por faixa etaria;
- subtotal por faixa;
- valor por vida por faixa;
- dental;
- total geral;
- total apos 12 meses;
- avisos de validade/recalculo/aceitacao.

Dois PDFs da mesma empresa indicam opcoes diferentes:

- `OURO QC R COPART TP`, 3 vidas, total medico R$ 2.542,87.
- `AMIL S450 QC NAC R COPART TP PJ_PME`, 3 vidas, total medico R$ 2.908,96.

Isso sugere que o sistema deve aceitar varias opcoes de uma mesma fonte para o mesmo grupo de vidas.

### SulAmerica / Cuidado 360

O PDF `PropostaComercialCuidado360_7673186-1.pdf` traz Saude e Odonto no mesmo arquivo.

Saude:

- proposta 7673186-1;
- emissao 13/05/2026;
- validade 27/06/2026;
- 3 vidas;
- PME;
- produto 557 - Ambulatorial e Hospitalar com Obstetricia;
- tipo compulsorio sem encampacao;
- sem coparticipacao;
- plano `Direto Nacional Enfermaria`;
- tabela por faixa etaria;
- 1 vida em 0 a 18, 1 vida em 34 a 38, 1 vida em 39 a 43;
- premio Saude R$ 2.775,05 + IOF R$ 66,04 = total R$ 2.841,09;
- exemplos de reembolso.

Odonto:

- proposta 7673186-2;
- 3 vidas;
- produto 430 - Odonto;
- mensalidade R$ 0,00;
- multiplos/exemplos de reembolso;
- grupos de carencia.

Isso reforca que o extrator precisa separar subprodutos dentro de um PDF e nao assumir que todo arquivo representa uma unica cotacao simples.

### Planilhas atuais

O arquivo `.xlsx` iniciado por `cotac...` e contendo `CTO ATUALIZADO` mostra o formato operacional principal:

- uma linha por funcionario/pessoa;
- coluna de idade;
- varias colunas de planos/opcoes;
- totais por coluna ao fim;
- abas separando combinacoes de planos.

Exemplos de colunas:

- `UNIREDE RECIFE ENF`;
- `UNIREDE PE ENF`;
- `HAPVIDA ENF`;
- `S380 ENF copart Total`;
- `S380 ENF COP. PARC.`;
- `AMIL PRATA COP.PARCIAL`;
- `SELECT RECIFE ENF`;
- `SELECT RECIFE APT`.

`UNIMED - OTORRINOS.xlsx` traz:

- aba `UNIMED` com nomes, idades, parentesco, valores atuais SulAmerica, valor estimado SulAmerica, Unimed PE enfermaria/apartamento;
- aba `FAIXA ETARIA` com tabela de preco Unimed por faixa e acomodacao.

Isso sugere que o MVP deve suportar:

- importacao ou digitacao de vidas;
- fonte de tabela por faixa etaria;
- calculo por idade/faixa;
- exportacao em formato de matriz.

## Saidas desejadas do sistema

O produto deve caminhar para tres saidas geradas do mesmo rascunho revisado:

1. Planilha: prioridade maxima do prototipo urgente, porque replica o trabalho atual da corretora.
2. PDF: proposta comercial organizada, boa para envio formal.
3. Link navegavel: experiencia consultiva para cliente, com comparacao e CTA de WhatsApp.

No prototipo urgente, a planilha vem primeiro. PDF e link podem usar a mesma base de dados depois.

## Necessidade futura: PDF como imagem/OCR

Algumas tabelas podem vir como imagem/PNG dentro do PDF ou como PDF escaneado. O PDF lab atual extrai texto quando existe camada textual, mas o produto de Saude deve prever uma etapa futura de OCR/layout visual:

- detectar paginas com pouco texto extraivel;
- renderizar pagina como imagem;
- aplicar OCR ou vision model;
- preservar coordenadas/estrutura de tabela quando possivel;
- marcar campos como `source: "ocr"` ou `source: "vision_inferred"`;
- exigir revisao humana quando o valor vier de imagem.

Essa frente nao deve bloquear o MVP textual, mas precisa estar documentada para nao fingirmos que todos os PDFs de Saude sao textuais.

## Divisao recomendada de tasks

### Fase 0 - Discovery urgente

Mapear PDFs e planilhas variadas de Saude, listar campos extraiveis, lacunas, estrutura de planilha atual e contrato minimo do rascunho.

### Fase 1 - Contrato do rascunho de Saude

Definir `HealthQuoteDraft`, `DraftField`, `MemberLife`, `QuoteOption`, `AgeBandPrice`, `ManualTableSource` e regras de origem/confianca/revisao.

### Fase 2 - Extrator generico IA/texto

Implementar extracao assistida para PDFs textuais de Saude, retornando rascunho revisavel, nao cotacao final.

### Fase 3 - Revisao de vidas e campos

Criar tela/fluxo para confirmar vidas, nomes opcionais, idades, parentesco, rateio por faixa, campos inferidos e campos ausentes.

### Fase 4 - Fontes de tabela manual

Permitir cadastrar/importar tabela por faixa etaria, plano, acomodacao, coparticipacao e validade. Usar o grupo de vidas revisado para calcular novas opcoes.

### Fase 5 - Exportacao de planilha

Gerar `.xlsx` no estilo das planilhas da corretora: linhas por pessoa, colunas por plano/opcao, totais e notas de validade/origem.

### Fase 6 - PDF comercial

Gerar proposta PDF a partir do rascunho revisado, com linguagem simples e sem prometer campos nao confirmados.

### Fase 7 - Link navegavel

Gerar link publico mobile-first a partir do mesmo rascunho revisado, com comparacao, detalhes e CTA para corretora.

### Fase 8 - OCR/vision para PDFs-imagem

Adicionar fallback para tabelas em imagem/PNG/PDF escaneado.

## Decisao provisoria

Saude deve ter uma camada `draft/review` antes da cotacao final. O prototipo urgente pode ser generico e usar IA, mas nao deve gravar inferencias como fatos finais sem origem, confianca e revisao.

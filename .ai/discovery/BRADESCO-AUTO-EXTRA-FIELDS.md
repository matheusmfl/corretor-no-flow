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

Preencher apos rodar o PDF lab.

### Renovacao

- Encontrado: pendente
- Label no PDF:
- Exemplo de texto:
- Recomendacao:

### Bonus

- Encontrado: pendente
- Label no PDF:
- Exemplo de texto:
- Recomendacao:

### Uso Do Veiculo

- Encontrado: pendente
- Label no PDF:
- Exemplo de texto:
- Recomendacao:

### Coberturas Enriquecidas / Servicos

- Encontrado: pendente
- Labels no PDF:
- Exemplo de texto:
- Campos candidatos para `coverageDetails`:
- O que e fato extraido do PDF:
- O que parece catalogo/tooltip estatico:
- Recomendacao:

### Assistencia / Guincho

- Encontrado: pendente
- Limite de km:
- Texto de plano:
- Recomendacao:

### Vidros

- Encontrado: pendente
- Tier/plano:
- Recomendacao:

### Reparo / Servicos Opcionais

- Encontrado: pendente
- Martelinho/reparo rapido:
- Lataria/pintura:
- Roda/pneu/suspensao:
- Recomendacao:

### Condicoes De Reparo

- Encontrado: pendente
- Oficina:
- Peca:
- Recomendacao:

## Recomendacao Final

Pendente.

Nota: esta discovery deve virar task de implementacao propria antes de alterar prompt/schema/renderizadores para Bradesco.


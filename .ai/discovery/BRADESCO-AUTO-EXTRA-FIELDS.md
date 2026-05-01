# Discovery - Bradesco AUTO Extra Fields

## Objetivo

Mapear campos adicionais do PDF Bradesco AUTO que podem ser uteis para revisao, comparacao e renovacao.

## Campos A Procurar

- Seguradora de renovacao.
- Classe de bonus.
- Tipo de uso do veiculo: particular, comercial, aplicativo, taxi ou similar.
- Qualquer indicio de vigencia anterior ou renovacao.

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

## Recomendacao Final

Pendente.


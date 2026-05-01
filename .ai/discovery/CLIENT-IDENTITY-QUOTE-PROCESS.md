# Client Identity In Quote Process

Data: 2026-05-01

## Product Decision

Um processo de cotacao representa um atendimento comercial, nao necessariamente um unico segurado extraido dos PDFs.

Na pratica do corretor, um mesmo atendimento pode comparar cotacoes em nomes diferentes. Exemplos:

- cotar no nome da esposa e do marido;
- testar segurado e principal condutor diferentes;
- comparar onde a Porto, Bradesco ou outra seguradora fica mais competitiva;
- montar uma proposta familiar quando a decisao de compra e do nucleo familiar.

Por isso, o sistema nao deve bloquear automaticamente nomes divergentes dentro do mesmo processo.

## Core Principle

O produto deve proteger o corretor contra erro de apresentacao sem impedir a estrategia comercial.

Isso significa:

- permitir multiplos nomes extraidos no mesmo processo;
- detectar divergencias automaticamente;
- preservar fluxo simples quando existe apenas um nome;
- exigir ou sugerir uma apresentacao clara antes de publicar um link com nomes divergentes;
- nunca publicar saudacao personalizada usando automaticamente apenas o nome de uma cotacao quando existem varias identidades.

## Product Model

### Simple Mode

Quando todas as cotacoes apontam para a mesma identidade, o sistema continua como hoje para o corretor.

Exemplo:

```txt
Cotacao 1: Maria Fonteles
Cotacao 2: Maria Fonteles
Link: Ola, Maria Fonteles
```

Nao deve haver etapa extra, alerta forte ou campo obrigatorio novo nesse caso.

### Flexible Commercial Service Mode

Quando o processo contem nomes divergentes, ele passa a ser tratado como atendimento comercial flexivel.

Exemplo:

```txt
Cotacao 1: Maria Fonteles
Cotacao 2: Joao Fonteles
Link: Ola, Familia Fonteles
```

O corretor deve receber sugestoes prontas para o nome de apresentacao, em vez de um campo vazio abstrato.

Sugestoes iniciais:

- se houver sobrenome comum forte: `Familia Fonteles`;
- se houver dois primeiros nomes claros: `Maria e Joao`;
- se nao houver padrao confiavel: `Cliente`;
- sempre permitir edicao manual pelo corretor.

## Public Link Greeting

O link publico deve usar um nome de apresentacao do processo, nao o nome extraido de uma cotacao especifica quando houver conflito.

Regras recomendadas:

- um nome unico confiavel: `Ola, Maria Fonteles`;
- multiplos nomes com sobrenome comum: `Ola, Familia Fonteles`;
- dois nomes simples: `Ola, Maria e Joao`;
- conflito sem sugestao confiavel: `Ola`;
- nome manual definido pelo corretor: usar o nome manual.

O processamento de PDF nao deve sobrescrever silenciosamente um nome de apresentacao ja definido ou confirmado pelo corretor.

## Quote Cards

Cada card de cotacao deve poder exibir discretamente os nomes relevantes daquela cotacao.

Isso e util comercialmente porque explica diferencas reais de preco e aceitacao entre segurado/condutor.

Exemplo:

```txt
Porto Seguro
Premio total: R$ 2.840,15

Segurado: Joao Fonteles
Condutor principal: Maria Fonteles
```

A exibicao deve ser secundaria, nao o centro visual do card.

## Publish Warning

Quando houver nomes divergentes e nenhum nome de apresentacao confirmado, o dashboard deve alertar antes de publicar.

Texto conceitual:

```txt
Encontramos nomes diferentes nas cotacoes deste processo.
Escolha como o cliente sera cumprimentado no link publico.
```

O sistema deve oferecer sugestoes e permitir edicao manual.

## Follow-Up Implementation Slices

1. Criar regras de deteccao e sugestao de identidade do processo.
2. Adicionar UX no dashboard para revisar/confirmar o nome de apresentacao quando houver divergencia.
3. Ajustar link publico para usar o nome confirmado e mostrar nomes por card de cotacao.

## Risks

- Exibir nomes demais pode deixar a proposta pesada ou confusa.
- Esconder nomes divergentes pode reduzir transparencia e causar duvida no cliente.
- Sobrescrever nome manual pode produzir saudacao errada.
- Bloquear nomes divergentes pode atrapalhar uma pratica real de venda.

## Open Questions

- O nome de apresentacao deve ser salvo como campo proprio, por exemplo `displayClientName`, ou reutilizar `clientName` com uma origem/flag?
- O dashboard deve exigir confirmacao apenas ao publicar ou tambem ja na tela de review?
- O link publico deve mostrar segurado/condutor sempre ou apenas quando houver divergencia?


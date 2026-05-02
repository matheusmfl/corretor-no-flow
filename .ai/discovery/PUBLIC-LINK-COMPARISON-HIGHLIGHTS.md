# Discovery - Destaques De Comparacao No Link Publico

## Contexto

O link publico deve ajudar o segurado a entender diferencas entre cotacoes sem transformar o produto em um recomendador absoluto.

A task antiga `TASK-0004` propunha implementar diretamente uma secao de `Destaques da comparacao`, mas ainda existem decisoes de produto abertas:

- quais campos podem ser comparados com seguranca;
- como escrever o destaque sem afirmar que uma cotacao e "a melhor";
- como lidar com uma unica cotacao;
- como lidar com varias franquias da mesma seguradora;
- como lidar com dados ausentes ou incompletos;
- qual nivel de detalhe ajuda o cliente sem poluir a proposta.

## Principio

O produto deve destacar fatos comparaveis, nao tomar a decisao pelo segurado.

Exemplos de linguagem segura:

- `Menor premio anual entre as cotacoes enviadas`
- `Maior limite de RCF informado`
- `Parcela mais baixa informada`
- `Opcao com carro reserva informado`

Evitar:

- `Melhor cotacao`
- `Mais vantajosa`
- `Recomendada`
- `Escolha ideal`

## Perguntas Em Aberto

- Quais campos entram no primeiro V1 de comparacao?
- O destaque deve aparecer quando so existe uma cotacao?
- Como agrupar cotacoes da mesma seguradora com franquias diferentes?
- O produto deve destacar preco mesmo quando cobertura/RCF/franquia diferem muito?
- Como tratar `Nao informado`, `Incluso`, `Nao contratado` e valores ausentes?
- Como o link deve explicar que os destaques nao substituem a orientacao do corretor?

## Campos Candidatos

- premio total anual;
- melhor parcela ou maior parcelamento sem juros;
- franquia;
- RCF danos materiais/corporais;
- assistencia/guincho;
- carro reserva;
- protecao de vidros;
- seguradora mais visualizada pelo cliente no futuro, quando tracking estiver maduro.

## Resultado Esperado Da Discovery

Esta discovery deve produzir:

- lista fechada de campos do primeiro V1;
- regra de elegibilidade para cada destaque;
- textos seguros para cada destaque;
- comportamento para uma cotacao, varias seguradoras e varias opcoes da mesma seguradora;
- recomendacao de uma task pequena de implementacao.


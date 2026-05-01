# Discovery - AutoQuoteData Extras Contract

## Objetivo

Definir como o `AutoQuoteData` pode continuar tendo um core comum para AUTO e, ao mesmo tempo, permitir dados extras especificos por seguradora.

## Problema

Cada seguradora pode trazer informacoes extras:

- Bradesco pode trazer dados de renovacao, bonus e uso do veiculo.
- Porto traz Porto Bank, descontos, custos de defesa, protecao combinada, beneficios, antifurto e assistencias detalhadas.
- Outras seguradoras podem trazer campos proprios.

Se todos os campos virarem obrigatorios no core, o tipo fica grande e confuso. Se tudo virar JSON livre, a UI perde confianca.

## Hipotese Inicial

Separar:

- Core AUTO comum: campos necessarios para comparacao, review, PDF e link publico.
- Extras por seguradora: campos opcionais e tipados por insurer quando fizer sentido.

## Perguntas Em Aberto

- Extras devem ficar dentro de `AutoQuoteData.extras`?
- Extras devem ser discriminados por seguradora, por exemplo `extras.portoSeguro`?
- A review deve mostrar extras automaticamente ou apenas campos explicitamente suportados?
- O PDF publico deve ocultar extras por padrao?
- Quais extras podem ser usados para score/comparacao no futuro?

## Recomendacao Pendente

Pendente. Esta discovery deve ser preenchida antes de mudar tipos.


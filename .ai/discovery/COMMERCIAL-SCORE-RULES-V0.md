# Discovery - Score Comercial Por Regras V0

## Contexto

O produto ja registra eventos de tracking e deve evoluir para insight comercial simples: frio, morno ou quente.

A task antiga `TASK-0005` propunha implementar diretamente pesos fixos, mas os pesos ainda sao arbitrarios. Antes de implementar, precisamos definir uma regra v0 pequena, explicavel e baseada nos eventos que existem de verdade.

## Principio

O score deve ajudar o corretor a priorizar follow-up, nao prometer previsao de venda.

O primeiro score deve ser:

- deterministico;
- facil de explicar;
- conservador;
- ajustavel depois;
- isolado por processo e empresa;
- sem IA.

## Eventos Candidatos

- abertura do link;
- retorno ao link;
- tempo aproximado ativo via heartbeat;
- visualizacao de seguradora;
- visualizacao de formas de pagamento;
- download/abertura de PDF;
- clique no WhatsApp.

## Perguntas Em Aberto

- Quais eventos existem hoje de forma confiavel no dashboard/API?
- Quais eventos realmente indicam intencao comercial forte?
- Clique em WhatsApp deve ser sempre `hot`?
- Quantas visitas ou quanto tempo transformam frio em morno?
- O score deve explicar o motivo, por exemplo `Cliente voltou ao link e clicou no WhatsApp`?
- O score deve considerar seguradora mais vista ou isso fica para insight separado?

## Resultado Esperado Da Discovery

Esta discovery deve produzir:

- tabela de eventos usados no score v0;
- peso ou regra de cada evento;
- thresholds de `cold`, `warm` e `hot`;
- textos curtos de insight para o corretor;
- criterios de teste para uma task backend posterior.


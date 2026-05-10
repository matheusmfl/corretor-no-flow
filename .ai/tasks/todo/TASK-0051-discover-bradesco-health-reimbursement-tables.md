---
id: TASK-0051
title: Descobrir tabelas de reembolso Bradesco Saude
status: todo
kind: discovery
lifecycle: open
area: product
owner: codex
reviewer: human
complexity: medium
risk: high
tdd_required: false
created_at: 2026-05-10
---

# TASK-0051 - Descobrir tabelas de reembolso Bradesco Saude

## Context

Durante o desenho do mock do link publico Bradesco Saude, surgiu uma hipotese forte de UX: um simulador de reembolso. Ele pode ajudar o cliente a entender uma das partes mais dificeis do produto, especialmente quando a cotacao informa `reembolso especifico`.

Hoje ainda nao temos uma tabela de reembolso confiavel, estruturada e validada para calcular valores reais do plano `Nacional II` da cotacao analisada. O mock pode usar valores ficticios, mas o produto real precisa de descoberta separada.

## Objective

Mapear quais documentos, tabelas e regras sao necessarios para transformar o simulador de reembolso de um componente demonstrativo em uma funcionalidade confiavel.

## Scope

- Identificar nos materiais Bradesco Saude onde aparecem tabelas de reembolso.
- Separar reembolso completo vs reembolso especifico.
- Mapear se os valores variam por:
  - plano;
  - codigo do plano;
  - regiao;
  - acomodacao;
  - procedimento;
  - segmentacao/cobertura assistencial;
  - tipo de contratacao.
- Verificar se a cotacao PDF traz alguma referencia direta a tabela de reembolso.
- Definir campos minimos para uma futura entidade/estrutura de tabela de reembolso.
- Definir linguagem de cautela para o link publico.

## Out Of Scope

- Nao implementar calculo real.
- Nao alterar backend.
- Nao prometer que um valor sera reembolsado.
- Nao usar dados sensiveis de clientes/corretora.

## Executor Context Pack

Read these files first, in order:

1. `.ai/discovery/BRADESCO-HEALTH.md`
2. `.ai/discovery/BRADESCO-HEALTH-SALES-MATERIALS.md`
3. `.ai/discovery/BRADESCO-HEALTH-PUBLIC-PREVIEW-MVC.md`
4. `.ai/tasks/todo/TASK-0050-create-bradesco-health-public-preview-mock.md`

Use `rg` only for:

- `reembolso`
- `honorarios`
- `consulta`
- `tabela`
- `Nacional II`
- `Nacional Plus`
- `Premium`
- `reembolso especifico`
- `reembolso completo`

If more than 6 additional files seem necessary, stop and explain why before continuing.

## Discovery Questions

- A Bradesco publica uma tabela oficial por plano/codigo?
- A tabela vista nos materiais antigos se aplica ao `Nacional II` da cotacao de Pernambuco?
- O reembolso especifico tem valores fixos por evento ou depende de regra complementar?
- Consultas medicas e honorarios medicos usam tabelas diferentes?
- Existe limite por procedimento, por evento, por periodo ou por beneficiario?
- A informacao e suficientemente confiavel para um simulador ou deve ser apenas explicativa no MVP?

## Acceptance Criteria

- [ ] Documento de discovery criado ou atualizado com fontes de reembolso encontradas.
- [ ] Fica claro o que ja sabemos e o que ainda nao sabemos.
- [ ] Fica claro se a cotacao `Nacional II` pode ou nao alimentar um simulador real.
- [ ] Fica definido o shape minimo de dados para uma tabela futura.
- [ ] Fica definida a microcopy de cautela para qualquer simulador.
- [ ] Follow-up de implementacao pode ser criado sem ambiguidade.

## Risk

Reembolso e uma informacao sensivel comercialmente e operacionalmente. Um simulador incorreto pode gerar expectativa errada no cliente. Para MVP, a recomendacao inicial e tratar o simulador como demonstrativo ate que uma tabela oficial e aplicavel ao plano esteja validada.

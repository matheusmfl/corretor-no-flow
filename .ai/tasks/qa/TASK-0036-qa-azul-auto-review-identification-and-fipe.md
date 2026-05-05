---
id: TASK-0036
title: QA Azul AUTO - corrigir identificacao, FIPE e nomes dos PDFs
status: qa
kind: qa
lifecycle: open
area: product
owner: codex
reviewer: human
complexity: medium
risk: high
tdd_required: true
created_at: 2026-05-05
blocked_by: TASK-0033
---

# TASK-0036 - QA Azul AUTO - corrigir identificacao, FIPE e nomes dos PDFs

## Context

Durante QA humano da `TASK-0033`, foram enviados quatro PDFs Azul:

- Azul Auto Roubo/Furto reduzido.
- Azul Auto Roubo/Furto completo.
- Azul Tradicional/Compreensivo reduzido.
- Azul Tradicional/Compreensivo completo.

Deteccao, processamento inicial e confirmacao geral dos dados funcionaram. O link publico tambem exibiu taglines importantes corretamente, incluindo `90% FIPE` no produto de roubo/furto.

Mesmo assim, surgiram problemas de usabilidade e dados que podem afetar a confianca do corretor na etapa de confirmacao e na entrega dos PDFs.

## Findings De QA

### 1. Valor FIPE parece receber valor de franquia

Na etapa de confirmar cotacao, o campo `Valor FIPE` apareceu como `R$ 6.516,00`.

Esse valor parece ser franquia, nao valor FIPE do veiculo. A suspeita e que o parser/prompt esteja confundindo `franquia` com `fipeValue` ou `lmi`.

Precisamos confirmar se:

- acontece apenas na Azul;
- acontece tambem na Porto, Bradesco ou outras seguradoras;
- ocorre apenas em produto compreensivo;
- ocorre tambem em Azul Auto Roubo/Furto.

### 2. Valor da franquia nao aparece na confirmacao

No mesmo fluxo, o campo `Valor da franquia` nao apareceu. Para produto compreensivo, a franquia deveria aparecer quando existir no PDF.

Para Azul Auto Roubo/Furto, a ausencia pode ser esperada, mas precisa ser tratada como `nao aplicavel`, nao como dado perdido.

### 3. Titulo da cotacao nao identifica produto/servico

Na tela de confirmar cotacoes, o card aparece como:

```txt
AZUL - aguardando confirmacao
```

Isso e insuficiente quando o corretor sobe varios PDFs da mesma seguradora. A dor do usuario: como confirmar os dados se ele nao sabe a referencia exata do PDF?

O titulo deveria incluir pelo menos o produto/servico, por exemplo:

- `Azul Tradicional`
- `Azul Roubo e Furto`
- `Bradesco Compreensivo`
- `Porto Auto Senior`

Quando o produto nao for confiavel, considerar usar o nome original do arquivo como apoio visual.

### 4. Nome dos PDFs gerados fica apenas `Azul`

Ao gerar os PDFs finais, todos os arquivos ficaram com nome `Azul`, sem diferenciar produto, veiculo, tipo de cobertura ou arquivo original.

Isso prejudica operacao real, principalmente quando ha multiplas cotacoes da mesma seguradora no mesmo processo.

## Objective

Corrigir os problemas encontrados no QA Azul para que o corretor consiga identificar, revisar e exportar cada cotacao com seguranca.

## Scope

- Investigar origem do `Valor FIPE = R$ 6.516,00`.
- Corrigir mapeamento de `fipeValue`, `coverage.vehicle.deductible`, `deductibles` e/ou `lmi` conforme necessario.
- Garantir que franquia aparece na confirmacao quando aplicavel.
- Garantir que produto sem franquia tradicional nao exibe dado falso.
- Melhorar titulo/nome da cotacao na etapa de review para incluir produto/servico ou fallback com nome do arquivo.
- Melhorar nome do PDF gerado para diferenciar cotacoes Azul.
- Avaliar se a melhoria de titulo/nome deve ser generica para todas as seguradoras, nao apenas Azul.

## Out Of Scope

- Implementar Mitsui/Sompo.
- Implementar Itau.
- Criar comparador comercial avancado.
- Resolver todo o contrato de cobertura rica da `TASK-0022`.

## Likely Files

- `apps/api/src/modules/ai/ai.service.ts`
- `apps/api/src/modules/quotes/jobs/extract-pdf.processor.ts`
- `apps/api/src/modules/quotes/application/services/quote-filename.ts`
- `apps/api/src/modules/quotes/application/services/quote-pdf-template.service.ts`
- `apps/dashboard/src/app/(app)/dashboard/quotes/[processId]/review/page.tsx`
- `apps/dashboard/src/app/(public)/c/[token]/page.tsx`
- `packages/types/src/quote.types.ts`
- `apps/api/src/modules/quotes/application/services/azul-auto-extraction.spec.ts`

## TDD Requirement

Obrigatorio para bug de dados e nomeacao. Adicionar testes antes de corrigir:

- Azul Tradicional nao deve colocar franquia em `vehicle.fipeValue`.
- Azul Tradicional deve preencher franquia quando presente.
- Azul Auto Roubo/Furto deve aceitar ausencia de franquia.
- Nome gerado para multiplas cotacoes Azul deve diferenciar produto/cobertura.

## Acceptance Criteria

- [ ] `Valor FIPE` nao recebe valor de franquia.
- [ ] Franquia aparece na confirmacao quando aplicavel.
- [ ] Azul Auto Roubo/Furto nao exibe franquia falsa.
- [ ] Card de confirmacao identifica produto/servico ou usa fallback com nome do arquivo.
- [ ] Link publico diferencia cards da mesma seguradora de forma compreensivel.
- [ ] PDFs gerados possuem nomes distintos e uteis, nao apenas `Azul`.
- [ ] Regressao verificada em Porto e Bradesco para FIPE, franquia e nome de PDF.

## Human QA Checklist

- [ ] Reprocessar Azul Tradicional completo/reduzido.
- [ ] Reprocessar Azul Roubo/Furto completo/reduzido.
- [ ] Confirmar FIPE, franquia, premio total, RCF e forma de pagamento contra PDF original.
- [ ] Confirmar que cada card de review e link publico pode ser identificado sem abrir o PDF original.
- [ ] Baixar PDFs gerados e confirmar nomes distintos.
- [ ] Rodar regressao rapida com Porto e Bradesco.

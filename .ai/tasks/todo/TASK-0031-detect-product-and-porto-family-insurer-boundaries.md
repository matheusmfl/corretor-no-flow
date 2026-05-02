---
id: TASK-0031
title: Refinar deteccao de produto e fronteiras da familia Porto
status: todo
kind: discovery
lifecycle: open
area: product
owner: codex
reviewer: human
complexity: medium
risk: high
tdd_required: false
created_at: 2026-05-01
blocked_by: TASK-0030
---

# TASK-0031 - Refinar deteccao de produto e fronteiras da familia Porto

## Context

Durante QA do upload unico, PDFs Itau e Mitsui foram detectados/processados como Porto Seguro. A extracao quase funcionou porque os documentos sao muito parecidos, mas isso e perigoso para o produto: a seguradora exibida ao corretor e ao segurado fica errada.

Tambem surgiu a pergunta se o sistema verifica o tipo de cotacao. Hoje o processo seleciona `AUTO`, mas a deteccao inicial identifica seguradora, nao valida com seguranca se o PDF e de AUTO. Um PDF Saude Bradesco nao deveria passar como cotacao AUTO apenas porque contem Bradesco.

## Objective

Definir regras de deteccao para distinguir seguradora especifica e produto/ramo antes de processar PDFs AUTO.

## Scope

- Usar PDFs reais/extracoes da `TASK-0030` quando disponiveis.
- Documentar diferencas entre Porto Seguro, Itau, Azul, Mitsui/Sompo e outras marcas da familia/portfolio.
- Documentar diferencas entre PDF reduzido e PDF completo dentro da familia Porto.
- Confirmar se Sompo pertence ou nao ao mesmo grupo/estrutura relevante para o produto.
- Definir se Mitsui deve ser tratada como seguradora separada, alias de Sompo, ou discovery propria.
- Mapear produtos comerciais como `Itau Seguro Auto Compacto`, `Alternativo`, `Azul Tradicional e Protecao Combinada`, `Auto Senior e Protecao Combinada`, `Incendio e Roubo/Furto`.
- Mapear coberturas ausentes por produto para distinguir `nao contratado`, `nao aplicavel` e `nao existente nesse plano`.
- Definir sinais fortes para `AUTO` vs `HEALTH` quando possivel.
- Atualizar `.ai/discovery/AUTO-PDF-INSURER-DETECTION.md` com regras conservadoras:
  - Itau nao deve virar Porto;
  - Mitsui/Sompo nao deve virar Porto;
  - marca de grupo/template nao deve decidir seguradora;
  - produto nao AUTO deve bloquear ou pedir confirmacao segura.
- Produzir follow-up implementation task para detector/backend.

## Out Of Scope

- Nao implementar parser Itau/Mitsui/Sompo/Azul.
- Nao adicionar seguradora futura como suportada no frontend.
- Nao processar Saude.

## Likely Files

- `.ai/discovery/AUTO-PDF-INSURER-DETECTION.md`
- `.ai/discovery/PORTO-FAMILY-AUTO.md`
- `.ai/tasks/todo/TASK-0030-collect-future-insurer-pdf-samples.md`
- `apps/api/src/modules/quotes/application/services/insurer-detector.ts`

## TDD Requirement

No implementation in this task.

## Acceptance Criteria

- [ ] Regras conceituais distinguem Porto, Itau e Mitsui/Sompo.
- [ ] Risco de produto errado, como Saude Bradesco em processo AUTO, esta documentado.
- [ ] Discovery diferencia PDF reduzido e PDF completo da familia Porto.
- [ ] Discovery documenta tipos de produto/cobertura que mudam a interpretacao das coberturas.
- [ ] Recomendacao existe para bloquear ou confirmar produto divergente.
- [ ] Follow-up tecnico pode ser escrito sem ambiguidade.

## Risks

- PDFs da familia Porto podem compartilhar muitos textos e induzir o detector a falsos positivos.
- Sem validar ramo/produto, o sistema pode tentar extrair AUTO de PDFs de Saude e gerar falha ou dados ruins.

## Failure Scenario

O corretor envia PDF Itau ou Mitsui, o sistema exibe Porto Seguro, processa com parser Porto e publica uma proposta com seguradora errada.

## Human QA Checklist

- [ ] Human confirma quais marcas pertencem a qual grupo/estrutura comercial.
- [ ] Human fornece exemplos reais ou extracoes para Itau e Mitsui/Sompo quando possivel.

## Human Notes - 2026-05-02

Observacoes iniciais feitas no olho a partir de PDFs reais:

- A familia Porto/Azul/Itaú/Mitsui parece compartilhar o core do documento. PDFs reduzidos da Porto e Azul parecem quase iguais, mudando principalmente headline, produto comercial e coberturas contratadas.
- Exemplo headline Azul reduzido:
  - `Orcamento de Seguro Auto`
  - `Orcamento: 5634702819-0-4`
  - `Azul Tradicional e Protecao Combinada`
- Exemplo headline Porto reduzido:
  - `Orcamento de Seguro Auto`
  - `Orcamento: 5634702819-0-1`
  - `Auto Senior e Protecao Combinada`
- Porto Seguro pode aparecer pouco no texto extraido, talvez mais em logomarca/cabecalho e em formas de pagamento como `Porto Bank`.
- PDFs completos parecem manter o core do documento, mas a Porto tende a trazer mais beneficios, coberturas adicionais, servicos e possivel cobertura residencial junto do plano.
- Exemplo de descontos no PDF completo Porto:
  - `Desconto Cartao Porto Bank - Aquisicao (limitado a R$ 500,00): 10.00%`
  - `Desconto a vista - Primeira Compra: 5.00%`
  - `Desconto Auto+Residencial: 5.00%`
  - `Desconto a vista - Demais formas de Pagamento: 5.00%`
- Existem produtos/coberturas com semantica diferente:
  - `Itau Seguro Auto Compacto` parece ter cobertura reduzida e pode pagar apenas percentual da FIPE, exemplo observado: 85%.
  - `Alternativo` precisa de mapeamento.
  - `Incendio e Furto/Roubo` pode nao ter franquia porque aciona em perda total, e pode nao ter `Casco` como cobertura tradicional.
- Algumas cotacoes nao possuem coberturas como RCF. O sistema nao deve necessariamente tratar isso como erro; pode ser `nao contratado`, `nao aplicavel` ou `fora do produto`, dependendo do produto comercial.
- Necessidade de labels mais informativas no review/proposta para explicar produtos reduzidos, compacto, roubo/furto/incendio e ausencias esperadas de cobertura.

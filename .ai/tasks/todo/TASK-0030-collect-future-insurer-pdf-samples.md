---
id: TASK-0030
title: Coletar e extrair PDFs AUTO de seguradoras futuras
status: todo
kind: human
lifecycle: open
area: product
owner: human
reviewer: codex
complexity: medium
risk: low
tdd_required: false
created_at: 2026-05-01
priority: low
---

# TASK-0030 - Coletar e extrair PDFs AUTO de seguradoras futuras

## Context

O produto hoje processa efetivamente Bradesco e Porto Seguro. Mesmo assim, o corretor possui acesso a PDFs AUTO de seguradoras futuras, incluindo Azul, Sompo, Itau, Tokio Marine e possivelmente HDI.

Essas amostras nao devem bloquear a entrega atual de upload unico/deteccao, mas sao valiosas para evoluir:

- detector conservador de seguradora;
- discovery da familia Porto;
- futura priorizacao de novas seguradoras;
- fixtures e testes antes de implementar novos parsers.

## Objective

Coletar PDFs reais de seguradoras futuras, extrair texto pelo PDF lab e documentar sinais de identidade/estrutura sem criar implementacao tecnica ainda.

## Scope

- Separar PDFs por seguradora em `.ai/pdf-lab/input`.
- Quando possivel, coletar pelo menos uma amostra de:
  - Azul;
  - Sompo;
  - Itau;
  - Tokio Marine;
  - HDI, se disponivel;
  - outras seguradoras acessiveis.
- Rodar `npm run pdf:extract` para cada seguradora/amostra.
- Nomear outputs com seguradora e variante.
- Documentar no discovery relevante:
  - sinais fortes de identidade da seguradora;
  - mencoes a grupo/template;
  - se estrutura parece com Porto ou nao;
  - se existe risco de confusao para detector;
  - se a seguradora parece candidata proxima ou futura.

## Out Of Scope

- Nao implementar parser de novas seguradoras.
- Nao alterar o fluxo atual de processamento.
- Nao adicionar seguradora ao frontend como suportada.
- Nao commitar PDFs brutos ou outputs com dados sensiveis.

## Likely Files

- `.ai/pdf-lab/input/**`
- `.ai/pdf-lab/output/**`
- `.ai/discovery/PORTO-FAMILY-AUTO.md`
- `.ai/discovery/AUTO-PDF-INSURER-DETECTION.md`
- `.ai/discovery/**`

## TDD Requirement

No code in this task.

## Acceptance Criteria

- [ ] Pelo menos uma amostra futura e extraida pelo PDF lab.
- [ ] Itau/Azul/Sompo sao comparados contra a hipotese de familia Porto quando houver PDFs.
- [ ] Tokio Marine e HDI sao documentadas como fora/possivelmente fora da familia Porto.
- [ ] Sinais de identidade úteis para o detector sao documentados.
- [ ] Nenhum PDF bruto sensivel e adicionado ao Git.
- [ ] Codex consegue criar tasks tecnicas futuras a partir dos achados.

## Risks

- Amostras isoladas podem nao representar todas as variacoes reais da seguradora.
- PDFs podem conter dados pessoais e devem ficar fora do Git.

## Failure Scenario

O time implementa uma nova seguradora assumindo que ela segue a estrutura Porto, mas os PDFs reais mostram diferencas importantes que nao foram mapeadas antes.

## Human QA Checklist

- [ ] Confirmar quais PDFs foram coletados e suas seguradoras.
- [ ] Confirmar que os arquivos estao anonimizados ou protegidos localmente.
- [ ] Confirmar que os achados fazem sentido para priorizacao comercial.


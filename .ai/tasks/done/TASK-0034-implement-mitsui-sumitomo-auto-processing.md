---
id: TASK-0034
title: Implementar suporte Mitsui Sumitomo AUTO
status: done
kind: implementation
lifecycle: closed
area: backend
owner: codex
reviewer: human
complexity: high
risk: high
tdd_required: true
created_at: 2026-05-05
blocked_by: TASK-0032
---

# TASK-0034 - Implementar suporte Mitsui Sumitomo AUTO

## Context

A `TASK-0032` reconhece Mitsui Sumitomo como seguradora com PDF estruturalmente parecido com a base Porto, mas bloqueia o processamento por falta de parser suportado. As amostras indicam estrutura muito proxima da Porto e texto de cosseguro com Porto lider e Mitsui Sumitomo como cosseguradora.

Correcao de produto: Sompo nao deve ser tratada como alias de Mitsui nem como parte da familia Porto neste momento. Sompo fica como seguradora futura separada, fora do escopo desta task.

## Objective

Adicionar suporte real a processamento AUTO Mitsui Sumitomo com identidade correta, sem exibir Porto Seguro como seguradora final.

## Scope

- Confirmar nome de produto/seguradora a exibir: `Mitsui Sumitomo`.
- Decidir enum/contrato de seguradora.
- Criar fixtures anonimizadas a partir de:
  - `auto_mitsui_discovery.md`;
  - amostras completas e reduzidas disponiveis.
- Validar se parser/prompt Porto pode ser reaproveitado.
- Garantir que textos de cosseguro com Porto nao alterem a seguradora exibida.
- Integrar ao fluxo AUTO:
  - detector;
  - processamento;
  - review;
  - PDF;
  - link publico.
- Mapear assistencia observada, exemplo `Rede Referenciada - 400km`, sem quebrar core comum.

## Out Of Scope

- Implementar Azul.
- Implementar Itau.
- Resolver contrato completo de cosseguro.
- Interpretar juridicamente lideranca de cosseguro alem do necessario para exibir a proposta corretamente.
- Implementar Sompo ou tratar Sompo como alias de Mitsui.

## Likely Files

- `apps/api/prisma/schema.prisma`
- `packages/types/src/quote.types.ts`
- `apps/api/src/modules/quotes/application/services/insurer-detector.ts`
- `apps/api/src/modules/quotes/application/services/insurer-detector.spec.ts`
- `apps/api/src/modules/quotes/jobs/extract-pdf.processor.ts`
- `apps/api/src/modules/ai/ai.service.ts`
- `apps/api/src/modules/quotes/application/services/fixtures/**`
- `apps/dashboard/src/**`
- `.ai/pdf-lab/output/auto_mitsui_discovery.md`
- `.ai/discovery/PORTO-FAMILY-AUTO.md`

## Executor Context Pack

Do not use broad Explore/subagent/codebase-map workflows before reading these files.

Read these files first, in order:

1. `.ai/pdf-lab/output/auto_mitsui_discovery.md`
2. `apps/api/src/modules/quotes/application/services/insurer-detector.spec.ts`
3. `apps/api/src/modules/quotes/application/services/insurer-detector.ts`
4. `apps/api/src/modules/quotes/application/services/azul-auto-extraction.spec.ts`
5. `apps/api/src/modules/ai/ai.service.ts`
6. `apps/api/src/modules/quotes/jobs/extract-pdf.processor.ts`
7. `apps/api/src/modules/quotes/application/services/quote-pdf-template.service.ts`

Use `rg` only for these terms before opening more files:

- `MITSUI`
- `Mitsui`
- `Insurer`
- `SUPPORTED_INSURERS`
- `PRISMA_INSURERS`
- `AZUL`
- `extractAutoQuote`

If more than 6 additional files seem necessary, stop and explain why before continuing.

## TDD Requirement

Obrigatorio. Comecar por testes que provem que Mitsui Sumitomo nao vira Porto e que o core AUTO e extraido corretamente das fixtures.

## Acceptance Criteria

- [ ] Nome de exibicao `Mitsui Sumitomo` e validado pelo humano.
- [ ] Detector retorna a seguradora suportada correta para amostra Mitsui Sumitomo.
- [ ] Texto/CNPJ/beneficios Porto aparecem como sinais de familia/cosseguro, nao como seguradora final.
- [ ] Extracao retorna `AutoQuoteData` valido para pelo menos uma amostra Mitsui Sumitomo.
- [ ] Review, PDF e link publico exibem Mitsui Sumitomo conforme decisao de produto.
- [ ] Bradesco, Porto e Azul, se ja suportada, nao sofrem regressao.

## Risks

- Nome comercial errado pode gerar desconfiança no corretor/cliente.
- Cosseguro pode confundir parser e UI se tratado como seguradora unica sem contexto.
- Estrutura parecida com Porto pode esconder diferencas de cobertura ou assistencia.

## Implementation Notes

### O que foi implementado

**Decisão de enum:** `MITSUI_SUMITOMO` adicionado ao enum Prisma `Insurer` e ao tipo `@corretor/types`. Nome de exibição: `Mitsui Sumitomo Seguros`.

**Detector (`insurer-detector.ts`):** Renomeadas todas as referências internas de `MITSUI` para `MITSUI_SUMITOMO`. Agora a seguradora é reconhecida como processável em vez de `notProcessable: true`. A family rule `porto` continua suprimindo Porto Seguro quando Mitsui aparece, e MITSUI_SUMITOMO vence como `detectedInsurer` com `confidence: high` (sinal forte de razão social) ou `medium` (marca apenas).

**Fixture:** `fixtures/mitsui-sumitomo-auto-complete.txt` criado com dados anonimizados do PDF de descoberta (5 páginas, compreensiva + proteção combinada).

**Testes:**
- `insurer-detector.spec.ts`: Testes Mitsui atualizados — agora provam que `detectedInsurer === 'MITSUI_SUMITOMO'` com `family: 'porto'` e sem `notProcessable`. 2 fixture tests adicionados.
- `mitsui-auto-extraction.spec.ts`: 16 testes — parser de pagamentos Porto reutilizado (8 métodos), integração AI response + `parseAutoQuoteData`.
- Suite completa: 324/324 passando.

**AI prompt (`ai.service.ts`):** `getMitsuiSumitomoAutoPrompt()` adicionado. Instrui a IA que o CNPJ no cabeçalho é da Porto Seguro (líder de cosseguro), mas o campo `insurer` retornado deve ser sempre `"Mitsui Sumitomo Seguros"`.

**Processor (`extract-pdf.processor.ts`):** `MITSUI_SUMITOMO` adicionado ao `INSURER_SHORT` e ao branch de parser determinístico (reutiliza `parsePortoPaymentTable`).

**PDF template (`quote-pdf-template.service.ts`):** `MITSUI_SUMITOMO` adicionado com `label: 'Mitsui Sumitomo Seguros'` e `brand: '#003087'` (mesma paleta da família Porto).

**Dashboard (`upload/page.tsx`):** `MITSUI_SUMITOMO` adicionado ao `SUPPORTED_INSURERS` (override manual) e ao `INSURER_LABEL`.

**Migration:** `20260505000001_add_mitsui_sumitomo_insurer/migration.sql` criado.

### Cosseguro — decisão tomada

Texto de cosseguro ("Porto Seguro líder em cosseguro (85%), Mitsui Sumitomo S.A. (15%) como cosseguradora") é tratado como contexto do PDF, não como seguradora da proposta. O detector suprime Porto via family rule. O prompt de IA instrui explicitamente a retornar `insurer: "Mitsui Sumitomo Seguros"`. A UI exibe `Mitsui Sumitomo Seguros` em todos os pontos — review, PDF e link público.

### Assistência Rede Referenciada 400km

O fixture e o prompt documentam "34 - REDE REFERENCIADA - 400KM Gratuita". O campo `coverage.assistance.towing` captura essa assistência (instrução no prompt: "Rede Referenciada conta como assistência").

### Regressões verificadas

Bradesco, Porto Seguro, Azul continuam sem regressão (324 testes).

## Fix dos blockers P1 (pós-review Codex)

**P1 — `detect-insurer.use-case.ts`**: `SUPPORTED_INSURERS` não incluía `MITSUI_SUMITOMO`, então `supported: false` era retornado ao frontend mesmo após detecção correta. Corrigido adicionando `'MITSUI_SUMITOMO'` ao Set. Teste `detect-insurer.use-case.spec.ts` atualizado com cenário `MITSUI_SUMITOMO retorna supported: true`.

**P1 — `upload-auto-quote.use-case.ts`**: `SUPPORTED_INSURERS` não incluía `Insurer.MITSUI_SUMITOMO`, então o upload backend rejeitava com `BadRequestException` antes de enfileirar o job. Corrigido adicionando `Insurer.MITSUI_SUMITOMO` ao Set. Teste `upload-auto-quote.use-case.spec.ts` atualizado — `it.each` agora inclui `MITSUI_SUMITOMO`.

Suite completa: 326/326 passando após os fixes.

## QA operacional - 2026-05-05

Durante QA humano, o upload falhou inicialmente com `invalid input value for enum "Insurer": "MITSUI_SUMITOMO"`. A causa era o banco Postgres local sem o valor novo no enum, apesar do schema/codigo ja estarem atualizados.

Resolucao operacional: aplicar a migration `20260505000001_add_mitsui_sumitomo_insurer` no banco real e regenerar Prisma antes do QA.

## Final QA decision - 2026-05-05

QA humano validou Mitsui Sumitomo sem encontrar regressao visivel:

- upload/processamento concluido;
- seguradora exibida como Mitsui Sumitomo, nao Porto Seguro;
- dados principais aceitos na revisao;
- fluxo seguiu sem erro observado na rodada.

Task encerrada.

## Human QA Checklist

- [x] Confirmar nome correto: Mitsui Sumitomo.
- [x] Subir PDF Mitsui Sumitomo e confirmar seguradora exibida.
- [x] Comparar premio, FIPE, franquia, RCF, assistencia e pagamentos contra PDF original.
- [x] Confirmar que nenhuma tela mostra Porto Seguro ou Sompo como seguradora da proposta Mitsui Sumitomo.

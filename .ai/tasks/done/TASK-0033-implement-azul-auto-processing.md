---
id: TASK-0033
title: Implementar suporte inicial Azul AUTO
status: done
kind: implementation
lifecycle: done
area: backend
owner: codex
reviewer: human
complexity: high
risk: high
tdd_required: true
created_at: 2026-05-05
blocked_by: TASK-0032
---

# TASK-0033 - Implementar suporte inicial Azul AUTO

## Context

A `TASK-0032` passou a reconhecer PDFs Azul da familia Porto como nao processaveis para evitar que sejam roteados como Porto Seguro. As amostras da `TASK-0030` mostram que Azul compartilha grande parte do core de documento Porto, mas possui produto/headline propria e variacoes como `Azul Tradicional` e `Azul Auto Roubo`.

Azul parece ser a proxima seguradora mais segura para implementar porque a estrutura observada e muito proxima da Porto e as variacoes iniciais estao bem mapeadas.

## Objective

Adicionar suporte real a processamento AUTO Azul, sem confundir Azul com Porto Seguro e sem mascarar diferencas de produto/cobertura.

## Scope

- Decidir como representar Azul no enum/contrato de seguradoras.
- Atualizar detector para retornar Azul como seguradora suportada quando parser estiver pronto.
- Criar fixtures anonimizadas a partir das extracoes Azul existentes:
  - `auto_azul_discovery.md`
  - variantes compreensiva/completa, compreensiva/reduzida, incendio/roubo/furto quando disponiveis.
- Reaproveitar parser/prompt Porto apenas quando os testes provarem compatibilidade.
- Garantir suporte minimo para:
  - `Azul Tradicional e Protecao Combinada`;
  - `Azul Auto Roubo`;
  - cobertura compreensiva;
  - incendio/roubo/furto sem franquia tradicional quando aplicavel;
  - percentual FIPE diferente de 100% quando aparecer.
- Integrar Azul ao fluxo de processamento AUTO:
  - upload unico;
  - fila de extracao;
  - review;
  - PDF gerado;
  - link publico.
- Adicionar label/logotipo textual seguro para Azul no frontend/backend, sem depender de SVG se `TASK-0023` ainda estiver aberta.

## Out Of Scope

- Implementar Itau.
- Implementar Mitsui/Sompo.
- Resolver contrato completo de extras por seguradora.
- Adicionar comparacao comercial avancada ou score.

## Likely Files

- `apps/api/prisma/schema.prisma`
- `packages/types/src/quote.types.ts`
- `apps/api/src/modules/quotes/application/services/insurer-detector.ts`
- `apps/api/src/modules/quotes/application/services/insurer-detector.spec.ts`
- `apps/api/src/modules/quotes/jobs/extract-pdf.processor.ts`
- `apps/api/src/modules/ai/ai.service.ts`
- `apps/api/src/modules/quotes/application/services/porto-payment-parser.ts`
- `apps/api/src/modules/quotes/application/services/fixtures/**`
- `apps/dashboard/src/app/(app)/dashboard/quotes/[processId]/upload/page.tsx`
- `apps/dashboard/src/lib/**`
- `.ai/pdf-lab/output/auto_azul_discovery.md`

## TDD Requirement

Obrigatorio. Comecar por testes de detector, parser/reuse de pagamentos e extracao core Azul antes de habilitar como suportada.

## Acceptance Criteria

- [x] Azul aparece como seguradora suportada no detector somente apos parser/testes passarem.
- [x] PDF Azul Tradicional nao e processado como Porto Seguro.
- [x] PDF Azul Auto Roubo nao exige franquia/casco tradicional quando nao aplicavel.
- [x] Extracao retorna `AutoQuoteData` valido para pelo menos uma amostra reduzida e uma completa.
- [x] Pagamentos sao extraidos com confianca ou falham visivelmente em teste.
- [x] Review, PDF e link publico exibem Azul, nao Porto. QA humano abriu follow-up para FIPE, identificacao e nomes de PDF na `TASK-0036`.
- [x] Bradesco e Porto continuam passando nos testes existentes.

## Risks

- O compartilhamento de CNPJ/template Porto pode induzir regressao visual ou de label.
- `Azul Auto Roubo` pode ter semantica diferente de cobertura e franquia.
- Reaproveitar prompt/parser Porto sem testes pode gerar dados plausiveis, mas errados.

## Implementation Notes - 2026-05-04

### Mudancas implementadas

**`apps/api/prisma/schema.prisma`**
- Adicionado `AZUL` ao enum `Insurer`
- Aplicado via `prisma db push` (migração manual pendente para produção)

**`packages/types/src/quote.types.ts`**
- Adicionado `'AZUL'` ao tipo `Insurer`

**`apps/api/src/modules/quotes/application/services/insurer-detector.ts`**
- Nenhuma mudança necessária: após AZUL entrar no enum Prisma, `PRISMA_INSURERS.has('AZUL')` passa a ser true, e o path `!PRISMA_INSURERS.has(winner)` deixa de retornar `notProcessable: true` para AZUL
- Family rule e downgrade dos sinais de PORTO_SEGURO continuam funcionando

**`apps/api/src/modules/quotes/jobs/extract-pdf.processor.ts`**
- Adicionado `AZUL: 'Azul'` ao mapa `INSURER_SHORT`
- Adicionado `else if (insurer === Insurer.AZUL) parsedPayments = parsePortoPaymentTable(rawText)` no roteamento de parser determinístico

**`apps/api/src/modules/ai/ai.service.ts`**
- Adicionada função `getAzulAutoPrompt()` com instruções específicas para Azul: campo `"insurer": "Azul Seguro Auto"`, aviso de que `deductible` pode ser ausente (Azul Auto Roubo), FIPE pode ser 90%
- Adicionado roteamento `else if (product === AUTO && insurer === AZUL) prompt = getAzulAutoPrompt()`

**`apps/api/src/modules/quotes/application/services/fixtures/`**
- Criados `azul-auto-tradicional-complete.txt` e `azul-auto-roubo-complete.txt` com dados anonimizados das extrações da discovery

**`apps/api/src/modules/quotes/application/services/azul-auto-extraction.spec.ts`** (novo)
- Testes TDD para `parsePortoPaymentTable` nos fixtures Azul (Tradicional e Roubo): 8 métodos cada
- Testes de integração `parseAutoQuoteData` para Azul Tradicional (com franquia)
- Testes de integração `parseAutoQuoteData` para Azul Auto Roubo (sem `coverage.vehicle.deductible`, com `deductibles: []`)

**`apps/api/src/modules/quotes/application/services/insurer-detector.spec.ts`**
- Atualizado teste Azul Tradicional: removida assertiva `notProcessable: true`, adicionada assertiva `detectedInsurer: 'AZUL'`
- Adicionado teste explícito: "detecta AZUL como seguradora suportada com alta confiança"

**`apps/dashboard/src/app/(app)/dashboard/quotes/[processId]/upload/page.tsx`**
- Adicionado `{ value: 'AZUL', label: 'Azul Seguros' }` a `SUPPORTED_INSURERS`
- Adicionado `AZUL: 'Azul Seguros'` a `INSURER_LABEL`

### Suite de testes
- 277 testes passando, 27 suites, 0 falhas

### Decisoes de design

**Parser de pagamentos reutilizado (Porto):** Ambos os formatos de PDF Azul (Tradicional e Roubo) usam a tabela Porto Bank idêntica. O `parsePortoPaymentTable` funciona sem modificações — confirmado pelos testes de fixture.

**Prompt dedicado para Azul:** Optou-se por `getAzulAutoPrompt()` separado (não reutilizar Porto prompt) para evitar que a IA retorne `"insurer": "Porto Seguro"` e para dar instrução explícita sobre `deductible` ausente no Azul Auto Roubo.

**Migração formal pendente:** `prisma db push` foi usado em desenvolvimento. Uma migration formal `add-azul-insurer` deve ser criada antes de deploy em produção via `prisma migrate dev`.

## Completion Notes - 2026-05-05

- Migration formal criada em `apps/api/prisma/migrations/20260505000000_add_azul_insurer/migration.sql` com `ALTER TYPE "Insurer" ADD VALUE IF NOT EXISTS 'AZUL'`.
- QA humano validou upload/processamento inicial de quatro PDFs Azul: Auto Roubo/Furto e Tradicional/Compreensivo, em versoes reduzida e completa.
- Confirmacao geral dos dados e exibicao da seguradora Azul funcionaram.
- Problemas residuais foram separados na `TASK-0036`: `Valor FIPE` possivelmente recebendo franquia, franquia ausente no review quando aplicavel, identificacao insuficiente dos cards de confirmacao e nomes de PDF gerados como apenas `Azul`.
- A task fica concluida como suporte inicial Azul AUTO; os ajustes de qualidade operacional seguem na fila de QA.

## Human QA Checklist

- [ ] Subir PDF Azul Tradicional e confirmar que processa como Azul (seguradora = Azul Seguros no review).
- [ ] Subir PDF Azul Auto Roubo e confirmar que ausencias esperadas nao aparecem como erro.
- [ ] Conferir review, PDF final e link publico com nome Azul.
- [ ] Comparar premio, FIPE, franquia, RCF e pagamento contra PDF original.

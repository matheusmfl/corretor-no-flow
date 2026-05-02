---
id: TASK-0029
title: Substituir upload por seguradora por dropzone unico multi-PDF
status: done
kind: implementation
lifecycle: closed
area: dashboard
owner: claude
reviewer: codex
complexity: high
risk: high
tdd_required: false
created_at: 2026-05-01
blocked_by: TASK-0028
---

# TASK-0029 - Substituir upload por seguradora por dropzone unico multi-PDF

## Context

O corretor nao deveria escolher manualmente um slot de seguradora para cada arquivo. Esse desenho aumenta atrito e permite erro humano: PDF Porto no dropzone Bradesco, PDF Bradesco no dropzone Porto, ou futuros casos de grupo como Itau/Porto e Aliro/Allianz.

A decisao de produto e manter selecao de ramo/produto, mas remover a selecao obrigatoria de seguradora antes do upload.

## Objective

Criar uma experiencia de upload unico multi-PDF no dashboard, usando a deteccao backend da `TASK-0028` para mostrar uma etapa de revisao antes do processamento final.

## Scope

- Ler `.ai/discovery/AUTO-PDF-INSURER-DETECTION.md`.
- Substituir os cards/dropzones por seguradora por uma area unica de upload multi-PDF.
- Permitir que o corretor arraste ou selecione varios PDFs de uma vez.
- Enviar cada arquivo para deteccao backend.
- Exibir uma lista de arquivos com:
  - nome do arquivo;
  - seguradora detectada;
  - confianca;
  - sinais ou resumo explicavel quando disponivel;
  - estado de suportado, ambiguo ou nao suportado.
- Para alta confianca, permitir confirmar e processar.
- Para baixa/media confianca, permitir escolher manualmente entre candidatas suportadas antes de processar.
- Para seguradora nao suportada, bloquear processamento e permitir remover arquivo.
- Remover ou esconder a selecao previa obrigatoria de seguradoras do fluxo de criacao de processo, mantendo ramo/produto.
- Manter uma jornada simples para o caso comum: varios PDFs reconhecidos com alta confianca.

## Out Of Scope

- Criar detector no frontend.
- Implementar suporte real a Itau, Aliro ou novas seguradoras.
- Redesenhar review, PDF final ou link publico.
- Detectar ramo/produto automaticamente.
- Criar fluxo de cobranca/plano por seguradora.

## Likely Files

- `apps/dashboard/src/app/(app)/dashboard/quotes/new/page.tsx`
- `apps/dashboard/src/app/(app)/dashboard/quotes/[processId]/upload/page.tsx`
- `apps/dashboard/src/hooks/quotes/use-upload-quote.ts`
- `apps/dashboard/src/lib/api/quote-process.api.ts`
- `packages/types/src/quote.types.ts`

## TDD Requirement

Adicionar testes se houver padrao existente para componentes/hooks envolvidos. Se nao houver cobertura viavel, documentar QA manual e validar fluxo no navegador.

## Acceptance Criteria

- [x] Corretor cria processo AUTO sem escolher seguradoras obrigatoriamente.
- [x] Tela de upload mostra uma area unica multi-PDF.
- [x] Varios PDFs podem ser enviados no mesmo fluxo.
- [x] Cada arquivo mostra seguradora detectada e estado claro.
- [x] Arquivos com alta confianca podem ser confirmados/processados sem friccao extra.
- [x] Arquivos ambiguos exigem confirmacao manual antes de processar.
- [x] Arquivos nao suportados nao sao processados.
- [x] Nao existe mais caminho facil para jogar PDF de uma seguradora dentro do slot visual de outra.

## Implementation Notes

### Arquivos modificados

**Backend (aditivo — fluxo antigo preservado):**
- `packages/types/src/quote-process.types.ts` — `insurers` opcional em `CreateQuoteProcessDto`
- `packages/types/src/quote.types.ts` — `DetectInsurerResponse` exportado
- `apps/api/src/modules/quotes/application/dtos/upload-quote.dto.ts` — `insurers` com `@IsOptional()`
- `apps/api/src/modules/quotes/application/use-cases/upload-quote.use-case.ts` — `dto.insurers ?? []`
- `apps/api/src/modules/quotes/application/use-cases/upload-auto-quote.use-case.ts` — novo: cria Quote + enfileira com insurer confirmado
- `apps/api/src/modules/quotes/presentation/quote.controller.ts` — endpoint `POST /:processId/upload-auto`
- `apps/api/src/modules/quotes/quotes.module.ts` — registra `UploadAutoQuoteUseCase`

**Frontend:**
- `apps/dashboard/src/lib/api/quote-process.api.ts` — métodos `detectInsurer(file)` e `uploadAuto(processId, insurer, file)`
- `apps/dashboard/src/app/(app)/dashboard/quotes/new/page.tsx` — seleção de seguradora removida; nota informativa sobre detecção automática
- `apps/dashboard/src/app/(app)/dashboard/quotes/[processId]/upload/page.tsx` — reescrito: dropzone multi-PDF, state machine por arquivo (detecting → ready/needs_override/unsupported), processamento paralelo via `uploadAuto`

### Comportamento de erro (P1/P2 corrigidos)

- `canProcess` só habilita quando todos os entries estão em `ready` ou `done` — `unsupported` e `error` bloqueiam.
- Se qualquer `uploadAuto` falhar, `anyFailed = true` suprime a navegação para `/processing`. O arquivo fica em `error` com mensagem de retry; corretor remove e reenvia.

## Risks

- Se a revisao for pesada, o fluxo perde o ganho de simplicidade.
- Se o frontend esconder demais os sinais de deteccao, o corretor pode nao confiar no sistema.
- Mudanca no fluxo de criacao/upload pode afetar processos em andamento.

## Human QA Checklist

- [x] Criar processo AUTO e confirmar que seguradora nao e obrigatoria.
- [x] Subir Bradesco e Porto juntos.
- [x] Confirmar que ambos aparecem na lista com seguradoras corretas.
- [x] Confirmar processamento apenas apos revisao/confirmacao.
- [x] Simular arquivo ambiguo e confirmar que nao processa sem escolha manual.
- [x] Simular arquivo nao suportado e confirmar que pode remover.

## QA Findings - 2026-05-01 (Corrigidos em 2026-05-01)

QA humana encontrou 4 problemas; todos corrigidos antes do segundo ciclo de QA.

### Problema 1–3: Quotes acumulando no processo (qualquer status)

**Causa raiz**: Ao voltar para a tela de upload e enviar novos PDFs, quotes de lotes anteriores (FAILED, PROCESSING, PENDING_REVIEW, READY) continuavam ligadas ao processo e reapareciam na tela de processamento/review.

**Correção — novo endpoint `POST /:processId/reset-batch`**:
- `ResetQuoteBatchUseCase`: valida ownership, apaga todas as quotes do processo via `deleteMany`.
- `QuoteController`: expõe `POST /:processId/reset-batch` com `@HttpCode(200)`.
- Frontend: `handleProcess` chama `quoteProcessApi.resetBatch(processId)` de forma atômica antes das chamadas paralelas de `uploadAuto`. Se o reset falhar, o processamento é abortado (evita acúmulo parcial).
- Frontend: ao montar a tela, busca `quoteProcessApi.getById(processId)` e exibe banner de aviso se houver quotes existentes, com texto explicando que serão substituídas ao processar.

### Problema 4: Itaú e Mitsui rotulados como Porto Seguro

**Causa raiz**: A regra de família só disparava quando o emissor específico (Itaú/Mitsui) tinha sinal *forte*. PDFs onde o emissor aparece apenas como menção de marca (sinal médio) continuavam retornando Porto Seguro com alta confiança.

**Correção** em `insurer-detector.ts`:
- Regra de família agora dispara em sinais *médios ou fortes* (não apenas fortes).
- Adicionados padrões STRONG para Mitsui: `mitsui sumitomo seguros`, `mitsui seguros`.
- Adicionados padrões MEDIUM para Mitsui (`\bmitsui\b`) e Itaú sem S/A (`itaú seguros`).
- Adicionado MITSUI ao `FAMILY_RULES` com `groupInsurer: PORTO_SEGURO`.
- Check de non-Prisma winner generalizado: qualquer emissor não registrado (ITAU, MITSUI) retorna `detectedInsurer: null, confidence: 'medium'` com reason explicativo.
- Campo `family` propagado para todos os ramos do decision tree (não apenas o ramo de sinal forte).

### Guard de produto (saúde vs AUTO) + notProcessable

- `InsurerDetectionResult` agora tem campo `notProcessable?: boolean`.
- Detector retorna `notProcessable: true` quando: (a) emissor da família Porto/Allianz é detectado mas não está no enum Prisma (Itaú, Mitsui); (b) guard de saúde dispara (sinais de saúde sem sinais AUTO).
- `phaseFromDetection` no frontend checa `notProcessable` **primeiro**: se true → `'unsupported'` (sem select de override, sem caminho de processamento manual).
- Estado `unsupported` exibe `detection.reason` quando disponível, tornando a mensagem específica para Itaú/Mitsui/saúde em vez do genérico "ainda não suportada".

### Testes adicionados (19 → 19, suite completa 243/243)

- Itaú com sinal médio (`Itaú Seguros` sem S/A) não retorna Porto Seguro.
- Mitsui com sinal forte (`Mitsui Sumitomo`) não retorna Porto Seguro.
- Mitsui com sinal médio (`mitsui`) não retorna Porto Seguro.
- Bradesco detectado em PDF de saúde retorna `confidence: medium` com reason sobre saúde.

## Human QA Checklist (3º ciclo)

- [ ] Criar processo AUTO e confirmar que seguradora nao e obrigatoria.
- [ ] Subir Bradesco e Porto juntos — ambos reconhecidos com alta confiança, processados normalmente.
- [ ] Enviar PDF invalido como Bradesco → Quote FAILED. Voltar ao upload, enviar PDFs validos → ao clicar "Processar", lote antigo some e tela de processamento mostra apenas o novo lote.
- [ ] Subir 3 PDFs validos → processar → voltar ao upload do mesmo processo → banner de aviso aparece com contagem de quotes existentes → subir novos PDFs → ao processar, quotes antigas somem e apenas o novo lote aparece no review.
- [ ] Subir PDF de Itau — deve aparecer como bloqueado (`unsupported`) com reason explicativo, sem select de seguradora, sem caminho para processamento.
- [ ] Subir PDF de Mitsui — idem.
- [ ] Subir PDF Bradesco Saude — deve aparecer como bloqueado (`unsupported`) com reason sobre produto saude, sem caminho para processamento.
- [ ] Simular arquivo com baixa confiança (sem seguradora clara) — deve aparecer em `needs_override` com select.
- [ ] Simular arquivo nao suportado (ex: Tokio Marine) — `unsupported`, pode remover.


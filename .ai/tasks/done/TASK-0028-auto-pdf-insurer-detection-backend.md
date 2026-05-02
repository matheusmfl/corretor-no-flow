---
id: TASK-0028
title: Criar deteccao conservadora de seguradora no upload AUTO
status: done
kind: implementation
lifecycle: closed
area: api
owner: claude
reviewer: codex
complexity: high
risk: high
tdd_required: true
created_at: 2026-05-01
---

# TASK-0028 - Criar deteccao conservadora de seguradora no upload AUTO

## Context

O fluxo atual associa cada upload a uma `quote` ja criada para uma seguradora. Se o corretor enviar um PDF Porto no slot Bradesco, o backend processa o arquivo usando a seguradora errada.

A direcao de produto definida em `.ai/discovery/AUTO-PDF-INSURER-DETECTION.md` e remover a selecao obrigatoria de seguradora antes do upload e detectar a seguradora emissora/cotada a partir do PDF.

## Objective

Criar uma camada backend de deteccao conservadora de seguradora para PDFs AUTO, capaz de identificar Bradesco e Porto Seguro inicialmente, e preparada para regras manuais por familia como Itau/Porto e Aliro/Allianz.

## Scope

- Ler `.ai/discovery/AUTO-PDF-INSURER-DETECTION.md`.
- Criar servico/helper deterministico de deteccao de seguradora a partir do texto extraido do PDF.
- Classificar sinais como fortes, medios e fracos.
- Retornar `detectedInsurer`, `confidence`, `candidates`, `signals`, `family` e `reason` quando aplicavel.
- Garantir que mencoes fracas de grupo nao decidam seguradora.
- Implementar regras iniciais para:
  - Bradesco sem conflito;
  - Porto Seguro sem conflito;
  - Itau vencendo Porto quando Itau aparece como sinal forte;
  - Aliro vencendo Allianz quando Aliro aparece como sinal forte.
- Criar endpoint ou ajustar fluxo de upload para permitir:
  - receber PDF sem `quoteId` pre-definido por seguradora;
  - detectar a seguradora;
  - criar/associar a quote correta apenas depois da deteccao confiavel ou confirmada.
- Bloquear processamento final quando a confianca for baixa ou a seguradora nao for suportada.
- Preservar compatibilidade com o processamento assincrono existente.

## Out Of Scope

- Redesenhar frontend.
- Detectar ramo/produto automaticamente.
- Implementar parsers para Itau, Aliro ou outras seguradoras ainda nao suportadas.
- Usar IA pesada para classificar seguradora quando regras deterministicas bastarem.
- Resolver todas as familias de seguradoras do mercado.

## Likely Files

- `apps/api/src/modules/quotes/presentation/quote.controller.ts`
- `apps/api/src/modules/quotes/application/use-cases/upload-quote.use-case.ts`
- `apps/api/src/modules/quotes/application/use-cases/submit-quote-for-processing.use-case.ts`
- `apps/api/src/modules/quotes/jobs/extract-pdf.processor.ts`
- `apps/api/src/modules/quotes/application/services/**`
- `apps/api/src/modules/quotes/application/dtos/**`
- `packages/types/src/quote.types.ts`

## TDD Requirement

Backend task. Comecar por testes antes da implementacao cobrindo:

- Bradesco detectado com confianca alta;
- Porto Seguro detectado com confianca alta;
- texto contendo Porto e Itau retorna Itau quando Itau tem sinal forte;
- texto contendo Allianz e Aliro retorna Aliro quando Aliro tem sinal forte;
- texto contendo apenas marca de grupo como sinal fraco nao decide seguradora;
- caso ambiguo retorna baixa confianca e nao enfileira processamento final;
- seguradora nao suportada retorna erro/estado controlado.

## Acceptance Criteria

- [x] Backend possui detector deterministico e testado de seguradora AUTO.
- [x] Detector retorna sinais explicaveis para UI/review.
- [x] Mencao de grupo/template nao vence seguradora especifica.
- [x] PDF ambiguo nao e processado com parser errado.
- [x] Upload sem seguradora pre-selecionada consegue chegar a uma quote correta quando a deteccao e confiavel.
- [x] Fluxo antigo nao quebra enquanto o frontend novo nao estiver pronto, ou ha uma estrategia explicita de migracao.
- [x] Tests pass.

## Implementation Notes

### Arquivos criados

- `apps/api/src/modules/quotes/application/services/insurer-detector.ts` — função pura `detectInsurerFromText(text)`, zero dependências externas, zero IA.
- `apps/api/src/modules/quotes/application/services/insurer-detector.spec.ts` — 13 testes TDD (RED→GREEN): alta confiança Bradesco/Porto/Tokio, família Porto (Itaú suprime Porto), família Allianz (Aliro suprime Allianz), sinal fraco, ambíguo sem família, texto sem padrões, estrutura de signals/candidates.
- `apps/api/src/modules/quotes/application/use-cases/detect-insurer.use-case.ts` — use case que extrai texto do PDF via `PdfExtractorService` e retorna `DetectInsurerResponse` com campo `supported: boolean` (atualmente BRADESCO e PORTO_SEGURO).
- `packages/types/src/quote.types.ts` — tipos `InsurerDetectionSignal` e `InsurerDetectionResult` exportados no pacote compartilhado.

### Endpoint

`POST /quotes/detect-insurer` (auth obrigatória, multipart/form-data, campo `file`).

Retorna:
```json
{
  "detectedInsurer": "BRADESCO" | "PORTO_SEGURO" | null,
  "confidence": "high" | "medium" | "low",
  "family": "porto" | "allianz" | undefined,
  "candidates": ["BRADESCO"],
  "signals": [{ "insurer": "BRADESCO", "type": "strong", "source": "razao_social", "value": "BRADESCO SEGUROS S/A" }],
  "supported": true,
  "reason": "..." | undefined
}
```

### Estratégia de migração

O fluxo antigo (`POST /quotes` + `POST /quotes/:id/quotes/:quoteId/upload`) não foi alterado. O novo endpoint é aditivo — o frontend novo (TASK-0029) pode usá-lo antes de criar o processo, enquanto o fluxo existente continua funcionando.

### Comportamento seguro

- `high + supported: true` → frontend pode criar processo/quote automaticamente.
- `high + supported: false` → insurer detectado mas sem parser (ex: TOKIO_MARINE). Bloquear processamento, informar corretor.
- `medium` → mostrar pré-selecionado, pedir confirmação antes de processar.
- `low` ou `null` → bloquear, pedir ao corretor que identifique a seguradora ou remova o arquivo.

## Risks

- Regras ingenuas por substring podem classificar errado PDFs de grupos como Porto/Itau e Allianz/Aliro.
- Alterar o fluxo de quote antes do frontend estar pronto pode quebrar a jornada atual.
- Criar quotes duplicadas para o mesmo PDF se o upload for repetido sem controle.

## Failure Scenario

O corretor sobe um PDF Itau que menciona Porto, o sistema detecta Porto por substring, processa com parser errado e publica uma cotacao com dados inconsistentes.

## Human QA Checklist

- [ ] Subir PDF Bradesco e confirmar deteccao correta.
- [ ] Subir PDF Porto e confirmar deteccao correta.
- [ ] Testar texto/PDF com sinais de Porto e Itau e confirmar que Itau vence quando for o emissor.
- [ ] Testar texto/PDF com sinais de Allianz e Aliro e confirmar que Aliro vence quando for o emissor.
- [ ] Confirmar que PDF ambiguo fica bloqueado para confirmacao, nao processado automaticamente.

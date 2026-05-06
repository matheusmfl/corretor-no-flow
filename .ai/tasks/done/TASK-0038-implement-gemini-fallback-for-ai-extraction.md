---
id: TASK-0038
title: Implementar fallback Gemini para extracao IA quando Groq limitar quota
status: done
kind: implementation
lifecycle: done
area: backend
owner: codex
reviewer: human
complexity: medium
risk: high
tdd_required: true
created_at: 2026-05-05
blocked_by: TASK-0035
---

# TASK-0038 - Implementar fallback Gemini para extracao IA quando Groq limitar quota

## Context

Durante QA dos PDFs Itau AUTO, multiplas cotacoes falharam com `429 rate_limit_exceeded` da Groq:

- modelo: `llama-3.3-70b-versatile`;
- limite observado: `tokens per day (TPD)`;
- uso observado: `Used 97952`, `Requested 4067`, `Limit 100000`;
- consequencia atual: `ExtractPdfProcessor` marca a cotacao como `FAILED`, mesmo quando o problema e apenas quota temporaria do provedor.

O projeto ja depende de `@google/generative-ai`, mas o backend hoje injeta apenas `GROQ_CLIENT` e exige `GROQ_API_KEY`.

## Objective

Adicionar suporte a Gemini como fallback de extracao/correcao IA para reduzir bloqueio de desenvolvimento e QA quando Groq atingir rate limit/quota diaria.

## Scope

- Adicionar configuracao de ambiente para Gemini sem commitar segredo real:
  - sugerido: `GEMINI_API_KEY`;
  - atualizar `apps/api/.env.example`.
- Criar provider Gemini no modulo de IA usando dependencia ja instalada (`@google/generative-ai`), se aplicavel.
- Refatorar `AiService` para:
  - manter Groq como provedor primario por padrao;
  - detectar erro Groq `429`/`rate_limit_exceeded`;
  - tentar Gemini como fallback quando configurado;
  - logar provedor usado, sem logar prompts nem chaves.
- Manter mesmo contrato de retorno: `Record<string, unknown>` parseado de JSON.
- Garantir que fallback funcione tanto em `extractQuoteData` quanto em `correctExtractedData`.
- Se Gemini tambem falhar ou nao estiver configurado, preservar erro claro para o job.
- Evitar chamadas reais de rede em testes.

## Out Of Scope

- Trocar Groq por Gemini como provedor unico.
- Implementar UI de escolha de provedor.
- Persistir custo/tokens por provedor no banco.
- Resolver retry/backoff de fila para todos os provedores.
- Committar chaves reais em `.env`.

## Likely Files

- `apps/api/src/modules/ai/ai.module.ts`
- `apps/api/src/modules/ai/ai.service.ts`
- `apps/api/src/modules/ai/ai.constants.ts`
- `apps/api/src/modules/ai/*.spec.ts`
- `apps/api/.env.example`
- `apps/api/src/modules/quotes/jobs/extract-pdf.processor.ts`
- `.ai/tasks/todo/TASK-0039-handle-ai-rate-limit-retry-later.md` (criar se o retry/backoff ficar fora desta task)

## Executor Context Pack

Do not use broad Explore/subagent/codebase-map workflows before reading these files.

Read these files first, in order:

1. `apps/api/src/modules/ai/ai.module.ts`
2. `apps/api/src/modules/ai/ai.service.ts`
3. `apps/api/src/modules/ai/ai.constants.ts`
4. `apps/api/src/modules/quotes/jobs/extract-pdf.processor.ts`
5. `apps/api/package.json`
6. `apps/api/.env.example`

Use `rg` only for these terms before opening more files:

- `GROQ_CLIENT`
- `GROQ_API_KEY`
- `GoogleGenerativeAI`
- `@google/generative-ai`
- `rate_limit_exceeded`
- `429`
- `callGroq`
- `extractQuoteData`
- `correctExtractedData`

If more than 6 additional files seem necessary, stop and explain why before continuing.

## TDD Requirement

Obrigatorio. Comecar por testes unitarios do `AiService`/provider:

- Groq sucesso: nao chama Gemini.
- Groq `429 rate_limit_exceeded` + Gemini configurado: chama Gemini e retorna JSON.
- Groq erro nao-rate-limit: nao mascara automaticamente como sucesso Gemini, salvo decisao documentada.
- Gemini retorna markdown fenced JSON: parser limpa e valida.
- Gemini nao configurado: erro claro informa ausencia de fallback configurado.

## Acceptance Criteria

- [x] `apps/api/.env.example` documenta `GEMINI_API_KEY` sem valor real.
- [x] Backend inicializa sem Gemini configurado e continua usando Groq.
- [x] Quando Groq retorna `429`/quota, Gemini e usado como fallback se `GEMINI_API_KEY` existir.
- [x] Logs indicam `provider=groq` ou `provider=gemini` e `fallback=true/false`.
- [x] Testes cobrem sucesso Groq, fallback Gemini e ausencia de Gemini.
- [x] QA humano consegue reprocessar 1 PDF Itau apos reset/sem quota Groq usando fallback Gemini.

## Risks

- Gemini pode retornar JSON com pequenas diferencas de formato; `parseAutoQuoteData` e correcao precisam continuar protegendo o contrato.
- Usar fallback sem marcar provedor pode dificultar diagnostico de qualidade.
- Se fallback for acionado para qualquer erro, pode mascarar bug real de prompt ou parsing.
- Free tier Gemini pode ter limites proprios de RPM/TPM/RPD e nao deve ser tratado como garantia de producao.

## Human QA Checklist

- [x] Configurar `GEMINI_API_KEY` localmente em `apps/api/.env`.
- [x] Forcar/mockar Groq 429 ou consumir fluxo com Groq sem quota.
- [x] Subir 1 PDF Itau Tradicional reduzido.
- [x] Confirmar nos logs que Gemini foi usado como fallback.
- [x] Confirmar que cotacao vai para review em vez de `FAILED`.
- [x] Repetir com 1 PDF Itau Assistencia 24h e verificar ausencia de casco fantasma.

## Implementation notes (ready for review)

- **Arquivos**: `ai.constants.ts` (token `GEMINI_CLIENT`), `ai.module.ts` (provider `GoogleGenerativeAI | null`), `ai.service.ts` (`isGroqRateLimitExceeded`, `completeJsonFromMessages` com Groq primario e Gemini em 429), `ai.service.spec.ts` (12 testes, sem rede), `apps/api/.env.example` (`GEMINI_API_KEY`, `GEMINI_MODEL` opcional).
- **Comportamento**: fallback apenas para rate limit Groq (429 / `rate_limit_exceeded`); outros erros Groq nao disparam Gemini. Sem `GEMINI_API_KEY` no 429: `InternalServerErrorException` com mensagem pedindo a variavel.
- **Testes**: `npx jest src/modules/ai/ai.service.spec.ts --no-cache` — 12 passed (2026-05-05).
- **Segredos**: nenhuma chave real em repo ou na task.
- **extract-pdf.processor.ts**: sem alteracao; fluxo passa pelo `AiService`.

## Done notes

Task encerrada em 2026-05-05 por decisao humana.

- Teste automatizado validado localmente: `node ..\..\node_modules\jest\bin\jest.js src/modules/ai/ai.service.spec.ts --no-cache --runInBand` (12 passed).
- QA real com 429 Groq nao foi reproduzido porque a quota Groq voltou antes do teste manual; o caminho de fallback ficou coberto por teste unitario sem rede.
- `GEMINI_API_KEY` foi configurada localmente em `apps/api/.env`; nenhuma chave real foi adicionada ao exemplo.

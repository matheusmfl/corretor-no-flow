---
id: TASK-0029
title: Substituir upload por seguradora por dropzone unico multi-PDF
status: todo
kind: implementation
lifecycle: open
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

- [ ] Corretor cria processo AUTO sem escolher seguradoras obrigatoriamente.
- [ ] Tela de upload mostra uma area unica multi-PDF.
- [ ] Varios PDFs podem ser enviados no mesmo fluxo.
- [ ] Cada arquivo mostra seguradora detectada e estado claro.
- [ ] Arquivos com alta confianca podem ser confirmados/processados sem friccao extra.
- [ ] Arquivos ambiguos exigem confirmacao manual antes de processar.
- [ ] Arquivos nao suportados nao sao processados.
- [ ] Nao existe mais caminho facil para jogar PDF de uma seguradora dentro do slot visual de outra.

## Risks

- Se a revisao for pesada, o fluxo perde o ganho de simplicidade.
- Se o frontend esconder demais os sinais de deteccao, o corretor pode nao confiar no sistema.
- Mudanca no fluxo de criacao/upload pode afetar processos em andamento.

## Failure Scenario

O corretor sobe tres PDFs, dois sao reconhecidos e um fica ambiguo, mas a tela permite seguir mesmo assim. O processo publica uma cotacao incompleta ou com seguradora errada.

## Human QA Checklist

- [ ] Criar processo AUTO e confirmar que seguradora nao e obrigatoria.
- [ ] Subir Bradesco e Porto juntos.
- [ ] Confirmar que ambos aparecem na lista com seguradoras corretas.
- [ ] Confirmar processamento apenas apos revisao/confirmacao.
- [ ] Simular arquivo ambiguo e confirmar que nao processa sem escolha manual.
- [ ] Simular arquivo nao suportado e confirmar que pode remover.


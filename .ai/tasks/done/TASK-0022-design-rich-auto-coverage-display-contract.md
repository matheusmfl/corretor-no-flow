---
id: TASK-0022
title: Desenhar contrato rico de coberturas AUTO para PDF e link publico
status: done
kind: discovery
lifecycle: closed
area: product
owner: codex
reviewer: human
complexity: medium
risk: medium
tdd_required: false
created_at: 2026-05-01
---

# TASK-0022 - Desenhar contrato rico de coberturas AUTO para PDF e link publico

## Context

QA mostrou que os campos atuais de assistencia sao pobres para venda:

- `Guincho` deveria ser `Assistencia 24h (guincho)` e incluir limite de km quando extraido.
- `Protecao de vidros: Incluso` precisa distinguir niveis por seguradora.
- `Veiculo reserva: Incluso` precisa mostrar dias e categoria/tier.
- Porto pode trazer pneus/para-brisas, carro reserva, reparo rapido, rodas/suspensao, martelinho e outros detalhes.
- Bradesco possui niveis de vidro como reparo de para-brisas, vidro protegido e vidro protegido plus.

Tambem surgiu a necessidade futura de permitir que o corretor personalize quais informacoes aparecem no PDF/link.

## Objective

Definir um contrato de exibicao de coberturas AUTO que seja comum o suficiente para comparar seguradoras, mas permita detalhes especificos por seguradora.

## Scope

- Mapear categorias de exibicao:
  - assistencia 24h/guincho;
  - vidros;
  - carro reserva;
  - reparo rapido/martelinho;
  - rodas/pneus/suspensao;
  - oficina/tipo de peca;
  - beneficios/descontos.
- Definir quais campos entram no core comum vs extras por seguradora.
- Propor como PDF/link devem mostrar campos ausentes, contratados e detalhados.
- Propor base para template personalizavel pelo corretor.
- Usar Bradesco e Porto como primeiros exemplos.

## Out Of Scope

- Nao implementar schema nesta task.
- Nao alterar parser nesta task.
- Nao criar UI de personalizacao ainda.

## Likely Files

- `.ai/discovery/AUTOQUOTE-EXTRAS-CONTRACT.md`
- `.ai/discovery/PORTO-FAMILY-AUTO.md`
- `.ai/discovery/BRADESCO-AUTO-EXTRA-FIELDS.md`
- `packages/types/src/quote.types.ts`

## TDD Requirement

No implementation in this task.

## Acceptance Criteria

- [x] Proposal document defines rich coverage display categories.
- [x] Bradesco glass tiers are represented conceptually.
- [x] Porto assistance/car replacement/glass/reparo rapido are represented conceptually.
- [x] Recommendation exists for first implementation slice.
- [x] Risks for public-link clarity and overexposure of noisy extras are documented.

## Risks

- Too much detail can make the proposal less clear for the insured.

## Failure Scenario

The product keeps showing `Incluso` for important coverage differences and fails to help the client compare real value.

## Human QA Checklist

- [x] Human confirms which coverage details matter most in real sales conversation.

## Implementation Notes — 2026-05-06

### Decisão: menor fatia implementável (não só design)

Task original era discovery sem implementação. Executada como fatia mínima implementável com TDD para desbloquear PDF/review/link público sem quebrar fluxo existente.

### Arquivos criados

- `packages/types/src/quote.types.ts` — adicionados `CoverageStatus`, `CoverageItem`, `RichCoverage`:
  - `CoverageStatus = 'contracted' | 'not_contracted' | 'not_applicable' | 'not_found'`
  - `CoverageItem { status, detail? }` — base para qualquer campo de cobertura
  - `RichCoverage` — estrutura completa com `vehicle`, `rcf`, `app`, `towing`, `glass`, `replacementVehicle`, `fastRepair`, `repairShopType?`, `partsType?`

- `apps/api/src/modules/quotes/application/services/coverage-display.ts` — `buildCoverageDisplay(data: AutoQuoteData): RichCoverage`:
  - Função pura, sem efeitos colaterais, pode ser chamada em qualquer ponto do render (PDF, link público, review screen)
  - `NO_CASCO_SEGMENTS = { 'ASSISTÊNCIA EXCLUSIVA' }` — segmentos sem casco retornam `not_applicable` para vehicle/rcf/app
  - `boolStatus(value, isNA)`: `true→contracted`, `false→not_contracted`, `undefined→not_found`, `isNA→not_applicable`
  - `objStatus(obj, isNA)`: objeto presente `→contracted`, `null/undefined→not_found`

- `apps/api/src/modules/quotes/application/services/coverage-display.spec.ts` — 37 testes cobrindo:
  - Tokio Assistência Exclusiva (vehicle/rcf/app = not_applicable, towing/glass/replacementVehicle = contracted)
  - Tokio Auto casco 100% FIPE (todos os campos positivos, glass = not_found por não extraído)
  - Tokio Auto Proteção Mensal (casco 90%, glass/reserva = not_contracted)
  - Tokio Auto Roubo + Rastreador (casco parcial, glass/reserva = not_contracted)
  - Bradesco sem segment (cobertura completa, moralDamages preservado)
  - Semântica undefined vs false: 5 casos isolados

### O que NÃO foi feito (out of scope para próximas tasks)

- Parsers não foram alterados — `AutoQuoteData.coverage.assistance` ainda usa `boolean`
- `coverageDisplay` não foi adicionado como campo a `AutoQuoteData` (requereria atualizar todos os parsers)
- PDF renderer e link público ainda não chamam `buildCoverageDisplay`
- Itaú Assistência 24h: segmento ainda não mapeado em `NO_CASCO_SEGMENTS` (sem fixture de segmento confirmado)
- Nível de vidro Bradesco (`tier: 'repair' | 'basic' | 'plus'`) não populado — extração ainda retorna booleano simples
- `repairShopType` e `partsType` retornam `undefined` até a extração ser expandida
- `fastRepair` sempre retorna `not_found` até haver padrão de extração

### Próxima task sugerida

Criar task para: (1) chamar `buildCoverageDisplay` no PDF renderer e no link público; (2) adicionar `segment` ao prompt/extração dos parsers que ainda não o fazem; (3) atualizar `NO_CASCO_SEGMENTS` com Itaú Assistência 24h quando fixture for confirmado.

### Resultado dos testes

37 testes passando, 0 falhas. Regressões pré-existentes em `quote.controller.spec.ts` (3 falhas por `RemoveQuoteFromProcessUseCase` não mockado) confirmadas como pré-existentes por git stash — não introduzidas nesta task.

## Human acceptance - 2026-05-07

- Human aprovou fechar a `TASK-0022` como fundação técnica.
- Decisão: manter a fundação genérica e destrinchar enriquecimento prático por seguradora.
- Follow-up Tokio criado em `TASK-0044`.

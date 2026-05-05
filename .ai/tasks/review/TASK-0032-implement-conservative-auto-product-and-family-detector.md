---
id: TASK-0032
title: Implementar detector conservador de produto AUTO e familia Porto
status: review
kind: implementation
lifecycle: review
area: backend
owner: codex
reviewer: human
complexity: medium
risk: high
tdd_required: true
created_at: 2026-05-04
blocked_by: TASK-0031
---

# TASK-0032 - Implementar detector conservador de produto AUTO e familia Porto

## Context

A `TASK-0031` consolidou que PDFs da familia Porto compartilham template, CNPJ, Porto Bank, textos legais e links de grupo. Por isso, `PORTO_SEGURO` nao pode ser decidido por esses sinais quando o produto/headline indica Azul, Itau ou Mitsui Sumitomo/Sompo.

Tambem ficou claro que processo `AUTO` precisa bloquear PDFs de outro ramo, como Saude, antes de enfileirar parser AUTO.

## Objective

Evoluir o detector backend para classificar seguradora e produto/ramo de forma conservadora antes do processamento final.

## Scope

- Adicionar testes cobrindo amostras/sinais da familia Porto:
  - Porto Seguro continua detectado como suportado quando headline/produto aponta Porto.
  - Azul nao vira Porto; deve retornar reconhecido mas nao processavel enquanto nao houver parser.
  - Itau nao vira Porto; deve retornar reconhecido mas nao processavel enquanto nao houver parser.
  - Mitsui Sumitomo/Sompo nao vira Porto; deve retornar reconhecido mas nao processavel enquanto nao houver parser.
- Adicionar testes para guard de produto:
  - AUTO forte + seguradora suportada pode seguir.
  - Saude forte em processo AUTO retorna `notProcessable`.
  - Sem sinal AUTO suficiente retorna baixa/media confianca e exige confirmacao.
- Atualizar contrato de resposta, se necessario, com campos como:
  - `detectedProduct?: InsuranceProduct | null`
  - `productConfidence?: 'high' | 'medium' | 'low'`
  - `commercialProduct?: string`
  - `notProcessable?: boolean`
  - `reason?: string`
- Atualizar frontend somente se o contrato mudar e precisar exibir motivo/label novo.
- Usar fixtures de texto anonimizadas ou trechos sinteticos derivados das discoveries; nao commitar PDFs brutos.

## Out Of Scope

- Implementar parser Azul, Itau, Mitsui/Sompo.
- Adicionar novas seguradoras como suportadas no fluxo de processamento.
- Processar Saude.
- Resolver a estrutura completa de `coverageSemantics` em review/public link.

## Likely Files

- `apps/api/src/modules/quotes/application/services/insurer-detector.ts`
- `apps/api/src/modules/quotes/application/services/insurer-detector.spec.ts`
- `packages/types/src/quote.types.ts`
- `apps/dashboard/src/app/(app)/dashboard/quotes/[processId]/upload/page.tsx`
- `.ai/discovery/AUTO-PDF-INSURER-DETECTION.md`
- `.ai/discovery/PORTO-FAMILY-AUTO.md`

## TDD Requirement

Obrigatorio. Comecar por testes do detector antes de alterar regras.

## Acceptance Criteria

- [x] Testes provam que Itau, Azul e Mitsui/Sompo nao sao roteados como Porto Seguro.
- [x] Testes provam que PDF Saude detectado em processo AUTO fica bloqueado.
- [x] Resultado do detector explica seguradora, familia, produto/ramo e motivo de bloqueio.
- [x] Seguradoras reconhecidas mas nao suportadas aparecem como nao processaveis, nao como erro generico.
- [x] Frontend mostra mensagem clara quando arquivo e reconhecido mas nao suportado ou nao AUTO.
- [x] Nenhum PDF bruto sensivel e commitado.

## Implementation Notes - 2026-05-04

### Mudancas implementadas

**`packages/types/src/quote.types.ts`**
- Re-exporta `InsuranceProduct` de `company.types.ts` via `export type { InsuranceProduct } from './company.types'` em vez de redeclarar — evita conflito de export duplicado no barrel `index.ts`
- Adicionados campos `detectedProduct?: InsuranceProduct | null` e `productConfidence?: 'high' | 'medium' | 'low'` em `InsurerDetectionResult`

**`apps/api/src/modules/quotes/application/services/insurer-detector.ts`**
- Adicionados strong patterns para AZUL: `azul tradicional`, `azul auto roubo`, `azul seguro auto`, `azul compacto`
- Adicionado medium pattern para AZUL: `\bazul seguros?\b`
- Adicionada family rule: `{ family: 'porto', specificInsurer: 'AZUL', groupInsurer: 'PORTO_SEGURO' }`
- Expandidos patterns ITAU: `ita[ú] (?:seguro )?auto`, `ita[ú] (?:tradicional|compacto)`, `ita[ú] assist[eê]ncia`
- Adicionados sinais AUTO: `or[cç]amento de seguro auto`, `\bplaca\b`, `\bchassi\b`, `\bfipe\b`, `\brcf[-\s]?v?\b`
- Adicionada funcao `computeProductDetection` que retorna `detectedProduct` e `productConfidence` com base em contagem de sinais AUTO/HEALTH
- Todos os pontos de retorno passam agora `...productProp` com os novos campos
- Label `AZUL` adicionado ao mapa interno de labels para seguradoras nao processaveis

**`apps/api/src/modules/quotes/application/services/insurer-detector.spec.ts`**
- Novos testes: Azul Tradicional nao vira Porto, Azul Auto Roubo nao vira Porto, sinais Porto downgraded para weak, Itau Compacto nao vira Porto, Itau Assistencia nao vira Porto, `detectedProduct AUTO` com alta confianca, `detectedProduct HEALTH`, `detectedProduct AUTO` para Porto valido, `detectedProduct null` para texto sem sinais, `detectedProduct HEALTH` no teste Bradesco Saude
- Fix attempt P1 (medium notProcessable): adicionada assertiva `notProcessable: true` para testes de Itau medium e Mitsui medium; adicionado novo teste `bloqueia PDF de saude mesmo com mencao isolada de seguro auto`

### Fix attempt - 2026-05-04 (review findings P1/P2)

Correcoes aplicadas em resposta ao review do Codex:

**P1 — Export duplicado de InsuranceProduct**
- `quote.types.ts` declarava `InsuranceProduct = 'AUTO' | 'HEALTH'` localmente; corrigido para re-exportar de `company.types.ts` que ja possui o tipo completo do dominio

**P1 — Sinais medios de seguradora nao suportada nao bloqueavam (notProcessable ausente)**
- Bloco `mediumInsurerSet.size === 1` so tratava o caminho Prisma; adicionado branch `!PRISMA_INSURERS.has(winner)` que retorna `notProcessable: true` e `confidence: 'low'` para ITAU/MITSUI/AZUL detectados apenas por sinal medio
- Testes de PORTO_ITAU_MEDIUM e PORTO_MITSUI_MEDIUM agora assertam `notProcessable: true`

**P2 — Guard de saude perdia prioridade com qualquer sinal AUTO**
- `computeProductDetection` alterada: `healthMatches >= 2` retorna HEALTH independente de autoMatches (evidencia forte domina ruido); `healthMatches === 1 && autoMatches === 0` retorna HEALTH com confianca media; caso contrario AUTO ou null como antes
- Novo teste `HEALTH_WITH_AUTO_NOISE_TEXT`: PDF de saude com "seguro auto" em rodapé ainda bloqueia como notProcessable

### Suite de testes
- 253 testes passando, 26 suites, 0 falhas

### Frontend
- Nao requer mudancas: a pagina de upload ja exibe `detection.reason` no estado `unsupported`, cobrindo Azul/Itau/Mitsui com mensagem como "Azul Seguros detectado como emissor mas nao registrado como seguradora processavel"

### Decisao mantida: commercialProduct nao implementado
- O campo `commercialProduct` foi avaliado mas nao e necessario para os criterios de aceitacao atuais. A extracao do nome do produto comercial requer parsing de texto mais complexo e pode ser task separada quando necessario para review/public-link

## Risks

- Regras muito agressivas podem bloquear Porto valido.
- Regras muito permissivas podem processar Itau/Azul/Mitsui como Porto.
- Produto comercial e cobertura principal ainda nao estao modelados no contrato final.

## Human QA Checklist

- [ ] Validar mensagem exibida para Itau/Azul/Mitsui/Sompo reconhecidos mas nao suportados.
- [ ] Validar mensagem exibida para PDF nao AUTO em fluxo AUTO.
- [ ] Confirmar se Mitsui Sumitomo deve aparecer no texto do produto como Mitsui, Sompo ou Mitsui/Sompo.

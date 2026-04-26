# Corretor no Flow — Plano de Execução

## Fases

### Fase 1 — Schema e contratos de tipos
Redesenhar o Prisma schema para suportar processos, cotações com nome editável, planos/assinaturas e schema de comparação por ramo. Atualizar `@corretor/types` para refletir os novos contratos. Rodar a migration. Nada de código de feature ainda — só a fundação de dados.

### Fase 2 — Módulo de processos (backend)
CRUD de processos de cotação: criar processo (ramo + seguradoras), listar, buscar, cancelar. Sem upload de PDF ainda — só o processo em si com TDD.

### Fase 3 — Upload e fila de processamento (backend)
Endpoint de upload de PDF por cotação dentro de um processo. Job assíncrono que extrai o texto com pdfjs, chama Claude API, valida o JSON extraído contra o schema do ramo, gera o nome automático da cotação. Com TDD nos casos críticos.

### Fase 4 — Interface de criação de processo (frontend)
A tela nova de "Nova cotação": seleção de ramo, seleção de seguradoras, os cards com drag-and-drop no desktop e tap-to-upload no mobile, acompanhamento de status em tempo real.

### Fase 5 — Revisão e geração (backend + frontend)
Tela de revisão dos dados extraídos, edição de campos e do nome da cotação, geração do PDF individual por seguradora via Puppeteer, geração do link público.

### Fase 6 — Comparação e link público (backend + frontend)
Motor de comparação modular por ramo, página pública mobile-first do segurado com ranking, tracking de abertura, notificação pro corretor.

### Fase 7 — Planos e permissões
Entidade Plan/Subscription, guards de permissão nos uploads, contador mensal, tela de planos no dashboard.

---

## Fase 1 — Detalhamento

### Bloco 1.1 — Redesenho do schema Prisma

**Objetivo:** modelar as entidades novas sem quebrar o que já existe.

**Entidades a criar ou modificar:**

`QuoteProcess` — o agrupador de cotações
- id, companyId, product (ramo), status, name (opcional, editável), publicToken, expiresAt, openedAt, createdAt, updatedAt
- status: DRAFT | PROCESSING | PENDING_REVIEW | READY | PUBLISHED | ARCHIVED

`Quote` — cotação individual dentro de um processo (redesenho completo)
- id, processId, insurer (enum), name (gerado + editável), nameSlug (único por processo), status, extractedData (Json), originalFileKey, createdAt, updatedAt
- status: PENDING | PROCESSING | PENDING_REVIEW | READY | FAILED

`Insurer` — enum das seguradoras
- BRADESCO | PORTO_SEGURO | TOKIO_MARINE | SULAMERICA | SUHAI | ALIRO | ALLIANZ | YELLOW

`ComparisonSchema` — schema de comparação por ramo (tabela de configuração)
- id, product (ramo), fields (Json — array de campos com tipo de comparação), createdAt, updatedAt

`Plan` — planos disponíveis
- id, name, quotesPerMonth, products (Json), insurers (Json), features (Json), createdAt, updatedAt

`Subscription` — assinatura da empresa
- id, companyId, planId, status, currentPeriodStart, currentPeriodEnd, quotesUsedThisMonth, createdAt, updatedAt

**Modificações no schema atual:**
- `Quote` atual vira `QuoteProcess` — migração com rename
- Criar nova `Quote` vinculada a `QuoteProcess`
- `Company` ganha relação com `Subscription`

### Bloco 1.2 — Migration e seed

**Objetivo:** aplicar o novo schema sem perder dados existentes (em dev, pode resetar).

- Escrever a migration com `prisma migrate dev`
- Criar seed com: 1 ComparisonSchema para AUTO, 1 ComparisonSchema para SAÚDE, 2 Plans (Free e Profissional)

### Bloco 1.3 — Atualizar `@corretor/types`

**Objetivo:** os contratos TypeScript refletirem o novo schema antes de qualquer código de feature.

- Criar `quote-process.types.ts` com `QuoteProcess`, `CreateQuoteProcessDto`, `QuoteProcessStatus`
- Reescrever `quote.types.ts` com `Quote`, `QuoteStatus`, `Insurer`
- Criar `plan.types.ts` com `Plan`, `Subscription`
- Criar `comparison.types.ts` com `ComparisonSchema`, `ComparisonField`, `FieldComparisonType`
- Atualizar `index.ts`

### Bloco 1.4 — Atualizar DTOs da API

**Objetivo:** os DTOs do NestJS implementarem os novos tipos via `implements`.

- Reescrever DTOs do módulo `quotes` para apontar para `QuoteProcess`
- Criar DTOs base para `Quote` individual
- Garantir que tudo compila sem erros

---

## Fases 2–7

*A detalhar após conclusão da Fase 1.*

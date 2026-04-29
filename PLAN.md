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

## Status das fases

| Fase | Status |
|------|--------|
| Fase 1 — Schema e tipos | ✅ Concluído |
| Fase 2 — Módulo de processos | ✅ Concluído |
| Fase 3 — Upload e fila | ✅ Concluído |
| Fase 4 — Interface de criação | ✅ Concluído |
| Fase 5 — Revisão e geração | ✅ Concluído |
| Fase 6 — Comparação e link público | ⏸ Adiado (ver abaixo) |
| Fase 7 — Planos e permissões | ⏸ Adiado (ver abaixo) |

---

## Próximo foco — Fase 2.0 (qualidade e modelo de dados)

### 🔧 Bug: nome do veículo no filename do PDF gerado

**Problema:** a função `buildQuotePdfFilename` usa o nome completo do veículo extraído (ex: `Jeep Compass Turbo 4x4 Diesel`), resultando em filename `Bradesco_Turbo_reduzida` (pega só o último token).  
**Correção:** truncar para Marca + Modelo (primeiras duas palavras), ex: `Bradesco_Jeep_Compass_Reduzida`.

---

### 🔧 Agrupamento e enriquecimento das cotações

**Contexto:** corretores frequentemente cotam a mesma seguradora com 2 franquias diferentes (mesmas coberturas, dedutiveis distintos). O sistema hoje trata cada PDF como cotação independente, quebrando a comparação para o cliente.

**Campos a garantir na extração (IA) e schema:**
- `totalPremium` — valor total do prêmio (R$)
- `franchiseValue` — valor em R$ da franquia
- `franchiseType` — enum: `REDUZIDA` | `NORMAL` | `AMPLIADA` | `FRANQUIA_ZERO`
- `label` — rótulo editável pelo corretor (ex: "Bradesco — Martelinho e Vidros Full")

**Fluxo:**
1. IA extrai `franchiseValue` e `franchiseType` automaticamente do PDF
2. Corretor confirma/edita no step de revisão
3. No link público e PDF, cotações da mesma seguradora agrupadas visualmente

**Exemplo de exibição para o segurado:**
```
Bradesco Seguros
  ├── Franquia Reduzida (R$ 1.500)  →  R$ 2.340/ano
  └── Franquia Normal  (R$ 3.000)  →  R$ 1.980/ano

Porto Seguro
  └── Franquia Normal  (R$ 2.000)  →  R$ 2.100/ano
```

---

### 📋 Expansão de seguradoras — Auto

- **Porto Seguro Auto** — novo schema de extração, adaptação do parser
- **Tokio Marine Auto** — idem

> Implementar **após** o agrupamento resolvido para não gerar débito técnico no modelo de dados.

---

### 📋 Notificação: segurado abriu o link

- Registrar `openedAt` no `QuoteProcess` ao acessar o token (campo já existe)
- Enviar e-mail ao corretor: "Seu cliente acabou de abrir a cotação [nome]"

Alta percepção de valor, baixo custo de implementação.

---

## Backlog — Polimento e completude

### 📋 Recovery de senha
Fluxo: e-mail com link temporário assinado → formulário de redefinição → invalidar token após uso.

### 📋 Máscaras de input nos formulários
- CPF: `000.000.000-00`
- CNPJ: `00.000.000/0000-00`
- Telefone: `(00) 00000-0000`

### 📋 Busca de CEP automática
No cadastro de endereço da empresa: preencher logradouro, bairro, cidade e estado via ViaCEP ao digitar o CEP.

### 📋 Área de edição de perfil e dados da empresa
Corretor deve poder editar: nome, e-mail, senha, nome fantasia, CNPJ, telefones, endereço, logo e cor primária.

### 📋 Footer personalizado no PDF e no link público
O corretor configura um rodapé que aparece tanto no PDF gerado quanto na página pública do segurado:
- Endereço da corretora
- Telefone(s) de contato
- Frase personalizada (ex: "Proteção que cabe no seu bolso")
- Logo e cor primária (já existem na entidade Company)

---

## Futuro — Não priorizado

### 🔮 Botão "Compartilhar via WhatsApp" no link público
Link `wa.me` pré-formatado com a URL da cotação. Zero backend. Alta percepção de valor para o corretor.  
Aguarda o core estabilizado.

### 🔮 CRM / Gestão de clientes e leads
- Cadastro de clientes vinculados ao corretor
- Associação de cotações a clientes
- Lembretes automáticos: aniversário, renovação anual de apólice
- Notificação por e-mail ou WhatsApp na data configurada

É um produto dentro do produto. Implementar só após uma base de corretores usando o sistema core.

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

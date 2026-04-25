@AGENTS.md

# Corretor no Flow

Plataforma SaaS para corretores de seguros. O problema central: PDFs de cotação gerados por seguradoras (começando pelo Bradesco Seguros) são técnicos e difíceis de entender pelo segurado. A solução é receber o upload desse PDF, extrair as informações via IA e gerar um novo PDF limpo, personalizado com a identidade visual do corretor — além de um link dinâmico onde o segurado pode ler as informações de forma visual e amigável.

## Produto

### Escopo inicial: AUTO
Começamos com cotações de AUTO por ser o produto mais padronizado e com maior volume. A arquitetura deve permitir expansão para outros produtos (Saúde, Viagem, Residencial) sem reescrita — cada produto terá seu próprio schema de extração e template de saída.

### Funcionalidades planejadas
- Upload de PDF de cotação (Bradesco AUTO)
- Extração de dados via IA (Claude API)
- Preview e edição dos dados extraídos antes de gerar
- Geração de PDF personalizado com logo e cor da empresa do corretor
- Link dinâmico público para o segurado (`app/[slug]/[token]`)
- Tracking de abertura do link (notifica o corretor quando o cliente abre)
- Histórico de cotações por corretor
- Perfil da empresa: nome, CNPJ, telefone, logo, cor primária

### Diferenciais
- Link dinâmico mobile-first com botão de WhatsApp para o corretor
- QR code no PDF gerado apontando para o link dinâmico
- Notificação em tempo real quando o segurado abre a cotação
- Sistema de planos com limite de cotações por mês

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Monorepo | Turborepo + npm workspaces |
| Dashboard (app do corretor) | Next.js 16 + Tailwind 4 |
| Landing page | Next.js (a criar) |
| API | Nest.js (a criar) |
| Tipos compartilhados | `@corretor/types` (packages/types) |
| Banco de dados | PostgreSQL (Supabase) |
| Fila de jobs | BullMQ ou pg-boss |
| PDF parsing | pdfjs-dist (texto) + Claude Vision (fallback) |
| PDF geração | Puppeteer (HTML → PDF) |
| IA | Anthropic SDK — claude-sonnet-4-6 |
| Storage | S3 (ou compatível) |

## Estrutura do Monorepo

```
corretor-no-flow/
  apps/
    dashboard/   # @corretor/dashboard — app do corretor
    web/         # @corretor/web — landing page (a criar)
    api/         # @corretor/api — Nest.js (a criar)
  packages/
    types/       # @corretor/types — DTOs e interfaces compartilhados
  .claude/
    skills/      # skills do projeto (turborepo, nestjs, frontend-design, etc.)
  turbo.json
  package.json
```

## Entidades principais (`@corretor/types`)

- `User` — corretor autenticado
- `Company` — empresa do corretor (nome, slug, logo, cor primária)
- `Quote` — cotação processada (status, produto, link público, dados extraídos)
- `AutoQuoteData` — dados específicos de cotação AUTO (coberturas, parcelas, veículo)

## Regras de negócio críticas

- Corretor só acessa cotações da própria empresa (isolamento por `companyId`)
- PDF original deve ser excluído do storage após extração (LGPD)
- Dados do segurado não são persistidos além do necessário
- Link dinâmico expira após prazo configurável (padrão: 30 dias)
- Falha na extração IA não quebra o fluxo — entra em status `pending_review`
- Processamento de PDF é sempre assíncrono (job queue), nunca síncrono

## Pipeline de processamento

```
Upload PDF → job queue → extração de texto (pdfjs) → Claude API → JSON validado
→ (corretor revisa) → template HTML → Puppeteer → PDF gerado + link dinâmico
```

## Módulos Nest.js planejados

```
api/src/modules/
  auth/          # JWT, login, cadastro, recuperação de senha
  companies/     # perfil da empresa, logo, cores
  quotes/        # upload, processamento, histórico
    jobs/        # extract-pdf.job, generate-pdf.job
  links/         # link público do segurado (sem auth)
  storage/       # abstração S3
  ai/            # abstração Anthropic SDK
```

## Requisitos funcionais (MVP)

**Auth:** cadastro, login JWT, recuperação de senha

**Empresa:** nome fantasia, CNPJ, telefone, logo, cor primária, slug

**Cotação:** upload PDF, extração assíncrona, preview/edição, geração PDF, link dinâmico, download, histórico com status

**Link do segurado:** página pública mobile-first, dados da cotação legíveis, dados do corretor, botão WhatsApp, tracker de abertura, expiração

## Infraestrutura local (Docker)

Todo o ambiente de desenvolvimento roda via Docker. Não instale Postgres ou Redis localmente.

```
docker-compose up -d          # sobe postgres, redis e api
docker-compose up -d postgres redis   # só infra (API local fora do container)
docker-compose logs -f api    # acompanhar logs da API
```

**Serviços e portas:**
| Serviço | Container | Porta |
|---------|-----------|-------|
| PostgreSQL 16 | `corretor_postgres` | 5432 |
| Redis 7 | `corretor_redis` | 6379 |
| API (NestJS) | `corretor_api` | 3001 |

**Network:** todos os serviços estão na network `db` — os containers se comunicam pelo nome do serviço (ex: `DB_HOST=postgres`).

**Hot reload:** em desenvolvimento, `apps/api/src` e `packages/types/src` são volume-mounted no container. Alterações no código refletem sem rebuild.

**Rebuild necessário apenas quando `package.json` mudar:**
```
docker-compose up -d --build api
```

Copie `.env.example` → `.env` em `apps/api/` antes de subir:
```
cp apps/api/.env.example apps/api/.env
```

## Decisões técnicas registradas

- **Monorepo com Turborepo** em vez de 3 repos separados — evita duplicação de tipos e simplifica CI
- **Nest.js para API** em vez de Next.js API Routes — escala melhor para a complexidade planejada (jobs, guards, módulos, DI)
- **Node/TypeScript** para o backend — ecossistema de PDF mais maduro em JS, e o gargalo é a IA, não a linguagem
- **Processamento assíncrono obrigatório** — PDF pode levar 10–30s para processar
- **`.env` por app** (nunca na raiz do monorepo) — segue boas práticas Turborepo e evita acoplamento implícito

## Contrato de tipos (`@corretor/types` como fonte de verdade)

`packages/types` é a **única fonte de verdade** para os contratos entre API e frontend. O fluxo é:

```
Prisma schema muda
  → atualiza @corretor/types manualmente
  → NestJS DTOs quebram compilação (implements garante)
  → Frontend quebra compilação (usa os mesmos tipos)
```

**Regra obrigatória:** todo DTO do NestJS deve implementar a interface correspondente de `@corretor/types`:

```ts
import type { CreateCompanyDto as ICreateCompanyDto } from '@corretor/types';

export class CreateCompanyDto implements ICreateCompanyDto {
  // se divergir de ICreateCompanyDto → erro de compilação
}
```

Isso garante que mudanças no contrato sejam detectadas em compile-time, não em runtime.

**O que NÃO fazer:** usar `@prisma/client` diretamente no frontend — Prisma é uma dependência de backend.

## Dashboard — arquitetura frontend

- **Gestão de sessão:** httpOnly cookies + Next.js Middleware (sem localStorage)
- **HTTP client:** fetch com `credentials: 'include'` — cookies enviados automaticamente
- **Data fetching:** React Query (TanStack Query) para Client Components
- **Tipagem dos hooks:** todos os hooks usam os tipos de `@corretor/types` para entrada e saída

## Desenvolvimento da API
- **Todo desenvolvimento deve ser feito seguindo modelo TDD** - Inicialmente iremos fazer tudo com testes unitários no desenvolvimento do backend, leia as skills de teste e tdd, isso deve ajudar na hora de construir os mocks

- **Design DDD** - Devemos fazer o desenvolvimento utilizando o design DDD e uma arquitetura com SOLID usando inversão e injeção de dependências.
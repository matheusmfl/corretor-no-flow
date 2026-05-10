# Brainstorm - Cache, maturidade REST e preparacao para escala

Data: 2026-05-08

## Topic

Estudo de niveis de maturidade da API (modelo de Richardson) levantou a ideia de
introduzir cache em pontos onde a leitura e dominante e a mutacao tem trigger
claro. A motivacao principal e maturidade tecnica do produto e preparacao para
escalar, nao um problema medido de performance hoje.

Decisao do humano em 2026-05-08: registrar ideia, nao virar discovery agora. O
projeto tem prazo apertado e o volume atual nao justifica o esforco. Quando a
escala chegar ou o time tiver folga, retomar.

## Context

- Volume realista no curto prazo: ~10 usuarios registrados, leitura concentrada
  no link publico (0 a 20 acessos por cliente final).
- Volume de medio prazo: corretoras com muitos produtos cadastrados, cada
  cotacao lendo varios dados de catalogo (lista de seguradoras, coberturas por
  seguradora, futuras listas de checkbox renderizadas a partir da API).
- A V1 prioriza pre-venda Auto (`PRE-SALE-V1.md`). Cache nao bloqueia nada nesse
  roadmap.

## Principio

Cache so vale quando:

1. Leitura e dominante.
2. Mutacao tem trigger claro e bem mapeado.
3. Stale aceitavel ou invalidacao confiavel.
4. Ha valor mensurado (latencia, custo) ou semantica HTTP a corrigir.

Quando algum desses falha, cache vira fonte de bug em vez de ganho.

## Tres Categorias De Cache Identificadas

Cada categoria tem perfil diferente. Tratar como problemas separados quando o
discovery for aberto.

### 1. Link publico do cliente (per-token)

- URL: `apps/dashboard/src/app/(public)/c/[token]/page.tsx`.
- Conteudo: anonimo, mesmo bytes para todos os visitantes daquele token.
- Triggers de invalidacao:
  - corretor sobe novo PDF;
  - corretor exclui cotacao;
  - extracao assincrona muda estado (`processing` -> `ready`);
  - fallback Gemini conclui;
  - corretor edita `clientName`;
  - corretor seleciona/desseleciona cotacoes (`TASK-0042`);
  - corretor publica/despublica (se esse estado existir);
  - corretor edita cobertura no review (se existir).
- Risco: esquecer um trigger -> cliente ve dado antigo. Pior do que sem cache.
- Tracking deve permanecer escrita pura, sem participar do cache.
- Ganho real esperado: latencia percebida + reducao de carga no Postgres no
  cenario futuro de processos virais.

### 2. Catalogo / dados de referencia (cross-tenant)

Exemplos:

- lista de seguradoras suportadas por produto (Auto hoje);
- catalogo de coberturas por seguradora (ex: tooltips Tokio, lista de servicos
  opcionais);
- catalogo de produtos por seguradora;
- regras de comparacao para destaques no link publico (`TASK-0004`);
- categorizacao de status, planos, tiers, etc.

Perfil:

- mesmo dado para todos os tenants;
- muda raramente (deploy ou admin);
- lido varias vezes por sessao do corretor e do cliente;
- nao depende de estado por processo.

E o caso onde cache da o maior retorno em complexidade baixa. Pode ser cache
em memoria por processo Node, com TTL longo e invalidacao por deploy/admin.
Nao precisa de Redis.

### 3. UI metadata / formularios dinamicos (futuro)

Quando aparecer no roadmap (mencionado pelo humano como possibilidade):

- checkboxes renderizados a partir de resposta da API;
- listas dropdown de coberturas/seguradoras/produtos para upload e review;
- definicoes de campos exibiveis por seguradora.

Perfil parecido com a categoria 2, mas potencialmente versionado por seguradora
ou por release. Cache de catalogo cobre a maior parte.

## Tres Niveis De Intervencao

Mantidos da conversa anterior, refinados com a categoria 2 incluida.

### A - HTTP-only (maturidade Richardson Nivel 2 honesta)

- API publica responde `Cache-Control` apropriado, `ETag`, `Last-Modified`.
- `If-None-Match` -> 304.
- Sem servidor de cache, sem Redis.
- Browser/CDN cuidam.
- Risco: baixo. Esforco: baixo.
- Aplicavel ao link publico e a endpoints de catalogo.

### B - Next.js cache tags (sweet spot quando virar prioridade)

- `unstable_cache` ou `fetch` com `next.tags` para link publico e catalogos.
- Server actions/use-cases do corretor chamam `revalidateTag` ao mutar.
- Endpoints de catalogo recebem TTL longo + tag por entidade.
- Risco: medio (mapear todos os triggers da categoria 1).
- Esforco: medio.

### C - Redis cache server-side

- Justifica quando ha medicao real de gargalo no Postgres ou quando a API
  precisa servir multiplos clientes (mobile, integracoes, terceiros).
- Mantem categoria 2 mais escalavel para muitas corretoras com muitos produtos.
- Risco: alto (drift Postgres x Redis).
- Nao recomendado entrar por aqui.

## Quando Tirar Da Prateleira

Sinais que justificam reabrir essa discussao:

1. Latencia percebida do link publico ficar ruim em medicao real.
2. Custo de infra do Postgres subir de forma notavel.
3. Surgir feature que exija renderizar muitos catalogos por sessao (UI metadata
   da categoria 3).
4. Crescimento de corretoras com muitos produtos cadastrados (categoria 2 sob
   pressao).
5. API ser exposta para integracao externa, mobile ou parceiros.
6. Trabalho do roadmap chegar perto de `TASK-0004` (destaques de comparacao) ou
   das frentes de score (`TASK-0005`), onde a estrutura de eventos e
   leitura mudam.

Sem esses sinais, manter foco em pre-venda V1.

## Tensoes Que O Discovery Futuro Tera Que Resolver

- Separar leitura cacheavel de eventos de tracking (escrita).
- Definir se existe estado explicito de "publicado" no processo, ou se o link
  fica ativo desde que ha token.
- Evitar que cache do link publico esconda transicoes de estado da extracao
  assincrona (cliente pode acessar enquanto processa).
- Decidir se invalidacao por trigger e responsabilidade da camada Next.js
  (revalidateTag) ou da camada NestJS (cache do API service).
- Confirmar onde o dashboard roda em producao (Vercel, self-host) antes de
  apostar em features especificas do Next/CDN.
- Antes de mexer em comportamento Next.js, ler o guia da versao em
  `node_modules/next/dist/docs/`.

## Files/Tasks Affected

- `apps/dashboard/src/app/(public)/c/[token]/page.tsx`
- `apps/api/src/modules/public/application/use-cases/get-public-process.use-case.ts`
- `apps/api/src/modules/quotes/jobs/extract-pdf.processor.ts` (triggers)
- `apps/api/src/modules/quotes/application/use-cases/upload-quote.use-case.ts`
- futuros endpoints de catalogo (seguradoras, coberturas, planos)
- `TASK-0004` (destaques de comparacao)
- `TASK-0042` (selecao de cotacoes antes de publicar)
- `TASK-0043` (navegacao do link publico)
- `.ai/discovery/PUBLIC-LINK-COMPARISON-HIGHLIGHTS.md`

## Recommended Next Action

- Nao virar discovery nem task agora.
- Manter este brainstorm como referencia.
- Revisitar quando aparecer um dos sinais listados acima.
- Quando reabrir, comecar pelo Nivel A (HTTP-only) para o link publico e
  catalogo. Avaliar Nivel B com base no host e em medicao real. Adiar Nivel C
  ate ter dados de carga.
- Anotar em `DECISIONS.md` apenas quando a decisao real for tomada, nao agora.

## Referencias De Estudo

- Modelo de maturidade de Richardson (4 niveis).
- HTTP semantics: `Cache-Control`, `ETag`, `Last-Modified`, `If-None-Match`,
  `Vary`.
- Next.js: `unstable_cache`, `revalidateTag`, `revalidatePath`, ISR, route
  segment config.
- Padroes de invalidacao: time-based TTL, event-based, version-based.

Idea registrada. Foco volta para pre-venda V1.

# Brainstorm - Dominios proprios no link publico

Data: 2026-05-10

## Raw Idea

Permitir que o usuario/corretora escolha e configure o proprio dominio para as
paginas publicas enviadas ao segurado.

Hoje o link publico e gerado dentro do dominio da plataforma, no formato:

```txt
https://app-corretor-no-flow/c/{publicToken}
```

A ideia e permitir uma experiencia white label, por exemplo:

```txt
https://propostas.corretora.com.br/c/{publicToken}
```

ou, em uma versao mais ambiciosa:

```txt
https://corretora.com.br/proposta/{publicToken}
```

## Refined Idea

O produto pode oferecer "dominio proprio para propostas" como recurso de
marca/confianca. O corretor continua usando o dashboard do Corretor no Flow,
mas o segurado recebe uma URL com o dominio da corretora.

O caminho recomendado para V1 e suportar subdominio proprio, nao dominio raiz:

```txt
propostas.suacorretora.com.br
```

Esse modelo reduz risco operacional porque nao interfere no site institucional
da corretora. O usuario configura apenas um CNAME apontando para a infraestrutura
do produto.

Dominio raiz (`suacorretora.com.br`) pode ficar como fase posterior, porque pode
conflitar com site existente, e-mail, SEO e configuracoes de DNS mais delicadas.

## User Value

- Aumenta confianca do segurado ao abrir a proposta.
- Reforca a marca da corretora, nao a marca da plataforma.
- Reduz friccao comercial em clientes que estranham links de terceiros.
- Pode ser recurso premium/comercial: "envie propostas pelo seu proprio dominio".
- Ajuda corretoras maiores que exigem experiencia white label ou mais
  profissional.

## Technical Notes

Estado atual observado em 2026-05-10:

- A API gera o link em `GenerateLinkUseCase` usando `APP_URL`:
  `apps/api/src/modules/quotes/application/use-cases/generate-link.use-case.ts`.
- O dashboard exibe o retorno da API ou monta fallback com `window.location.origin`:
  `apps/dashboard/src/app/(app)/dashboard/quotes/[processId]/generate/page.tsx`.
- A pagina publica e servida em:
  `apps/dashboard/src/app/(public)/c/[token]/page.tsx`.
- A API publica os dados em:
  `apps/api/src/modules/public/presentation/public.controller.ts`.
- O modelo `Company` ja possui `slug`, `website`, identidade visual e dados de
  contato, mas nao possui campo para dominio customizado:
  `apps/api/prisma/schema.prisma`.

Possivel desenho de dados:

```txt
Company.customDomain: String?
Company.customDomainStatus: PENDING | VERIFIED | SSL_ACTIVE | ERROR
Company.customDomainVerifiedAt: DateTime?
Company.customDomainLastCheckedAt: DateTime?
```

Fluxo proposto para MVP:

1. Corretor informa um subdominio, exemplo `propostas.corretora.com.br`.
2. Sistema mostra instrucao de DNS:
   `CNAME propostas.corretora.com.br -> app.corretornoflow.com.br`.
3. Backend valida periodicamente ou sob demanda se o DNS aponta corretamente.
4. Infra registra o dominio e emite SSL.
5. Ao publicar cotacao, API usa o dominio customizado validado se existir.
6. Caso o dominio falhe, sistema volta para o dominio padrao da plataforma.

Pontos sensiveis:

- Verificacao de propriedade do dominio.
- Emissao/renovacao de SSL.
- Suporte a multiplos hosts no deploy.
- Evitar que uma corretora cadastre dominio de outra.
- Definir fallback claro quando DNS ou SSL quebrar.
- Decidir se a feature fica limitada a plano premium.

Infra possivel:

- Vercel: usar API de domains/projects para registrar dominio, verificar status
  e automatizar SSL.
- Cloudflare: usar DNS/SSL gerenciado, possivelmente com custom hostnames.
- VPS: usar Caddy, Traefik ou Nginx + Let's Encrypt, com automacao propria.

## Product Shape

Copy possivel:

> Use seu proprio dominio nas propostas enviadas ao cliente.

Tela no dashboard:

- Campo: `propostas.suacorretora.com.br`.
- Status: `Aguardando DNS`, `Verificado`, `SSL ativo`, `Erro`.
- Instrucao copiavel de DNS.
- Botao: `Verificar novamente`.
- Aviso: "Recomendamos usar um subdominio para nao alterar o site principal da
  corretora."

## Candidate Tasks

- Discovery tecnico: escolher estrategia de dominio customizado conforme a infra
  real de deploy.
- Modelar campos de dominio customizado em `Company`.
- Criar endpoint de configuracao e verificacao de dominio.
- Criar UI de configuracao em Settings.
- Alterar geracao de `publicUrl` para usar dominio validado da corretora.
- Garantir fallback para dominio padrao.
- Criar QA manual para DNS pendente, DNS verificado, SSL ativo e erro.

## Open Questions

- A infra final sera Vercel, Cloudflare, VPS ou outro provedor?
- Queremos liberar apenas subdominios ou tambem dominio raiz?
- O dominio customizado sera por corretora, por usuario ou por workspace futuro?
- Deve ser feature premium?
- O link publico deve continuar em `/c/{token}` ou usar caminho mais amigavel,
  como `/proposta/{token}`?
- Precisamos permitir mais de um dominio por corretora?

## Current Recommendation

Nao virar implementacao imediata sem discovery de infra.

Quando retomar, comecar pequeno:

```txt
propostas.corretora.com.br/c/{publicToken}
```

Esse formato entrega o valor principal de marca/confianca com a menor mudanca
no produto e no roteamento atual.

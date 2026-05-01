---
id: TASK-0018
title: Corrigir estado de auth quando API esta offline ou sessao expira
status: todo
kind: implementation
lifecycle: open
area: dashboard
owner: claude
reviewer: codex
complexity: medium
risk: high
tdd_required: false
created_at: 2026-05-01
priority: urgent
---

# TASK-0018 - Corrigir estado de auth quando API esta offline ou sessao expira

## Context

O dashboard valida a sessao chamando `/api/auth/me` via `useCurrentUser`. Quando a API esta offline, ou quando a rota nao responde como esperado, a aplicacao pode entrar em um ciclo de navegacao/revalidacao entre `/dashboard` e `/api/auth/me`.

Com a API ligada, a navegacao funciona normalmente. O problema e o fallback ruim quando a API esta indisponivel ou quando a sessao nao pode ser validada.

O projeto usa Next 16, onde `middleware` virou `proxy.ts`. Conforme docs locais de `node_modules/next/dist/docs/`, o Proxy deve fazer apenas checagens otimistas e nao substituir validacao real de sessao.

## Objective

Garantir que o dashboard tenha comportamento previsivel quando:

- a API esta offline;
- `/api/auth/me` falha por erro de conexao;
- o access token expirou;
- o refresh token falhou;
- o backend responde `401`.

## Scope

- Revisar fluxo atual de auth no dashboard:
  - `apps/dashboard/src/proxy.ts`
  - `apps/dashboard/src/lib/api/client.ts`
  - `apps/dashboard/src/hooks/auth/use-current-user.ts`
  - `apps/dashboard/src/providers.tsx`
  - `apps/dashboard/src/app/(app)/layout.tsx`
- Evitar loop de redirects/reloads.
- Diferenciar erro de sessao expirada de erro de conexao/API offline.
- Para `401`, manter tentativa de refresh uma vez e depois redirecionar para `/login`.
- Para erro de conexao/status `0`, mostrar estado controlado no layout protegido, sem redirect infinito.
- Para `404` em `/api/auth/me`, nao tratar como usuario deslogado silenciosamente; expor erro controlado ou mensagem de indisponibilidade/configuracao.
- Garantir que `useCurrentUser` nao seja chamado duplicadamente de forma desnecessaria no layout e nas paginas filhas, se possivel.

## Out Of Scope

- Nao mudar backend auth.
- Nao trocar estrategia de autenticacao.
- Nao implementar refresh token server-side.
- Nao redesenhar tela de login.
- Nao alterar regras de negocio de usuario/company.

## Likely Files

- `apps/dashboard/src/lib/api/client.ts`
- `apps/dashboard/src/providers.tsx`
- `apps/dashboard/src/hooks/auth/use-current-user.ts`
- `apps/dashboard/src/app/(app)/layout.tsx`
- opcional: `apps/dashboard/src/components/**`

## TDD Requirement

Frontend task. Testes automatizados sao opcionais se nao houver setup de testes para dashboard.

Se houver padrao existente, adicionar teste para:

- erro `401` redireciona para login;
- erro de conexao nao redireciona em loop;
- erro `404` em `/api/auth/me` mostra fallback controlado.

## Acceptance Criteria

- [ ] Com API ligada e sessao valida, `/dashboard` abre normalmente.
- [ ] Com API desligada, `/dashboard` nao entra em loop de reload/redirect.
- [ ] Com API desligada, usuario ve mensagem clara de indisponibilidade do servidor e opcao de tentar novamente.
- [ ] Com access token expirado e refresh valido, sessao e renovada e a navegacao continua.
- [ ] Com access token expirado e refresh invalido/expirado, usuario e redirecionado uma unica vez para `/login`.
- [ ] `404` em `/api/auth/me` nao gera loop.
- [ ] Nao ha spam continuo de requests `/dashboard` + `/api/auth/me` no console.
- [ ] `npm run lint -- --filter=@corretor/dashboard` ou comando equivalente passa, se disponivel.

## Risks

- Confundir API offline com sessao expirada pode deslogar usuarios sem necessidade.
- Redirecionar dentro de erro global do React Query pode causar reload repetido se varias queries falharem ao mesmo tempo.
- O `proxy.ts` so ve cookie, nao sabe se token expirou; a protecao real precisa continuar no client/API.

## Failure Scenario

A API cai temporariamente e usuarios autenticados ficam presos em loop de navegacao, sem entender se perderam sessao ou se o servidor esta indisponivel.

## Human QA Checklist

- [ ] Rodar dashboard com API desligada e acessar `/dashboard`.
- [ ] Confirmar que aparece fallback de servidor indisponivel.
- [ ] Ligar API e clicar em tentar novamente ou recarregar.
- [ ] Confirmar navegacao normal.
- [ ] Simular sessao invalida/expirada e confirmar redirect unico para `/login`.

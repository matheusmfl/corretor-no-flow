# Session Limits And Concurrent Access

Data: 2026-05-01

## Context

Ideia levantada para futuro: quando um usuario tentar logar e esse mesmo usuario ja estiver logado em outro device, o sistema deveria avisar que continuar vai desconectar a outra sessao.

Essa ideia se conecta com free tier, limites de acessos simultaneos, cadastro de corretores e possiveis planos pagos no futuro.

## Product Question

Qual deve ser a politica de sessoes simultaneas por usuario, empresa e plano?

## Questions To Answer Later

- Free tier deve permitir apenas uma sessao ativa por usuario?
- Planos pagos devem permitir mais sessoes simultaneas?
- O limite deve ser por usuario, por corretora/empresa, por corretor cadastrado, ou uma combinacao?
- O sistema deve bloquear novo login ou permitir login novo derrubando a sessao antiga?
- Antes de derrubar a sessao antiga, o usuario deve confirmar explicitamente?
- A mensagem deve explicar onde existe uma sessao ativa, por exemplo navegador, sistema operacional, IP aproximado ou horario do ultimo acesso?
- O usuario administrador da corretora deve poder ver e gerenciar sessoes ativas dos corretores?
- Como isso conversa com refresh tokens, logout manual, expiracao de sessao e troca de senha?
- Como tratar uma aba antiga aberta que tenta usar uma sessao revogada?
- Como evitar que a regra atrapalhe suporte interno, teste, QA ou uso em mais de um device pelo proprio corretor?

## Possible V1 Direction

Para uma primeira versao simples de free tier:

- `1 usuario = 1 sessao ativa`;
- login em novo device detecta sessao ativa existente;
- API retorna conflito especifico, como `SESSION_ALREADY_ACTIVE`;
- dashboard mostra modal:

```txt
Esta conta ja esta ativa em outro dispositivo.
Continuar vai desconectar a outra sessao.
```

- se o usuario confirmar, o login prossegue com `force=true`;
- a API revoga sessoes antigas e cria uma nova sessao.

## Possible Future Implementation Slices

### Backend - Active Sessions Model

- Criar modelo de sessao ativa por usuario.
- Registrar device label, user agent, IP, lastSeenAt e revokedAt.
- Vincular refresh token ou sessionId a uma sessao ativa.
- Garantir que refresh de sessao revogada falhe.

### Backend - Login Conflict

- Detectar sessao ativa durante login.
- Retornar conflito quando o plano/usuario nao permite outra sessao.
- Aceitar `force=true` para revogar sessoes antigas.
- Cobrir com testes.

### Dashboard - Confirmation Modal

- Detectar erro `SESSION_ALREADY_ACTIVE`.
- Mostrar aviso antes de desconectar sessao antiga.
- Permitir cancelar ou continuar neste device.
- Se continuar, repetir login com confirmacao.

## Why Not Now

Essa frente deve ficar em discovery porque ainda nao e prioridade imediata da Pre-Sale V1. Ela toca produto, pricing, seguranca, auditoria e experiencia de login.

Nao transformar em implementation task ate decidirmos a politica comercial de limites.


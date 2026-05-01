# Brainstorm - QA public link, client identity, and coverage display

Data: 2026-05-01

## Topic

QA do fluxo com duas cotacoes no mesmo processo: uma Bradesco e uma Porto Seguro.

## What Happened

O processo aceitou duas cotacoes de segurados/condutores diferentes. O link publico usa `process.clientName` para cumprimentar o cliente, mas cada cotacao pode ter `driver.name` diferente em `extractedData`.

Resultado observado:

- Link abriu com saudacao `Ola, FABIANO`.
- Uma das cotacoes nao era de Fabiano.
- Isso cria conflito na comunicacao com o segurado e pode reduzir confianca.

## Product Question

Um processo de cotacao deve representar:

1. um unico segurado;
2. uma unica pessoa atendida, mesmo quando segurado e principal condutor mudam entre cotacoes;
3. um grupo de cotacoes soltas que podem ter nomes diferentes.

Para o link publico, a opcao 3 e perigosa. O segurado pode ver uma saudacao com outro nome ou dados pessoais de outra pessoa.

## Possible Rules

### Rule A - Strict same insured

O processo deve aceitar apenas cotacoes com o mesmo segurado.

Pros:

- Mais simples para o link publico.
- Menor risco de expor/confundir dados pessoais.
- Busca por cliente continua clara.

Cons:

- Pode bloquear casos reais em que o corretor testa variacao com principal condutor/segurado diferente para o mesmo atendimento.

### Rule B - Same customer, variant people allowed

O processo tem um `clientName` escolhido pelo corretor, e cada cotacao pode ter `insuredName` e `mainDriverName`.

O link usa uma saudacao neutra ou baseada no cliente do atendimento:

- `Sua cotacao esta pronta`
- `Preparamos suas opcoes de seguro Auto`
- `Cotacoes para analise`

Quando houver nomes divergentes, o link deve mostrar uma etiqueta discreta por cotacao:

- `Segurado: Maria`
- `Principal condutor: Fabiano`

Pros:

- Suporta caso real de variacao segurado/condutor.
- Evita saudacao errada.
- Mantem transparencia.

Cons:

- Exige UI e regras de alerta.
- Pode confundir cliente se exibido de forma pesada.

### Rule C - Allow mixed names but warn before publish

O sistema detecta nomes divergentes e bloqueia/publica com confirmacao:

- "Encontramos nomes diferentes nas cotacoes. Confirme se elas pertencem ao mesmo atendimento antes de publicar."

Pros:

- Menos bloqueio.
- Ajuda o corretor a corrigir erro antes do cliente ver.

Cons:

- Se o corretor ignorar, o problema ainda pode chegar ao cliente.

## Recommended Direction

Para V1, combinar B + C:

- Processo representa um atendimento comercial, nao necessariamente um unico nome extraido.
- O corretor deve informar ou confirmar o `clientName` do atendimento.
- O sistema deve detectar nomes divergentes nas cotacoes antes de publicar.
- Se houver divergencia, usar saudacao neutra no link e mostrar alerta na tela de review/generate.
- Nunca sobrescrever silenciosamente `process.clientName` com o ultimo PDF processado.

## Decisions To Consider

- `clientName` deve ser manual e editavel pelo corretor.
- `extractedData.driver.name` deve continuar por cotacao.
- Futuramente separar `insuredName`, `mainDriverName` e `displayClientName`.
- O link publico deve evitar saudacao pessoal quando houver conflito.

## Files/Tasks Affected

- `apps/api/src/modules/quotes/jobs/extract-pdf.processor.ts`
- `apps/api/src/modules/quotes/application/use-cases/upload-quote.use-case.ts`
- `apps/api/src/modules/public/application/use-cases/get-public-process.use-case.ts`
- `apps/dashboard/src/app/(public)/c/[token]/page.tsx`
- `apps/dashboard/src/app/(app)/dashboard/quotes/[processId]/review/page.tsx`
- `TASK-0021`

## Recommended Next Action

Criar discovery/task para regras de identidade do cliente no processo antes de mexer no modelo final. Como mitigacao rapida, parar de sobrescrever `process.clientName` automaticamente quando ja existe nome manual ou quando as cotacoes divergem.

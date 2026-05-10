# Brainstorm - Como mostrar coberturas nao contratadas no link publico

Data: 2026-05-07

## Topic

Apos a TASK-0044 ficar pronta, o link publico passou a renderizar chips de coberturas
contratadas e nao contratadas no `QuoteCard`. Em produtos mais enxutos (ex: Tokio Marine
Protecao Mensal), o card visualmente fica dominado por chips riscados de "nao contratado".

Isso levanta uma duvida de produto que precisa de discovery antes de virar implementacao.

## What Happened

Print de QA em 2026-05-07, link publico, card Tokio Marine Protecao Mensal mostrou:

- chips positivos: `90% FIPE`, `RCF R$ 25.000,00`, `Assistencia 24h Completa 200 km`,
  `Rede Referenciada`, `Novas Compativeis`;
- chips riscados (not_contracted): `Vidros nao contratado`, `Sem veiculo reserva`,
  `Martelinho`, `Lataria e pintura`, `Roda/pneu`, `Logomarca`.

A informacao esta tecnicamente correta. Mas seis chips riscados na frente do cliente
final podem parecer um produto fraco mesmo quando ele e adequado para o perfil de uso.

## Product Question

Mostrar todas as coberturas nao contratadas ao cliente final:

1. aumenta transparencia e da argumento ao corretor para upsell;
2. desestimula a compra ao destacar tudo o que falta;
3. e neutro - depende do contexto e da intencao da apresentacao.

A hipotese do humano em 2026-05-07: nao contratado so vale como informacao se for
um diferencial real. Ou seja, faz sentido mostrar "vidro nao contratado" apenas se
existir outra cotacao no mesmo grupo onde vidro foi contratado.

## Possible Rules

### Rule A - Mostrar tudo sempre (estado atual)

Cada cotacao mostra todos os campos extraidos, contratados e nao contratados.

Pros:

- Maxima transparencia.
- Cliente sabe exatamente o que cada produto cobre.
- Padrao e estavel: nao depende do que tem em outras cotacoes.

Cons:

- Em produtos mensais/basicos o card fica visualmente "pobre".
- Pode desestimular sem motivo se o cliente nem se interessava por aquele item.
- Aumenta poluicao visual e tempo de leitura.

### Rule B - Mostrar nao contratado so se for diferencial entre cotacoes

O sistema cruza as cotacoes do mesmo processo. Para cada campo:

- se nenhuma cotacao tem -> nao mostra.
- se todas as cotacoes tem -> mostra como contratado normal.
- se algumas tem e outras nao -> mostra contratado nas que tem e mostra
  `nao contratado` (riscado) nas que nao tem, virando diferencial visivel.

Pros:

- Cliente so ve "nao contratado" quando faz sentido (existe alternativa que tem).
- Cria upsell natural: cliente percebe diferenca real e pode pedir o plano com
  vidro/reserva/etc.
- Reduz peso visual em cotacoes basicas comparadas a outras basicas.

Cons:

- Comportamento muda conforme o conjunto de cotacoes do processo.
- Cotacao unica nunca mostra `nao contratado`, o que pode esconder informacao
  quando nao ha base de comparacao.
- Implementacao mais complexa: card precisa de contexto do processo, nao pode
  ser puramente local.
- Risco de sumir com info que o corretor queria mostrar deliberadamente.

### Rule C - Mostrar nao contratado so quando o cliente expandir detalhes

O card sumario mostra so o que esta contratado. O cliente clica em
`Ver cotacao completa` ou em `Ver detalhes` e ai aparece tabela completa com
contratado, nao contratado e nao informado.

Pros:

- Card sumario sempre limpo.
- Cliente que quer comparar tem informacao completa em outra camada.
- Nao depende do conjunto de cotacoes.

Cons:

- Diferenca entre cotacoes fica escondida atras de clique.
- Cliente que so olha card pode nao perceber falta de cobertura.
- Mais navegacao para corretor explicar via WhatsApp.

### Rule D - Modo do corretor

O corretor escolhe na tela de review/publish entre dois modos:

- `Comparativo`: mostra diferencas (regra B);
- `Resumo limpo`: mostra so o que cada cotacao tem (regra C);
- futuramente `Detalhado`: mostra tudo (regra A).

Pros:

- Corretor adapta para o cliente.
- Nao impoe um unico padrao.

Cons:

- Decisao a mais para o corretor.
- Risco de o padrao default ficar errado para a maioria dos casos.

## Recommended Direction

Hipotese de produto para validar com discovery:

- O default do link publico deveria ser proximo da Rule B (diferencial entre
  cotacoes), porque o link publico e ferramenta de comparacao, nao laudo tecnico.
- Cotacao unica deve usar Rule C como fallback: card limpo, detalhes em camada
  expandida.
- Rule D pode ser uma evolucao, mas nao precisa entrar no V1.
- Coberturas universais e reguladas (ex: RCF, casco/FIPE) podem ter regra propria
  e continuar visiveis sempre, mesmo sem diferencial.

A pergunta de fundo: o link publico e para comparar ou para descrever cotacoes?
Hoje ele faz os dois. A discovery deve responder qual e o objetivo principal e
ajustar a apresentacao.

## Open Questions For Discovery

- Quais coberturas devem aparecer sempre, mesmo sem diferencial (ex: RCF, franquia,
  premio)?
- Quais coberturas so devem aparecer quando ha diferencial (ex: martelinho,
  logomarca, lataria/pintura)?
- Como apresentar diferencial sem soar como propaganda do plano mais caro?
- Cotacao unica deve mostrar `nao contratado` em algum campo?
- Como o corretor controla o que aparece sem virar configuracao complexa?
- Esse comportamento deve ser igual no PDF gerado e no link publico, ou o PDF
  pode ser mais detalhado por ser documento formal?
- Existe risco regulatorio ao omitir cobertura nao contratada de uma cotacao real?

## Files/Tasks Affected

- `apps/dashboard/src/app/(public)/c/[token]/page.tsx` - QuoteCard chips.
- `apps/api/src/modules/quotes/application/services/coverage-display.ts` - hoje
  decide status por cotacao isolada; precisaria de visao do processo.
- `apps/api/src/modules/quotes/application/services/quote-pdf-template.service.ts`
  - mesma decisao para o PDF gerado.
- `TASK-0004` - destaques de comparacao no link publico (relacionado).
- `TASK-0043` - melhorar navegacao e contexto do link publico (relacionado).
- `.ai/discovery/PUBLIC-LINK-COMPARISON-HIGHLIGHTS.md` - discovery existente que
  pode absorver parte desta pergunta.

## Recommended Next Action

1. Criar discovery em `.ai/discovery/PUBLIC-LINK-COVERAGE-DISPLAY-MODE.md` (ou
   anexar a `PUBLIC-LINK-COMPARISON-HIGHLIGHTS.md`) consolidando as 4 regras,
   exemplos visuais e criterio de escolha do default.
2. Decidir o default antes de criar a task de implementacao.
3. So depois criar `TASK` de implementacao para mudar `coverage-display.ts` e o
   `QuoteCard` para considerar contexto do processo.

Esta brainstorm nao deve virar implementacao direta. E uma pergunta de produto
que precisa de discovery e decisao do humano orquestrador antes de codigo.

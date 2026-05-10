# Brainstorm - Revisao UX e pesquisa Bradesco Saude pre-reuniao com corretora

Data: 2026-05-10

## Quem fez essa analise

Esta brainstorm foi produzida pelo Cursor agindo como estrategista substituto. O papel oficial de estrategia do projeto e do Codex (`.ai/CODEX.md`), mas naquele momento o Codex estava sem tokens. O humano pediu a opiniao critica como product/UX engineer, e o Cursor respondeu nesse papel.

Importante para historico:

- analise nao foi feita por Codex;
- nao deve ser tratada como decisao de produto, e sim como sugestao;
- conclusoes precisam ser revalidadas por Codex e pelo humano antes de virar decisao formal em `DECISIONS.md`.

## Topic

Revisao critica do mock do link publico Bradesco Saude (`TASK-0050`) e dos materiais de discovery associados, antes da reuniao do humano com uma corretora especialista em Bradesco Saude prevista para 2026-05-11.

Objetivo: maximizar o valor do tempo curto da corretora, expor inconsistencias do produto, identificar o que nao mostrar para cliente final no MVP, e levantar perguntas que destravam decisoes de produto.

## Material analisado

- `.ai/discovery/BRADESCO-HEALTH.md`
- `.ai/discovery/BRADESCO-HEALTH-SALES-MATERIALS.md`
- `.ai/discovery/BRADESCO-HEALTH-PE-NETWORK.md`
- `.ai/discovery/BRADESCO-HEALTH-PE-NETWORK-LIST.md`
- `.ai/discovery/BRADESCO-HEALTH-PUBLIC-PREVIEW-MVC.md`
- `.ai/tasks/todo/TASK-0050-create-bradesco-health-public-preview-mock.md`
- `.ai/tasks/todo/TASK-0051-discover-bradesco-health-reimbursement-tables.md`

## Achados criticos

### P1 - Risco alto, afeta venda

**1. Nomenclatura de planos divergente entre 3 fontes.**

- Portal de cotacao: `Ideal 1`, `Nacional Flex`, `Nacional II`, `Nacional III`, `Nacional Plus`, `Premium`, `Saude Efetivo IV`.
- Portfolio comercial SPG: `Efetivo`, `Efetivo Plus`, `Flex`, `Ideal`, `Nacional`, `Nacional Plus`, `Premium`.
- PDF de rede PE: `Efetivo`, `Efetivo Plus`, `Flex`, `Ideal`, `Nacional II`, `Nacional III`, `Nacional Plus`, `Premium`.

Nao temos catalogo confirmando se `Nacional II`/`III` sao subprodutos do `Nacional`, sub-acomodacoes, ou produtos distintos. Cliente vai abrir o link e ver "Nacional II" sem contexto.

**2. Rede PE para `Nacional II` e tecnicamente fragil.**

`BRADESCO-HEALTH-PE-NETWORK.md` registra explicitamente que as colunas finais do PDF (Nacional II/III/Plus/Premium) ficam comprimidas e foram extraidas de forma conservadora, com aviso "validar visualmente antes de modelar contrato de dados". O mock mostra exatamente esses hospitais como argumento de venda.

**3. Cotacao real `Nacional II` PE nao traz 3 informacoes de decisao:**

- segmentacao assistencial (A+H+OB ou H+OB);
- coparticipacao (sim/nao/percentual);
- acomodacao (quarto/enfermaria/multiplo).

Sem isso, qualquer explicacao de reembolso, custo recorrente e uso pratico fica generica.

**4. Reembolso especifico tem escopo diferente entre A+H+OB e H+OB.**

- A+H+OB+RE: consultas medicas eletivas + honorarios medicos de paciente internado.
- H+OB+RE: consultas eletivas relacionadas a pre-natal, parto, puerperio + honorarios medicos de internado.

Hoje o mock fala "reembolso especifico" como conceito unico. Para Socios de empresa pequena, o segundo escopo seria quase nada.

**5. Coparticipacao nao aparece na cotacao.**

Toda Bradesco Saude SPG pode ser com ou sem coparticipacao de 30%. O preco mostrado no mock (`R$ 4.048,15/mes`) muda completamente a percepcao do cliente conforme tem ou nao copart.

### P2 - Risco medio, afeta apresentacao

**6. Categoria funcional macro vs por perfil.**

Portal pede checkbox `Socios e Diretores` na cotacao geral, e no perfil pede `Socios` como categoria. Nao sabemos se o sistema permite multiplos perfis com categorias diferentes, nem se isso muda preco.

**7. Carencia para SPG 3.**

Discovery diz que isencao/alivio de carencia geralmente vale para 30+ vidas. Cotacao de Socios vai ser SPG 3. Carencia padrao: 24h emergencia, 180 dias procedimentos, 300 dias parto. Mock nao explica isso.

**8. IOF e parcelas.**

Mock mostra `R$ 4.048,15/mes` e `Primeira parcela R$ 4.142,92`. Precisa confirmar se IOF e so na primeira ou se tem composicao especifica em saude.

**9. Dental conjugado.**

Cotacao mostra Dental, mas o mock empilha sem deixar claro se e opcional.

### P3 - Risco menor

**10. Cartoes Bradesco, Transferencia Bradesco, Desconto Folha.**

Discovery nao validou se afetam preco ou apenas cadastro.

**11. Faixas etarias acima de 53 anos.**

Discovery anotou pendencia de capturar via scroll horizontal. Para Socios mais velhos, pode importar.

## Diferenciacao dos niveis (clareza atual)

| Nivel | Definicao | Clareza hoje |
| --- | --- | --- |
| Plano comercial | Nome de marketing, ex.: `Nacional`, `Premium` | Confuso, 3 fontes divergentes |
| Codigo do plano | Registro ANS, ex.: `Efetivo Plus E CE copart` | Identificado mas nao exposto |
| Linha da rede referenciada | Chave dos PDFs de rede, ex.: `Nacional II`, `Nacional III` | Boa nos materiais; mapeamento para plano comercial em aberto |
| Acomodacao | Enfermaria, Quarto, Multiplo 2-10 | Confuso; `Multiplo N` nao foi traduzido para cliente |
| Regiao | Tarifaria, ex.: `Pernambuco` | Clara |
| Reembolso | Especifico/Completo, atrelado a municipio/regiao/plano | Confuso; depende tambem de A+H+OB vs H+OB |

Risco direto: o mock junta tudo em chips `Nacional II - Pernambuco - Reembolso especifico - Socios`. Pelo menos 3 desses 4 chips guardam camadas escondidas.

## Caso Nacional II x rede PE

Resposta honesta: provavelmente corresponde, com risco real de erro de coluna na extracao.

`BRADESCO-HEALTH-PE-NETWORK.md`:

> "O cabecalho dos planos nacionais fica muito apertado na tabela. A leitura por coordenada mostra colunas consistentes, mas ainda precisamos validar visualmente qual coluna final pertence a Nacional II, Nacional III, Nacional Plus e Premium."

`BRADESCO-HEALTH-PE-NETWORK-LIST.md`:

> "Nesta primeira lista, as colunas finais foram mantidas de forma conservadora como Nacional Plus Quarto e Premium Quarto; validar visualmente antes de modelar contrato de dados."

Tradução: a lista de hospitais Recife/Olinda/Jaboatao do mock pode ter sido extraida de coluna errada. Antes de usar para cliente real ou levar como prop para corretora, abrir o PDF e checar 3-4 hospitais (sugestao: Hospital Portugues, Hospital Esperanca, Hospital Memorial Guararapes) contra a coluna `Nacional II Quarto`.

## O que cliente final realmente precisa ver

Em ordem de impacto:

1. Preco real e estavel, incluindo se tem coparticipacao por uso.
2. Quem esta coberto (vidas + idade + faixa).
3. Onde posso ser atendido perto de mim (busca focada).
4. Quarto ou enfermaria.
5. O que acontece se eu usar fora da rede.
6. Carencia em linguagem humana.
7. Concierge/Meu Doutor/Novamed/telemedicina, filtrados pelo plano.
8. Pontos para confirmar com a corretora antes de assinar (lista curta).

Mock cobre 1, 2, 3, 5 e parte do 8. Falta 4, 6, 7 com filtragem por plano.

## O que NAO prometer no MVP

- Valor exato de reembolso (sem tabela validada; `TASK-0051` pendente).
- Tabela de coparticipacao (depende de proposta).
- Que a rede mostrada e a vigente.
- Carencia especifica da empresa cotada.
- Concierge/Extra Rol/Seguro Viagem em planos onde nao temos certeza.
- Que o cliente tera quarto ou enfermaria em qualquer prestador.
- Cobertura de procedimento especifico, ex.: "esse plano cobre cirurgia bariatrica".

## Avaliacao do mock TASK-0050

### Pontos fortes

- Mobile-only/mobile-first com frame centralizado em desktop.
- Hero com asset gerado e chips de contexto.
- Busca de rede com filtros por cidade e tipo.
- Tooltip para H/P.S/M/A/HDIA.
- Caution copy presente em rede e simulador.
- Separacao de assets bitmap (medica) vs CSS/SVG (background, marca d'agua) coerente para multi-tenant.

### Pontos fracos

- 6 tabs em mobile e demais para link consultivo.
- Simulador de reembolso ativo antes de tabela validada cria ancoragem numerica perigosa.
- FAQ com 8 perguntas pode virar PDF.
- Lista "pontos para confirmar" pode crescer e poluir.
- Mock fala "Plano Bradesco Saude Nacional II" no titulo. Confianca real vem da identidade da corretora, nao da Bradesco.

## Ajustes de UX recomendados antes de implementacao real

1. Cortar simulador para v0; substituir por secao explicativa + CTA WhatsApp. Reativar quando `TASK-0051` fechar.
2. Reduzir tabs para 4: `Resumo`, `Rede`, `Reembolso`, `FAQ`. Vidas e valores vira card dentro de Resumo. Observacoes desaparece e migra para "Pontos para confirmar com a corretora" no fim do Resumo.
3. Adicionar bloco curto de carencia em Reembolso ou Resumo, em texto humano.
4. Mostrar acomodacao no chip do hero quando conhecida; se nao, marcar como item a confirmar.
5. Validar rede PE visualmente antes de cravar lista. Sem isso, marcar cada item com badge "Lista preliminar".
6. WhatsApp da corretora persistente (botao flutuante mobile).
7. Identidade da corretora em primeiro plano. Bradesco em segundo plano.

## Top perguntas para a corretora amanha

Tempo estimado: 25-30 min. Sugestao de pauta: abrir o mock no celular e fazer perguntas em torno do que aparece nele.

### Bloco 1 - Plano e nomenclatura (5 min, P1)

1. Qual a relacao entre `Nacional`, `Nacional II`, `Nacional III`, `Nacional Plus` e `Premium`? Sao tiers do mesmo produto ou produtos distintos? Existe catalogo oficial?
2. O `Nacional II` que aparece na cotacao de PE e o mesmo `Nacional II` da tabela de rede credenciada?
3. Para Socios em Pernambuco com 3 vidas, qual a diferenca real entre `Nacional II`, `Nacional III` e `Nacional Plus` na pratica?

### Bloco 2 - Reembolso (5 min, P1)

4. A cotacao mostra `Reembolso especifico`. E A+H+OB ou H+OB? Onde isso aparece?
5. Em planos com reembolso especifico, qual a primeira frase que voces usam para explicar para o cliente?
6. Voces tem acesso a tabela de reembolso por plano? E por plano comercial ou por codigo ANS?

### Bloco 3 - Coparticipacao e preco (4 min, P1)

7. A cotacao de R$ 4.048,15/mes e com ou sem coparticipacao? Como o corretor sabe disso olhando o PDF?
8. As 11 parcelas pos-primeira sao iguais? IOF so na primeira?

### Bloco 4 - Acomodacao (3 min, P1)

9. Para `Nacional II` em Pernambuco, qual a acomodacao? Existe escolha entre quarto e enfermaria? O que muda no preco?

### Bloco 5 - Rede e pratica de venda (5 min, P1+P2)

10. (P1, mostrando o mock) Olhando essa tela de rede: tem hospital aqui que cliente em Recife quase nunca aceita? Tem hospital famoso de Recife que esse plano nao cobre?
11. (P2) Quais 2-3 perguntas o cliente faz que a Bradesco perde no comparativo contra Unimed/Hapvida/Amil?

### Bloco 6 - Carencia e contratacao (3 min, P2)

12. Para 3 vidas (Socios), qual a carencia basica que voces explicam de cara?
13. Quanto tempo entre assinar e usar de fato?

### Bloco 7 - Demo do mock (5 min, P1)

14. "Se voce usasse isso amanha com cliente real, o que voce cortaria, o que adicionaria, e o que esta te dando medo de mostrar?"

A pergunta 14 e a mais valiosa. Vai expor 3-4 coisas que nenhuma discovery captura.

## Acao recomendada antes da reuniao

Abrir o PDF `PE__Hospitais_Abril_26.pdf` em visualizador e checar visualmente se Hospital Portugues, Hospital Esperanca e Hospital Memorial Guararapes estao marcados na coluna `Nacional II Quarto`/`Nacional II Enfermaria`. Isso ja resolve um risco P1 antes da conversa.

## Files/Tasks afetadas

- `.ai/tasks/todo/TASK-0050-create-bradesco-health-public-preview-mock.md`
- `.ai/tasks/todo/TASK-0051-discover-bradesco-health-reimbursement-tables.md`
- `.ai/discovery/BRADESCO-HEALTH.md`
- `.ai/discovery/BRADESCO-HEALTH-SALES-MATERIALS.md`
- `.ai/discovery/BRADESCO-HEALTH-PE-NETWORK.md`
- `.ai/discovery/BRADESCO-HEALTH-PE-NETWORK-LIST.md`
- `.ai/discovery/BRADESCO-HEALTH-PUBLIC-PREVIEW-MVC.md`
- `.ai/DECISIONS.md` (potencial, depois da reuniao)

## Recommended Next Action

1. Validar visualmente a rede PE para `Nacional II` antes da reuniao com a corretora.
2. Conduzir reuniao com pauta baseada nas 14 perguntas, em ordem de prioridade.
3. Apos a reuniao, registrar respostas como atualizacao em `BRADESCO-HEALTH.md` (ou novo discovery `BRADESCO-HEALTH-BROKER-INTERVIEW-2026-05-11.md`).
4. Pedir Codex (quando voltar a ter tokens) revisar esta brainstorm e decidir o que vira:
   - decisao em `DECISIONS.md`;
   - ajuste em `TASK-0050` (cortar simulador, reduzir tabs, etc.);
   - acceleracao da `TASK-0051` se a corretora confirmar que tem acesso a tabela de reembolso.
5. So depois disso, mandar Claude implementar a versao revisada do mock.

Esta brainstorm nao deve virar implementacao direta. E pesquisa e revisao de UX para alimentar discovery e decisoes de produto.

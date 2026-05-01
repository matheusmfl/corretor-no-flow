# Relatorio Para Socio - Organizacao Da Pre-Venda V1

Data: 2026-05-01

## Em 30 Segundos

O brainstorm partiu de uma ideia central: o Corretor no Flow nao deve ser apenas um gerador de proposta bonita. Ele deve ajudar o corretor a vender melhor.

Na V1, o foco fica em pre-venda:

- expandir AUTO para Porto Seguro e depois familia Porto;
- transformar o link publico em uma pagina de comparacao mais persuasiva;
- medir comportamento do segurado no link;
- criar score simples de interesse: frio, morno ou quente;
- registrar status comercial da cotacao;
- criar agenda interna de renovacao e retomada;
- mapear Saude antes de desenvolver;
- deixar pos-venda e prospeccao como fases futuras bem documentadas.

O ponto mais importante: antes de codar features grandes, vamos maturar as ideias, mapear PDFs/regras reais e so depois criar tasks pequenas para execucao.

## Resumo

Organizamos o projeto para evoluir o Corretor no Flow como uma ferramenta de conversao para corretores, nao apenas como um gerador de PDF bonito.

A decisao principal foi manter a V1 focada em **pre-venda**: melhorar cotacoes, comparacoes, metricas de comportamento e oportunidades de renovacao. Pos-venda e prospeccao continuam importantes, mas foram separados como frentes futuras para nao abrir escopo demais agora.

## Decisao De Produto

### Pre-venda e o foco da V1

Pre-venda inclui tudo que ajuda o corretor antes do fechamento:

- transformar PDFs tecnicos em proposta clara;
- gerar link publico para o segurado;
- comparar seguradoras;
- medir interesse do cliente;
- ajudar o corretor a abordar no momento certo;
- criar oportunidades futuras de renovacao ou retomada.

### Pos-venda fica como fase separada

Pos-venda foi tratado como uma frente grande propria, com ideias como:

- portal do segurado;
- acesso por telefone;
- apolices e seguros contratados;
- cartao do segurado;
- telefones uteis;
- botao de emergencia;
- corretor assumir atendimento;
- possivel triagem com IA.

Essa frente tem muito valor, mas entra depois que a pre-venda estiver mais madura.

### Prospeccao tambem fica para fase futura

Tambem foram levantadas ideias de:

- materiais de apoio;
- conteudo com IA;
- email marketing;
- landing page do corretor;
- formularios de captura;
- perfil estilo linktree.

Essas ideias ficam documentadas, mas nao entram no ciclo atual.

## Seguradoras AUTO

A ordem de expansao planejada e:

1. Bradesco, que ja existe.
2. Porto Seguro.
3. Itau.
4. Sompo.
5. Azul.

A estrategia tecnica e tratar Porto Seguro como a base da chamada "familia Porto", porque Itau, Sompo e Azul parecem ter PDFs e estrutura parecidos.

Antes de implementar, vamos mapear PDFs reais. Isso evita criar um parser isolado para Porto e depois descobrir que nao reaproveita bem para as outras marcas.

## Descoberta Inicial Da Porto

Foram analisados dois PDFs da Porto:

- cotacao completa;
- cotacao incompleta.

Conclusao inicial:

- o PDF incompleto ja traz os dados principais para uma primeira versao;
- o PDF completo traz mais detalhes legais, clausulas e explicacoes;
- ambos devem ser usados para testar a robustez da extracao;
- pagamento da Porto provavelmente precisa de parser deterministico, porque as tabelas sao complexas.

Campos importantes encontrados:

- segurado;
- principal condutor;
- bonus;
- veiculo;
- uso do veiculo;
- franquia;
- premio total;
- RCF;
- vidros;
- assistencia;
- descontos;
- Porto Bank;
- formas de pagamento.

## Metricas E Conversao

A direcao escolhida foi transformar metricas em informacao comercial simples.

Nao queremos apenas registrar "abriu o link". Queremos entender sinais como:

- abriu mais de uma vez;
- clicou no WhatsApp;
- viu uma seguradora especifica;
- abriu PDF;
- voltou depois;
- comparou opcoes.

A primeira versao do score sera por regras simples, sem IA:

- frio;
- morno;
- quente.

A ideia e ajudar o corretor a saber quando e como abordar o cliente.

## Renovacao E Oportunidades

Renovacao foi tratada como parte da pre-venda.

Mesmo quando o cliente nao fecha agora, ele pode virar oportunidade no futuro. Quando fecha, tambem vira oportunidade de renovacao no vencimento da apolice.

Decisao tomada:

- comecar com agenda interna para o corretor;
- sem mensagem automatica para o cliente no primeiro momento;
- corretor marca status manualmente, como ganhou, perdeu, em negociacao ou sem resposta.

## Saude

Saude nao vai direto para codigo.

Primeiro sera feito um mapeamento humano:

- quais campos aparecem nos PDFs;
- como comparar planos;
- o que o segurado precisa entender;
- quais informacoes sao sensiveis;
- qual seguradora deve ser a primeira.

Essa decisao evita criar um schema errado cedo demais.

## Workflow De Trabalho

Tambem organizamos o fluxo de trabalho entre humano, Codex e Claude.

O fluxo agora e:

```txt
Brainstorm
  -> maturacao estrategica
  -> discovery ou roadmap
  -> task pequena
  -> Claude executa
  -> Codex revisa
  -> humano testa
```

A regra principal:

> Se Claude precisa decidir produto, a task ainda nao esta madura.

Isso reduz risco de tarefas grandes demais e ajuda a manter as decisoes de produto com os socios.

## Estrutura Criada

Foi criada uma area `.ai/` no repositorio para organizar o trabalho:

- `PRODUCT-MEMORY.md`: memoria viva do produto;
- `DECISIONS.md`: decisoes importantes;
- `STRATEGIC-MATURATION.md`: como ideias viram tasks;
- `roadmap/`: planos por fase;
- `discovery/`: mapeamentos e pesquisas;
- `tasks/`: tarefas executaveis;
- `brainstorm/`: notas de sessoes importantes;
- `pdf-lab/`: laboratorio local para analisar PDFs;
- `kanban/`: visualizacao das tasks.

Tambem existe um Kanban local para mover tasks entre status.

## Proxima Etapa Recomendada

Continuar a maturacao da Porto Seguro antes de pedir implementacao ao Claude.

Proximos passos:

1. Decidir quais campos da Porto entram no MVP.
2. Separar "core AUTO" de "extras Porto".
3. Criar uma task especifica para parser de pagamento Porto.
4. Criar uma task separada para extracao core Porto.
5. Gerar mais PDFs com variacoes de cobertura quando possivel.

## Conclusao

A organizacao atual deixa o projeto mais controlado.

O foco imediato fica em fortalecer a pre-venda, principalmente com Porto Seguro e metricas comerciais. Pos-venda e prospeccao continuam no radar, mas sem comprometer o andamento da V1.

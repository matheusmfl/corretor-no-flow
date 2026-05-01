# Fluxo de Trabalho do Projeto

Este arquivo e um resumo simples do nosso jeito de trabalhar com produto, Codex, Claude e tasks.

## Ideia principal

Nem toda ideia vira task direto.

O fluxo correto e:

```txt
Brainstorm
  -> maturacao estrategica
  -> discovery ou roadmap
  -> task pequena
  -> Claude executa
  -> Codex revisa
  -> humano testa
```

## Papeis

**Humano/orquestrador**

- Traz ideias e prioridades.
- Aprova direcao de produto.
- Decide o que Claude deve executar.
- Testa o resultado final.

**Codex**

- Ajuda a maturar ideias.
- Avalia risco, complexidade e impacto tecnico.
- Le o codigo quando precisar orientar uma task.
- Cria discovery, roadmap e tasks.
- Revisa o que Claude implementou.

**Claude**

- Executa tasks pequenas e bem definidas.
- Segue TDD no backend.
- Move a task para review quando terminar.

## Estrutura de pastas

```txt
.ai/
  LEIA-ME-FLUXO.md              resumo rapido do fluxo
  STRATEGIC-MATURATION.md       regra de como amadurecer ideias
  PRODUCT-MEMORY.md             memoria viva do produto
  DECISIONS.md                  decisoes importantes
  WORKFLOW.md                   fluxo completo dos agentes
  CODEX.md                      papel do Codex

  roadmap/                      direcao macro e ordem das frentes
  discovery/                    pesquisa, mapeamento e ideias ainda nao prontas
  tasks/                        tasks executaveis por status
  templates/                    modelos de task, review e brainstorm
  scripts/                      scripts locais
  kanban/                       HTML do kanban
  pdf-lab/                      laboratorio local para extrair PDFs
```

## Onde cada coisa deve ir

**Ideia solta**

Vai para conversa com Codex ou, se precisar registrar, para um arquivo de brainstorm/discovery.

**Ideia que precisa ser entendida melhor**

Vai para `.ai/discovery/`.

Exemplos:

- Mapear PDF da Porto.
- Entender PDF de Saude.
- Pensar portal de pos-venda.

**Direcao macro**

Vai para `.ai/roadmap/`.

Exemplo:

- `.ai/roadmap/PRE-SALE-V1.md`

**Task pronta para executar**

Vai para `.ai/tasks/todo/`.

Uma task pronta precisa ter:

- contexto
- objetivo
- escopo
- fora de escopo
- criterios de aceite
- riscos
- cenario de erro
- checklist humano
- TDD obrigatorio se for backend

## Status das tasks

```txt
.ai/tasks/todo          pronta para executar
.ai/tasks/in-progress   em execucao
.ai/tasks/review        aguardando revisao do Codex
.ai/tasks/done          aceita e concluida
.ai/tasks/discarded     descartada
```

## Kanban

Para abrir o Kanban interativo:

```bash
npm run dev:kanban
```

Depois abra:

```txt
http://localhost:4173
```

Arrastar um card entre colunas move o arquivo `.md` entre as pastas de status.

Se quiser apenas regenerar o HTML:

```bash
node .ai/scripts/build-kanban.mjs
```

## Laboratorio de PDF

Use quando formos mapear seguradoras novas ou variacoes de PDF.

1. Coloque PDFs em:

```txt
.ai/pdf-lab/input
```

2. Rode:

```bash
npm run pdf:extract -- --output-name auto_porto_seguro_reduzido --insurer porto_seguro --variant reduzido
```

3. Leia os arquivos gerados em:

```txt
.ai/pdf-lab/output
```

Esses inputs e outputs nao devem ir para o Git, porque podem conter dados sensiveis.

## Regra de ouro

Se Claude precisar decidir produto, a task ainda nao esta madura.

Nesse caso, volta para maturacao estrategica ou discovery antes de implementar.


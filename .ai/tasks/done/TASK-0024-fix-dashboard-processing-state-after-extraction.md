---
id: TASK-0024
title: Corrigir estado de processamento no dashboard apos extracao concluir
status: todo
kind: implementation
lifecycle: open
area: dashboard
owner: claude
reviewer: codex
complexity: medium
risk: medium
tdd_required: true
created_at: 2026-05-01
---

# TASK-0024 - Corrigir estado de processamento no dashboard apos extracao concluir

## Context

Durante o QA da extracao Bradesco/Porto, os logs instrumentados na TASK-0020 mostraram que o backend conclui o processamento em poucos segundos:

- Bradesco: `totalMs` em torno de 2.6s a 3.3s.
- Porto Seguro: `totalMs` em torno de 2.1s a 3.7s.
- Ambos chegam a `dbWrite` e `[TIMING]` rapidamente.

Mesmo assim, a experiencia no dashboard parece ficar em "processando" por muito mais tempo. Isso indica que o gargalo percebido pelo usuario provavelmente esta no frontend: polling, cache, refetch, invalidacao de query, estado local, status esperado incorreto, ou a tela aguardando uma condicao diferente da conclusao real do backend.

Observacoes de QA:

- Algumas vezes, ao clicar no botao de acompanhar processamento, o fluxo parece "agilizar". Isso pode indicar que a navegacao/clique esta forçando um refetch ou lendo dados mais atualizados que a tela anterior nao buscou sozinha.
- Tambem pode haver confusao de percepcao humana: ao subir o primeiro PDF e depois gastar tempo procurando o segundo arquivo no diretorio, o primeiro ja pode estar processando em background. Nesse caso, a sensacao de demora entre seguradoras pode estar contaminada pelo tempo gasto selecionando arquivos, nao pelo tempo real de processamento.

## Objective

Investigar e corrigir o fluxo do dashboard para que a UI saia do estado de processamento assim que a API indicar que as cotacoes do processo terminaram de processar.

## Scope

- Mapear o fluxo de upload/nova cotacao no dashboard.
- Identificar qual endpoint/status o frontend usa para acompanhar processamento.
- Confirmar quais statuses o backend grava ao concluir com sucesso ou falha.
- Corrigir polling/refetch/cache/estado local para refletir o fim do processamento.
- Verificar se o botao de acompanhar processamento dispara refetch/navegacao que atualiza o estado mais rapido que o fluxo automatico.
- Garantir que `PENDING_REVIEW` ou outro status final esperado faca a UI avancar para a etapa correta.
- Garantir que falhas (`FAILED`) tambem encerrem o estado de loading e mostrem acao recuperavel.
- Evitar loops de polling desnecessarios depois que todas as cotacoes do processo tiverem status final.

## Out Of Scope

- Nao otimizar Groq ou prompt nesta task.
- Nao alterar parsers de seguradora.
- Nao mudar contrato publico do link compartilhado.
- Nao redesenhar a tela inteira; foco e estado/fluxo.

## Likely Files

- `apps/dashboard/src/app/**`
- `apps/dashboard/src/components/**`
- `apps/dashboard/src/lib/**`
- `apps/dashboard/src/hooks/**`
- `apps/api/src/modules/quotes/**` somente se for necessario confirmar contrato/status.

## TDD Requirement

Dashboard task. Adicionar ou ajustar testes quando houver cobertura existente para:

- polling/refetch apos upload;
- transicao de status de cotacao/processo;
- renderizacao de estado processing/success/error.

Se a cobertura atual nao existir ou for muito cara, documentar QA manual e manter a alteracao pequena.

## Acceptance Criteria

- [ ] Frontend identifica corretamente quando todas as cotacoes do processo sairam de processamento.
- [ ] UI deixa de mostrar "processando" quando o backend retorna status final, especialmente `PENDING_REVIEW`.
- [ ] Status `FAILED` nao deixa a tela presa em loading infinito.
- [ ] Polling/refetch para ou reduz apos conclusao.
- [ ] A correcao nao depende de timeout arbitrario longo para "parecer" concluida.
- [ ] Testes passam ou QA manual esta documentado.

## Implementation Notes

Ponto de partida sugerido:

1. Encontrar a tela/componente que mostra o estado de processamento apos upload.
2. Encontrar onde o dashboard chama a API para buscar quote process/quotes.
3. Verificar se a condicao de conclusao considera apenas um status antigo ou incorreto.
4. Validar se o cache/query e invalidado depois do upload e durante o polling.
5. Confirmar se o frontend espera `COMPLETED`, mas o backend grava `PENDING_REVIEW`.
6. Comparar o comportamento automatico com o comportamento apos clicar em acompanhar processamento.

## Risks

- Se a UI parar polling cedo demais, pode mostrar cotacoes incompletas.
- Se a UI nao tratar `FAILED`, o usuario pode ficar sem saber que precisa reenviar ou revisar.

## Failure Scenario

O backend termina o processamento em 2-4 segundos, mas o corretor espera muito mais tempo porque a tela continua presa no estado "processando".

## Human QA Checklist

- [ ] Subir API e dashboard.
- [ ] Criar nova cotacao com Bradesco.
- [ ] Confirmar que a UI sai de "processando" poucos segundos apos o backend logar `[TIMING]`.
- [ ] Criar nova cotacao com Porto Seguro.
- [ ] Confirmar o mesmo comportamento.
- [ ] Testar o fluxo sem clicar em acompanhar processamento.
- [ ] Testar o fluxo clicando em acompanhar processamento e comparar se o clique acelera a atualizacao visual.
- [ ] Simular ou observar falha de processamento e confirmar que a UI nao fica em loading infinito.

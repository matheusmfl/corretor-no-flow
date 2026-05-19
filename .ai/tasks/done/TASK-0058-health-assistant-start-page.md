---
id: TASK-0058
title: Assistente Inicial Saude — tela Como voce quer comecar
status: done
kind: implementation
lifecycle: done
area: dashboard
owner: claude
reviewer: codex
complexity: low
risk: low
tdd_required: false
created_at: 2026-05-13
---

# TASK-0058 - Assistente Inicial Saúde

## Objective

Criar tela de seleção em `/dashboard/quotes/health/` com 4 cards de entrada para o fluxo de cotação Saúde.

## Acceptance Criteria

- [x] Tela em `/dashboard/quotes/health/page.tsx` com 4 cards.
- [x] Card "Importar PDF da seguradora" marcado como recomendado, link para `/health/upload`.
- [x] Outros 3 cards desabilitados com "Em breve".
- [x] Design consistente com o sistema de cores mahogany/surface/ink.

## Implementation Notes (2026-05-13)

- Arquivo criado: `apps/dashboard/src/app/(app)/dashboard/quotes/health/page.tsx`
- Componente `StartCard` com variante primária (recomendado) e desabilitada.
- "Importar PDF" navega para `/dashboard/quotes/health/upload` (implementado na TASK-0059).
- TypeScript limpo, sem testes (frontend puro).

## Codex review (2026-05-13)

**Veredito:** pronto para mover para `done` do ponto de vista de escopo da TASK-0058; nenhum P0/P1 bloqueante.

**Critérios (task):** 4 cards; PDF recomendado; outros três desabilitados com “Em breve”; paleta mahogany/surface/ink — atendido em `page.tsx`.

**Notas (não são bloqueios):**

- [P3] **Copy duplicada:** cada card desabilitado mostra “Em breve” e o rodapé repete a ideia (“Outros modos…”). Aceitável para protótipo; pode unificar depois.
- [P3] **Acessibilidade:** cards desabilitados são `div` estáticos (sem `aria-disabled` / sem papel de botão). Para MVP ok; melhorias podem vir de uma task de a11y geral.
- [P3] **Rota na AC vs código:** a AC original cita `/health/upload`; o código e as notas usam `/dashboard/quotes/health/upload`, alinhado ao App Router e à TASK-0059 — não exigir mudança de rota aqui.

**Fora de escopo (tasks futuras — não cobrar nesta revisão):** upload real, extração, review com dados reais (0059+), planilha/link público (0060+), wiring XLSX (0062). Os três placeholders desabilitados cobrem intenção explícita de “em breve”.

## Codex final review (2026-05-14)

**Veredito:** aprovado para `done`.

**Findings:** nenhum P0/P1/P2. O escopo é isolado, os 4 cards existem, o card recomendado aponta para `/dashboard/quotes/health/upload` e os demais ficam desabilitados como "Em breve".

**Validação:** lint direcionado do dashboard passou incluindo `apps/dashboard/src/app/(app)/dashboard/quotes/health/page.tsx`.

---
id: TASK-0049
title: Transformar etapa final em workspace editavel da proposta
status: todo
kind: discovery
lifecycle: open
area: dashboard
owner: codex
reviewer: human
complexity: medium
risk: medium
tdd_required: false
created_at: 2026-05-10
---

# TASK-0049 - Transformar etapa final em workspace editavel da proposta

## Context

`TASK-0042` introduces the technical/product base for selecting which READY quotes enter the generated PDF and public link.

Human product direction after reviewing that flow:

- The final screen should not behave like a one-time wizard step that ends after link creation.
- The broker should be able to return to a client's quote process and land in a final proposal workspace.
- The public link should remain the same URL/token, but its visible quote set should be editable by the broker.
- The broker may need to hide/show quotes after the first publication without sending a new link to the client.
- This page can become a light CRM surface for the proposal: public link, visibility management, preview, future metrics, and follow-up context.

This task should mature the product/UX concept before implementation. It should not compete with `TASK-0042`; instead, it should use `publicQuoteIds` and quote selection from `TASK-0042` as the foundation.

## Objective

Design the final quote generation page as an editable client proposal workspace where the broker can manage the public link, visible quotes, generated PDFs, and future engagement metrics without creating a new link for every adjustment.

## Product Principles

- The public link is a living proposal page, not only a generated artifact.
- PDFs are generated artifacts; the public link is editable configuration.
- The broker must understand when changes are draft vs already published to the client.
- Hiding a quote from the link must not delete it from the process.
- The main path should stay calm and fast; advanced management should be available without overwhelming the page.
- The page should feel like a work surface for a real client proposal, not a marketing landing page or a generic settings panel.

## Proposed UX Shape

Top area:

- Client/proposal header with client name, product, vehicle summary when available, and process status.
- Public link status: not published, published, expired, opened by client.
- Link actions: copy link, open link, share via WhatsApp.
- Primary action based on state: publish link, update public link, or copy/share after publication.

Main management area:

- `Material visivel no link` section listing quotes currently visible to the client.
- Compact quote rows/cards with insurer/product, premium, deductible/franchise, and key coverage chips.
- Visibility control per quote: `Visivel no link` / `Oculta`.
- Clear label for hidden quotes: `Oculta do cliente`.
- Guardrail: at least one READY quote must remain visible before publishing/updating.

Draft/published state:

- When the broker changes visible quotes after publication, show a clear state such as `Alteracoes nao publicadas`.
- Provide actions: `Atualizar link publico` and `Descartar alteracoes`.
- Preserve the same `publicToken` when updating visible quotes.
- Show last published/update timestamp when available or when the backend can support it later.

Preview and metrics area:

- Provide `Ver como cliente` or equivalent preview action.
- Reserve a future `Atividade do cliente` area for:
  - link opened;
  - last opened at;
  - open count;
  - insurer/quote viewed;
  - WhatsApp click;
  - PDF download.
- It is acceptable for metrics to show an honest placeholder in this task if tracking is not ready.

## Scope

- Produce a UX/product proposal for turning the current generation page into a proposal workspace.
- Define which parts should be implemented immediately vs later.
- Decide how `publicQuoteIds` should behave after a link is already published.
- Define the draft vs published interaction for changing visible quotes.
- Define how PDF generation relates to public-link visibility.
- Identify whether backend needs extra fields such as last link update timestamp, draft selection, or explicit publish history.
- Recommend whether implementation should be split into follow-up tasks.

## Out Of Scope

- Do not implement code changes in this discovery task.
- Do not build full CRM functionality.
- Do not implement client-side request for new coverage options yet.
- Do not implement automatic ranking, best price, or best coverage highlights.
- Do not change extraction/parsing.
- Do not replace `TASK-0042`; this task should build on it.

## Likely Files

- `apps/dashboard/src/app/(app)/dashboard/quotes/[processId]/generate/page.tsx`
- `apps/dashboard/src/app/(public)/c/[token]/page.tsx`
- `apps/dashboard/src/lib/api/quote-process.api.ts`
- `apps/api/src/modules/quotes/application/use-cases/generate-link.use-case.ts`
- `apps/api/src/modules/public/application/use-cases/get-public-process.use-case.ts`
- `apps/api/prisma/schema.prisma`
- `.ai/tasks/review/TASK-0042-select-quotes-before-pdf-and-public-link-generation.md`

## Executor Context Pack

Read these files first, in order:

1. `.ai/tasks/review/TASK-0042-select-quotes-before-pdf-and-public-link-generation.md`
2. `apps/dashboard/src/app/(app)/dashboard/quotes/[processId]/generate/page.tsx`
3. `apps/dashboard/src/app/(public)/c/[token]/page.tsx`
4. `apps/api/src/modules/quotes/application/use-cases/generate-link.use-case.ts`
5. `apps/api/src/modules/public/application/use-cases/get-public-process.use-case.ts`
6. `apps/api/prisma/schema.prisma`

Use `rg` only for:

- `publicQuoteIds`
- `publicToken`
- `openedAt`
- `PUBLISHED`
- `publishProcess`
- `generatePdf`
- `QuoteEventType`

If more than 6 additional files seem necessary, stop and explain why before continuing.

## TDD Requirement

No TDD required for this discovery task. If this becomes implementation:

- backend behavior around updating an existing published link needs tests;
- public process filtering by visible quote IDs needs regression tests;
- dashboard behavior should have component tests if a local frontend test pattern exists, otherwise manual QA must be documented.

## Acceptance Criteria

- [ ] Proposal describes the final page as a client proposal workspace, not a one-time generation step.
- [ ] Proposal distinguishes generated PDFs from editable public-link visibility.
- [ ] Proposal explains how the same public URL can be updated without issuing a new link.
- [ ] Draft vs published changes are defined.
- [ ] Quote visibility management is described with UX labels and guardrails.
- [ ] Future metrics/CRM area is defined without requiring full implementation now.
- [ ] Risks and implementation split are documented.
- [ ] Follow-up implementation tasks can be created from the proposal.

## Risks

- If link content changes silently, the broker may not know what the client is seeing.
- If PDF and public-link behavior are mixed, generated artifacts may not match current link visibility.
- If the page becomes too large, the final step may feel heavy and slow instead of useful.
- If every change immediately updates the live link, the broker loses the chance to prepare a curated version before publishing.
- If every change requires a new link, the client experience becomes fragmented.

## Failure Scenario

The broker publishes a link, the client asks for an adjusted option, and the broker has no pleasant place to manage the proposal. They either send a new link, lose context, or edit visibility in a way that is unclear and risky.

## Human QA Checklist

- [ ] Human confirms that the broker should be able to update the same public link after publication.
- [ ] Human confirms preferred language for quote visibility: `Visivel no link`, `Oculta do cliente`, or alternatives.
- [ ] Human confirms whether PDF and public link should be treated as independent surfaces.
- [ ] Human confirms whether metrics placeholders are acceptable before full tracking is implemented.

---
id: TASK-0050
title: Criar mock MVC do link publico Bradesco Saude
status: todo
kind: implementation
lifecycle: open
area: frontend
owner: claude
reviewer: human
complexity: medium
risk: medium
tdd_required: false
created_at: 2026-05-10
---

# TASK-0050 - Criar mock MVC do link publico Bradesco Saude

## Context

Estamos descobrindo o produto Bradesco Saude. Ja existe uma cotacao real analisada, mas o mock deve usar apenas dados ficticios. O objetivo desta task e criar uma primeira demonstracao visual do link publico para cliente, com foco em percepcao de valor, rede referenciada pesquisavel e explicacoes simples.

Este mock nao representa backend final, extracao final ou regra definitiva de produto. Saude e complexo; a tela deve comunicar valor e abrir espaco para maturacao.

## Objective

Criar uma primeira tela/mock mobile navegavel do link publico de uma cotacao Bradesco Saude, usando o exemplo de `Nacional II` em Pernambuco, com dados ficticios, imagem de hero ja gerada e amostra de rede referenciada de Recife, Olinda e Jaboatao dos Guararapes.

## Source UX Brief

Ler primeiro:

- `.ai/discovery/BRADESCO-HEALTH-PUBLIC-PREVIEW-MVC.md`

Asset do hero:

- Repo path: `.ai/assets/bradesco-health-preview/doctor-hero-header.png`
- Absolute path: `C:\Users\mathe\Desktop\codigos 2026\corretor-no-flow\.ai\assets\bradesco-health-preview\doctor-hero-header.png`

Documentos de apoio:

- `.ai/discovery/BRADESCO-HEALTH.md`
- `.ai/discovery/BRADESCO-HEALTH-PE-NETWORK.md`
- `.ai/discovery/BRADESCO-HEALTH-PE-NETWORK-LIST.md`
- `.ai/discovery/BRADESCO-HEALTH-SALES-MATERIALS.md`

## Mock Data

Use somente dados ficticios para pessoas e corretora.

- Seguradora: Bradesco Saude
- Plano: Nacional II
- Regiao: Pernambuco
- Perfil: Socios
- Reembolso: Especifico
- Vidas: 3
- Saude: R$ 3.981,76
- Dental: R$ 66,39
- Total mensal: R$ 4.048,15
- Primeira parcela com IOF: R$ 4.142,92

Vidas:

- Ana Souza, 42 anos
- Bruno Lima, 38 anos
- Clara Lima, 12 anos

Corretora ficticia:

- Corretora Exemplo

## UX Requirements

The screen should feel like a premium consultative report, not like a copied PDF table.

First viewport must include:

- hero/header using `.ai/assets/bradesco-health-preview/doctor-hero-header.png`;
- fictitious broker logo/identity area;
- title `Plano Bradesco Saude Nacional II`;
- monthly total highlight;
- chips for `3 vidas`, `Pernambuco`, `Reembolso especifico`, `Perfil socios`;
- CTA or anchor to `Ver rede credenciada`.

This task is mobile-first and mobile-only for the current mock. On larger screens, render the mobile experience centered in the page with a constrained phone-like width. Do not design a full tablet/desktop proposal page yet.

Use tabs as the primary navigation:

- Resumo
- Vidas e valores
- Rede credenciada
- Reembolso
- FAQ
- Observacoes

Horizontal scroll can be used only inside dense comparison/table sections. Do not make horizontal scrolling the main navigation because the public client link should be easy on mobile.

Layout direction:

- one-column content;
- centered mobile frame on desktop;
- compact hero;
- card-based sections;
- sticky or easy-to-reach tab/navigation area if it fits existing patterns;
- CTA to contact/send question to broker visible in important decision moments.

## Reimbursement Simulator Requirements

Include a demonstrative reimbursement simulator in the `Reembolso` tab/section.

Important: this is not an official calculation. We do not yet have a validated reimbursement table for the quoted `Nacional II` plan. Use mock values and make the uncertainty explicit.

Suggested UI:

- Eyebrow: `Simulador de reembolso`
- Text: `Atendeu fora da rede? Simule quanto seu plano poderia reembolsar.`
- Select: `Tipo de atendimento`
- Options: `Consulta medica`, `Honorarios medicos`, `Exame simples`
- Money input: `Valor pago ao medico (R$)`
- Result card: `Reembolso estimado` and `Custo final para voce`
- Caution text: `Valores estimativos para demonstracao. O reembolso real depende da tabela do plano, regras do produto, documentos apresentados e analise da Bradesco Saude.`
- Action: `Enviar duvida para corretora`

Example mock calculation:

- `Consulta medica`: limit `R$ 120,00`
- paid value `R$ 300,00`
- estimated reimbursement `R$ 120,00`
- final cost `R$ 180,00`

The simulator should feel useful and concrete, but must not imply official reimbursement approval.

## Rede Credenciada Requirements

Build a mock searchable network section.

Controls:

- search field with magnifying-glass icon;
- city filter: Recife, Olinda, Jaboatao;
- type filter: Hospitais, Laboratorios;
- attendance filter: Hospital, Pronto Socorro, Maternidade, Ambulatorio, Hospital Dia.

Hospital examples:

- Recife: Hospital Portugues
- Recife: Hospital Santa Joana
- Recife: Hospital Esperanca
- Recife: Hospital Jayme da Fonte
- Recife: HOPE
- Olinda: Hospital Esperanca Olinda
- Olinda: CLINOPE
- Jaboatao dos Guararapes: Hospital Memorial Guararapes
- Jaboatao dos Guararapes: Clinica N. Sra. da Piedade

Use badges and tooltips:

- `H`: Hospital
- `P.S`: Pronto Socorro
- `M`: Maternidade
- `A`: Ambulatorio
- `HDIA`: Hospital Dia

Show caution copy:

`Rede referenciada com base em material de abril/2026. A rede pode mudar; confirme a disponibilidade com a corretora antes da contratacao.`

## FAQ Requirements

Include an FAQ section with concise, client-friendly questions:

- Esse valor e mensal?
- O que significa reembolso especifico?
- A rede credenciada e garantida?
- Posso pesquisar hospitais por cidade?
- Esse plano cobre maternidade ou pronto socorro?
- Por que o PDF original e diferente dessa tela?
- O que eu devo confirmar antes de contratar?

Use the answers from `.ai/discovery/BRADESCO-HEALTH-PUBLIC-PREVIEW-MVC.md`.

## Visual Requirements

- Use a restrained healthcare palette with blue, teal, white and small warm accent.
- Use icons for search, info/tooltips, filters and actions.
- Use tooltips for product terms and abbreviations.
- Do not expose sensitive or real client/corretor data.
- Do not rely on official Bradesco or broker assets unless already available and approved.
- Do not make a marketing landing page; this is a usable client preview.
- Avoid oversized long tables in the first viewport.

## Scope

- Build the frontend mock/prototype in the most appropriate local place after reading the repo structure.
- It can be a static mock route, component, or isolated preview page, as long as it is easy for the human to open and review.
- Use mock data locally in the component/file.
- Preserve existing app patterns and design conventions.
- Add brief comments only where useful.

## Out Of Scope

- Do not implement backend extraction.
- Do not change database schema.
- Do not integrate real Bradesco API or official network lookup.
- Do not implement authentication changes.
- Do not use real customer, broker, CPF, CNPJ, email or phone data.
- Do not claim the network is final or guaranteed.

## Executor Context Pack

Read these files first, in order:

1. `.ai/discovery/BRADESCO-HEALTH-PUBLIC-PREVIEW-MVC.md`
2. `.ai/discovery/BRADESCO-HEALTH.md`
3. `.ai/discovery/BRADESCO-HEALTH-PE-NETWORK.md`
4. `.ai/discovery/BRADESCO-HEALTH-PE-NETWORK-LIST.md`
5. `apps/dashboard/src/app/(public)/c/[token]/page.tsx`
6. `apps/dashboard/src/app/(app)/dashboard/quotes/[processId]/generate/page.tsx`
7. `package.json`

Use `rg` only for:

- `public`
- `tooltip`
- `Tabs`
- `lucide-react`
- `Badge`
- `Card`
- `Quote`
- `Public`

If more than 6 additional files seem necessary, stop and explain why before continuing.

## TDD Requirement

No TDD required for this mock. If a component test pattern already exists and the implementation touches reusable public-link components, add a small smoke test. Otherwise, manual QA with screenshot is acceptable.

## Acceptance Criteria

- [ ] A reviewable frontend mock exists and can be opened locally.
- [ ] The hero uses `.ai/assets/bradesco-health-preview/doctor-hero-header.png`.
- [ ] The mock uses only fictitious person/broker data.
- [ ] The first viewport communicates plan, monthly price, lives, region and reimbursement mode.
- [ ] The network section has search/filter UI for Recife, Olinda and Jaboatao.
- [ ] Hospital capability badges have tooltips.
- [ ] FAQ is present with client-friendly explanations.
- [ ] Reimbursement-specific explanation is present and cautious.
- [ ] Demonstrative reimbursement simulator is present with mock values and caution copy.
- [ ] Network caution copy is visible.
- [ ] The mock is mobile-only/mobile-first and appears centered with constrained width on larger screens.
- [ ] Mobile uses tabs or similarly low-friction navigation.
- [ ] Dense comparisons, if present, use contained horizontal scroll only.
- [ ] Visual QA is performed on desktop/tablet and mobile widths.

## Risks

- If the mock looks like an official Bradesco proposal, it may imply legal certainty that we do not have.
- If the network list is presented as final, the client may trust outdated provider data.
- If the layout relies too much on horizontal scroll, mobile users may miss important sections.
- If the FAQ is too long, the page becomes another PDF.

## Human QA Checklist

- [ ] Human confirms the visual direction feels premium enough for a broker/client demo.
- [ ] Human confirms whether tabs or horizontal sections feel better on mobile.
- [ ] Human confirms whether the FAQ tone is clear and not too legalistic.
- [ ] Human confirms whether the network search is valuable enough for the next MVP slice.

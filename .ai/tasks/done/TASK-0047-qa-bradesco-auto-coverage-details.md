---
id: TASK-0047
title: QA Bradesco Auto coverage details
status: done
kind: qa
lifecycle: closed
area: dashboard
owner: human
reviewer: codex
complexity: low
risk: medium
tdd_required: false
created_at: 2026-05-08
---

# TASK-0047 - QA Bradesco Auto coverage details

## Context

`TASK-0046` enriched Bradesco Auto extraction/display for Tradicional, Auto Classic, and Seguro Auto Lar.

This changed human-facing surfaces:

- broker review screen;
- generated PDF;
- public quote link.

Workflow requires human QA for frontend/PDF/public-link changes before final acceptance.

## Objective

Confirm that Bradesco Auto coverage details appear correctly and do not confuse Auto Lar residential coverages with Auto coverages.

## Scope

- Upload/process the three Bradesco samples from the PDF lab or equivalent real PDFs:
  - Tradicional completo;
  - Bradesco Seguro Auto Classic;
  - Seguro Auto Lar.
- Inspect review screen.
- Generate PDF.
- Open public link.

## Acceptance Criteria

- [ ] Tradicional shows assistance 200 km, Vidro Protegido Plus Logomarca, Auto Reserva Plus 07 Dias, Martelinho, Reparo rapido, Troca de para-choque, Rodas/Pneus/Suspensao, and Logomarca.
- [ ] Auto Classic shows assistance 200 km, Vidro Protegido Plus, Martelinho/Reparo rapido, and no false carro reserva.
- [ ] Seguro Auto Lar shows assistance 400 km, Vidro Protegido Plus, Auto Reserva 07 Dias, and does not mix residential LMI/premium into Auto coverages.
- [ ] Generated PDF displays Reparo rapido and Troca de para-choque when contracted.
- [ ] Public link displays Reparo rapido and Troca de para-choque when contracted.
- [ ] Labels are understandable to the broker/client and do not expose confusing catalog noise.

## QA Findings

- [ ] Public link card title uses deductible type (`Bradesco — Obrigatoria`, `Bradesco — Reduzida`) instead of product/variant (`Bradesco Tradicional`, `Bradesco Auto Classic`, `Bradesco Auto Lar`). Deductible type is useful, but should not replace the product title.
- [ ] Public link should show deductible/franchise as a separate label when relevant, because it helps explain the quote difference without turning the card title into a franchise label.
- [ ] Glass coverage labels need catalog explanation. `Reparo de Para-Brisa` is self-explanatory; `Vidro Protegido` should clarify para-brisa + side windows; `Vidro Protegido Plus` should clarify that it includes all windows plus headlights, lanterns and sunroof; `Logomarca` variants should preserve that extra attribute.
- [ ] The current public link chip `Vidros Vidro Protegido Plus` is repetitive. Prefer a cleaner label like `Vidros: Protegido Plus` or `Vidros Plus`, with tooltip/details carrying the full catalog explanation.

## Notes

- Moto, caminhao, and Auto Lar Caminhao are out of this QA.
- `Cia Renovacao` may remain conservative/raw unless later mapped to a reliable insurer-name catalog.
- Follow-up implementation task: `TASK-0048`.

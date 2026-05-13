# Pre-Sale V1 Roadmap

## Product Intent

V1 focuses on pre-sale conversion for insurance brokers. The product should not only generate polished PDFs and public links; it should help the broker understand client behavior and act at the right moment.

## Delivery Order

1. Strengthen AUTO with Porto-family insurers.
2. Improve the public quote link as a comparison and conversion page.
3. Turn tracking into a rule-based commercial score.
4. Add manual sales outcome status and internal renewal/opportunity agenda.
5. Map Health as a human discovery track before implementation.
6. Keep post-sale and prospecting in discovery until the pre-sale core is stronger.

## Work Groups

### Group A - AUTO Multi-Insurer

- Porto Seguro is the base implementation for the Porto family.
- Itau, Mitsui Sumitomo, and Azul should reuse the same extraction strategy when their PDFs match Porto's structure.
- Sompo is a separate future insurer, not an alias for Mitsui Sumitomo and not part of the current Porto-family implementation scope.
- Each insurer needs PDF samples, extraction tests, schema validation, review UI compatibility, PDF generation, and public-link compatibility.
- Do not implement all insurers in one task.
- AUTO upload should move toward a single multi-PDF dropzone with conservative insurer detection, instead of requiring one dropzone per insurer.
- Group/template brand mentions must not decide the insurer. Example: Itau can mention Porto, and Aliro can mention Allianz.

### Group B - Conversion Public Link

- Define safe comparison highlights before implementing them in the public link.
- Use safe language such as "Destaques da comparacao".
- Compare price, installment, deductible, RCF, assistance, towing, and replacement car when available.
- Keep WhatsApp as the primary call to action.

### Group C - Commercial Metrics And Score

- Keep current session tracking as the base.
- Add higher-value events such as full quote open, return visit, order of quote viewing, time by insurer, PDF download, and WhatsApp intent.
- Score is deterministic at first: cold, warm, hot, but the first rule set must be defined before implementation.
- Insights should be simple and useful: likely price interest, likely coverage interest, top insurer, and suggested approach moment.

### Group D - Sales Outcome And Renewal Agenda

- Broker manually marks outcome: negotiating, won, lost, no response.
- Won processes generate renewal agenda items from policy validity.
- Lost or no-response processes generate future opportunity reminders.
- First version is internal dashboard agenda only.

### Group E - Health Discovery

- Health should start with human mapping, not code.
- Map fields, comparison rules, PDF examples, and client-facing language first.
- Implementation starts only after the mapping document is complete enough to produce tasks.
- Urgent Health prototype path: prioritize a reviewed quote-draft workflow that can generate the broker's current spreadsheet format from PDFs/tables.
- PDF and public link for Health should come after the reviewed draft and spreadsheet export, using the same confirmed data rather than re-extracting independently.
- Health OCR/vision support is a future technical slice for PDFs/tables that arrive as images or scans.

### Group F - Future Discovery

- Post-sale: insured portal, QR code, policies, support contacts, emergency request, broker assignment, AI triage.
- Prospecting: support materials, email marketing, content generation, broker landing pages, lead forms.
- These are not part of the immediate V1 implementation.

## Active Task Sequence

1. `TASK-0002` - Map Porto-family AUTO extraction strategy.
2. `TASK-0013` - Create Porto complete/incomplete fixtures.
3. `TASK-0014` - Implement Porto deterministic payment parser.
4. `TASK-0015` - Implement Porto core AUTO extraction.
5. `TASK-0016` - Integrate Porto in async processing flow.
6. `TASK-0017` - Validate review, PDF, and public link with Porto.
7. `TASK-0028` - Create conservative AUTO PDF insurer detection in backend.
8. `TASK-0029` - Replace per-insurer upload cards with a single multi-PDF upload review flow.
9. `TASK-0004` - Discover safe comparison highlights for the public link.
10. `TASK-0005` - Discover rule-based commercial score v0.
11. `TASK-0006` - Add sales outcome and renewal agenda foundation.
12. `TASK-0007` - Complete Health mapping document.
13. `TASK-0008` - Keep post-sale and prospecting discovery separate.
14. `TASK-0009` - Map Bradesco renewal, bonus, and vehicle usage fields.
15. `TASK-0010` - Generate Porto coverage variation quotes.
16. `TASK-0011` - Design AutoQuoteData insurer extras contract.
17. `TASK-0012` - Map Porto extras backlog.
18. `TASK-0030` - Collect and extract future insurer PDF samples.
19. `TASK-0052` - Discover Health varied PDFs and broker spreadsheet workflow.
20. `TASK-0053` - Create validated Health quote draft contract.
21. `TASK-0054` - Create Health textual extractor v0 to draft.
22. `TASK-0055` - Create Health manual age-band table pricing engine.
23. `TASK-0056` - Build Health spreadsheet matrix and XLSX export.
24. `TASK-0057` - Create Health review workspace UX.
25. `TASK-0058` - Wire Health draft to spreadsheet generation flow.
26. `TASK-0059` - Create Health proposal PDF from reviewed draft.
27. `TASK-0060` - Create Health public link from reviewed draft.

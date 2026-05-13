# Health Insurance Mapping

This document is for human product discovery before implementing Health quotes.

## Goal

Define what a broker and insured client need to understand from a Health quote before any schema, prompt, PDF, or public link is implemented.

## Insurer Discoveries

- Health assisted quote MVP: `.ai/discovery/HEALTH-QUOTE-ASSISTED-MVP.md`
- Bradesco Saude: `.ai/discovery/BRADESCO-HEALTH.md`
- Bradesco Saude sales materials: `.ai/discovery/BRADESCO-HEALTH-SALES-MATERIALS.md`
- Bradesco Saude Pernambuco network: `.ai/discovery/BRADESCO-HEALTH-PE-NETWORK.md`
- Bradesco Saude Pernambuco network extracted list: `.ai/discovery/BRADESCO-HEALTH-PE-NETWORK-LIST.md`
- Bradesco Saude public preview MVC: `.ai/discovery/BRADESCO-HEALTH-PUBLIC-PREVIEW-MVC.md`

## PDF Samples Needed

- Insurer:
- Product name:
- Number of lives:
- PDF source:
- Notes about layout:

## Current Urgent Samples

Folder:

- `.ai/pdf-lab/input/pdfs-saude-variados`

PDF extraction output:

- `.ai/pdf-lab/output/health_varied_quotes_2026_05_13.md`
- `.ai/pdf-lab/output/health_varied_quotes_2026_05_13.json`

Current broker spreadsheet examples:

- `UNIMED - OTORRINOS.xlsx`
- arquivo `.xlsx` iniciado por `cotac...` e contendo `CTO ATUALIZADO`

Urgent product direction:

- prioritize a reviewed quote draft that can generate the broker's current spreadsheet format;
- keep PDF and navigable public link as later outputs from the same reviewed draft;
- preserve field source, confidence, evidence and review status for every extracted/inferred field;
- add future OCR/vision support for PDFs whose tables are images or scans.

## Fields To Map

- Holder/company name
- Number of lives
- Age range per life
- Plan name
- Accommodation: apartment or infirmary
- Coparticipation: yes or no
- Dental coverage
- Coverage area: national, state, city, group of cities
- Monthly price per life
- Total monthly price
- Waiting periods
- Hospital network
- Key exclusions or limitations

## Comparison Questions

- What is cheaper?
- What has better hospital network?
- What has better accommodation?
- What has less coparticipation risk?
- What is easier for a non-technical client to understand?
- Which fields should never be ranked automatically?

## Client-Facing Language

Write the plain-language explanation the insured client should see.

Example:

```txt
Este plano custa menos por mes, mas possui coparticipacao. Isso significa que alem da mensalidade, pode haver cobranca quando usar consultas ou exames.
```

## Implementation Readiness Checklist

- [ ] At least 3 real Health quote PDFs reviewed.
- [ ] Required extraction fields defined.
- [ ] Comparison rules defined.
- [ ] Client-facing language examples written.
- [ ] Risky or legally sensitive fields marked.
- [ ] First insurer chosen for implementation.


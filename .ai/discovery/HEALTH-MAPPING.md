# Health Insurance Mapping

This document is for human product discovery before implementing Health quotes.

## Goal

Define what a broker and insured client need to understand from a Health quote before any schema, prompt, PDF, or public link is implemented.

## PDF Samples Needed

- Insurer:
- Product name:
- Number of lives:
- PDF source:
- Notes about layout:

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


# Decision Log

## 2026-04-30 - Markdown Tasks Instead Of Trello

Decision:
Use Markdown files in the repo as the source of truth for tasks. Use a simple local HTML Kanban only as a visual preview.

Reason:
Markdown is easier for agents to read, review, version, and connect to code changes. Trello API integration would add process complexity before the workflow proves itself.

Risk:
The local Kanban may become limited if the project grows to many collaborators.

Review when:
There are more than 50 active tasks or external collaborators need a shared board.

## 2026-04-30 - Pre-Sale V1 Is The Active Roadmap

Decision:
The active roadmap lives in `.ai/roadmap/PRE-SALE-V1.md` and executable work lives in `.ai/tasks`. The old root `PLAN.md` is removed.

Reason:
The previous plan was outdated and mixed status, roadmap, backlog, and implementation notes. Keeping the live plan inside `.ai/` makes the agent workflow clearer.

Risk:
Older context may be lost if it was only documented in `PLAN.md`.

Review when:
A new major product phase starts.

## 2026-04-30 - Score Starts With Rules, Not AI

Decision:
Commercial score starts as deterministic rules over tracked events: cold, warm, and hot.

Reason:
Fixed rules are easier to test, explain to brokers, and tune before adding AI interpretation.

Risk:
The first score may feel simplistic until enough real usage data exists.

Review when:
There are enough live sessions to compare score predictions against actual sales outcomes.

## 2026-04-30 - Renewal Starts As Internal Agenda

Decision:
Renewal automation starts as internal broker agenda items. The system will not message the insured client automatically in the first version.

Reason:
This gives brokers value without creating consent, deliverability, or communication-risk complexity.

Risk:
Brokers still need to manually act on reminders.

Review when:
Sales outcome status and agenda usage are stable.

## 2026-05-01 - Porto Payments Need Deterministic Parsing

Decision:
Porto Seguro AUTO payment tables should be parsed deterministically, not only by AI.

Reason:
The extracted text mixes payment methods, installments, discounts, interest, and Porto Bank rules. A deterministic parser is easier to test and safer for values shown to brokers and insured clients.

Risk:
Parser logic may need separate handling for complete and incomplete PDFs.

Review when:
More Porto PDF variants are extracted.

## 2026-05-01 - Keep AUTO Core Stable And Add Insurer Extras Later

Decision:
The first Porto implementation should focus on the current AUTO core fields and reliable payment parsing. Porto-specific extras should be mapped now but implemented separately.

Reason:
Expanding every possible insurer-specific field immediately would make the schema and UI too broad before the core Porto flow is stable.

Risk:
Some useful broker-facing information may be delayed.

Review when:
Porto core extraction is passing tests with complete and incomplete PDFs.

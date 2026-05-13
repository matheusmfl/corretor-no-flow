# Product Memory

## Product

Corretor no Flow helps insurance brokers turn technical insurer quote PDFs into clear, branded proposals and public comparison links for insured clients.

## Initial Focus

- Segment: insurance brokers.
- First product line: Auto insurance.
- First insurer: Bradesco.
- Core value: make pre-sale communication clearer, faster, more professional, and more actionable for conversion.

## Important Product Principles

- The insured client should understand the proposal without needing insurance jargon.
- The broker should save time before the sale and gain visibility after sending the link.
- The system should support multiple insurers and insurance lines later without rewriting the core flow.
- Public links should be mobile-first and easy to share by WhatsApp.

## Current Product Direction

- Quote processes group multiple individual quotes.
- A process produces one public client-facing link.
- Quotes from the same insurer may represent different franchise options.
- Comparison logic should be modular by insurance product line.
- V1 remains focused on pre-sale conversion.
- The quote link should become a sales tool: comparable, trackable, and actionable.
- Tracking should evolve into simple commercial insight: cold, warm, hot.
- Renewal starts as an internal agenda for brokers, not automatic customer messaging.
- Post-sale and prospecting are future discovery tracks, not V1 implementation scope.
- Health now has an urgent prototype track: start with a reviewed quote draft that turns PDFs/tables into the broker's spreadsheet workflow, then reuse the reviewed data for PDF and public link outputs.
- Health extraction may be generalist at first, but every field must carry source, confidence, evidence, and review status so AI inference does not become silent product truth.

## Pre-Sale V1 Roadmap

- Expand AUTO to Porto Seguro first, then reuse a Porto-family-style extraction base for Itau, Mitsui Sumitomo, and Azul when their PDFs match Porto's structure. Sompo is a separate future insurer and should not be treated as a Mitsui alias or Porto-family insurer.
- Improve the public link with safe comparison highlights.
- Expand tracking events and compute a rule-based commercial score.
- Add manual sales outcome status and internal renewal/opportunity agenda.
- Map Health as a human discovery document before implementation.
- For the urgent Health prototype, prioritize XLSX export from reviewed lives/options before polishing Health PDF/link UX.
- Keep product line/ramo selection before upload, but remove mandatory insurer selection from the AUTO upload flow once PDF insurer detection is implemented.
- Insurer detection must be conservative and explainable, especially for insurer groups such as Porto/Itau and Allianz/Aliro.

## Future Ideas

- Post-sale insured portal.
- Emergency support workflow.
- AI triage for urgent support.
- Content and prospecting tools.
- Broker landing pages and lead capture.
- Automatic insurer and product detection from PDFs.
- Plan and permission system.

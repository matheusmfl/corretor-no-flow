# Strategic Maturation

This is the step between a raw brainstorm and executable tasks.

## Why This Exists

The product has many valuable directions: insurer expansion, conversion metrics, renewal agenda, Health quotes, post-sale portal, and prospecting. Not every idea should become an implementation task immediately.

Strategic maturation prevents large, vague, risky tasks from reaching Claude Code before the product intent and technical constraints are clear.

## Maturity Flow

```txt
Raw brainstorm
  -> Strategic maturation
  -> Discovery or roadmap update
  -> Executable task
  -> Claude implementation
  -> Codex review
  -> Human QA
```

## Where Each Thing Goes

### Raw brainstorm

Use `.ai/brainstorm/` when the idea is still loose, emotional, or exploratory.

Examples:

- "What if we had an emergency button?"
- "Health quote PDFs may need a different comparison page."
- "Porto, Itau, Sompo, and Azul PDFs look similar."

### Strategic maturation

Use this step in conversation with Codex before writing execution tasks.

Codex should clarify:

- What problem this solves.
- Who benefits: broker, insured client, brokerage, or platform.
- Whether it belongs to V1, future discovery, or discard.
- What repo areas it may affect.
- What data, PDFs, examples, or business rules are missing.
- What can fail commercially or technically.
- Whether it needs discovery before implementation.

### Discovery

Use `.ai/discovery/` when the idea needs research, examples, PDF mapping, product definition, or risk analysis before coding.

Examples:

- Mapping Porto-family PDFs.
- Mapping Health quote fields.
- Defining post-sale portal risks.
- Exploring prospecting tools.

Discovery should produce enough clarity to write tasks later.

### Roadmap

Use `.ai/roadmap/` for prioritized direction and grouped work.

Roadmap answers:

- Which work group matters next?
- What order should the team follow?
- What is explicitly out of scope for now?
- Which discovery docs or tasks belong to each group?

### Tasks

Use `.ai/tasks/` only for work ready to execute.

A task must be small enough for Claude Code to implement without making product decisions.

Every implementation task should include:

- Context
- Objective
- Scope
- Out of scope
- Likely files
- TDD requirement
- Acceptance criteria
- Risks
- Failure scenario
- Human QA checklist

Backend tasks must require TDD.

## When Mapping Happens

Mapping is part of discovery, not implementation.

For new insurer PDFs:

1. Put PDFs in `.ai/pdf-lab/input`.
2. Run `npm run pdf:extract`.
3. Read the generated Markdown/JSON in `.ai/pdf-lab/output`.
4. Create or update a discovery document in `.ai/discovery/`.
5. Compare extracted content against current product types and UI needs.
6. Only then create implementation tasks.

For new product lines such as Health:

1. Review real PDFs.
2. Fill the mapping document.
3. Define comparison rules and client-facing language.
4. Mark risky fields.
5. Choose the first insurer/product slice.
6. Then create technical tasks.

## Output Of Strategic Maturation

At the end of maturation, Codex should produce one of these outcomes:

- Update product memory or decision log.
- Create or update a discovery document.
- Update the active roadmap.
- Create one or more executable tasks.
- Mark the idea as future/discarded.

Not every idea becomes a task.

## Current Rule For Pre-Sale V1

The active pre-sale V1 path is:

1. Mature the idea with Codex.
2. Discover/map if needed.
3. Update `.ai/roadmap/PRE-SALE-V1.md`.
4. Create small tasks in `.ai/tasks/todo`.
5. Use the Kanban only to move executable tasks through status.


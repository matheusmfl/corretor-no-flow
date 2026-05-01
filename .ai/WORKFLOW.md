# Agent Workflow

This repo uses Markdown as the source of truth for product execution.

## Roles

- Human Orchestrator: owns product judgment and final priority.
- Codex Strategist: converts ideas into tasks, risks, and review checklists.
- Claude Executor: implements approved tasks.
- Codex Reviewer: reviews completed work before the human accepts it.
- Human QA: tests the user-facing behavior.

## Flow

1. Human sends a brainstorm or priority.
2. Codex matures the idea before tasking: product value, risks, dependencies, missing data, and whether discovery is needed.
3. If the idea is not ready for execution, Codex updates `.ai/discovery`, `.ai/roadmap`, `.ai/PRODUCT-MEMORY.md`, or `.ai/DECISIONS.md`.
4. When the idea is mature enough, Codex creates one or more executable tasks in `.ai/tasks/todo`.
5. Human asks Claude to execute a specific task.
6. Claude reads the task, follows TDD when required, implements, tests, and moves it to `.ai/tasks/review`.
7. Codex reviews the diff and task criteria.
8. If approved, human performs the QA checklist.
9. Task moves to `.ai/tasks/done`.

Read `.ai/STRATEGIC-MATURATION.md` for the detailed brainstorm-to-task process.

## Brainstorm Session Notes

When a conversation creates useful product context, create a short session note in `.ai/brainstorm/`.

The note should not copy the whole conversation. It should capture:

- date
- topic
- ideas raised
- decisions made
- files/tasks affected
- recommended next action

Important decisions should also be copied into `.ai/DECISIONS.md` or `.ai/PRODUCT-MEMORY.md`.

## Task Status Folders

- `.ai/tasks/todo`: approved and ready to execute.
- `.ai/tasks/in-progress`: currently being implemented.
- `.ai/tasks/review`: implemented and waiting for Codex review.
- `.ai/tasks/done`: reviewed and accepted.
- `.ai/tasks/discarded`: intentionally abandoned.

## Task Kind And Lifecycle

Task folders show operational status. Frontmatter shows what kind of work it is and whether the underlying question is still open.

Use:

```yaml
kind: discovery|implementation|human|review|documentation
lifecycle: open|closed
```

Examples:

- `kind: discovery` + `lifecycle: open`: mapping or product question still needs work.
- `kind: discovery` + `lifecycle: closed`: discovery question is answered; follow-up implementation tasks may exist.
- `kind: implementation` + `lifecycle: open`: ready for Claude to build.
- `kind: human` + `lifecycle: open`: waiting for human action.

When discovery is completed, either move it to `done` or set `lifecycle: closed` and create follow-up tasks.

## Kanban Preview

Run this command after creating or moving Markdown tasks:

```bash
node .ai/scripts/build-kanban.mjs
```

It reads `.ai/tasks/*/*.md` and regenerates `.ai/kanban/index.html`.

For an interactive Kanban that moves Markdown files between status folders, run:

```bash
node .ai/scripts/kanban-server.mjs
```

Then open `http://localhost:4173` and drag cards between columns.

## PDF Extraction Lab

Use this when mapping new insurers or PDF variants before writing implementation tasks.

1. Put sample PDFs in `.ai/pdf-lab/input`.
2. Run:

```bash
npm run pdf:extract -- --output-name auto_porto_seguro_reduzido --insurer porto_seguro --variant reduzido
```

3. Read the generated `.json` and `.md` in `.ai/pdf-lab/output`.

Useful options:

```bash
npm run pdf:extract -- --output-name auto_porto_seguro_extendido --insurer porto_seguro --variant extendido --max-pages 4
npm run pdf:extract -- --input-dir C:\tmp\porto-pdfs --output-name auto_porto_seguro_vidros_full --format md
npm run pdf:extract -- --output-name auto_porto_seguro_layout --include-items
```

Inputs and outputs are ignored by Git because they may contain sensitive insured data.

## Rules

- Markdown tasks are the source of truth.
- Raw ideas should not become implementation tasks until they pass strategic maturation.
- Use discovery documents when an idea needs PDFs, examples, product rules, or risk analysis first.
- Use roadmap files for grouped direction and task order.
- The HTML Kanban is only a visual preview.
- Avoid large tasks. Split work when the scope crosses backend, frontend, and infra at the same time.
- Prefer repo conventions over new abstractions.
- Record important product or architecture decisions in `.ai/DECISIONS.md`.

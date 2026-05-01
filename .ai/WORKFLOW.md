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
2. Codex refines the idea and creates one or more tasks in `.ai/tasks/todo`.
3. Human asks Claude to execute a specific task.
4. Claude reads the task, follows TDD when required, implements, tests, and moves it to `.ai/tasks/review`.
5. Codex reviews the diff and task criteria.
6. If approved, human performs the QA checklist.
7. Task moves to `.ai/tasks/done`.

## Task Status Folders

- `.ai/tasks/todo`: approved and ready to execute.
- `.ai/tasks/in-progress`: currently being implemented.
- `.ai/tasks/review`: implemented and waiting for Codex review.
- `.ai/tasks/done`: reviewed and accepted.
- `.ai/tasks/discarded`: intentionally abandoned.

## Rules

- Markdown tasks are the source of truth.
- The HTML Kanban is only a visual preview.
- Avoid large tasks. Split work when the scope crosses backend, frontend, and infra at the same time.
- Prefer repo conventions over new abstractions.
- Record important product or architecture decisions in `.ai/DECISIONS.md`.


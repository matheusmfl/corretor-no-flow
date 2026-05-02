@AGENTS.md

# Corretor no Flow - Claude Execution Guide

Claude Code is the implementation agent for this repository. Product strategy, task shaping, and review flow live in `.ai/`.

## Product Summary

Corretor no Flow is a SaaS for insurance brokers. It turns insurer quote PDFs into clear, branded proposals and public client-facing comparison links. The first focus is Auto insurance, starting with Bradesco.

## Execution Workflow

1. Read the assigned task in `.ai/tasks/todo` or `.ai/tasks/in-progress`.
2. Move the task to `.ai/tasks/in-progress` when starting.
3. Implement only the task scope.
4. Run the relevant tests or explain why they could not run.
5. Move the task to `.ai/tasks/review` when complete.

Markdown tasks are the source of truth. The HTML Kanban in `.ai/kanban/index.html` is only a visual aid.

## Task, Review, and QA Hygiene

Task files are product memory, not just execution notes. When updating a task:

- Do not erase, rewrite, or mark Codex review findings / human QA findings as fixed unless the implementation fully addresses the exact reported behavior.
- If you believe a finding is fixed, add a new section such as `Fix attempt`, `Implementation notes`, or `Ready for re-review`; keep the original finding text visible for traceability.
- If Codex or human QA says the fix is incomplete, do not change the task to imply completion. Add `Review findings pending` or `QA failed` notes and keep the task in `.ai/tasks/review`.
- Do not move a task to `.ai/tasks/qa` until all Codex P0/P1/P2 findings are resolved in code and documented with the concrete behavior changed.
- Do not move a task to `.ai/tasks/done`; done is accepted by the human/Codex review flow, not by the implementation agent.

When responding to review findings:

- Address the full user-observed scenario, not just the narrow symptom named in the first sentence.
- Before saying "fixed", replay the scenario mentally against the code path and check whether other persisted states still reproduce it.
- If the review asks for a product decision or there are multiple valid strategies, stop and document options instead of choosing silently.
- A confidence downgrade is not the same as a block. If a known unsupported or wrong-product file can still be manually confirmed into a supported insurer, the unsafe path is still open.
- Prefer adding targeted tests for the failing scenario. For backend fixes, tests are mandatory unless clearly impossible.

Example:

```txt
Bad: "FAILED quotes are fixed because deleteMany({ status: FAILED }) runs before upload."
Good: "FAILED quotes are removed, but existing READY/PENDING_REVIEW/PROCESSING quotes still remain in the process. The original QA scenario is not fully fixed until the new-batch behavior is defined and implemented."
```

## Mandatory Backend Rule: TDD

All backend development must follow TDD.

Before implementing backend behavior:

1. Read the project TDD skills.
2. Write or update unit tests first.
3. Run the failing test when practical.
4. Implement the smallest change that passes.
5. Refactor without changing behavior.

Do not skip tests for backend tasks unless the task explicitly says it is documentation-only or impossible to test. If tests cannot run, explain the exact blocker.

## Architecture Rules

- Use NestJS modules, dependency injection, DTOs, and clear service boundaries.
- Keep business logic out of controllers.
- Preserve tenant isolation with `companyId`.
- Preserve LGPD behavior: original PDFs must not be retained longer than necessary.
- PDF processing must remain asynchronous.
- Failed AI extraction must not break the flow; use reviewable failure states.
- Shared contracts live in `packages/types`.
- NestJS DTOs should implement the corresponding interfaces from `@corretor/types`.
- Do not use `@prisma/client` directly in frontend code.

## Frontend Rules

- Dashboard uses Next.js, React, Tailwind, httpOnly cookie session, and React Query where appropriate.
- Before changing Next.js behavior, read the relevant guide in `node_modules/next/dist/docs/`.
- Keep authenticated routes protected by the existing session pattern.
- Build practical broker-facing screens, not marketing pages, unless the task asks for marketing.

## Local Development

Use Docker for infrastructure. Do not install Postgres or Redis locally.

```bash
docker-compose up -d postgres redis
docker-compose up -d --build api
```

Common commands:

```bash
npm run dev
npm run dev:dashboard
npm run dev:web
npm run dev:api
npm run build
npm run lint
```

## Important References

- `.ai/WORKFLOW.md` - agent workflow
- `.ai/CODEX.md` - Codex strategist/reviewer role
- `.ai/PRODUCT-MEMORY.md` - product memory
- `.ai/DECISIONS.md` - decision log
- `.ai/roadmap/PRE-SALE-V1.md` - active roadmap
- `.ai/templates/task.template.md` - task format
- `PRODUCT.md` - deeper product rules

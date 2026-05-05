---
id: TASK-0000
title: Task title
status: todo
kind: discovery|implementation|qa|human|review|documentation
lifecycle: open|closed
area: api|dashboard|web|types|infra|product
owner: claude
reviewer: codex
complexity: low|medium|high
risk: low|medium|high
tdd_required: true|false
created_at: YYYY-MM-DD
---

# TASK-0000 - Task Title

## Context

Why this task exists.

## Objective

What must be true after this task is complete.

## Scope

What is included.

## Out Of Scope

What should not be changed.

## Likely Files

- `path/to/file.ts`

## Executor Context Pack

Read these files first, in order:

1. `path/to/most-relevant-test-or-entrypoint.spec.ts`
2. `path/to/primary-implementation-file.ts`
3. `path/to/related-ui-or-template-file.ts`

Use `rg` only for these terms before opening more files:

- `specificSymbolOrField`
- `specificFunctionName`
- `specificRouteOrLabel`

Do not use broad Explore/subagent/codebase-map workflows before reading these files. If more than 6 additional files seem necessary, stop and explain why.

## TDD Requirement

Backend work must start with tests or update existing tests before implementation.

## Acceptance Criteria

- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Relevant tests pass

## Risks

- Risk 1

## Failure Scenario

Briefly describe how this could fail in production or confuse the user.

## Human QA Checklist

- [ ] Step 1
- [ ] Step 2

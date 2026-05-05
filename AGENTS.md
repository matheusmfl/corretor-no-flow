<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:context-budget-rules -->
# Context Budget Rules

When executing a Markdown task from `.ai/tasks`, read the task's `Executor Context Pack` before broad repository exploration.

If an `Executor Context Pack` exists:

- Read only the listed files first, in order.
- Use only the listed `rg` terms before opening more files.
- Do not start with broad Explore, subagent, or codebase-map workflows.
- If more than 6 additional files seem necessary, stop and explain why before continuing.

When writing implementation or QA tasks, include an `Executor Context Pack` with 3-7 starting files and exact search terms.
<!-- END:context-budget-rules -->

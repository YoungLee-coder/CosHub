<!-- ai-init-version: 6 -->

# CosHub — Claude Code Instructions

Project knowledge is distributed across `.ai/` (shared with opencode). Read these files before non-trivial work:

- `.ai/project.md` — project background, response language
- `.ai/architecture.md` — tech stack, repository map, entry points
- `.ai/coding-style.md` — conventions, helpers, gotchas
- `.ai/workflow.md` — commands, verification, release flow
- `.ai/testing.md` — test strategy, per-change verification
- `.ai/security.md` — safety rules, destructive-op guardrails

Claude-specific notes:

- 优先使用 Edit 工具修改已有文件，而非 Write 工具整体重写。
- 修改 Edge/Cloud Function（JS 文件）后无法自动 typecheck，需手动验证。
- **Persistent memory:** when you notice a stable convention, command, or gotcha missing from `.ai/`, propose saving it and ask for confirmation before writing. Use `/coshub-remember` or route per `.ai/project.md` Persistent memory section.
- Put personal overrides in `CLAUDE.local.md` (gitignored).

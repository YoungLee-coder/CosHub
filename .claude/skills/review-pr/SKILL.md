---
name: review-pr
description: Review a pull request for CosHub using code-reviewer and security-auditor agents. Use before merging / when asked to review a PR / 看看PR.
---

# Review PR

Review a pull request against project conventions and security rules.

## Steps

1. **Get the diff**: `git diff` against the branch base, or read the PR description and changed files.
2. **Run code-reviewer**: invoke the `code-reviewer` subagent on the diff. It checks against `.ai/coding-style.md` and `.ai/workflow.md`.
3. **Run security-auditor** (if applicable): invoke the `security-auditor` subagent on the diff. It checks against `.ai/security.md`. Skip if the change is documentation-only or has no security-relevant code.
4. **Run architect** (if structural): invoke the `architect` subagent on the diff. It checks against `.ai/architecture.md`. Skip if the change is a small fix with no cross-layer impact.
5. **Synthesize**: combine the findings from all agents. Present a summary with P0/P1/P2 items and a final verdict.
6. **Verification check**: confirm the commands from `.ai/workflow.md` Verification section were run for the change types involved.

Project-specific instructions:

- 任何涉及 edge-functions/ 或 cloud-functions/ 的变更都必须运行 security-auditor。
- 检查新 API 端点是否在 middleware.js 中被 JWT 保护。

---
name: coshub-review-pr
description: Review a pull request for CosHub against .ai/ conventions and security rules. Use before merging / when asked to review a PR / 看看PR.
---

# Review PR

Review a pull request against project conventions and security rules in `.ai/`.

## Steps

1. **Get the diff**: `git diff` against the branch base, or read the PR description and changed files.
2. **Read context**: skim `.ai/coding-style.md`, `.ai/workflow.md`, and `.ai/architecture.md` for the standards to check against. If `.ai/security.md` exists, read it too.
3. **Code review**: run the bugbot subagent on the diff, or review manually against `.ai/coding-style.md` and `.ai/workflow.md`.
4. **Security review** (if applicable): run the security-review subagent on the diff against `.ai/security.md`. Skip if the change is documentation-only or has no security-relevant code.
5. **Architecture check** (if structural): verify layer boundaries and coupling against `.ai/architecture.md`. Skip for small fixes with no cross-layer impact.
6. **Synthesize**: combine findings. Present a summary with P0/P1/P2 items and a final verdict.
7. **Verification check**: confirm the commands from `.ai/workflow.md` Verification section were run for the change types involved.

Project-specific instructions:

- 任何涉及 edge-functions/ 或 cloud-functions/ 的变更都必须运行 security-review。
- 检查新 API 端点是否在 middleware.js 中被 JWT 保护。

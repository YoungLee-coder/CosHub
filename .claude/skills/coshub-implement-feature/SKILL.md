---
name: coshub-implement-feature
description: Implement a new feature in CosHub, following project conventions from .ai/ files. Use when asked to add a feature / implement something / build X / 新功能.
---

# Implement Feature

Implement a new feature following the conventions defined in `.ai/`:

1. **Read project context**: `.ai/project.md` (what this is), `.ai/architecture.md` (where things go), `.ai/coding-style.md` (how to write), `.ai/workflow.md` (commands and verification).
2. **Plan the change**: identify which files to modify, which layers are involved, which conventions apply.
3. **Implement**: write the code following `.ai/coding-style.md` conventions. Use the helpers and patterns documented there, not raw alternatives.
4. **Verify**: run the commands from `.ai/workflow.md` Verification section for the change type you made. If there are tests in `.ai/testing.md` for the area you touched, run those too.
5. **Review**: if the change is non-trivial, invoke the code-reviewer and/or architect subagent before considering it done.

Project-specific instructions:

- 新功能模块放在 `src/features/<domain>/` 下，包含 `client/` 子目录用于 API 调用。
- COS SDK 操作必须在 Cloud Function 中完成，前端通过 `src/features/cos/client/` API 模块调用。
- 新 API 端点必须被 `middleware.js` JWT 认证保护。
- UI 字符串使用中文，API 响应使用统一信封格式。

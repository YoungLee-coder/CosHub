---
name: coshub-release-check
description: Verify release readiness for CosHub — run checks, confirm version, validate deployment config. Use before release / 发布前检查 / release readiness.
---

# Release Check

Verify that CosHub is ready for release. Follow the release process defined in `.ai/workflow.md`.

## Steps

1. **Run lint**: `pnpm lint` — no errors.
2. **Run typecheck**: `pnpm typecheck` — no errors.
3. **Run format check**: `pnpm format:check` — no errors.
4. **Build**: `pnpm build` — must succeed. Verify `dist/` output exists.
5. **Check version**: verify the version number in `package.json` matches the expected release version.
6. **Security scan**: invoke the `security-auditor` subagent on changes since the last release. Focus on auth endpoints and COS credential handling.
7. **Check deployment config**: verify `edgeone.json` build command and output directory settings are correct.
8. **Report**: summarize the results. If any check fails, report what failed and the fix needed before release can proceed.

Project-specific instructions:

- CosHub 部署到 EdgeOne Pages，无自动化 CI/CD。发布前手动验证 `pnpm build` 和 `edgeone.json` 配置。
- 版本号在 `package.json` 中，当前为 `0.2.0`，但不绑定自动化发布流程。

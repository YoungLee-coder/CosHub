---
name: update-claude-config
description: "重新扫描当前项目并同步 .claude/ 配置。当技术栈、目录结构、package.json scripts 等发生较大变化时运行——只更新「描述项目当前状态」的字段（CLAUDE.md 的 Tech Stack / Commands / Project Structure 三节 + reference-commands.md），不动用户自定义的规则文件和持久决策（persona / Do / Don't / Boundaries）。"
user_invocable: true
---

# Update Claude Config

重新扫描当前项目，把 Claude Code 配置同步到最新状态。

## 适用场景

- 新增了重要依赖（如从 Prisma 切到 Drizzle、加了 Redis）
- 目录结构有较大调整（新增子模块、目录重组）
- `package.json` scripts 增删过半
- 引入了新的子系统（测试框架、CI/CD、新模块）

## 不适用场景

- 单纯改业务代码 → 配置不需要每次都更
- 仅修改某条规则 → 直接编辑 `.claude/rules/{file}.md`
- 想新增规则 → 复制 `.claude/rules/_template.md` 手写

## Steps

### Step 1: 检测变化

对比当前项目与现有配置：

1. **技术栈对比** — 重新检测 `package.json` / `pyproject.toml` / `go.mod` 等，与 CLAUDE.md 的 Tech Stack 节对比
2. **命令对比** — 解析当前 scripts / Makefile targets，与 `.claude/rules/reference-commands.md` 对比
3. **目录结构对比** — 扫描根目录与主要子目录，与 CLAUDE.md 的 Project Structure 对比
4. **环境变量对比**（如有 `.env.example`） — 检测新增 / 移除变量

### Step 2: 展示变更预览

向用户列出发现的新增 / 移除 / 重命名内容，例如：

```
检测到以下变化：

技术栈：
+ Drizzle ORM 0.30
- Prisma 5.x

命令：
+ pnpm db:migrate
+ pnpm db:seed
- pnpm prisma generate

目录：
+ db/schema/
+ db/migrations/
- prisma/

将更新：
- CLAUDE.md 的 Tech Stack / Commands / Project Structure 三节
- .claude/rules/reference-commands.md 命令列表

不会动：
- CLAUDE.md 的 persona / Do / Don't / Boundaries
- .claude/rules/ 下用户自定义的规则文件
- .claude/skills/ 下其他 skill
```

询问用户是否确认。

### Step 3: 应用更新

仅重写「描述项目当前状态」的字段：

- **`CLAUDE.md`**
  - 更新 `## Tech Stack` 节
  - 更新 `## Commands` 节的 3-5 条关键命令
  - 更新 `## Project Structure` 目录树
  - **保留** persona / Do / Don't / Boundaries 不动（这些是用户决策）

- **`.claude/rules/reference-commands.md`**
  - 全量重写命令列表
  - 保留 frontmatter（title / impact / tags）

### Step 4: 提示后续手动操作

- 如果新依赖需要新增规则（例：加了认证库 → 可能需要 `security-*.md`），手动新增到 `.claude/rules/`
- 如果旧规则失效（引用了已删除的库或文件），手动更新或删除对应规则文件
- 本 skill **不主动新增 / 删除规则文件**，避免误删用户精心写的规则

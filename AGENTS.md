# AGENTS.md

> 给 AI 编码代理（Claude / Codex / Cursor 等）阅读的项目说明。
> 改动代码前请先读这份文档。

## 项目一句话

一个比 [serebii.net](https://www.serebii.net/) 更好看、更易用的中英双语 Pokemon 图鉴网站，部署在 Vercel。

## 技术栈

- **Framework**: Next.js 15 (App Router) + React 19 + TypeScript
- **UI**: shadcn/ui + Tailwind CSS v4
- **i18n**: next-intl (zh-Hans / en)
- **部署**: Vercel
- **包管理器**: pnpm

> 具体依赖版本以 `package.json` 为准。

## 数据来源

- **底座**: [PokeAPI](https://pokeapi.co/) — build-time 拉取，输出静态 JSON
- **补充**: serebii.net 选择性抓取（仅在 PokeAPI 缺失时）
- **私货**: 本仓库内的 MDX 笔记

## 项目状态

🚧 已完成 scaffolding（Next.js + shadcn `radix-lyra`），dashboard 模板已落到根路径 `/`。

## 决策记录（逐步补充）

| 日期 | 决策 | 备注 |
|---|---|---|
| 2026-05-01 | 覆盖范围：Gen 1–9 全世代 | 约 1025+ Pokemon |
| 2026-05-01 | 主要场景：图鉴浏览 | 不做对战 / 攻略 / 收集追踪 |
| 2026-05-01 | 数据策略：PokeAPI + Serebii + 笔记 | 三层混合 |
| 2026-05-01 | UI 语言：中英双语 | next-intl 实现 |
| 2026-05-01 | shadcn style: `radix-lyra` | 盒子型、锐利、配 mono 字体（boxy & sharp） |
| 2026-05-01 | dashboard 作为 root `/` | 取消 `/dashboard` 子路径 |
| 2026-05-01 | TooltipProvider 加在 root layout | 避免 sidebar 用 tooltip 时报错 |
| 2026-05-01 | 配色：Emerald 沉稳派（方案 A） | primary=emerald-600 / accent=lime-400 / secondary=emerald-100 / muted=emerald-50 / chart=emerald+lime+teal+green |
| 2026-05-01 | Sidebar 两组：Quick Links + Games | 都不折叠。Quick Links: Home/Search/Favorites；Games: Pokopia (NEW) |
| 2026-05-01 | 删除未用 nav 组件 | nav-main / nav-secondary / nav-documents 删除，新增通用 nav-group |
| 2026-05-01 | Brand logo: pokemon.com 经典 wordmark | `assets.pokemon.com/.../logo-pokemon-79x45.png`，favicon 用 pokemon.com 的 ico（已下载到本地 `app/favicon.ico`） |
| 2026-05-01 | Pokopia menu icon: pokopia.pokemon.com hero logo | `pokopia.pokemon.com/.../logo-pokopia.png` |
| 2026-05-01 | 修 SidebarMenuButton hydration warning | 加 `suppressHydrationWarning`（Radix Tooltip + React 19 + Next 16 已知 useId 不一致） |

## 给代理的工作约定（基于 shadcn skill）

> 全部规则参照 `skills/shadcn/SKILL.md` 和 `skills/shadcn/rules/*.md`。改 UI 前先读那两份。

### 颜色 / 样式（核心，违反必改）

- **只用语义色 token**：`bg-primary`、`text-foreground`、`text-muted-foreground`、`bg-card`、`border-border`、`text-destructive`...
- **绝对不用 raw 色**：❌ `bg-blue-500`、❌ `text-emerald-600`、❌ `text-green-500`
- **状态色用 Badge variant**：`<Badge variant="secondary">+20%</Badge>`，不要 `<span className="text-green-500">`
- **不写 `dark:` 覆盖**：semantic token 自动跟暗色走
- **不写 `z-index`**：Dialog / Sheet / Popover / Tooltip 自带堆叠
- **新增颜色**：改 `app/globals.css` 里的 `@theme inline` 块定义 CSS 变量，不要新建文件
- **className 只写 layout（`max-w-md`、`mx-auto`、`gap-4`），不写颜色 / 字体**

### 间距 / 尺寸

- 用 `gap-*`，不用 `space-x-*` / `space-y-*`：`<div className="flex flex-col gap-4">`
- 等宽高用 `size-*`：`size-10` 而不是 `w-10 h-10`
- 文本截断用 `truncate`，不要拼 `overflow-hidden text-ellipsis whitespace-nowrap`

### 组件用法

- **加新组件先搜后造**：`pnpm dlx shadcn@latest search` → `add`，不要手写 `<div>` 模拟现成组件
- **加 block / 复杂组合**：`pnpm dlx shadcn@latest add <block-id>`，加完立刻 review 文件，按 SKILL.md "Workflow" 第 7 步检查
- **变体优先**：`<Button variant="outline">`，不要 `<Button className="border bg-transparent">`
- **条件 className**：用 `cn()`，不要写模板字符串三元
- **图标在 Button 里**：`<Button><SearchIcon data-icon="inline-start" /></Button>`，**不要**给图标加 `size-4`
- **Form**：`FieldGroup` + `Field`，不要 `<div className="space-y-2"><Label>`
- **Overlay 必须有 Title**：Dialog/Sheet/Drawer，视觉隐藏用 `className="sr-only"`
- **Card 用全套**：`CardHeader` / `CardTitle` / `CardDescription` / `CardContent` / `CardFooter`，不要全塞 `CardContent`
- **Tooltip 必须在 TooltipProvider 里**：本项目已在 `app/layout.tsx` 全局包裹

### CLI / 升级

- 加组件：`pnpm dlx shadcn@latest add <name>`
- 升级已装组件：先 `--dry-run` + `--diff` 看 diff，再决定 `--overwrite`
- 切 preset：永远不要直接覆盖，先问用户 overwrite / partial / merge / skip
- 永远不要手动从 GitHub 拉 raw 文件

### 项目特定

- **icon library**: `lucide-react`（来自 `components.json` 的 `iconLibrary: "lucide"`）
- **alias**: `@/components`、`@/lib`、`@/hooks`、`@/components/ui`
- **base**: `radix`（即 components 用 `radix-ui` 而非 base-ui，注意 `asChild` 而非 `render`）
- **tailwind**: v4，CSS 变量定义在 `app/globals.css` 的 `@theme inline` 块

## 依赖升级策略

项目目标是**始终保持依赖最新**，但 npm 包和 shadcn/ui 组件走两套不同流程：

### 1. NPM 依赖（next / react / radix-ui / tailwind / 等）

- **自动**：`.github/workflows/auto-update-deps.yml` 每周一自动开升级 PR，typecheck + build 通过才送审
- **手动**：本地 `pnpm deps:check` 看清单，`pnpm deps:update` 一键升所有，`pnpm deps:update:major` 含 major 跳级
- **lock**：每次升级会更新 `pnpm-lock.yaml`；本地装包永远 `pnpm install --frozen-lockfile`（CI 也是）

### 2. shadcn/ui 组件（`components/ui/*`）— **不走自动**

shadcn 组件是源码 copy，不是 npm 包。我们可能在某些组件上加过本地修改（例如 `components/ui/sidebar.tsx` 里的 `suppressHydrationWarning`），无脑覆盖会丢这些。

**正确升级流程**：

```bash
# 1. 看哪些组件有 upstream 更新
pnpm dlx shadcn@latest add <name> --dry-run

# 2. 单个组件看 diff（关键）
pnpm dlx shadcn@latest add <name> --diff

# 3. 决策：
#    - 没本地改动 → 直接 --overwrite
#    - 有本地改动 → 手动合并 upstream 改动 + 保留本地
#    - 不确定 → 跳过这次
```

> 永远不要无脑跑 `--overwrite` 或 `add --all --overwrite`。

## 参考链接

- shadcn skill 本地路径: `skills/shadcn/SKILL.md`
- PokeAPI 文档: https://pokeapi.co/docs/v2
- Serebii 数据源: https://www.serebii.net/
- shadcn/ui: https://ui.shadcn.com/
- next-intl: https://next-intl.dev/

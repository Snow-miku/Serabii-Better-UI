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

## 数据来源（Serebii-first）

主数据源切换到 Serebii — 整个项目以 [serebii.net](https://www.serebii.net/) 为 source of truth：

| 层 | 来源 | 用途 |
|---|---|---|
| **主** | serebii.net 抓 + 解析（cheerio）| 99% 的内容（图鉴、技能、地点、事件等）|
| **辅** | [PokeAPI](https://pokeapi.co/) | Serebii 没有的（统一 sprite、跨语言名称）|
| **私货** | 本仓库 MDX 笔记 | 个人 tier 评分、实战心得 |

### Serebii 抓取约定

- 通用 wrapper：`lib/serebii/client.ts`（`fetchSerebiiHtml(path, { revalidate })`）
- 每个 endpoint 单独 module：`lib/serebii/{endpoint}.ts`
- 缓存策略：默认 ISR 24 小时，单页面可覆盖
- User-Agent 表明身份：`SerebiiBetterUI/0.1 (... non-commercial fan project)`
- 解析用 cheerio（不用 regex，更稳健）

### 代码组织

```
lib/
  serebii/                 # 跟数据源相关（fetcher + parser）
    client.ts              # 通用 fetch wrapper
    pokopia.ts             # Pokopia available pokemon parser
    ...                    # 以后加 sv.ts, anime.ts 等
  pokemon/                 # franchise-level types & domain logic
    pokopia/types.ts       # PokopiaPokemon, PokopiaSpecialty
    sv/types.ts            # ...
```

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
| 2026-05-01 | 配色：Lime（Serebii heritage） | primary=lime-700 (≈Serebii box `#507C36`) / accent=lime-500 (≈Serebii title `#7ACC3B`) / accent-fg=lime-950 (≈Serebii title text `#104C09`) / chart 全 lime 系。背景中性（白/黑灰）、文字+box=lime |
| 2026-05-01 | Sidebar 两组：Quick Links + Games | 都不折叠。Quick Links: Home/Search/Favorites；Games: Pokopia (NEW) |
| 2026-05-01 | 删除未用 nav 组件 | nav-main / nav-secondary / nav-documents 删除，新增通用 nav-group |
| 2026-05-01 | Brand logo: pokemon.com 经典 wordmark | `assets.pokemon.com/.../logo-pokemon-79x45.png`，favicon 用 pokemon.com 的 ico（已下载到本地 `app/favicon.ico`） |
| 2026-05-01 | Pokopia menu icon: pokopia.pokemon.com hero logo | `pokopia.pokemon.com/.../logo-pokopia.png` |
| 2026-05-01 | 修 SidebarMenuButton hydration warning | 加 `suppressHydrationWarning`（Radix Tooltip + React 19 + Next 16 已知 useId 不一致） |
| 2026-05-01 | URL 架构：franchise 即顶层 namespace | 为未来扩展（FGO / Genshin 等）做准备。所有 Pokemon 内容走 `/pokemon/...`，未来 FGO 走 `/fgo/...`。每个 franchise 数据模型独立，代码也按 franchise 分文件夹（`app/pokemon/`、`lib/pokemon/`、`content/notes/pokemon/`）。Pokopia 是 Pokemon 旗下游戏 → `/pokemon/pokopia` |
| 2026-05-01 | 数据策略转向：Serebii 为主 | 之前规划是 PokeAPI + Serebii 混合。现在改成 Serebii 主数据源（用户偏好），PokeAPI 留作后备。每个数据 endpoint 走自己 module（如 `lib/serebii/pokopia.ts` 解析 availablepokemon.shtml）|
| 2026-05-01 | "实时同步" = ISR + revalidate 86400s | Server component 直接 fetch Serebii，Next.js 在背景静默 revalidate（24h）。无需 cron / DB / KV，零基础设施。可以以后升级到 Vercel Cron + KV 实现"小时级"同步 |
| 2026-05-01 | Sidebar shell 上提到 root layout | `SidebarProvider` + `AppSidebar` + `SidebarInset` 现在在 `app/layout.tsx` 全局生效。`SiteHeader` 改成接受 `title` prop，每个 page 自己渲染 SiteHeader + 内容 |
| 2026-05-01 | 第一个数据页：`/pokemon/pokopia/pokedex` | 拉 serebii.net availablepokemon.shtml → cheerio 解析 → 渲染卡片网格。卡片含 sprite + 编号 + 名字 + Specialty badges。整页 server-rendered + 24h ISR |
| 2026-05-01 | Lyra 全站锐角 | `--radius: 0`（一处改全站 sharp corners） |
| 2026-05-01 | 自定义 design token：`--tile`、`--text-3xs` | `--tile`/`--tile-foreground` 给 Pokemon tile 用的中性灰；`--text-3xs: 0.65rem` 给紧凑 badge 用。两者都按 shadcn 推荐方式注册到 `@theme inline` |
| 2026-05-01 | 严格遵守 shadcn skill 全检 | `<Link>` 用于内部跳转；pokedex-card 用 Card composition（Header/Content/Footer）；自定义字号走 design token；icon 加 `data-icon` |

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

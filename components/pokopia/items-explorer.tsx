"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { SearchIcon } from "lucide-react"

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { TableCell, TableRow } from "@/components/ui/table"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { DataTable } from "@/components/pokopia/data-table"
import { pokopiaItemHref } from "@/lib/pokemon/pokopia/links"
import type { PokopiaItem } from "@/lib/pokemon/pokopia/types"

interface ItemsExplorerProps {
  items: PokopiaItem[]
}

/**
 * Items 列表的 client filter UI：
 *   - 搜索（名字 + 描述）
 *   - Category 多选（12 个分类，OR）
 *   - Tag 多选（5 个 tag — Decoration / Toy / Relaxation / Road / Food，OR）
 *   - Category 和 Tag 之间是 AND（必须同时满足）
 *   - 选了 tag 时，没 tag 的 item 自动排除
 */
export function ItemsExplorer({ items }: ItemsExplorerProps) {
  const [query, setQuery] = React.useState("")
  const [activeCategories, setActiveCategories] = React.useState<string[]>([])
  const [activeTags, setActiveTags] = React.useState<string[]>([])

  const allCategories = React.useMemo(() => {
    const counts = new Map<string, number>()
    for (const i of items) counts.set(i.category, (counts.get(i.category) ?? 0) + 1)
    return Array.from(counts.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, count]) => ({ name, count }))
  }, [items])

  const allTags = React.useMemo(() => {
    const counts = new Map<string, number>()
    for (const i of items) {
      if (!i.tag) continue
      // 只保留官方 5 个 tag，过滤 Serebii 偶尔出现的 typo / 注释字符串
      const known = ["Decoration", "Toy", "Relaxation", "Road", "Food"]
      if (!known.includes(i.tag)) continue
      counts.set(i.tag, (counts.get(i.tag) ?? 0) + 1)
    }
    return Array.from(counts.entries())
      .sort(([, a], [, b]) => b - a)
      .map(([name, count]) => ({ name, count }))
  }, [items])

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    return items.filter((item) => {
      if (q) {
        const inName = item.name.toLowerCase().includes(q)
        const inDesc = item.description.toLowerCase().includes(q)
        if (!inName && !inDesc) return false
      }
      if (activeCategories.length > 0 && !activeCategories.includes(item.category)) {
        return false
      }
      if (activeTags.length > 0) {
        if (!item.tag || !activeTags.includes(item.tag)) return false
      }
      return true
    })
  }, [items, query, activeCategories, activeTags])

  // 按 category 分组（用于显示）
  const filteredByCategory = React.useMemo(() => {
    const map = new Map<string, PokopiaItem[]>()
    for (const item of filtered) {
      const arr = map.get(item.category) ?? []
      arr.push(item)
      map.set(item.category, arr)
    }
    return Array.from(map.entries())
  }, [filtered])

  return (
    <div className="flex flex-col gap-6">
      {/* 搜索 */}
      <InputGroup>
        <InputGroupAddon>
          <SearchIcon />
        </InputGroupAddon>
        <InputGroupInput
          type="search"
          placeholder="按名字或描述搜索 (honey, log, ...)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </InputGroup>

      {/* Category filter */}
      <div className="flex flex-col gap-2">
        <p className="text-muted-foreground text-xs">
          Filter by Category (多选，OR)
        </p>
        <ToggleGroup
          type="multiple"
          value={activeCategories}
          onValueChange={setActiveCategories}
          variant="outline"
          className="flex-wrap justify-start gap-1.5"
        >
          {allCategories.map((c) => (
            <ToggleGroupItem
              key={c.name}
              value={c.name}
              aria-label={c.name}
              className="gap-1.5"
            >
              {c.name}
              <Badge variant="secondary" className="text-3xs ml-1 px-1.5 py-0">
                {c.count}
              </Badge>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {/* Tag filter */}
      <div className="flex flex-col gap-2">
        <p className="text-muted-foreground text-xs">
          Filter by Tag (多选，OR · 选了之后没 tag 的 item 不显示)
        </p>
        <ToggleGroup
          type="multiple"
          value={activeTags}
          onValueChange={setActiveTags}
          variant="outline"
          className="flex-wrap justify-start gap-1.5"
        >
          {allTags.map((t) => (
            <ToggleGroupItem
              key={t.name}
              value={t.name}
              aria-label={t.name}
              className="gap-1.5"
            >
              {t.name}
              <Badge variant="secondary" className="text-3xs ml-1 px-1.5 py-0">
                {t.count}
              </Badge>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <Separator />

      {/* 计数 */}
      <p className="text-muted-foreground text-sm">
        {filtered.length === items.length
          ? `${items.length} 个物品`
          : `${filtered.length} / ${items.length} 个物品`}
      </p>

      {/* 结果 */}
      {filtered.length > 0 ? (
        <div className="flex flex-col gap-8">
          {filteredByCategory.map(([category, list]) => (
            <section key={category} className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold">{category}</h2>
                <Badge variant="secondary">{list.length}</Badge>
              </div>
              <DataTable
                columns={[
                  { width: 96, header: "图标" },
                  { width: 240, header: "名称" },
                  { width: 112, header: "Tag" },
                  { header: "描述" },
                ]}
              >
                {list.map((item) => (
                  <TableRow key={item.slug} className="hover:bg-muted/50">
                    <TableCell className="py-3 text-center align-middle">
                      {item.iconUrl ? (
                        <Link
                          href={pokopiaItemHref(item.slug)}
                          className="hover:opacity-80 inline-block transition-opacity"
                          aria-label={`查看 ${item.name} 详情`}
                        >
                          <Image
                            src={item.iconUrl}
                            alt=""
                            width={48}
                            height={48}
                            unoptimized
                            className="size-12 mx-auto object-contain"
                          />
                        </Link>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-center align-middle">
                      <Link
                        href={pokopiaItemHref(item.slug)}
                        className="hover:text-accent font-semibold underline-offset-2 hover:underline"
                      >
                        {item.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-center align-middle">
                      {item.tag ? (
                        <Badge
                          variant="secondary"
                          className="text-3xs px-1.5 py-0"
                        >
                          {item.tag}
                        </Badge>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-muted-foreground align-middle text-sm whitespace-normal">
                      {item.description}
                    </TableCell>
                  </TableRow>
                ))}
              </DataTable>
            </section>
          ))}
        </div>
      ) : (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No items match</EmptyTitle>
            <EmptyDescription>
              换个关键字或清掉一些 filter 试试。
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </div>
  )
}

"use client"

import * as React from "react"
import Image from "next/image"
import { ArrowDownIcon, ArrowUpIcon, SearchIcon } from "lucide-react"

import { PokopiaPokedexCard } from "@/components/pokopia/pokedex-card"
import { Badge } from "@/components/ui/badge"
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
import { Separator } from "@/components/ui/separator"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type {
  PokopiaPokemon,
  PokopiaSpecialty,
} from "@/lib/pokemon/pokopia/types"

interface PokopiaPokedexExplorerProps {
  pokemon: PokopiaPokemon[]
}

type SpecialtyMode = "or" | "and"
type SortDirection = "asc" | "desc"

/**
 * Client-side 搜索 + Specialty filter + 排序，渲染过滤后的卡片网格。
 *
 * 数据从 server component 一次性传进来（~308 只），全部 client 端 filter，
 * 不需要每次输入都打网络。
 *
 * 灵感来自 fgo.wiki/英灵图鉴：每个 filter chip 多选 + 左侧 AND/OR 切换组合方式
 *
 * Filter 逻辑：
 *   - 名字模糊匹配（不区分大小写）
 *   - Specialty 多选：
 *     - OR 模式：选中任意一个匹配则保留
 *     - AND 模式：必须全部匹配才保留
 *   - 名字 AND specialty：两个条件 AND
 */
export function PokopiaPokedexExplorer({
  pokemon,
}: PokopiaPokedexExplorerProps) {
  const [query, setQuery] = React.useState("")
  const [activeSpecialties, setActiveSpecialties] = React.useState<string[]>([])
  const [specialtyMode, setSpecialtyMode] = React.useState<SpecialtyMode>("or")
  const [sortDirection, setSortDirection] = React.useState<SortDirection>("asc")

  // 从 pokemon 里抽出去重后的 specialty 列表（用 name 当 key），按字母排序
  const allSpecialties = React.useMemo<PokopiaSpecialty[]>(() => {
    const byName = new Map<string, PokopiaSpecialty>()
    for (const p of pokemon) {
      for (const s of p.specialties) {
        if (!byName.has(s.name)) byName.set(s.name, s)
      }
    }
    return Array.from(byName.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    )
  }, [pokemon])

  const { mainList, eventList } = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = pokemon.filter((p) => {
      if (q && !p.name.toLowerCase().includes(q)) return false
      if (activeSpecialties.length > 0) {
        const ownNames = new Set(p.specialties.map((s) => s.name))
        if (specialtyMode === "or") {
          if (!activeSpecialties.some((name) => ownNames.has(name))) return false
        } else {
          if (!activeSpecialties.every((name) => ownNames.has(name))) return false
        }
      }
      return true
    })

    const sorted = [...filtered].sort((a, b) =>
      sortDirection === "asc"
        ? a.pokopiaNumber - b.pokopiaNumber
        : b.pokopiaNumber - a.pokopiaNumber
    )

    return {
      mainList: sorted.filter((p) => !p.isEvent),
      eventList: sorted.filter((p) => p.isEvent),
    }
  }, [pokemon, query, activeSpecialties, specialtyMode, sortDirection])

  const totalFiltered = mainList.length + eventList.length

  // ToggleGroup type="single" 不允许 value 为 ""，需保护避免取消选择
  const handleModeChange = React.useCallback((value: string) => {
    if (value === "or" || value === "and") setSpecialtyMode(value)
  }, [])
  const handleSortChange = React.useCallback((value: string) => {
    if (value === "asc" || value === "desc") setSortDirection(value)
  }, [])

  return (
    <div className="flex flex-col gap-6">
      {/* 搜索框 */}
      <InputGroup>
        <InputGroupAddon>
          <SearchIcon />
        </InputGroupAddon>
        <InputGroupInput
          type="search"
          placeholder="按名字搜索 (Bulbasaur, Char...)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </InputGroup>

      {/* Specialty 过滤器：左侧 AND/OR 切换 + 右侧 chip 多选 */}
      <div className="flex flex-col gap-2">
        <p className="text-muted-foreground text-xs">
          Filter by Specialty (多选)
        </p>
        <div className="flex flex-wrap items-start gap-3">
          <ToggleGroup
            type="single"
            value={specialtyMode}
            onValueChange={handleModeChange}
            variant="outline"
            aria-label="Specialty 多选合并方式"
          >
            <ToggleGroupItem value="or">OR</ToggleGroupItem>
            <ToggleGroupItem value="and">AND</ToggleGroupItem>
          </ToggleGroup>
          <Separator
            orientation="vertical"
            className="data-[orientation=vertical]:h-9"
          />
          <ToggleGroup
            type="multiple"
            value={activeSpecialties}
            onValueChange={setActiveSpecialties}
            variant="outline"
            className="flex-wrap justify-start gap-1.5"
          >
            {allSpecialties.map((s) => (
              <ToggleGroupItem
                key={s.name}
                value={s.name}
                aria-label={s.name}
                className="gap-1.5"
              >
                {s.iconUrl ? (
                  <Image
                    src={s.iconUrl}
                    alt=""
                    width={16}
                    height={16}
                    data-icon="inline-start"
                    unoptimized
                    className="shrink-0"
                  />
                ) : null}
                {s.name}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </div>

      {/* 计数 + 排序 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">
          {totalFiltered === pokemon.length
            ? `${pokemon.length} 只`
            : `${totalFiltered} / ${pokemon.length} 只`}
        </p>

        <ToggleGroup
          type="single"
          value={sortDirection}
          onValueChange={handleSortChange}
          variant="outline"
          aria-label="按编号排序"
        >
          <ToggleGroupItem value="asc" aria-label="编号升序">
            <ArrowUpIcon data-icon="inline-start" />#
          </ToggleGroupItem>
          <ToggleGroupItem value="desc" aria-label="编号降序">
            <ArrowDownIcon data-icon="inline-start" />#
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* 结果网格 / Empty */}
      {totalFiltered > 0 ? (
        <div className="flex flex-col gap-8">
          {mainList.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-6">
              {mainList.map((p) => (
                <PokopiaPokedexCard key={p.slug} pokemon={p} />
              ))}
            </div>
          ) : null}
          {eventList.length > 0 ? (
            <section className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold">Event Pokémon</h2>
                <Badge variant="secondary">{eventList.length}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-6">
                {eventList.map((p) => (
                  <PokopiaPokedexCard key={`event-${p.slug}`} pokemon={p} />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      ) : (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No Pokémon found</EmptyTitle>
            <EmptyDescription>
              换个关键字或清掉一些 specialty filter 试试。
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </div>
  )
}

/**
 * Pokopia 单只 Pokemon 详情解析。
 *
 * 数据源：serebii.net/pokemonpokopia/pokedex/{slug}.shtml
 * 例如：/pokemonpokopia/pokedex/bulbasaur.shtml
 */

import * as cheerio from "cheerio"

import { slugFromSerebiiUrl } from "@/lib/pokemon/pokopia/links"
import type {
  PokopiaEntityRef,
  PokopiaFavoriteRef,
  PokopiaIdealHabitatRef,
  PokopiaPokemonDetail,
  PokopiaSpecialty,
  PokopiaType,
} from "@/lib/pokemon/pokopia/types"
import { absolutizeSerebiiUrl, fetchSerebiiHtml } from "../client"

const POKEMON_DETAIL_BASE = "/pokemonpokopia/pokedex"

export async function getPokopiaPokemonBySlug(
  slug: string
): Promise<PokopiaPokemonDetail | null> {
  const path = `${POKEMON_DETAIL_BASE}/${encodeURIComponent(slug)}.shtml`
  try {
    const html = await fetchSerebiiHtml(path)
    return parsePokopiaPokemonDetailHtml(html, slug, path)
  } catch {
    return null
  }
}

/**
 * 解析详情页 HTML。
 *
 * Serebii 的页面结构（按区块）：
 *
 *   <h1>#001 Bulbasaur</h1>
 *   ──────────────────────
 *   Picture row
 *   ──────────────────────
 *   Type | Classification | Std. Height | Std. Weight    ← header
 *   <icons> | text | text | text                          ← values
 *   ──────────────────────
 *   <h2>Flavor Text</h2>
 *   {text}
 *   ──────────────────────
 *   <h2>Stats</h2>
 *   Specialty | Ideal Habitat | Favorites    ← header
 *   <chips>   | <link>        | <link list>  ← values
 *   ──────────────────────
 *   <h2>Habitats & Locations</h2>
 *   {复杂 table — v1 不解析}
 */
export function parsePokopiaPokemonDetailHtml(
  html: string,
  slug: string,
  fromPath: string
): PokopiaPokemonDetail | null {
  const $ = cheerio.load(html)

  // ─── #NNN + Name ───
  const h1Text = $("h1").first().text().trim()
  // 形如 "#001 Bulbasaur"
  const h1Match = h1Text.match(/^#?(\d+)\s+(.+)$/)
  if (!h1Match) return null
  const pokopiaNumber = Number.parseInt(h1Match[1], 10)
  const name = h1Match[2].trim()

  // ─── Sprite ───
  const spriteImg = $("#sprite-regular").first()
  const imageUrl = absolutizeSerebiiUrl(
    spriteImg.attr("src") ?? "",
    fromPath
  )

  // ─── Basic info row（Type / Classification / Height / Weight）───
  const basicHeaderRow = findRowAfterHeader($, ["Type", "Classification"])
  const types: PokopiaType[] = []
  let classification = ""
  let heightImperial = ""
  let heightMetric = ""
  let weightImperial = ""
  let weightMetric = ""

  if (basicHeaderRow) {
    const cells = basicHeaderRow.children("td")
    // Type 是第 1 列：包含 1-2 个 type icon
    cells
      .eq(0)
      .find("img")
      .each((_, img) => {
        const $img = $(img)
        const typeName = $img.attr("alt")?.trim() ?? ""
        const typeSrc = $img.attr("src") ?? ""
        if (typeName) {
          types.push({
            name: typeName,
            iconUrl: absolutizeSerebiiUrl(typeSrc, fromPath),
          })
        }
      })
    classification = cells.eq(1).text().trim()
    const heightHtml = cells.eq(2).text().replace(/\s+/g, " ").trim()
    const weightHtml = cells.eq(3).text().replace(/\s+/g, " ").trim()
    // 例 "2'04\" 0.7m" 拆成两段
    const heightMatch = heightHtml.match(/^(.+?)\s+([0-9.]+m.*)$/)
    if (heightMatch) {
      heightImperial = heightMatch[1].trim()
      heightMetric = heightMatch[2].trim()
    } else {
      heightImperial = heightHtml
    }
    const weightMatch = weightHtml.match(/^(.+?)\s+([0-9.]+kg.*)$/)
    if (weightMatch) {
      weightImperial = weightMatch[1].trim()
      weightMetric = weightMatch[2].trim()
    } else {
      weightImperial = weightHtml
    }
  }

  // ─── Flavor Text ───
  const flavorText = textAfterH2($, "Flavor Text")

  // ─── Specialty / Ideal Habitat / Favorites row ───
  const stuffRow = findRowAfterHeader($, [
    "Specialty",
    "Ideal Habitat",
    "Favorites",
  ])
  let specialties: PokopiaSpecialty[] = []
  let idealHabitat: PokopiaIdealHabitatRef | null = null
  let favorites: PokopiaFavoriteRef[] = []

  if (stuffRow) {
    const cells = stuffRow.children("td")
    specialties = parseSpecialtiesFromCell($, cells.eq(0), fromPath)
    idealHabitat = parseFirstRefFromCell(
      $,
      cells.eq(1),
      "/idealhabitat/",
      fromPath
    )
    favorites = parseAllRefsFromCell(
      $,
      cells.eq(2),
      "/favorites/",
      fromPath
    )
  }

  return {
    pokopiaNumber,
    name,
    slug,
    imageUrl,
    detailUrl: absolutizeSerebiiUrl(fromPath),
    specialties,
    types,
    classification,
    heightImperial,
    heightMetric,
    weightImperial,
    weightMetric,
    flavorText,
    idealHabitat,
    favorites,
  }
}

// ─── 辅助 ───

/**
 * 找一个 `<tr>` 包含给定 `<td class="foo">` 文字的 header 行，
 * 返回它**之后**的下一个 `<tr>`（数据行）。
 */
function findRowAfterHeader(
  $: cheerio.CheerioAPI,
  headerLabels: string[]
): ReturnType<cheerio.CheerioAPI> | null {
  let result: ReturnType<cheerio.CheerioAPI> | null = null
  $("tr").each((_, row) => {
    const $row = $(row)
    const cells = $row.children("td.foo")
    if (cells.length < headerLabels.length) return
    const matches = headerLabels.every(
      (label, i) => cells.eq(i).text().trim() === label
    )
    if (matches) {
      result = $row.next("tr")
      return false
    }
  })
  return result
}

/**
 * 从 `<h2>{heading}</h2>` 所在的 `<tr>` 之后拿下一行 `<td.fooinfo>` 的文字。
 * 跟 specialty 详情解析里同样的 pattern。
 */
function textAfterH2($: cheerio.CheerioAPI, heading: string): string {
  let result = ""
  $("h2").each((_, el) => {
    if ($(el).text().trim() !== heading) return
    const headingTr = $(el).closest("tr")
    const nextTr = headingTr.next("tr")
    const fooinfo = nextTr.find("td.fooinfo").first()
    if (fooinfo.length) {
      result = fooinfo.text().trim().replace(/\s+/g, " ")
    }
    return false
  })
  return result
}

/**
 * Specialty 单元格里抽出 specialty 列表。复用 pokopia.ts 同样的逻辑，
 * 但这里独立写一份是因为 fromPath 不同（详情页 vs 列表页）。
 */
function parseSpecialtiesFromCell(
  $: cheerio.CheerioAPI,
  cell: ReturnType<cheerio.CheerioAPI>,
  fromPath: string
): PokopiaSpecialty[] {
  const byUrl = new Map<string, PokopiaSpecialty>()

  cell.find("a").each((_, a) => {
    const $a = $(a)
    const href = $a.attr("href") ?? ""
    if (!href.includes("/specialty/")) return

    const detailUrl = absolutizeSerebiiUrl(href, fromPath)
    const existing = byUrl.get(detailUrl)
    const text = $a.text().trim()
    const iconSrc = $a.find("img").attr("src")

    if (existing) {
      if (text && !existing.name) existing.name = text
      if (iconSrc && !existing.iconUrl) {
        existing.iconUrl = absolutizeSerebiiUrl(iconSrc, fromPath)
      }
      return
    }

    byUrl.set(detailUrl, {
      name: text || "",
      slug: slugFromSerebiiUrl(href, "specialty/"),
      iconUrl: iconSrc ? absolutizeSerebiiUrl(iconSrc, fromPath) : "",
      detailUrl,
    })
  })

  return Array.from(byUrl.values()).filter((s) => s.name.length > 0)
}

/** 从单元格里抽第一个 entity ref（用于 ideal habitat — 单值） */
function parseFirstRefFromCell(
  $: cheerio.CheerioAPI,
  cell: ReturnType<cheerio.CheerioAPI>,
  pathSegment: string,
  fromPath: string
): PokopiaEntityRef | null {
  const refs = parseAllRefsFromCell($, cell, pathSegment, fromPath)
  return refs.length > 0 ? refs[0] : null
}

/** 从单元格里抽所有 entity ref（用于 favorites — 多值） */
function parseAllRefsFromCell(
  $: cheerio.CheerioAPI,
  cell: ReturnType<cheerio.CheerioAPI>,
  pathSegment: string,
  fromPath: string
): PokopiaEntityRef[] {
  const seen = new Set<string>()
  const result: PokopiaEntityRef[] = []
  cell.find("a").each((_, a) => {
    const $a = $(a)
    const href = $a.attr("href") ?? ""
    if (!href.includes(pathSegment)) return
    const text = $a.text().trim()
    if (!text || seen.has(href)) return
    seen.add(href)
    result.push({
      name: text,
      slug: slugFromSerebiiUrl(href, pathSegment),
      detailUrl: absolutizeSerebiiUrl(href, fromPath),
    })
  })
  return result
}


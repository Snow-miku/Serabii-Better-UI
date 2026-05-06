/**
 * Pokopia Habitats — 列表 parser。
 *
 * 数据源：serebii.net/pokemonpokopia/habitats.shtml
 * 详情页 URL pattern：/pokemonpokopia/habitatdex/{slug}.shtml
 *   注意：列表 URL 是 habitats.shtml 但详情走的是 habitatdex/，不一致是 Serebii 的设计。
 */

import * as cheerio from "cheerio"

import { slugFromSerebiiUrl } from "@/lib/pokemon/pokopia/links"
import type {
  PokopiaHabitat,
  PokopiaHabitatDetail,
} from "@/lib/pokemon/pokopia/types"
import { absolutizeSerebiiUrl, fetchSerebiiHtml } from "../client"

const HABITATS_LIST_PATH = "/pokemonpokopia/habitats.shtml"
const HABITATS_DETAIL_BASE = "/pokemonpokopia/habitatdex"

export async function getPokopiaHabitats(): Promise<PokopiaHabitat[]> {
  const html = await fetchSerebiiHtml(HABITATS_LIST_PATH)
  return parseHabitatsListHtml(html)
}

export function parseHabitatsListHtml(html: string): PokopiaHabitat[] {
  const $ = cheerio.load(html)
  const seen = new Set<string>()
  const result: PokopiaHabitat[] = []

  // 跟踪当前 section（见到 "Habitats (Event)" header 后切到 event 模式）
  let isEventSection = false

  $("table.dextable tr").each((_, row) => {
    const $row = $(row)
    const cells = $row.children("td")
    if (cells.length === 0) return

    // 列名标记 / event section 切换
    const firstCellText = cells.first().text().trim()
    if (cells.first().hasClass("fooevo")) {
      if (firstCellText.includes("Habitats (Event)")) {
        isEventSection = true
      }
      return
    }

    if (cells.length < 4) return

    const numText = cells.eq(0).text().trim()
    const numMatch = numText.match(/^#?0*(\d+)$/)
    if (!numMatch) return
    const habitatNumber = Number.parseInt(numMatch[1], 10)

    const picLink = cells.eq(1).find("a").first()
    const href = picLink.attr("href") ?? ""
    if (!href.includes("habitatdex/")) return
    const imgSrc = picLink.find("img").attr("src") ?? ""

    const name = cells.eq(2).find("a").first().text().trim().replace(/\s+/g, " ")
    if (!name) return
    const description = cells.eq(3).text().trim().replace(/\s+/g, " ")

    const slug = slugFromSerebiiUrl(href, "habitatdex/")
    if (!slug || seen.has(slug)) return
    seen.add(slug)

    result.push({
      habitatNumber,
      name,
      slug,
      iconUrl: absolutizeSerebiiUrl(imgSrc, HABITATS_LIST_PATH),
      detailUrl: absolutizeSerebiiUrl(href, HABITATS_LIST_PATH),
      description,
      isEvent: isEventSection,
    })
  })

  return result
}

// ─────────────────────────────────────────────────────────────
// Detail 解析（住户 Pokemon list）
// ─────────────────────────────────────────────────────────────

export async function getPokopiaHabitatBySlug(
  slug: string
): Promise<PokopiaHabitatDetail | null> {
  const path = `${HABITATS_DETAIL_BASE}/${encodeURIComponent(slug)}.shtml`
  try {
    const [allHabitats, detailHtml] = await Promise.all([
      getPokopiaHabitats(),
      fetchSerebiiHtml(path),
    ])
    const base = allHabitats.find((h) => h.slug === slug)
    if (!base) return null
    const extras = parseHabitatDetailExtras(detailHtml)
    return { ...base, ...extras }
  } catch {
    return null
  }
}

/**
 * 详情页结构：
 *   <h1>Tall Grass</h1>
 *   Picture
 *   <h2>Flavor Text</h2> {text}
 *   <h2>Requirements</h2> table
 *   <h2>Available Pokémon</h2>
 *      table 里每 4 个 Pokemon 一行（image 和 name 各占一行）
 *
 * 我们抓所有 a[href="/pokemonpokopia/pokedex/{slug}.shtml"] 当 slugs。
 */
function parseHabitatDetailExtras(html: string): {
  flavorText: string
  pokemonSlugs: string[]
} {
  const $ = cheerio.load(html)

  // Flavor Text — h2 + 下一 tr 的 fooinfo
  let flavorText = ""
  $("h2").each((_, el) => {
    if ($(el).text().trim() !== "Flavor Text") return
    const tr = $(el).closest("tr")
    const next = tr.next("tr")
    flavorText = next.find("td.fooinfo").first().text().trim().replace(/\s+/g, " ")
    return false
  })

  // Pokemon slugs — 整页扫所有 /pokedex/{slug}.shtml 链接（slug 不含 /）
  const seen = new Set<string>()
  const pokemonSlugs: string[] = []
  $("a").each((_, a) => {
    const href = $(a).attr("href") ?? ""
    const m = href.match(/\/pokemonpokopia\/pokedex\/([^/]+)\.shtml$/)
    if (!m) return
    const slug = m[1]
    if (seen.has(slug)) return
    seen.add(slug)
    pokemonSlugs.push(slug)
  })

  return { flavorText, pokemonSlugs }
}

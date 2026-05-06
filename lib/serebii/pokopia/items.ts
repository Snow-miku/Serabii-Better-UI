/**
 * Pokopia Items — 列表 parser。
 *
 * 数据源：serebii.net/pokemonpokopia/items.shtml
 * 详情页 URL pattern：/pokemonpokopia/items/{slug}.shtml
 *
 * 页面结构：
 *   <h2>List of Materials</h2>  → <table.dextable> 5 列
 *   <h2>List of Food</h2>       → <table.dextable>
 *   <h2>...</h2>                → 更多 section
 * 列：Picture | Name | Description | Tag | Locations
 *
 * Locations 列含多个 <a href="locations/...">  + 文字标注（如 "(Natural)" "Around trees"）。
 */

import * as cheerio from "cheerio"

import { slugFromSerebiiUrl } from "@/lib/pokemon/pokopia/links"
import type {
  PokopiaEntityRef,
  PokopiaItem,
  PokopiaItemDetail,
  PokopiaItemLocationRef,
} from "@/lib/pokemon/pokopia/types"
import { absolutizeSerebiiUrl, fetchSerebiiHtml } from "../client"

const ITEMS_LIST_PATH = "/pokemonpokopia/items.shtml"
const ITEMS_DETAIL_BASE = "/pokemonpokopia/items"

export async function getPokopiaItems(): Promise<PokopiaItem[]> {
  const html = await fetchSerebiiHtml(ITEMS_LIST_PATH)
  return parseItemsListHtml(html)
}

export function parseItemsListHtml(html: string): PokopiaItem[] {
  const $ = cheerio.load(html)
  const seen = new Set<string>()
  const result: PokopiaItem[] = []

  $("table.dextable").each((_, table) => {
    const $table = $(table)

    // 走回去找最近的 <h2>（可能直接是 <h2> 或 wrap 在 <p> 里）
    // 之前用 prevAll("p").find("h2").first() 是 bug：first() 返回 DOM 最早的 h2，
    // 不是最近的，所以所有 table 都拿到 "List of Materials"。
    let category = "Items"
    let cursor = $table.prev()
    while (cursor.length) {
      const ownH2 = cursor.is("h2") ? cursor : cursor.find("h2").last()
      if (ownH2.length) {
        category = ownH2.text().replace(/^List of /i, "").trim() || category
        break
      }
      cursor = cursor.prev()
    }

    $table.find("tr").each((_, row) => {
      const $row = $(row)
      const cells = $row.children("td")
      if (cells.length < 5) return
      if (cells.first().hasClass("fooevo")) return

      const picCell = cells.eq(0)
      const picLink = picCell.find("a").first()
      const href = picLink.attr("href") ?? ""
      if (!href.includes("items/")) return
      const imgSrc = picLink.find("img").attr("src") ?? ""

      const name = cells.eq(1).find("a").first().text().trim()
      if (!name) return
      const description = cells.eq(2).text().trim().replace(/\s+/g, " ")

      // Tag 列：很多 item 是 &nbsp;（U+00A0）= 空 tag。
      // .text() 不会把 nbsp 当 whitespace，所以单独清理
      const tagRaw = cells.eq(3).text().replace(/[ ]/g, "").trim()
      const tag = tagRaw.replace(/\s+/g, " ")

      const slug = slugFromSerebiiUrl(href, "items/")
      if (!slug || seen.has(slug)) return
      seen.add(slug)

      const locations = parseItemLocationsCell($, cells.eq(4))

      result.push({
        name,
        slug,
        iconUrl: absolutizeSerebiiUrl(imgSrc, ITEMS_LIST_PATH),
        detailUrl: absolutizeSerebiiUrl(href, ITEMS_LIST_PATH),
        description,
        category,
        tag,
        locations,
      })
    })
  })

  return result
}

// ─────────────────────────────────────────────────────────────
// Detail 解析
// ─────────────────────────────────────────────────────────────

/**
 * Item 详情。我们从 list 已经拿到 base 数据，详情只补 flavorText / tradeValue /
 * favoriteCategories（反向 link 到 favorites）。
 *
 * 列表数据通过 slug 跟详情合并：先查 list（cache 命中）拿 base，再 fetch detail
 * 增量。这样 generateMetadata 只调一个函数。
 */
export async function getPokopiaItemBySlug(
  slug: string
): Promise<PokopiaItemDetail | null> {
  const path = `${ITEMS_DETAIL_BASE}/${encodeURIComponent(slug)}.shtml`
  try {
    const [allItems, detailHtml] = await Promise.all([
      getPokopiaItems(),
      fetchSerebiiHtml(path),
    ])
    const base = allItems.find((i) => i.slug === slug)
    if (!base) return null
    const extras = parseItemDetailExtras(detailHtml, path)
    return { ...base, ...extras }
  } catch {
    return null
  }
}

/**
 * 解析详情页特有字段：
 *   - flavorText（"Flavor Text" 标题之后的 fooinfo 文字）
 *   - tradeValue（"Trade Value" 区块的文字）
 *   - favoriteCategories（"Favorite Categories" 区块里的 /favorites/ links）
 *
 * Serebii 详情页布局复杂（colspan + 嵌套 row），用启发式：
 *   - flavorText 用现成 textAfterH2 helper
 *   - tradeValue 抓 "Trade Value" header 之后**直到**下一个 h2 之间的所有文字
 *   - favoriteCategories 抓 "Favorite Categories" 之后**直到**下一个 h2 之间的所有 a[href*="/favorites/"]
 */
function parseItemDetailExtras(
  html: string,
  fromPath: string
): {
  flavorText: string
  tradeValue: string
  favoriteCategories: PokopiaEntityRef[]
} {
  const $ = cheerio.load(html)

  // ── Flavor Text ──
  let flavorText = ""
  $("h2").each((_, el) => {
    if ($(el).text().trim() !== "Flavor Text") return
    const tr = $(el).closest("tr")
    const next = tr.next("tr")
    flavorText = next.find("td.fooinfo").first().text().trim().replace(/\s+/g, " ")
    return false
  })

  // ── Trade Value ──
  // "Trade Value" 是一个 fooevo header（不是 h2）。它和 "Favorite Categories" 在同一行。
  // 找含 "Trade Value" 的 fooevo td 的 <tr>，然后收集后续兄弟 tr 直到下一个 fooevo header。
  const tradeRow = $("td.fooevo")
    .filter((_, el) => $(el).text().trim() === "Trade Value")
    .first()
    .closest("tr")
  let tradeValue = ""
  if (tradeRow.length) {
    // 两行结构：[Standard | 400] [Favorite: | 600]
    // 取每行非 favorite-link 的 cell，配对成 "label value" pair，再用 " · " 连接
    const pairs: string[] = []
    let cur = tradeRow.next("tr")
    let safety = 0
    while (cur.length && safety < 6) {
      const cells = cur.children("td")
      if (cells.length === 0) break
      const isHeaderRow = cells
        .toArray()
        .some((c) => $(c).hasClass("fooevo"))
      if (isHeaderRow) break

      // 过滤出 trade value 那列的 cell（去掉 fooblack 子标题和 favorite-link cell）
      const tradeCells = cells.toArray().filter((td) => {
        const $td = $(td)
        if ($td.hasClass("fooblack")) return false
        if ($td.find('a[href*="/favorites/"]').length) return false
        return true
      })

      const texts = tradeCells
        .map((td) => $(td).text().trim().replace(/\s+/g, " "))
        .filter(Boolean)

      if (texts.length === 2) pairs.push(`${texts[0]} ${texts[1]}`)
      else if (texts.length === 1) pairs.push(texts[0])

      cur = cur.next("tr")
      safety++
    }
    tradeValue = pairs.join(" · ")
  }

  // ── Favorite Categories ──
  // 找 "Favorite Categories" header 所在 tr，扫描其后所有 tr 里的 a[href*="/favorites/"]
  // 直到遇到含 h2 的 row（下一段 section）。
  const favHeaderRow = $("td.fooevo")
    .filter((_, el) => $(el).text().trim() === "Favorite Categories")
    .first()
    .closest("tr")
  const favoriteCategories: PokopiaEntityRef[] = []
  const favSeen = new Set<string>()
  if (favHeaderRow.length) {
    let cur = favHeaderRow.next("tr")
    let safety = 0
    while (cur.length && safety < 20) {
      if (cur.find("h2").length) break
      cur.find("a").each((_, a) => {
        const $a = $(a)
        const href = $a.attr("href") ?? ""
        if (!href.includes("/favorites/")) return
        const name = $a.text().trim()
        if (!name) return
        const slug = slugFromSerebiiUrl(href, "favorites/")
        if (!slug || favSeen.has(slug)) return
        favSeen.add(slug)
        favoriteCategories.push({
          name,
          slug,
          detailUrl: absolutizeSerebiiUrl(href, fromPath),
        })
      })
      cur = cur.next("tr")
      safety++
    }
  }

  return { flavorText, tradeValue, favoriteCategories }
}

/**
 * 把 location 单元格里的 location refs 抽出来。
 * 单元格内部：<a>locations/X.shtml</a> + 紧跟其后纯文本（如 "(Natural)"）+ <br />
 * 也可能是 dreamisland/X.shtml（Dream Island 也是个地点概念）
 */
function parseItemLocationsCell(
  $: cheerio.CheerioAPI,
  cell: ReturnType<cheerio.CheerioAPI>
): PokopiaItemLocationRef[] {
  const seen = new Set<string>()
  const result: PokopiaItemLocationRef[] = []

  cell.find("a").each((_, a) => {
    const $a = $(a)
    const href = $a.attr("href") ?? ""
    if (!href.includes("/locations/") && !href.includes("/dreamisland/")) return

    const name = $a.text().trim()
    if (!name) return

    let slug = ""
    let prefix = ""
    if (href.includes("/locations/")) {
      slug = slugFromSerebiiUrl(href, "locations/")
      prefix = "loc:"
    } else {
      slug = slugFromSerebiiUrl(href, "dreamisland/")
      prefix = "di:"
    }
    if (!slug || seen.has(prefix + slug)) return
    seen.add(prefix + slug)

    const next = $a[0]?.nextSibling
    let note = ""
    if (next && next.type === "text") {
      note = (next.data ?? "").replace(/\s+/g, " ").trim()
    }

    result.push({
      name,
      slug,
      detailUrl: absolutizeSerebiiUrl(href, ITEMS_LIST_PATH),
      note,
    })
  })

  return result
}

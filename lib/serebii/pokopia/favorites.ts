/**
 * Pokopia Favorites — 列表 parser。
 *
 * 数据源：serebii.net/pokemonpokopia/favorites.shtml
 * 详情页 URL pattern：/pokemonpokopia/favorites/{slug}.shtml
 *
 * 当前 Serebii 的列表只有 2 列（Name + Quantity of Items），且 Quantity 全是 "TBD"。
 * 我们只取 name + slug + detailUrl，详情页留给单独 fetch。
 */

import * as cheerio from "cheerio"

import { slugFromSerebiiUrl } from "@/lib/pokemon/pokopia/links"
import type {
  PokopiaFavorite,
  PokopiaFavoriteDetail,
  PokopiaFavoriteItemRef,
} from "@/lib/pokemon/pokopia/types"
import { absolutizeSerebiiUrl, fetchSerebiiHtml } from "../client"

const FAVORITES_LIST_PATH = "/pokemonpokopia/favorites.shtml"
const FAVORITES_DETAIL_BASE = "/pokemonpokopia/favorites"

export async function getPokopiaFavorites(): Promise<PokopiaFavorite[]> {
  const html = await fetchSerebiiHtml(FAVORITES_LIST_PATH)
  return parseFavoritesListHtml(html)
}

export function parseFavoritesListHtml(html: string): PokopiaFavorite[] {
  const $ = cheerio.load(html)
  const seen = new Set<string>()
  const result: PokopiaFavorite[] = []

  $("table.dextable tr").each((_, row) => {
    const $row = $(row)
    const cells = $row.children("td")
    if (cells.length < 2) return
    if (cells.first().hasClass("fooevo")) return

    const link = cells.eq(0).find("a").first()
    const href = link.attr("href") ?? ""
    if (!href.includes("/favorites/")) return

    const name = link.text().trim()
    if (!name) return // 跳过 Serebii 列表里的空 row（最后一条 broken）

    const slug = slugFromSerebiiUrl(href, "favorites/")
    if (!slug || seen.has(slug)) return
    seen.add(slug)

    result.push({
      name,
      slug,
      detailUrl: absolutizeSerebiiUrl(href, FAVORITES_LIST_PATH),
    })
  })

  return result.sort((a, b) => a.name.localeCompare(b.name))
}

// ─────────────────────────────────────────────────────────────
// Detail 解析（items + pokemon 双 list）
// ─────────────────────────────────────────────────────────────

export async function getPokopiaFavoriteBySlug(
  slug: string
): Promise<PokopiaFavoriteDetail | null> {
  const path = `${FAVORITES_DETAIL_BASE}/${encodeURIComponent(slug)}.shtml`
  try {
    const html = await fetchSerebiiHtml(path)
    return parseFavoriteDetailHtml(html, slug, path)
  } catch {
    return null
  }
}

/**
 * 详情页结构：
 *   <h1>{Name}</h1>
 *   <h2>List of {Name} Items</h2>
 *   <table.dextable>: 4 cols (Pic | Name | Description | Category)
 *   <h2>List of Pokémon that like {Name}</h2>
 *   <table.tab>: 6 cols (#NNN | Pic | Name | Ideal Habitat | Specialty Icon | Specialty)
 */
export function parseFavoriteDetailHtml(
  html: string,
  slug: string,
  fromPath: string
): PokopiaFavoriteDetail | null {
  const $ = cheerio.load(html)
  const name = $("h1").first().text().trim()
  if (!name) return null

  // Items table（dextable, 4 cols）
  const items: PokopiaFavoriteItemRef[] = []
  const itemSeen = new Set<string>()
  $("table.dextable").each((_, table) => {
    $(table)
      .find("tr")
      .each((_, row) => {
        const cells = $(row).children("td")
        if (cells.length < 4) return
        if (cells.first().hasClass("fooevo")) return

        const picLink = cells.eq(0).find("a").first()
        const href = picLink.attr("href") ?? ""
        if (!href.includes("items/")) return
        const iconSrc = picLink.find("img").attr("src") ?? ""
        const itemName = cells.eq(1).find("a").first().text().trim()
        if (!itemName) return
        const description = cells
          .eq(2)
          .text()
          .trim()
          .replace(/\s+/g, " ")
        const tag = cells.eq(3).text().replace(/[ ]/g, "").trim()
        const itemSlug = slugFromSerebiiUrl(href, "items/")
        if (!itemSlug || itemSeen.has(itemSlug)) return
        itemSeen.add(itemSlug)
        items.push({
          name: itemName,
          slug: itemSlug,
          iconUrl: absolutizeSerebiiUrl(iconSrc, fromPath),
          description,
          tag,
        })
      })
  })

  // Pokemon table（class="tab"，6 cols）
  // 用 picture 列里 <a href> 拿 slug
  const pokemonSlugs: string[] = []
  const pokeSeen = new Set<string>()
  $("a").each((_, a) => {
    const $a = $(a)
    const href = $a.attr("href") ?? ""
    // 只接受形如 /pokemonpokopia/pokedex/{slug}.shtml（Pokemon 详情链接）
    const match = href.match(/\/pokemonpokopia\/pokedex\/([^\/]+)\.shtml$/)
    if (!match) return
    const pSlug = match[1]
    // 排除 specialty / idealhabitat 等子目录（它们的 href 包含更多段）
    if (pSlug.includes("/")) return
    // 检查父级——Pokemon table 在 favorite detail 里（<table class="tab">），
    // 而 specialty link 也在但 href 形如 /pokedex/specialty/X.shtml（包含 / ）已被上面过滤
    if (pokeSeen.has(pSlug)) return
    pokeSeen.add(pSlug)
    pokemonSlugs.push(pSlug)
  })

  return {
    name,
    slug,
    detailUrl: absolutizeSerebiiUrl(fromPath),
    items,
    pokemonSlugs,
  }
}

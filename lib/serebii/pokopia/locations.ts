/**
 * Pokopia Locations — 列表 parser。
 *
 * 数据源：serebii.net/pokemonpokopia/locations.shtml
 * 详情页 URL pattern：/pokemonpokopia/locations/{slug}.shtml
 */

import * as cheerio from "cheerio"

import { slugFromSerebiiUrl } from "@/lib/pokemon/pokopia/links"
import type { PokopiaLocation } from "@/lib/pokemon/pokopia/types"
import { absolutizeSerebiiUrl, fetchSerebiiHtml } from "../client"

const LOCATIONS_LIST_PATH = "/pokemonpokopia/locations.shtml"

export async function getPokopiaLocations(): Promise<PokopiaLocation[]> {
  const html = await fetchSerebiiHtml(LOCATIONS_LIST_PATH)
  return parseLocationsListHtml(html)
}

export function parseLocationsListHtml(html: string): PokopiaLocation[] {
  const $ = cheerio.load(html)
  const seen = new Set<string>()
  const result: PokopiaLocation[] = []

  $("table.dextable tr").each((_, row) => {
    const $row = $(row)
    const cells = $row.children("td")
    if (cells.length < 2) return
    if (cells.first().hasClass("fooevo")) return

    const picLink = cells.eq(0).find("a").first()
    const href = picLink.attr("href") ?? ""
    if (!href.includes("locations/")) return

    const imgSrc = picLink.find("img").attr("src") ?? ""
    const name = cells.eq(1).find("a").first().text().trim()
    if (!name) return

    const slug = slugFromSerebiiUrl(href, "locations/")
    if (!slug || seen.has(slug)) return
    seen.add(slug)

    result.push({
      name,
      slug,
      imageUrl: absolutizeSerebiiUrl(imgSrc, LOCATIONS_LIST_PATH),
      detailUrl: absolutizeSerebiiUrl(href, LOCATIONS_LIST_PATH),
    })
  })

  return result
}

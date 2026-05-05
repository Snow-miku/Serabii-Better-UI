/**
 * Pokopia Specialty 解析 — 列表页 + 单只详情页。
 *
 * 数据源：
 *   - 列表：serebii.net/pokemonpokopia/specialty.shtml
 *   - 详情：serebii.net/pokemonpokopia/pokedex/specialty/{slug}.shtml
 *
 * 24h ISR cache（fetchSerebiiHtml 默认）。
 */

import * as cheerio from "cheerio"

import { slugFromSerebiiUrl } from "@/lib/pokemon/pokopia/links"
import type {
  PokopiaSpecialtyDetail,
  PokopiaSpecialtyListEntry,
} from "@/lib/pokemon/pokopia/types"
import { absolutizeSerebiiUrl, fetchSerebiiHtml } from "../client"

const SPECIALTY_LIST_PATH = "/pokemonpokopia/specialty.shtml"
const SPECIALTY_DETAIL_BASE = "/pokemonpokopia/pokedex/specialty"

// ----- list page -----

export async function getPokopiaSpecialties(): Promise<
  PokopiaSpecialtyListEntry[]
> {
  const html = await fetchSerebiiHtml(SPECIALTY_LIST_PATH)
  return parseSpecialtyListHtml(html)
}

/**
 * 列表页结构：
 *   <table class="dextable">
 *     <tr> [header: Picture | Name | Description] </tr>
 *     <tr>
 *       <td class="cen"><a href="pokedex/specialty/grow.shtml"><img src="..."/></a></td>
 *       <td class="fooinfo"><a href="..."><u>Grow</u></a></td>
 *       <td class="fooinfo">{description}</td>
 *     </tr>
 *     ...
 *   </table>
 *
 * 注意：URL 是相对于列表页所在目录（/pokemonpokopia/）的相对路径，
 *       要用 fromPath = SPECIALTY_LIST_PATH 才能正确解析。
 */
export function parseSpecialtyListHtml(
  html: string
): PokopiaSpecialtyListEntry[] {
  const $ = cheerio.load(html)
  const result: PokopiaSpecialtyListEntry[] = []

  $("table.dextable tr").each((_, row) => {
    const $row = $(row)
    const cells = $row.children("td")
    if (cells.length < 3) return
    if (cells.first().hasClass("fooevo")) return // header

    const picCell = cells.eq(0)
    const nameCell = cells.eq(1)
    const descCell = cells.eq(2)

    const picAnchor = picCell.find("a").first()
    const iconSrc = picAnchor.find("img").attr("src") ?? ""
    const detailHref = picAnchor.attr("href") ?? ""

    const name = nameCell.find("a").first().text().trim()
    const description = descCell.text().trim()

    if (!name || !detailHref) return

    result.push({
      name,
      slug: slugFromSerebiiUrl(detailHref, "specialty/"),
      iconUrl: absolutizeSerebiiUrl(iconSrc, SPECIALTY_LIST_PATH),
      detailUrl: absolutizeSerebiiUrl(detailHref, SPECIALTY_LIST_PATH),
      description,
    })
  })

  return result
}

// ----- detail page -----

export async function getPokopiaSpecialtyBySlug(
  slug: string
): Promise<PokopiaSpecialtyDetail | null> {
  const path = `${SPECIALTY_DETAIL_BASE}/${encodeURIComponent(slug)}.shtml`
  try {
    const html = await fetchSerebiiHtml(path)
    return parseSpecialtyDetailHtml(html, slug, path)
  } catch {
    return null
  }
}

/**
 * 详情页结构：
 *   <h1>Grow</h1>
 *   ...Picture（图片在 fooevo "Picture" 后的 cen 单元格里的 <img>）
 *   <h2>Flavor Text</h2>
 *   {下一行 fooinfo 单元格的文字}
 *   <h2>Effect</h2>
 *   {下一行 fooinfo 单元格的文字}
 *   <h2>List of Pokémon with X Specialty</h2>
 *   {Pokemon table — 我们用自己的数据，跳过解析}
 */
export function parseSpecialtyDetailHtml(
  html: string,
  slug: string,
  fromPath: string
): PokopiaSpecialtyDetail | null {
  const $ = cheerio.load(html)

  const h1 = $("h1").first().text().trim()
  if (!h1) return null

  // 图标：找 alt 属性等于 specialty 名字的 <img>，或第一个 max-height 大的图
  const iconImg = $('img[alt]')
    .filter((_, el) => $(el).attr("alt")?.trim() === h1)
    .first()
  const iconSrc = iconImg.attr("src") ?? ""

  // 文本节：每个 <h2> 后的下一个 <td class="fooinfo"> 是它的内容
  const flavorText = textAfterH2($, "Flavor Text")
  const effect = textAfterH2($, "Effect")

  return {
    name: h1,
    slug,
    iconUrl: absolutizeSerebiiUrl(iconSrc, fromPath),
    detailUrl: absolutizeSerebiiUrl(fromPath),
    flavorText,
    effect,
  }
}

/**
 * 找标题为 heading 的 <h2>，返回它**所在 <tr> 之后**第一个
 * `<td class="fooinfo">` 的文字。Serebii 用的 HTML 模式：
 *   <tr><td class="fooevo"><h2>Effect</h2></td></tr>
 *   <tr><td class="fooinfo">...内容...</td></tr>
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
    return false // break
  })
  return result
}

/**
 * Pokopia 页面解析 — 从 Serebii availablepokemon.shtml 抓 + 解析。
 *
 * 缓存策略：fetchSerebiiHtml 默认 24h ISR revalidate。
 */

import * as cheerio from "cheerio"

import type {
  PokopiaPokemon,
  PokopiaSpecialty,
} from "@/lib/pokemon/pokopia/types"
import { absolutizeSerebiiUrl, fetchSerebiiHtml } from "./client"

const POKOPIA_AVAILABLE_PATH = "/pokemonpokopia/availablepokemon.shtml"

/**
 * 抓取并解析 Pokopia "Available Pokémon" 列表。
 *
 * Server-only — 内部用 fetch + Next.js ISR 缓存，不要在 client 调用。
 */
export async function getPokopiaAvailablePokemon(): Promise<PokopiaPokemon[]> {
  const html = await fetchSerebiiHtml(POKOPIA_AVAILABLE_PATH)
  return parsePokopiaAvailableHtml(html)
}

/**
 * 纯解析逻辑（拆出来好测试，传入任意 HTML 即可）。
 *
 * Serebii 表结构（每只一行）：
 *   <tr>
 *     <td class="cen">#001</td>
 *     <td class="cen"><a href=".../bulbasaur.shtml"><img src=".../001.png" /></a></td>
 *     <td class="cen"><a href="..."><u>Bulbasaur</u></a></td>
 *     <td class="cen">
 *       <table><tr>
 *         <td><a href=".../specialty/grow.shtml"><img src=".../grow.png" /></a></td>
 *         <td><a href=".../specialty/grow.shtml"><u>Grow</u></a></td>
 *       </tr></table>
 *     </td>
 *   </tr>
 */
export function parsePokopiaAvailableHtml(html: string): PokopiaPokemon[] {
  const $ = cheerio.load(html)
  const pokemon: PokopiaPokemon[] = []

  $("tr").each((_, row) => {
    const $row = $(row)
    const cells = $row.children("td")
    // 必须至少 4 个直接子 td；少于则不是数据行（可能是 header 或嵌套表格行）
    if (cells.length < 4) return

    // 跳过 header 行（class="fooevo"）
    if (cells.first().hasClass("fooevo")) return

    // 第 1 列必须是 #NNN 形式
    const numText = cells.eq(0).text().trim()
    const numMatch = numText.match(/^#?0*(\d+)$/)
    if (!numMatch) return
    const pokopiaNumber = Number.parseInt(numMatch[1], 10)
    if (Number.isNaN(pokopiaNumber)) return

    // 第 2 列：图片 + 详情链接
    const picAnchor = cells.eq(1).find("a").first()
    const picImg = picAnchor.find("img").first()
    const imageUrl = absolutizeSerebiiUrl(picImg.attr("src") ?? "")
    const detailHref = picAnchor.attr("href") ?? ""
    const detailUrl = absolutizeSerebiiUrl(detailHref)

    // 第 3 列：名字
    const nameCell = cells.eq(2)
    const name = nameCell.find("a").first().text().trim()

    // slug 从 detail URL 提取（更稳）
    const slugMatch = detailHref.match(/\/([^\/]+)\.shtml$/)
    const slug = slugMatch ? slugMatch[1] : name.toLowerCase().replace(/\s+/g, "")

    // 第 4 列：specialty 列表（嵌套表格）
    const specialtyCell = cells.eq(3)
    const specialties = parseSpecialtiesFromCell($, specialtyCell)

    pokemon.push({
      pokopiaNumber,
      name,
      slug,
      imageUrl,
      detailUrl,
      specialties,
    })
  })

  return pokemon
}

/**
 * 从 specialty 单元格里抽出 specialty 列表。
 *
 * 单元格内是一个嵌套 table，每个 specialty 占两个 <td>（icon + 文字）。
 * 用 specialty URL 做 dedupe key（icon 和文字两个 link 指向同一 URL）。
 */
function parseSpecialtiesFromCell(
  $: cheerio.CheerioAPI,
  cell: ReturnType<cheerio.CheerioAPI>
): PokopiaSpecialty[] {
  const byUrl = new Map<string, PokopiaSpecialty>()

  cell.find("a").each((_, a) => {
    const $a = $(a)
    const href = $a.attr("href") ?? ""
    if (!href.includes("/specialty/")) return

    const detailUrl = absolutizeSerebiiUrl(href)
    const existing = byUrl.get(detailUrl)

    const text = $a.text().trim()
    const iconSrc = $a.find("img").attr("src")

    if (existing) {
      // 已经记录过，补图标或名字
      if (text && !existing.name) existing.name = text
      if (iconSrc && !existing.iconUrl) {
        existing.iconUrl = absolutizeSerebiiUrl(iconSrc)
      }
      return
    }

    byUrl.set(detailUrl, {
      name: text || "",
      iconUrl: iconSrc ? absolutizeSerebiiUrl(iconSrc) : "",
      detailUrl,
    })
  })

  // 去掉空 name 的（异常情况）
  return Array.from(byUrl.values()).filter((s) => s.name.length > 0)
}

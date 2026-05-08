/**
 * Pokopia 页面解析 — 从 Serebii availablepokemon.shtml 抓 + 解析。
 *
 * 缓存策略：fetchSerebiiHtml 默认 24h ISR revalidate。
 */

import * as cheerio from "cheerio"

import type {
  PokopiaPokemon,
  PokopiaPokemonListEntry,
  PokopiaSpecialty,
} from "@/lib/pokemon/pokopia/types"
import { slugFromSerebiiUrl } from "@/lib/pokemon/pokopia/links"
import { absolutizeSerebiiUrl, fetchSerebiiHtml } from "./client"
import { getPokopiaPokemonBySlug } from "./pokopia/pokemon-detail"

const POKOPIA_AVAILABLE_PATH = "/pokemonpokopia/availablepokemon.shtml"
const POKOPIA_EVENT_PATH = "/pokemonpokopia/eventpokedex.shtml"

/**
 * 抓取并解析 Pokopia "Available Pokémon" 列表（主图鉴）。
 *
 * Server-only — 内部用 fetch + Next.js ISR 缓存，不要在 client 调用。
 */
export async function getPokopiaAvailablePokemon(): Promise<PokopiaPokemon[]> {
  const html = await fetchSerebiiHtml(POKOPIA_AVAILABLE_PATH)
  return parsePokopiaAvailableHtml(html)
}

/**
 * 抓取并解析 Pokopia Event 图鉴（event 限定 pokemon）。
 *
 * Event pokemon 有独立编号 #001 起，所以会跟主图鉴重号 — 调用方需要用 slug
 * 或 isEvent 区分。表结构跟 main pokedex 一样，复用同一个 parser。
 */
export async function getPokopiaEventPokemon(): Promise<PokopiaPokemon[]> {
  const html = await fetchSerebiiHtml(POKOPIA_EVENT_PATH)
  return parsePokopiaAvailableHtml(html).map((p) => ({ ...p, isEvent: true }))
}

/**
 * 拿主图鉴 + event 图鉴，并对每只 pokemon 调详情页解析出 idealHabitat + favorites。
 *
 * 用于 pokedex list 的多维 filter（specialty / 喜欢的东西 / 喜欢的栖息地）。
 *
 * 性能：~312 个详情请求并发分批跑（chunk size 10），命中 Next.js fetch cache
 * 之后单页都是秒开。冷启动第一次 ~10s 后台跑，对终端用户透明
 * （Next.js ISR 会用上一份缓存渲染，下一次 revalidate 才用新数据）。
 *
 * 失败处理：单只详情解析失败不会影响整体，只是该 pokemon 的 idealHabitat 为 null
 * 且 favorites 为空，filter 时自然不参与新维度。
 */
export async function getPokopiaPokemonListEnriched(): Promise<
  PokopiaPokemonListEntry[]
> {
  const [main, event] = await Promise.all([
    getPokopiaAvailablePokemon(),
    getPokopiaEventPokemon(),
  ])
  const all = [...main, ...event]

  const enriched = await chunked(all, 10, async (p) => {
    try {
      const detail = await getPokopiaPokemonBySlug(p.slug)
      return {
        ...p,
        idealHabitat: detail?.idealHabitat ?? null,
        favorites: detail?.favorites ?? [],
      }
    } catch {
      return { ...p, idealHabitat: null, favorites: [] }
    }
  })

  return enriched
}

/**
 * 并发分批跑 fn，每批 size 个，避免对 Serebii 同时打 200+ 个请求。
 * 跟 habitats/page.tsx 用的同款 helper。
 */
async function chunked<T, R>(
  items: T[],
  size: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const result: R[] = []
  for (let i = 0; i < items.length; i += size) {
    const batch = items.slice(i, i + size)
    result.push(...(await Promise.all(batch.map(fn))))
  }
  return result
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
      slug: slugFromSerebiiUrl(href, "specialty/"),
      iconUrl: iconSrc ? absolutizeSerebiiUrl(iconSrc) : "",
      detailUrl,
    })
  })

  // 去掉空 name 的（异常情况）
  return Array.from(byUrl.values()).filter((s) => s.name.length > 0)
}

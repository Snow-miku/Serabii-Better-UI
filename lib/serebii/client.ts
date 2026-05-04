/**
 * Serebii fetch wrapper.
 *
 * 所有对 serebii.net 的请求都走这里，统一加：
 * - 表明身份的 User-Agent（非匿名爬虫，告知是粉丝项目）
 * - Next.js ISR 缓存（默认 24h；调用方可覆盖）
 * - 错误处理 + URL 规范化
 *
 * 法律 / 合规：
 * - Serebii 内容受版权保护，本项目仅个人 / 教育用途
 * - 不在公开页面成块 verbatim 转载 Serebii 文字内容
 * - 遵守 robots.txt 和 rate limit
 */

const SEREBII_BASE = "https://www.serebii.net"

/** 24 hours in seconds — Pokemon 游戏数据更新慢，1 天足够"实时" */
export const SEREBII_REVALIDATE_SECONDS = 86400

const USER_AGENT =
  "SerebiiBetterUI/0.1 (https://github.com/Snow-miku/Serabii-Better-UI; non-commercial fan project)"

export interface FetchSerebiiOptions {
  /** Next.js ISR revalidate seconds. Default 24h. Pass `false` to skip caching. */
  revalidate?: number | false
}

/**
 * 抓 Serebii 一个页面，返回 HTML 字符串。
 *
 * @param path 相对路径（以 `/` 开头）或完整 URL
 */
export async function fetchSerebiiHtml(
  path: string,
  options: FetchSerebiiOptions = {}
): Promise<string> {
  const url = path.startsWith("http") ? path : `${SEREBII_BASE}${path}`
  const revalidate = options.revalidate ?? SEREBII_REVALIDATE_SECONDS

  const res = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "text/html,application/xhtml+xml",
    },
    next: revalidate === false ? undefined : { revalidate },
  })

  if (!res.ok) {
    throw new Error(
      `Failed to fetch ${url}: ${res.status} ${res.statusText}`
    )
  }

  return res.text()
}

/**
 * 把 Serebii 相对路径补成完整 URL。
 * 用在解析 HTML 时拿到 `/pokemonpokopia/...` 这种相对路径。
 */
export function absolutizeSerebiiUrl(maybeRelative: string): string {
  if (!maybeRelative) return ""
  if (maybeRelative.startsWith("http")) return maybeRelative
  if (maybeRelative.startsWith("//")) return `https:${maybeRelative}`
  return `${SEREBII_BASE}${maybeRelative.startsWith("/") ? "" : "/"}${maybeRelative}`
}

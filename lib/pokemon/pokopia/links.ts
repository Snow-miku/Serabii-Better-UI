/**
 * Pokopia 内部 URL 帮手 — 把实体 slug 转成网站内部路径。
 *
 * 设计原则：
 *   - 所有跨实体链接都走这里，避免到处硬编码 `/pokemon/pokopia/...`
 *   - 只在 client / server component 渲染 `<Link href>` 时调用
 *   - 输入 slug 来自 Serebii 解析得到的稳定标识
 */

const POKOPIA_BASE = "/pokemon/pokopia"

export function pokopiaHubHref(): string {
  return POKOPIA_BASE
}

export function pokopiaPokemonHref(slug: string): string {
  return `${POKOPIA_BASE}/pokedex/${slug}`
}

export function pokopiaSpecialtyHref(slug: string): string {
  return `${POKOPIA_BASE}/specialties/${slug}`
}

export function pokopiaFavoriteHref(slug: string): string {
  return `${POKOPIA_BASE}/favorites/${slug}`
}

export function pokopiaItemHref(slug: string): string {
  return `${POKOPIA_BASE}/items/${slug}`
}

export function pokopiaHabitatHref(slug: string): string {
  return `${POKOPIA_BASE}/habitats/${slug}`
}

export function pokopiaLocationHref(slug: string): string {
  return `${POKOPIA_BASE}/locations/${slug}`
}

/**
 * 从 Serebii URL 抽出 slug。
 *
 * 例：
 *   `/pokemonpokopia/pokedex/specialty/grow.shtml` + prefix `specialty/`
 *   → `"grow"`
 */
export function slugFromSerebiiUrl(url: string, prefix: string): string {
  const stripped = url.split(prefix).pop() ?? url
  return stripped.replace(/\.shtml$/, "").replace(/^\/+/, "")
}

/**
 * Pokemon Pokopia 数据 types。
 *
 * 数据 source: serebii.net/pokemonpokopia/...
 * 解析逻辑: lib/serebii/pokopia.ts (Pokemon 列表)，
 *           lib/serebii/pokopia/{specialties,favorites,items,habitats,locations}.ts (其他实体)
 */

/** Pokopia 的"特长"机制 — 每只宝可梦能做的事（采集、传送、烹饪、爆破等） */
export interface PokopiaSpecialty {
  /** 显示名称（如 "Grow", "Burn", "Gather Honey", "???"） */
  name: string
  /** URL slug（如 "grow"），用作内部路由 + 跨实体引用 key */
  slug: string
  /** Specialty 图标 URL（来自 serebii.net）*/
  iconUrl: string
  /** Serebii 详情页 URL（外部）*/
  detailUrl: string
}

/** Specialty 列表页的一条 — 多了 description（短描述）*/
export interface PokopiaSpecialtyListEntry extends PokopiaSpecialty {
  description: string
}

/** Specialty 详情页 — 多了 flavor text 和 effect 全文 */
export interface PokopiaSpecialtyDetail extends PokopiaSpecialty {
  flavorText: string
  effect: string
}

// ─────────────────────────────────────────────────────────────
// 通用：跨实体 reference（只有 name + slug + URL，不深度解析）
// ─────────────────────────────────────────────────────────────

/** 通用引用：用于 Pokemon detail 里指向其他实体（favorite / habitat 等）*/
export interface PokopiaEntityRef {
  name: string
  slug: string
  detailUrl: string
}

/** "Ideal Habitat"（Bright / Dark / Quiet 等大类，非具体地点）*/
export type PokopiaIdealHabitatRef = PokopiaEntityRef

/** "Favorite"（Pokemon 喜欢的对象，如 "Lots of nature", "Sweet flavors" 等）*/
export type PokopiaFavoriteRef = PokopiaEntityRef

// ─────────────────────────────────────────────────────────────
// Pokemon 详情
// ─────────────────────────────────────────────────────────────

/** 属性（Grass / Poison / Fire 等），Pokopia 跟主线游戏共享 type 系统 */
export interface PokopiaType {
  name: string
  iconUrl: string
}

/** Pokemon 详情页的完整数据 */
export interface PokopiaPokemonDetail extends PokopiaPokemon {
  types: PokopiaType[]
  classification: string // 例 "Seed Pokémon"
  heightImperial: string // 例 "2'04\""
  heightMetric: string // 例 "0.7m"
  weightImperial: string // 例 "15.2lbs"
  weightMetric: string // 例 "6.9kg"
  flavorText: string
  idealHabitat: PokopiaIdealHabitatRef | null
  favorites: PokopiaFavoriteRef[]
}

// ─────────────────────────────────────────────────────────────
// Favorites（Pokemon 喜欢的对象类别 — Lots of fire / Soft stuff 等）
// ─────────────────────────────────────────────────────────────

export interface PokopiaFavorite {
  name: string
  slug: string
  detailUrl: string
}

/** Favorite 详情页里 items 表的一条 — 比通用 PokopiaItem 简化（只有 4 列） */
export interface PokopiaFavoriteItemRef {
  name: string
  slug: string
  iconUrl: string
  description: string
  /** Decoration / Toy / Relaxation 等 tag */
  tag: string
}

/** Favorite 详情页：包含的 items + 喜欢这个的 Pokemon slugs */
export interface PokopiaFavoriteDetail extends PokopiaFavorite {
  items: PokopiaFavoriteItemRef[]
  /** Pokemon slugs（可拿 slug 跟 getPokopiaAvailablePokemon() 里的 entry 对上）*/
  pokemonSlugs: string[]
}

// ─────────────────────────────────────────────────────────────
// Items（Pokopia 物品 — 木材 / 蜂蜜 / 花朵 等）
// ─────────────────────────────────────────────────────────────

export interface PokopiaItemLocationRef {
  name: string
  slug: string
  detailUrl: string
  /** 标注 (如 "Natural" / "Around trees" / "Destroy boulders") */
  note: string
}

export interface PokopiaItem {
  name: string
  slug: string
  iconUrl: string
  detailUrl: string
  description: string
  /** 物品分类（Materials / Food / etc.）— 来自页面的 section heading */
  category: string
  /** Tag 列（一般空，但 Serebii 留了这一列）*/
  tag: string
  /** 在哪些 location / dream island 出现 */
  locations: PokopiaItemLocationRef[]
}

/** Item 详情页：list 数据 + 详情页特有字段 */
export interface PokopiaItemDetail extends PokopiaItem {
  flavorText: string
  /** Trade Value (例 "Standard 100 / Favorite 150") — 留作原文 */
  tradeValue: string
  /** "Favorite Categories" — 这个 item 属于哪些 favorite（反向链）*/
  favoriteCategories: PokopiaEntityRef[]
}

/** Habitat 详情：list 数据 + 住户 Pokemon slugs */
export interface PokopiaHabitatDetail extends PokopiaHabitat {
  flavorText: string
  /** 该栖息地里能找到的 Pokemon slugs */
  pokemonSlugs: string[]
}

// ─────────────────────────────────────────────────────────────
// Habitats（具体栖息地 — Tall Grass / Bench with greenery 等）
// ─────────────────────────────────────────────────────────────

export interface PokopiaHabitat {
  habitatNumber: number
  name: string
  slug: string
  iconUrl: string
  detailUrl: string
  description: string
  /** "Habitats (Event)" 区的标记 */
  isEvent: boolean
}

// ─────────────────────────────────────────────────────────────
// Locations（地图地点 — Withered Wastelands / Palette Town 等）
// ─────────────────────────────────────────────────────────────

export interface PokopiaLocation {
  name: string
  slug: string
  imageUrl: string
  detailUrl: string
}

/** Pokopia 图鉴里的一只宝可梦 */
export interface PokopiaPokemon {
  /**
   * Pokopia 图鉴编号 (1–102 currently)
   *
   * 注意：同一编号可能有多个变体（如 #059 Shellos / Shellos East Sea；
   * #079 Pikachu / Peakychu）。区分用 slug。
   */
  pokopiaNumber: number
  /** 宝可梦显示名（如 "Bulbasaur", "Shellos East Sea"）*/
  name: string
  /** URL slug（如 "bulbasaur", "shelloseastsea"），可作为唯一 key */
  slug: string
  /** Sprite 图 URL（serebii.net 的 small 尺寸 png）*/
  imageUrl: string
  /** Serebii 详情页 URL */
  detailUrl: string
  /** 宝可梦的特长，1–4 个 */
  specialties: PokopiaSpecialty[]
}

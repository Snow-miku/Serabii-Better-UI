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

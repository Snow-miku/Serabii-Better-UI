/**
 * Pokemon Pokopia 数据 types。
 *
 * 数据 source: serebii.net/pokemonpokopia/availablepokemon.shtml
 * 解析逻辑: lib/serebii/pokopia.ts
 */

/** Pokopia 的"特长"机制 — 每只宝可梦能做的事（采集、传送、烹饪、爆破等） */
export interface PokopiaSpecialty {
  /** 显示名称（如 "Grow", "Burn", "Gather Honey", "???"） */
  name: string
  /** Specialty 图标 URL（来自 serebii.net）*/
  iconUrl: string
  /** 详情页 URL */
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

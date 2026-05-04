import { PokopiaPokedexExplorer } from "@/components/pokopia/pokedex-explorer"
import { SiteHeader } from "@/components/site-header"
import { getPokopiaAvailablePokemon } from "@/lib/serebii/pokopia"

export const metadata = {
  title: "Pokopia Pokédex · Better Pokédex",
  description:
    "All Pokémon available in Pokémon Pokopia, with their Specialties. Synced from serebii.net.",
}

/**
 * 24h ISR: Next.js 后台静默 revalidate，对用户永远是 cache hit。
 * Pokopia 数据更新慢（游戏更新才会变），24h 完全够。
 */
export const revalidate = 86400

export default async function PokopiaPokedexPage() {
  const pokemon = await getPokopiaAvailablePokemon()

  return (
    <>
      <SiteHeader title="Pokopia Pokédex" />

      <div className="@container/main flex flex-1 flex-col gap-6 px-4 py-6 lg:px-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Available Pokémon
          </h1>
          <p className="text-muted-foreground text-sm">
            数据来自{" "}
            <a
              href="https://www.serebii.net/pokemonpokopia/availablepokemon.shtml"
              target="_blank"
              rel="noreferrer"
              className="hover:text-foreground underline underline-offset-2"
            >
              serebii.net
            </a>
            ，每 24 小时自动同步
          </p>
        </header>

        <PokopiaPokedexExplorer pokemon={pokemon} />
      </div>
    </>
  )
}

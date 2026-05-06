import { ItemsExplorer } from "@/components/pokopia/items-explorer"
import { SiteHeader } from "@/components/site-header"
import { getPokopiaItems } from "@/lib/serebii/pokopia/items"

export const metadata = {
  title: "Pokopia Items · Better Pokédex",
  description: "All items (materials / food / etc.) found in Pokémon Pokopia.",
}

export const revalidate = 86400

export default async function Page() {
  const items = await getPokopiaItems()

  return (
    <>
      <SiteHeader title="Pokopia Items" />
      <div className="@container/main flex flex-1 flex-col gap-6 px-4 py-6 lg:px-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Items</h1>
          <p className="text-muted-foreground text-sm">
            数据来自{" "}
            <a
              href="https://www.serebii.net/pokemonpokopia/items.shtml"
              target="_blank"
              rel="noreferrer"
              className="hover:text-foreground underline underline-offset-2"
            >
              serebii.net
            </a>
            ，每 24 小时自动同步
          </p>
        </header>

        <ItemsExplorer items={items} />
      </div>
    </>
  )
}

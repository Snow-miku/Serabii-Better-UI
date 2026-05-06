import Link from "next/link"
import { ArrowRightIcon } from "lucide-react"

import { DataTable } from "@/components/pokopia/data-table"
import { SiteHeader } from "@/components/site-header"
import { TableCell, TableRow } from "@/components/ui/table"
import { pokopiaFavoriteHref } from "@/lib/pokemon/pokopia/links"
import { getPokopiaFavorites } from "@/lib/serebii/pokopia/favorites"

export const metadata = {
  title: "Pokopia Favorites · Better Pokédex",
  description: "All Favorite Object categories Pokémon enjoy in Pokémon Pokopia.",
}

export const revalidate = 86400

export default async function Page() {
  const favorites = await getPokopiaFavorites()

  return (
    <>
      <SiteHeader title="Pokopia Favorites" />
      <div className="@container/main flex flex-1 flex-col gap-6 px-4 py-6 lg:px-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Favorites</h1>
          <p className="text-muted-foreground text-sm">
            {favorites.length} 种 favorite 类别 · 点击进详情看 items + 喜欢的
            Pokémon · 数据来自{" "}
            <a
              href="https://www.serebii.net/pokemonpokopia/favorites.shtml"
              target="_blank"
              rel="noreferrer"
              className="hover:text-foreground underline underline-offset-2"
            >
              serebii.net
            </a>
          </p>
        </header>

        <DataTable
          columns={[
            { header: "名称" },
            { width: 64, header: "" },
          ]}
        >
          {favorites.map((f) => (
            <TableRow key={f.slug} className="hover:bg-muted/50">
              <TableCell className="align-middle whitespace-normal">
                <Link
                  href={pokopiaFavoriteHref(f.slug)}
                  className="hover:text-accent font-semibold underline-offset-2 hover:underline"
                >
                  {f.name}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground text-center align-middle">
                <Link
                  href={pokopiaFavoriteHref(f.slug)}
                  aria-label={`查看 ${f.name} 详情`}
                >
                  <ArrowRightIcon className="mx-auto size-4" />
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </DataTable>
      </div>
    </>
  )
}

import Image from "next/image"
import Link from "next/link"

import { DataTable } from "@/components/pokopia/data-table"
import { SiteHeader } from "@/components/site-header"
import { TableCell, TableRow } from "@/components/ui/table"
import { pokopiaLocationHref } from "@/lib/pokemon/pokopia/links"
import { getPokopiaLocations } from "@/lib/serebii/pokopia/locations"

export const metadata = {
  title: "Pokopia Locations · Better Pokédex",
  description: "All locations in Pokémon Pokopia.",
}

export const revalidate = 86400

export default async function Page() {
  const locations = await getPokopiaLocations()

  return (
    <>
      <SiteHeader title="Pokopia Locations" />
      <div className="@container/main flex flex-1 flex-col gap-6 px-4 py-6 lg:px-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Locations</h1>
          <p className="text-muted-foreground text-sm">
            {locations.length} 个地点 · 数据来自{" "}
            <a
              href="https://www.serebii.net/pokemonpokopia/locations.shtml"
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
            { width: 192, header: "缩略图" },
            { header: "地点" },
          ]}
        >
          {locations.map((loc) => (
            <TableRow key={loc.slug} className="hover:bg-muted/50">
              <TableCell className="py-3 text-center align-middle">
                {loc.imageUrl ? (
                  <Link
                    href={pokopiaLocationHref(loc.slug)}
                    className="bg-muted hover:opacity-80 relative mx-auto block aspect-video w-40 overflow-hidden transition-opacity"
                    aria-label={`查看 ${loc.name} 详情`}
                  >
                    <Image
                      src={loc.imageUrl}
                      alt={loc.name}
                      fill
                      unoptimized
                      sizes="160px"
                      className="object-cover"
                    />
                  </Link>
                ) : null}
              </TableCell>
              <TableCell className="text-center align-middle">
                <Link
                  href={pokopiaLocationHref(loc.slug)}
                  className="hover:text-accent font-semibold underline-offset-2 hover:underline"
                >
                  {loc.name}
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </DataTable>
      </div>
    </>
  )
}

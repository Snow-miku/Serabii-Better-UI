import Image from "next/image"
import Link from "next/link"

import { DataTable } from "@/components/pokopia/data-table"
import { SiteHeader } from "@/components/site-header"
import { Badge } from "@/components/ui/badge"
import { TableCell, TableRow } from "@/components/ui/table"
import { pokopiaSpecialtyHref } from "@/lib/pokemon/pokopia/links"
import { getPokopiaAvailablePokemon } from "@/lib/serebii/pokopia"
import { getPokopiaSpecialties } from "@/lib/serebii/pokopia/specialties"

export const metadata = {
  title: "Pokopia Specialties · Better Pokédex",
  description:
    "All Pokémon Pokopia Specialties — what each one does and which Pokémon have it.",
}

export const revalidate = 86400

export default async function Page() {
  const [specialties, pokemon] = await Promise.all([
    getPokopiaSpecialties(),
    getPokopiaAvailablePokemon(),
  ])

  const countBySlug = new Map<string, number>()
  for (const p of pokemon) {
    for (const s of p.specialties) {
      countBySlug.set(s.slug, (countBySlug.get(s.slug) ?? 0) + 1)
    }
  }

  return (
    <>
      <SiteHeader title="Pokopia Specialties" />
      <div className="@container/main flex flex-1 flex-col gap-6 px-4 py-6 lg:px-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Specialties</h1>
          <p className="text-muted-foreground text-sm">
            {specialties.length} 种特长 · 数据来自{" "}
            <a
              href="https://www.serebii.net/pokemonpokopia/specialty.shtml"
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
            { width: 96, header: "图标" },
            { width: 224, header: "特长" },
            { width: 128, header: "Pokémon 数量" },
            { header: "描述" },
          ]}
        >
          {specialties.map((s) => (
            <TableRow key={s.slug} className="hover:bg-muted/50">
              <TableCell className="py-3 text-center align-middle">
                {s.iconUrl ? (
                  <Link
                    href={pokopiaSpecialtyHref(s.slug)}
                    className="hover:opacity-80 inline-block transition-opacity"
                    aria-label={`查看 ${s.name} 详情`}
                  >
                    <Image
                      src={s.iconUrl}
                      alt=""
                      width={48}
                      height={48}
                      unoptimized
                      className="size-12 mx-auto object-contain"
                    />
                  </Link>
                ) : null}
              </TableCell>
              <TableCell className="text-center align-middle">
                <Link
                  href={pokopiaSpecialtyHref(s.slug)}
                  className="hover:text-accent font-semibold underline-offset-2 hover:underline"
                >
                  {s.name}
                </Link>
              </TableCell>
              <TableCell className="text-center align-middle">
                <Badge variant="secondary">
                  {countBySlug.get(s.slug) ?? 0}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground align-middle text-sm whitespace-normal">
                {s.description}
              </TableCell>
            </TableRow>
          ))}
        </DataTable>
      </div>
    </>
  )
}

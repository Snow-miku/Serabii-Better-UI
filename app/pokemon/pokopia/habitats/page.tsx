import Image from "next/image"
import Link from "next/link"

import { DataTable } from "@/components/pokopia/data-table"
import { SiteHeader } from "@/components/site-header"
import { Badge } from "@/components/ui/badge"
import { TableCell, TableRow } from "@/components/ui/table"
import {
  pokopiaHabitatHref,
  pokopiaPokemonHref,
} from "@/lib/pokemon/pokopia/links"
import type {
  PokopiaHabitat,
  PokopiaPokemon,
} from "@/lib/pokemon/pokopia/types"
import { getPokopiaAvailablePokemon } from "@/lib/serebii/pokopia"
import {
  getPokopiaHabitatBySlug,
  getPokopiaHabitats,
} from "@/lib/serebii/pokopia/habitats"

export const metadata = {
  title: "Pokopia Habitats · Better Pokédex",
  description: "All habitats Pokémon live in throughout Pokémon Pokopia.",
}

export const revalidate = 86400

/**
 * 并发分批跑 fn，每批 size 个，避免对 Serebii 同时打 200+ 个请求。
 * Next.js fetch cache 命中之后单页 cache 都吃，相当于"暖完一次永远秒开"。
 */
async function chunked<T, R>(
  items: T[],
  size: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const result: R[] = []
  for (let i = 0; i < items.length; i += size) {
    const batch = items.slice(i, i + size)
    result.push(...(await Promise.all(batch.map(fn))))
  }
  return result
}

interface HabitatRow extends PokopiaHabitat {
  pokemon: PokopiaPokemon[]
}

export default async function Page() {
  const [habitats, allPokemon] = await Promise.all([
    getPokopiaHabitats(),
    getPokopiaAvailablePokemon(),
  ])

  // 一次性拉全部 habitat details，内部走 Next.js 24h fetch cache
  const details = await chunked(habitats, 10, async (h) => {
    try {
      return await getPokopiaHabitatBySlug(h.slug)
    } catch {
      return null
    }
  })

  const pokemonBySlug = new Map(allPokemon.map((p) => [p.slug, p]))

  const enriched: HabitatRow[] = habitats.map((h, idx) => {
    const detail = details[idx]
    const slugs = detail?.pokemonSlugs ?? []
    const pokemon: PokopiaPokemon[] = []
    for (const s of slugs) {
      const p = pokemonBySlug.get(s)
      if (p) pokemon.push(p)
    }
    pokemon.sort((a, b) => a.pokopiaNumber - b.pokopiaNumber)
    return { ...h, pokemon }
  })

  const main = enriched.filter((h) => !h.isEvent)
  const event = enriched.filter((h) => h.isEvent)

  return (
    <>
      <SiteHeader title="Pokopia Habitats" />
      <div className="@container/main flex flex-1 flex-col gap-8 px-4 py-6 lg:px-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Habitats</h1>
          <p className="text-muted-foreground text-sm">
            {habitats.length} 个栖息地 · 数据来自{" "}
            <a
              href="https://www.serebii.net/pokemonpokopia/habitats.shtml"
              target="_blank"
              rel="noreferrer"
              className="hover:text-foreground underline underline-offset-2"
            >
              serebii.net
            </a>
          </p>
        </header>

        {[
          { title: "All Habitats", list: main },
          { title: "Event Habitats", list: event },
        ].map((section) =>
          section.list.length === 0 ? null : (
            <section key={section.title} className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold">{section.title}</h2>
                <Badge variant="secondary">{section.list.length}</Badge>
              </div>
              <DataTable
                columns={[
                  { width: 80, header: "编号" },
                  { width: 176, header: "图片" },
                  { width: 208, header: "栖息地" },
                  { header: "详情" },
                  { width: 360, header: "宝可梦" },
                ]}
              >
                {section.list.map((h) => (
                  <TableRow key={h.slug} className="hover:bg-muted/50">
                    <TableCell className="font-mono text-center align-middle">
                      #{String(h.habitatNumber).padStart(3, "0")}
                    </TableCell>
                    <TableCell className="py-4 text-center align-middle">
                      {h.iconUrl ? (
                        <Link
                          href={pokopiaHabitatHref(h.slug)}
                          className="hover:opacity-80 inline-block transition-opacity"
                          aria-label={`查看 ${h.name} 详情`}
                        >
                          <Image
                            src={h.iconUrl}
                            alt=""
                            width={160}
                            height={160}
                            unoptimized
                            className="size-36 mx-auto object-contain"
                          />
                        </Link>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-center align-middle">
                      <Link
                        href={pokopiaHabitatHref(h.slug)}
                        className="hover:text-accent font-semibold underline-offset-2 hover:underline"
                      >
                        {h.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground align-middle text-sm whitespace-normal">
                      <p className="leading-relaxed">{h.description}</p>
                    </TableCell>
                    <TableCell className="align-middle whitespace-normal">
                      <PokemonInlineList pokemon={h.pokemon} max={10} />
                    </TableCell>
                  </TableRow>
                ))}
              </DataTable>
            </section>
          )
        )}
      </div>
    </>
  )
}

function PokemonInlineList({
  pokemon,
  max,
}: {
  pokemon: PokopiaPokemon[]
  max: number
}) {
  if (pokemon.length === 0) {
    return <span className="text-muted-foreground text-xs">—</span>
  }
  const visible = pokemon.slice(0, max)
  const extra = pokemon.length - visible.length
  return (
    <div className="flex flex-wrap items-center gap-2">
      {visible.map((p) => (
        <Link
          key={p.slug}
          href={pokopiaPokemonHref(p.slug)}
          aria-label={p.name}
          title={p.name}
          className="bg-background/30 hover:bg-accent/30 inline-flex size-12 items-center justify-center transition-colors"
        >
          {p.imageUrl ? (
            <Image
              src={p.imageUrl}
              alt={p.name}
              width={48}
              height={48}
              unoptimized
              className="size-11 object-contain"
            />
          ) : null}
        </Link>
      ))}
      {extra > 0 ? (
        <span className="text-muted-foreground text-xs">+{extra}</span>
      ) : null}
    </div>
  )
}

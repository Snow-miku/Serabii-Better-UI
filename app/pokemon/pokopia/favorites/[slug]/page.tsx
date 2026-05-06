import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ExternalLinkIcon } from "lucide-react"

import { PokopiaPokedexCard } from "@/components/pokopia/pokedex-card"
import { SiteHeader } from "@/components/site-header"
import { Badge } from "@/components/ui/badge"
import { pokopiaItemHref } from "@/lib/pokemon/pokopia/links"
import { getPokopiaAvailablePokemon } from "@/lib/serebii/pokopia"
import { getPokopiaFavoriteBySlug } from "@/lib/serebii/pokopia/favorites"

interface Props {
  params: Promise<{ slug: string }>
}

export const revalidate = 86400

export async function generateStaticParams() {
  return []
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const fav = await getPokopiaFavoriteBySlug(slug)
  return {
    title: fav
      ? `${fav.name} · Pokopia Favorite · Better Pokédex`
      : "Favorite not found",
    description: fav
      ? `Items in ${fav.name} and Pokémon that like it.`
      : undefined,
  }
}

export default async function Page({ params }: Props) {
  const { slug } = await params
  const [fav, allPokemon] = await Promise.all([
    getPokopiaFavoriteBySlug(slug),
    getPokopiaAvailablePokemon(),
  ])
  if (!fav) notFound()

  // Pokemon slug → 完整 PokopiaPokemon (用我们已有的 list data)
  const slugSet = new Set(fav.pokemonSlugs)
  const relatedPokemon = allPokemon
    .filter((p) => slugSet.has(p.slug))
    .sort((a, b) => a.pokopiaNumber - b.pokopiaNumber)

  return (
    <>
      <SiteHeader title={`Favorite · ${fav.name}`} />
      <div className="@container/main flex flex-1 flex-col gap-8 px-4 py-6 lg:px-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">{fav.name}</h1>
          <p className="text-muted-foreground text-sm">
            {fav.items.length} 个 items · {relatedPokemon.length} 只 Pokémon · 数据来自{" "}
            <a
              href={fav.detailUrl}
              target="_blank"
              rel="noreferrer"
              className="hover:text-foreground underline underline-offset-2"
            >
              serebii.net
            </a>
          </p>
        </header>

        {/* Items section */}
        {fav.items.length > 0 ? (
          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold">
                Items in {fav.name}
              </h2>
              <Badge variant="secondary">{fav.items.length}</Badge>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {fav.items.map((item) => (
                <Link
                  key={item.slug}
                  href={pokopiaItemHref(item.slug)}
                  className="group bg-tile text-tile-foreground border-primary hover:border-accent flex flex-col gap-3 border-2 p-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="flex items-center gap-3">
                    {item.iconUrl ? (
                      <Image
                        src={item.iconUrl}
                        alt=""
                        width={40}
                        height={40}
                        unoptimized
                        className="shrink-0"
                      />
                    ) : null}
                    <div className="flex flex-1 flex-col gap-0.5">
                      <span className="font-semibold">{item.name}</span>
                      {item.tag ? (
                        <Badge
                          variant="secondary"
                          className="text-3xs w-fit px-1.5 py-0"
                        >
                          {item.tag}
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                  <p className="text-muted-foreground line-clamp-2 text-xs leading-relaxed">
                    {item.description}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {/* Pokemon section */}
        {relatedPokemon.length > 0 ? (
          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold">
                Pokémon that like {fav.name}
              </h2>
              <Badge variant="secondary">{relatedPokemon.length}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-6">
              {relatedPokemon.map((p) => (
                <PokopiaPokedexCard key={p.slug} pokemon={p} />
              ))}
            </div>
          </section>
        ) : null}

        <div className="flex justify-end">
          <a
            href={fav.detailUrl}
            target="_blank"
            rel="noreferrer"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs underline underline-offset-2"
          >
            View on Serebii <ExternalLinkIcon className="size-3" />
          </a>
        </div>
      </div>
    </>
  )
}

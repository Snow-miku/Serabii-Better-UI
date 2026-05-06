import Image from "next/image"
import { notFound } from "next/navigation"
import { ExternalLinkIcon } from "lucide-react"

import { PokopiaPokedexCard } from "@/components/pokopia/pokedex-card"
import { SiteHeader } from "@/components/site-header"
import { Badge } from "@/components/ui/badge"
import { getPokopiaAvailablePokemon } from "@/lib/serebii/pokopia"
import { getPokopiaHabitatBySlug } from "@/lib/serebii/pokopia/habitats"

interface Props {
  params: Promise<{ slug: string }>
}

export const revalidate = 86400

export async function generateStaticParams() {
  return []
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const habitat = await getPokopiaHabitatBySlug(slug)
  return {
    title: habitat
      ? `${habitat.name} · Pokopia Habitat · Better Pokédex`
      : "Habitat not found",
    description: habitat?.flavorText || habitat?.description,
  }
}

export default async function Page({ params }: Props) {
  const { slug } = await params
  const [habitat, allPokemon] = await Promise.all([
    getPokopiaHabitatBySlug(slug),
    getPokopiaAvailablePokemon(),
  ])
  if (!habitat) notFound()

  const slugSet = new Set(habitat.pokemonSlugs)
  const residents = allPokemon
    .filter((p) => slugSet.has(p.slug))
    .sort((a, b) => a.pokopiaNumber - b.pokopiaNumber)

  return (
    <>
      <SiteHeader title={`Habitat · ${habitat.name}`} />
      <div className="@container/main flex flex-1 flex-col gap-8 px-4 py-6 lg:px-6">
        {/* Hero */}
        <header className="flex flex-wrap items-start gap-6">
          {habitat.iconUrl ? (
            <div className="bg-tile border-primary flex size-32 shrink-0 items-center justify-center border-2 p-3">
              <Image
                src={habitat.iconUrl}
                alt={habitat.name}
                width={120}
                height={120}
                unoptimized
                priority
                className="size-auto max-h-full max-w-full object-contain"
              />
            </div>
          ) : null}
          <div className="flex flex-col gap-2">
            <Badge variant="secondary" className="w-fit font-mono">
              #{String(habitat.habitatNumber).padStart(3, "0")}
              {habitat.isEvent ? " · Event" : ""}
            </Badge>
            <h1 className="text-3xl font-semibold tracking-tight">
              {habitat.name}
            </h1>
            {habitat.flavorText || habitat.description ? (
              <p className="text-sm leading-relaxed">
                {habitat.flavorText || habitat.description}
              </p>
            ) : null}
          </div>
        </header>

        {/* Available Pokémon */}
        {residents.length > 0 ? (
          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold">Available Pokémon</h2>
              <Badge variant="secondary">{residents.length}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-6">
              {residents.map((p) => (
                <PokopiaPokedexCard key={p.slug} pokemon={p} />
              ))}
            </div>
          </section>
        ) : (
          <p className="text-muted-foreground text-sm">
            还没住户信息（Serebii 该页可能为空）。
          </p>
        )}

        <div className="flex justify-end">
          <a
            href={habitat.detailUrl}
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

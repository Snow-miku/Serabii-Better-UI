import Image from "next/image"
import { notFound } from "next/navigation"

import { PokopiaPokedexCard } from "@/components/pokopia/pokedex-card"
import { SiteHeader } from "@/components/site-header"
import { getPokopiaAvailablePokemon } from "@/lib/serebii/pokopia"
import {
  getPokopiaSpecialties,
  getPokopiaSpecialtyBySlug,
} from "@/lib/serebii/pokopia/specialties"

interface Props {
  params: Promise<{ slug: string }>
}

export const revalidate = 86400

/**
 * 让 Vercel build 时把所有 specialty 详情页预编译成静态 HTML。
 * Pokemon 那边浏览到 specialty badge 一点 → 直接 served from edge。
 */
export async function generateStaticParams() {
  const specialties = await getPokopiaSpecialties()
  return specialties.map((s) => ({ slug: s.slug }))
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const specialty = await getPokopiaSpecialtyBySlug(slug)
  if (!specialty) return { title: "Specialty not found · Better Pokédex" }
  return {
    title: `${specialty.name} · Pokopia Specialty · Better Pokédex`,
    description:
      specialty.flavorText ||
      `All Pokémon with the ${specialty.name} specialty in Pokémon Pokopia.`,
  }
}

export default async function PokopiaSpecialtyDetailPage({ params }: Props) {
  const { slug } = await params

  const [specialty, allPokemon] = await Promise.all([
    getPokopiaSpecialtyBySlug(slug),
    getPokopiaAvailablePokemon(),
  ])

  if (!specialty) notFound()

  const relatedPokemon = allPokemon
    .filter((p) => p.specialties.some((s) => s.slug === slug))
    .sort((a, b) => a.pokopiaNumber - b.pokopiaNumber)

  return (
    <>
      <SiteHeader title={`Specialty · ${specialty.name}`} />

      <div className="@container/main flex flex-1 flex-col gap-8 px-4 py-6 lg:px-6">
        {/* Hero */}
        <header className="flex flex-wrap items-start gap-6">
          {specialty.iconUrl ? (
            <div className="bg-tile border-primary flex size-24 shrink-0 items-center justify-center border-2 p-3">
              <Image
                src={specialty.iconUrl}
                alt={specialty.name}
                width={96}
                height={96}
                unoptimized
                className="size-auto max-h-full max-w-full object-contain"
              />
            </div>
          ) : null}
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold tracking-tight">
              {specialty.name}
            </h1>
            <p className="text-muted-foreground text-sm">
              {relatedPokemon.length} Pokémon · 数据来自{" "}
              <a
                href={specialty.detailUrl}
                target="_blank"
                rel="noreferrer"
                className="hover:text-foreground underline underline-offset-2"
              >
                serebii.net
              </a>
            </p>
          </div>
        </header>

        {/* Flavor + Effect */}
        {(specialty.flavorText || specialty.effect) && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {specialty.flavorText ? (
              <section className="bg-tile border-primary border-2 p-4">
                <h2 className="text-muted-foreground mb-2 text-xs font-semibold tracking-wider uppercase">
                  Flavor
                </h2>
                <p className="text-sm leading-relaxed">{specialty.flavorText}</p>
              </section>
            ) : null}
            {specialty.effect ? (
              <section className="bg-tile border-primary border-2 p-4">
                <h2 className="text-muted-foreground mb-2 text-xs font-semibold tracking-wider uppercase">
                  Effect
                </h2>
                <p className="text-sm leading-relaxed">{specialty.effect}</p>
              </section>
            ) : null}
          </div>
        )}

        {/* Pokemon list */}
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold">
            Pokémon with {specialty.name}
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-6">
            {relatedPokemon.map((p) => (
              <PokopiaPokedexCard key={p.slug} pokemon={p} />
            ))}
          </div>
        </section>
      </div>
    </>
  )
}

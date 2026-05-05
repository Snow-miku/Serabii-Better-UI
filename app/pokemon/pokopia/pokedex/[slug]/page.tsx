import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ExternalLinkIcon } from "lucide-react"

import { SiteHeader } from "@/components/site-header"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  pokopiaFavoriteHref,
  pokopiaSpecialtyHref,
} from "@/lib/pokemon/pokopia/links"
import { getPokopiaAvailablePokemon } from "@/lib/serebii/pokopia"
import { getPokopiaPokemonBySlug } from "@/lib/serebii/pokopia/pokemon-detail"

interface Props {
  params: Promise<{ slug: string }>
}

export const revalidate = 86400

/**
 * 不在 build 时预生成全部 308 个页面（避免 build 阶段 308 次 fetch Serebii）。
 * 改成 ISR on-demand：第一个访问的用户触发 render + cache，后续 24h 都吃 cache。
 */
export async function generateStaticParams() {
  return []
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const pokemon = await getPokopiaPokemonBySlug(slug)
  if (!pokemon) {
    return { title: "Pokémon not found · Better Pokédex" }
  }
  const padded = String(pokemon.pokopiaNumber).padStart(3, "0")
  return {
    title: `#${padded} ${pokemon.name} · Pokopia · Better Pokédex`,
    description:
      pokemon.flavorText || `${pokemon.name} in Pokémon Pokopia.`,
  }
}

export default async function PokopiaPokemonDetailPage({ params }: Props) {
  const { slug } = await params

  const [pokemon, allPokemon] = await Promise.all([
    getPokopiaPokemonBySlug(slug),
    getPokopiaAvailablePokemon(),
  ])

  if (!pokemon) notFound()

  const paddedNumber = String(pokemon.pokopiaNumber).padStart(3, "0")

  // 上下张前后跳转（按编号循环）
  const sortedByNumber = [...allPokemon].sort(
    (a, b) => a.pokopiaNumber - b.pokopiaNumber
  )
  const currentIndex = sortedByNumber.findIndex((p) => p.slug === slug)
  const prev =
    currentIndex > 0 ? sortedByNumber[currentIndex - 1] : null
  const next =
    currentIndex >= 0 && currentIndex < sortedByNumber.length - 1
      ? sortedByNumber[currentIndex + 1]
      : null

  return (
    <>
      <SiteHeader title={`#${paddedNumber} ${pokemon.name}`} />

      <div className="@container/main flex flex-1 flex-col gap-6 px-4 py-6 lg:px-6">
        {/* Hero */}
        <Card
          size="sm"
          className="bg-tile text-tile-foreground border-primary border-2 ring-0"
        >
          <CardContent className="flex flex-wrap items-center gap-6">
            {pokemon.imageUrl ? (
              <div className="bg-background border-border flex size-40 shrink-0 items-center justify-center border p-2">
                <Image
                  src={pokemon.imageUrl}
                  alt={pokemon.name}
                  width={250}
                  height={250}
                  unoptimized
                  priority
                  className="size-auto max-h-full max-w-full object-contain"
                />
              </div>
            ) : null}
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <CardDescription className="font-mono text-xs">
                #{paddedNumber}
              </CardDescription>
              <h1 className="text-3xl font-semibold tracking-tight">
                {pokemon.name}
              </h1>
              {pokemon.classification ? (
                <p className="text-muted-foreground text-sm">
                  {pokemon.classification}
                </p>
              ) : null}
              {pokemon.types.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {pokemon.types.map((t) => (
                    <Badge
                      key={t.name}
                      variant="secondary"
                      className="gap-1.5 px-2 py-1"
                    >
                      {t.iconUrl ? (
                        <Image
                          src={t.iconUrl}
                          alt=""
                          width={16}
                          height={16}
                          data-icon="inline-start"
                          unoptimized
                        />
                      ) : null}
                      {t.name}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>

        {/* Profile + Flavor */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card
            size="sm"
            className="bg-tile text-tile-foreground border-primary border-2 ring-0"
          >
            <CardHeader>
              <CardTitle>Profile</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              <ProfileRow label="Classification" value={pokemon.classification} />
              <ProfileRow
                label="Height"
                value={joinNonEmpty(
                  [pokemon.heightImperial, pokemon.heightMetric],
                  " / "
                )}
              />
              <ProfileRow
                label="Weight"
                value={joinNonEmpty(
                  [pokemon.weightImperial, pokemon.weightMetric],
                  " / "
                )}
              />
            </CardContent>
          </Card>

          {pokemon.flavorText ? (
            <Card
              size="sm"
              className="bg-tile text-tile-foreground border-primary border-2 ring-0"
            >
              <CardHeader>
                <CardTitle>Flavor</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{pokemon.flavorText}</p>
              </CardContent>
            </Card>
          ) : null}
        </div>

        {/* Specialty */}
        {pokemon.specialties.length > 0 ? (
          <Card
            size="sm"
            className="bg-tile text-tile-foreground border-primary border-2 ring-0"
          >
            <CardHeader>
              <CardTitle>Specialty</CardTitle>
              <CardDescription>点击进入特长详情</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {pokemon.specialties.map((s) => (
                <Link
                  key={s.slug}
                  href={pokopiaSpecialtyHref(s.slug)}
                  className="hover:bg-accent hover:text-accent-foreground border-border focus-visible:ring-ring inline-flex items-center gap-1.5 border bg-secondary px-2.5 py-1 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
                >
                  {s.iconUrl ? (
                    <Image
                      src={s.iconUrl}
                      alt=""
                      width={16}
                      height={16}
                      unoptimized
                    />
                  ) : null}
                  {s.name}
                </Link>
              ))}
            </CardContent>
          </Card>
        ) : null}

        {/* Habitat + Favorites */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {pokemon.idealHabitat ? (
            <Card
              size="sm"
              className="bg-tile text-tile-foreground border-primary border-2 ring-0"
            >
              <CardHeader>
                <CardTitle>Ideal Habitat</CardTitle>
              </CardHeader>
              <CardContent>
                <a
                  href={pokemon.idealHabitat.detailUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-foreground inline-flex items-center gap-1 text-sm underline underline-offset-2"
                >
                  {pokemon.idealHabitat.name}
                  <ExternalLinkIcon className="size-3" />
                </a>
              </CardContent>
            </Card>
          ) : null}

          {pokemon.favorites.length > 0 ? (
            <Card
              size="sm"
              className="bg-tile text-tile-foreground border-primary border-2 ring-0"
            >
              <CardHeader>
                <CardTitle>Favorites</CardTitle>
                <CardDescription>
                  {pokemon.name} 喜欢的对象
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-1.5 text-sm">
                {pokemon.favorites.map((f) => (
                  <Link
                    key={f.slug}
                    href={pokopiaFavoriteHref(f.slug)}
                    className="text-muted-foreground hover:text-foreground underline underline-offset-2"
                  >
                    {f.name}
                  </Link>
                ))}
              </CardContent>
            </Card>
          ) : null}
        </div>

        {/* Prev / Next */}
        <div className="flex items-center justify-between gap-4 pt-4">
          {prev ? (
            <Link
              href={`/pokemon/pokopia/pokedex/${prev.slug}`}
              className="text-muted-foreground hover:text-foreground text-sm underline underline-offset-2"
            >
              ← #{String(prev.pokopiaNumber).padStart(3, "0")} {prev.name}
            </Link>
          ) : (
            <span />
          )}
          <a
            href={pokemon.detailUrl}
            target="_blank"
            rel="noreferrer"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs underline underline-offset-2"
          >
            View on Serebii <ExternalLinkIcon className="size-3" />
          </a>
          {next ? (
            <Link
              href={`/pokemon/pokopia/pokedex/${next.slug}`}
              className="text-muted-foreground hover:text-foreground text-sm underline underline-offset-2"
            >
              #{String(next.pokopiaNumber).padStart(3, "0")} {next.name} →
            </Link>
          ) : (
            <span />
          )}
        </div>
      </div>
    </>
  )
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[8rem_1fr] gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span>{value || "—"}</span>
    </div>
  )
}

function joinNonEmpty(parts: string[], sep: string): string {
  return parts.filter(Boolean).join(sep)
}

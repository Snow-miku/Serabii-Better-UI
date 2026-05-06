import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ExternalLinkIcon } from "lucide-react"

import { SiteHeader } from "@/components/site-header"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  pokopiaFavoriteHref,
  pokopiaLocationHref,
} from "@/lib/pokemon/pokopia/links"
import { getPokopiaItemBySlug } from "@/lib/serebii/pokopia/items"

interface Props {
  params: Promise<{ slug: string }>
}

export const revalidate = 86400

export async function generateStaticParams() {
  return []
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const item = await getPokopiaItemBySlug(slug)
  return {
    title: item
      ? `${item.name} · Pokopia Item · Better Pokédex`
      : "Item not found",
    description: item?.flavorText || item?.description,
  }
}

export default async function Page({ params }: Props) {
  const { slug } = await params
  const item = await getPokopiaItemBySlug(slug)
  if (!item) notFound()

  return (
    <>
      <SiteHeader title={`Item · ${item.name}`} />
      <div className="@container/main flex flex-1 flex-col gap-6 px-4 py-6 lg:px-6">
        {/* Hero */}
        <header className="flex flex-wrap items-start gap-6">
          {item.iconUrl ? (
            <div className="bg-tile border-primary flex size-32 shrink-0 items-center justify-center border-2 p-3">
              <Image
                src={item.iconUrl}
                alt={item.name}
                width={120}
                height={120}
                unoptimized
                priority
                className="size-auto max-h-full max-w-full object-contain"
              />
            </div>
          ) : null}
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold tracking-tight">
              {item.name}
            </h1>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{item.category}</Badge>
              {item.tag ? <Badge variant="secondary">{item.tag}</Badge> : null}
            </div>
            {item.flavorText || item.description ? (
              <p className="text-sm leading-relaxed">
                {item.flavorText || item.description}
              </p>
            ) : null}
          </div>
        </header>

        {/* Trade Value + Favorite Categories */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {item.tradeValue ? (
            <Card
              size="sm"
              className="bg-tile text-tile-foreground border-primary border-2 ring-0"
            >
              <CardHeader>
                <CardTitle>Trade Value</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{item.tradeValue}</p>
              </CardContent>
            </Card>
          ) : null}

          {item.favoriteCategories.length > 0 ? (
            <Card
              size="sm"
              className="bg-tile text-tile-foreground border-primary border-2 ring-0"
            >
              <CardHeader>
                <CardTitle>Favorite Categories</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-1.5">
                {item.favoriteCategories.map((f) => (
                  <Link
                    key={f.slug}
                    href={pokopiaFavoriteHref(f.slug)}
                    className="hover:bg-accent hover:text-accent-foreground border-border focus-visible:ring-ring inline-flex items-center border bg-secondary px-2.5 py-1 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
                  >
                    {f.name}
                  </Link>
                ))}
              </CardContent>
            </Card>
          ) : null}
        </div>

        {/* Locations */}
        {item.locations.length > 0 ? (
          <section className="flex flex-col gap-3">
            <h2 className="text-xl font-semibold">Where to find</h2>
            <div className="bg-tile text-tile-foreground border-primary border-2">
              <ul className="flex flex-col">
                {item.locations.map((loc, idx) => {
                  const isDreamIsland =
                    loc.detailUrl.includes("/dreamisland/")
                  return (
                    <li
                      key={`${loc.slug}-${idx}`}
                      className="border-b-border/40 flex items-center justify-between gap-3 border-b px-4 py-3 last:border-b-0"
                    >
                      {isDreamIsland ? (
                        <a
                          href={loc.detailUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:text-foreground inline-flex items-center gap-1 text-sm underline underline-offset-2"
                        >
                          {loc.name}
                          <ExternalLinkIcon className="size-3" />
                        </a>
                      ) : (
                        <Link
                          href={pokopiaLocationHref(loc.slug)}
                          className="hover:text-foreground text-sm underline underline-offset-2"
                        >
                          {loc.name}
                        </Link>
                      )}
                      {loc.note ? (
                        <span className="text-muted-foreground text-xs">
                          {loc.note}
                        </span>
                      ) : null}
                    </li>
                  )
                })}
              </ul>
            </div>
          </section>
        ) : null}

        <div className="flex justify-end">
          <a
            href={item.detailUrl}
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

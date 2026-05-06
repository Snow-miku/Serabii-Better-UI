import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ExternalLinkIcon } from "lucide-react"

import { SiteHeader } from "@/components/site-header"
import { Badge } from "@/components/ui/badge"
import { pokopiaItemHref } from "@/lib/pokemon/pokopia/links"
import { getPokopiaItems } from "@/lib/serebii/pokopia/items"
import { getPokopiaLocations } from "@/lib/serebii/pokopia/locations"

interface Props {
  params: Promise<{ slug: string }>
}

export const revalidate = 86400

export async function generateStaticParams() {
  return []
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const locations = await getPokopiaLocations()
  const loc = locations.find((l) => l.slug === slug)
  return {
    title: loc
      ? `${loc.name} · Pokopia Location · Better Pokédex`
      : "Location not found",
  }
}

export default async function Page({ params }: Props) {
  const { slug } = await params
  const [locations, items] = await Promise.all([
    getPokopiaLocations(),
    getPokopiaItems(),
  ])
  const loc = locations.find((l) => l.slug === slug)
  if (!loc) notFound()

  // 反向找：哪些 item 在这个 location 出现
  const itemsHere = items.filter((item) =>
    item.locations.some((l) => l.slug === slug)
  )

  return (
    <>
      <SiteHeader title={`Location · ${loc.name}`} />
      <div className="@container/main flex flex-1 flex-col gap-6 px-4 py-6 lg:px-6">
        <header className="flex flex-col gap-4">
          {loc.imageUrl ? (
            <div className="bg-tile border-primary relative aspect-video w-full max-w-3xl overflow-hidden border-2">
              <Image
                src={loc.imageUrl}
                alt={loc.name}
                fill
                unoptimized
                sizes="(max-width: 768px) 100vw, 768px"
                className="object-cover"
              />
            </div>
          ) : null}
          <h1 className="text-3xl font-semibold tracking-tight">{loc.name}</h1>
        </header>

        {itemsHere.length > 0 ? (
          <section className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold">Items found here</h2>
              <Badge variant="secondary">{itemsHere.length}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {itemsHere.map((item) => {
                const note =
                  item.locations.find((l) => l.slug === slug)?.note ?? ""
                return (
                  <Link
                    key={item.slug}
                    href={pokopiaItemHref(item.slug)}
                    className="group bg-tile text-tile-foreground border-primary hover:border-accent flex flex-col items-center gap-2 border-2 p-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {item.iconUrl ? (
                      <Image
                        src={item.iconUrl}
                        alt=""
                        width={48}
                        height={48}
                        unoptimized
                      />
                    ) : null}
                    <div className="text-center text-xs font-medium">
                      {item.name}
                    </div>
                    {note ? (
                      <div className="text-muted-foreground text-3xs">
                        {note}
                      </div>
                    ) : null}
                  </Link>
                )
              })}
            </div>
          </section>
        ) : null}

        <div className="flex justify-end">
          <a
            href={loc.detailUrl}
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

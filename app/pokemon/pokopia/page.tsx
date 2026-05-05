import Link from "next/link"
import { ArrowRightIcon, BookOpenTextIcon, SparklesIcon } from "lucide-react"

import { SiteHeader } from "@/components/site-header"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export const metadata = {
  title: "Pokopia · Better Pokédex",
  description: "Pokémon Pokopia hub — guides, dex, locations, and more.",
}

const pokopiaSubpages = [
  {
    title: "Available Pokémon",
    description: "Pokopia 限定可获得宝可梦及其特长（Specialty）",
    href: "/pokemon/pokopia/pokedex",
    icon: BookOpenTextIcon,
    available: true,
  },
  {
    title: "Specialties",
    description: "32+ 种特长机制 — 用法、效果、有谁会",
    href: "/pokemon/pokopia/specialties",
    icon: SparklesIcon,
    available: true,
  },
  // 占位：以后加 favorites / items / habitats / locations
] as const

export default function PokopiaHubPage() {
  return (
    <>
      <SiteHeader title="Pokopia" />

      <div className="@container/main flex flex-1 flex-col gap-6 px-4 py-6 lg:px-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Pokémon Pokopia
          </h1>
          <p className="text-sm text-muted-foreground">
            探索 Pokopia 世界 — 数据同步自{" "}
            <a
              href="https://www.serebii.net/pokemonpokopia/"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2 hover:text-foreground"
            >
              serebii.net/pokemonpokopia
            </a>
          </p>
        </header>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {pokopiaSubpages.map((page) => {
            const Icon = page.icon
            return (
              <Link
                key={page.href}
                href={page.href}
                className="group block focus-visible:outline-none"
              >
                <Card className="h-full transition-all group-hover:-translate-y-0.5 group-hover:shadow-md group-focus-visible:ring-2 group-focus-visible:ring-ring">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <Icon className="text-primary" />
                      <ArrowRightIcon className="text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                    </div>
                    <CardTitle className="mt-2">{page.title}</CardTitle>
                    <CardDescription>{page.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>
    </>
  )
}

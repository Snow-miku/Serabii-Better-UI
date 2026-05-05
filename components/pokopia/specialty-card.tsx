import Image from "next/image"
import Link from "next/link"
import { ArrowRightIcon } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { pokopiaSpecialtyHref } from "@/lib/pokemon/pokopia/links"
import type { PokopiaSpecialtyListEntry } from "@/lib/pokemon/pokopia/types"
import { cn } from "@/lib/utils"

interface SpecialtyCardProps {
  specialty: PokopiaSpecialtyListEntry
  pokemonCount: number
  className?: string
}

/**
 * Specialty 列表的单条卡片。
 *
 * 图标 + 名字 + Pokemon 计数 + 描述。点整张卡跳到该 specialty 详情页。
 */
export function SpecialtyCard({
  specialty,
  pokemonCount,
  className,
}: SpecialtyCardProps) {
  return (
    <Link
      href={pokopiaSpecialtyHref(specialty.slug)}
      className="group block focus-visible:outline-none"
    >
      <Card
        size="sm"
        className={cn(
          "h-full bg-tile text-tile-foreground border-2 border-primary ring-0",
          "transition-all group-hover:border-accent group-hover:-translate-y-0.5 group-hover:shadow-md",
          "group-focus-visible:ring-2 group-focus-visible:ring-ring",
          className
        )}
      >
        <CardHeader className="flex-row items-center gap-3">
          {specialty.iconUrl ? (
            <Image
              src={specialty.iconUrl}
              alt=""
              width={40}
              height={40}
              unoptimized
              className="shrink-0"
            />
          ) : (
            <div className="size-10 bg-muted" />
          )}
          <div className="flex flex-1 flex-col gap-0.5">
            <CardTitle className="text-base">{specialty.name}</CardTitle>
            <CardDescription className="text-3xs">
              {pokemonCount} Pokémon
            </CardDescription>
          </div>
          <ArrowRightIcon className="text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground line-clamp-2 text-xs leading-relaxed">
            {specialty.description}
          </p>
        </CardContent>
      </Card>
    </Link>
  )
}

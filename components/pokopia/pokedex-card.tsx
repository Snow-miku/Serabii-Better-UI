import Image from "next/image"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { PokopiaPokemon } from "@/lib/pokemon/pokopia/types"
import { cn } from "@/lib/utils"

interface PokopiaPokedexCardProps {
  pokemon: PokopiaPokemon
  className?: string
}

/**
 * 单只 Pokopia 宝可梦卡片：正方形 tile，中性灰底 + lime 边框 highlight。
 *
 * 用 shadcn `Card` 完整组合（CardHeader / CardContent / CardFooter）：
 *   - CardHeader → 编号 (#NNN) 用 CardDescription
 *   - CardContent → sprite 图（flex 居中填充）
 *   - CardFooter → 名字 (CardTitle) + Specialty badges（去掉默认 border-t）
 *
 * `size="sm"` 让 Card 默认 gap/padding 紧凑；让 Card 自带 padding 跑 (px-3 py-3 / pb-0+footer p-3)，
 * 这样 badges 不会贴底边被裁。Lyra 全站 --radius=0 自动让 Card 直角。
 */
export function PokopiaPokedexCard({
  pokemon,
  className,
}: PokopiaPokedexCardProps) {
  const paddedNumber = String(pokemon.pokopiaNumber).padStart(3, "0")

  return (
    <a
      href={pokemon.detailUrl}
      target="_blank"
      rel="noreferrer"
      className="group block focus-visible:outline-none"
      aria-label={`${pokemon.name} on Serebii`}
    >
      <Card
        size="sm"
        className={cn(
          // shape: 正方形 tile
          "aspect-square",
          // color: 用 --tile (中性灰) 替代默认 --card (lime 染色)
          "bg-tile text-tile-foreground",
          // border: 用 lime primary 2px highlight，去掉默认 ring
          "border-2 border-primary ring-0",
          // interactive
          "transition-all group-hover:border-accent group-hover:-translate-y-0.5 group-hover:shadow-md",
          "group-focus-visible:ring-2 group-focus-visible:ring-ring",
          className
        )}
      >
        <CardHeader>
          <CardDescription className="text-3xs text-right font-mono">
            #{paddedNumber}
          </CardDescription>
        </CardHeader>

        <CardContent className="flex min-h-0 flex-1 items-center justify-center">
          {pokemon.imageUrl ? (
            <Image
              src={pokemon.imageUrl}
              alt={pokemon.name}
              width={96}
              height={96}
              unoptimized
              className="size-auto max-h-full max-w-full object-contain"
            />
          ) : (
            <div className="size-16 bg-muted" />
          )}
        </CardContent>

        <CardFooter className="flex-col items-stretch gap-1.5 border-t-0">
          <CardTitle className="truncate text-center text-sm">
            {pokemon.name}
          </CardTitle>
          {pokemon.specialties.length > 0 ? (
            <div className="flex flex-wrap justify-center gap-1.5">
              {pokemon.specialties.map((specialty) => (
                <Badge
                  key={specialty.name}
                  variant="secondary"
                  className="text-3xs gap-1 px-2 py-0.5 font-normal"
                >
                  {specialty.iconUrl ? (
                    <Image
                      src={specialty.iconUrl}
                      alt=""
                      width={14}
                      height={14}
                      data-icon="inline-start"
                      unoptimized
                      className="shrink-0"
                    />
                  ) : null}
                  {specialty.name}
                </Badge>
              ))}
            </div>
          ) : null}
        </CardFooter>
      </Card>
    </a>
  )
}

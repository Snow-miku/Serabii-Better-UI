import { SiteHeader } from "@/components/site-header"
import { SpecialtyCard } from "@/components/pokopia/specialty-card"
import { getPokopiaAvailablePokemon } from "@/lib/serebii/pokopia"
import { getPokopiaSpecialties } from "@/lib/serebii/pokopia/specialties"

export const metadata = {
  title: "Pokopia Specialties · Better Pokédex",
  description:
    "All Pokémon Pokopia Specialties — what each one does and which Pokémon have it.",
}

export const revalidate = 86400

export default async function PokopiaSpecialtiesPage() {
  // 并行抓 specialty 列表和 Pokemon 列表（共享 24h ISR cache，多个 page 调用不会重复抓）
  const [specialties, pokemon] = await Promise.all([
    getPokopiaSpecialties(),
    getPokopiaAvailablePokemon(),
  ])

  // 算每个 specialty 有多少 Pokemon 拥有
  const countBySlug = new Map<string, number>()
  for (const p of pokemon) {
    for (const s of p.specialties) {
      countBySlug.set(s.slug, (countBySlug.get(s.slug) ?? 0) + 1)
    }
  }

  return (
    <>
      <SiteHeader title="Pokopia Specialties" />

      <div className="@container/main flex flex-1 flex-col gap-6 px-4 py-6 lg:px-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Specialties</h1>
          <p className="text-muted-foreground text-sm">
            {specialties.length} 种特长 · 数据来自{" "}
            <a
              href="https://www.serebii.net/pokemonpokopia/specialty.shtml"
              target="_blank"
              rel="noreferrer"
              className="hover:text-foreground underline underline-offset-2"
            >
              serebii.net
            </a>
            ，每 24 小时自动同步
          </p>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {specialties.map((specialty) => (
            <SpecialtyCard
              key={specialty.slug}
              specialty={specialty}
              pokemonCount={countBySlug.get(specialty.slug) ?? 0}
            />
          ))}
        </div>
      </div>
    </>
  )
}

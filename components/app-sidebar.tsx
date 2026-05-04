"use client"

import * as React from "react"
import Image from "next/image"
import { HomeIcon, SearchIcon, StarIcon } from "lucide-react"

import { NavGroup, type NavGroupItem } from "@/components/nav-group"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const SITE_BRAND_LOGO =
  "https://assets.pokemon.com/assets/cms2/img/misc/gus/buttons/logo-pokemon-79x45.png"
const POKOPIA_GAME_LOGO =
  "https://pokopia.pokemon.com/assets/en-us/pages/index/logo-pokopia.png"

const data: {
  user: { name: string; email: string; avatar: string }
  quickLinks: NavGroupItem[]
  games: NavGroupItem[]
} = {
  user: {
    name: "Trainer",
    email: "trainer@pokedex.local",
    avatar: "/avatars/shadcn.jpg",
  },
  quickLinks: [
    { title: "Home", url: "/", icon: <HomeIcon /> },
    { title: "Search", url: "/search", icon: <SearchIcon /> },
    { title: "Favorites", url: "/favorites", icon: <StarIcon /> },
  ],
  games: [
    {
      title: "Pokopia",
      url: "/games/pokopia",
      icon: (
        <Image
          src={POKOPIA_GAME_LOGO}
          alt="Pokopia"
          width={20}
          height={20}
          unoptimized
        />
      ),
      badge: "NEW",
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <a href="/">
                <Image
                  src={SITE_BRAND_LOGO}
                  alt="Better Pokédex"
                  width={79}
                  height={45}
                  priority
                  unoptimized
                />
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavGroup label="Quick Links" items={data.quickLinks} />
        <NavGroup label="Games" items={data.games} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}

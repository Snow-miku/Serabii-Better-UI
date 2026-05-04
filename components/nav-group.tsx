"use client"

import * as React from "react"
import Link from "next/link"
import { ChevronRightIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

export interface NavGroupSubItem {
  title: string
  url: string
  badge?: string
}

export interface NavGroupItem {
  title: string
  /** 顶级 item URL — 如果是可展开的父项，这个 URL 不会被用（点 trigger 只展开） */
  url: string
  icon: React.ReactNode
  badge?: string
  /** 给定 children 该 item 就变成可展开的 collapsible 父项 */
  children?: NavGroupSubItem[]
  /** Collapsible 默认是否展开 */
  defaultOpen?: boolean
}

export function NavGroup({
  label,
  items,
}: {
  label: string
  items: NavGroupItem[]
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) =>
            item.children?.length ? (
              <CollapsibleNavItem key={item.title} item={item} />
            ) : (
              <FlatNavItem key={item.title} item={item} />
            )
          )}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

function FlatNavItem({ item }: { item: NavGroupItem }) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild tooltip={item.title}>
        <Link href={item.url}>
          {item.icon}
          <span>{item.title}</span>
          {item.badge ? (
            <Badge variant="secondary" className="ml-auto">
              {item.badge}
            </Badge>
          ) : null}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

function CollapsibleNavItem({ item }: { item: NavGroupItem }) {
  return (
    <Collapsible
      asChild
      defaultOpen={item.defaultOpen ?? false}
      className="group/collapsible"
    >
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton tooltip={item.title}>
            {item.icon}
            <span>{item.title}</span>
            <span className="ml-auto flex items-center gap-1">
              {item.badge ? (
                <Badge variant="secondary">{item.badge}</Badge>
              ) : null}
              <ChevronRightIcon className="transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
            </span>
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {item.children?.map((child) => (
              <SidebarMenuSubItem key={child.title}>
                <SidebarMenuSubButton asChild>
                  <Link href={child.url}>
                    <span>{child.title}</span>
                    {child.badge ? (
                      <Badge variant="secondary" className="ml-auto">
                        {child.badge}
                      </Badge>
                    ) : null}
                  </Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  )
}

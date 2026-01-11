"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { getAvatarSrc } from "@/lib/pagadores/utils";
import {
  RiArrowRightSLine,
  RiUserSharedLine,
  type RemixiconComponentType,
} from "@remixicon/react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import * as React from "react";

type NavItem = {
  title: string;
  url: string;
  icon: RemixiconComponentType;
  isActive?: boolean;
  items?: {
    title: string;
    url: string;
    avatarUrl?: string | null;
    isShared?: boolean;
    key?: string;
    icon?: RemixiconComponentType;
  }[];
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const MONTH_PERIOD_PARAM = "periodo";

const PERIOD_AWARE_PATHS = new Set([
  "/dashboard",
  "/lancamentos",
  "/orcamentos",
]);

export function NavMain({ sections }: { sections: NavSection[] }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const periodParam = searchParams.get(MONTH_PERIOD_PARAM);

  const isLinkActive = React.useCallback(
    (url: string) => {
      const normalizedPathname =
        pathname.endsWith("/") && pathname !== "/"
          ? pathname.slice(0, -1)
          : pathname;
      const normalizedUrl =
        url.endsWith("/") && url !== "/" ? url.slice(0, -1) : url;

      // Verifica se é exatamente igual ou se o pathname começa com a URL
      return (
        normalizedPathname === normalizedUrl ||
        normalizedPathname.startsWith(normalizedUrl + "/")
      );
    },
    [pathname]
  );

  const buildHrefWithPeriod = React.useCallback(
    (url: string) => {
      if (!periodParam) {
        return url;
      }

      const [rawPathname, existingSearch = ""] = url.split("?");
      const normalizedPathname =
        rawPathname.endsWith("/") && rawPathname !== "/"
          ? rawPathname.slice(0, -1)
          : rawPathname;

      if (!PERIOD_AWARE_PATHS.has(normalizedPathname)) {
        return url;
      }

      const params = new URLSearchParams(existingSearch);
      params.set(MONTH_PERIOD_PARAM, periodParam);

      const queryString = params.toString();
      return queryString
        ? `${normalizedPathname}?${queryString}`
        : normalizedPathname;
    },
    [periodParam]
  );

  const activeLinkClasses =
    "data-[active=true]:bg-sidebar-accent data-[active=true]:text-dark! hover:text-primary!";

  return (
    <>
      {sections.map((section) => (
        <SidebarGroup key={section.title}>
          <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {section.items.map((item) => {
                const itemIsActive = isLinkActive(item.url);
                return (
                  <Collapsible key={item.title} asChild>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        asChild
                        tooltip={item.title}
                        isActive={itemIsActive}
                        className={itemIsActive ? activeLinkClasses : ""}
                      >
                        <Link prefetch href={buildHrefWithPeriod(item.url)}>
                          <item.icon className="size-4" />
                          {item.title}
                        </Link>
                      </SidebarMenuButton>
                      {item.items?.length ? (
                        <>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuAction className="data-[state=open]:rotate-90 text-foreground px-2 trasition-transform duration-200">
                              <RiArrowRightSLine />
                              <span className="sr-only">Toggle</span>
                            </SidebarMenuAction>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <SidebarMenuSub>
                              {item.items?.map((subItem) => {
                                const subItemIsActive = isLinkActive(
                                  subItem.url
                                );
                                const avatarSrc = getAvatarSrc(
                                  subItem.avatarUrl
                                );
                                const initial =
                                  subItem.title.charAt(0).toUpperCase() || "?";
                                return (
                                  <SidebarMenuSubItem
                                    key={subItem.key ?? subItem.title}
                                  >
                                    <SidebarMenuSubButton
                                      asChild
                                      isActive={subItemIsActive}
                                      className={
                                        subItemIsActive ? activeLinkClasses : ""
                                      }
                                    >
                                      <Link
                                        prefetch
                                        href={buildHrefWithPeriod(subItem.url)}
                                        className="flex items-center gap-2"
                                      >
                                        {subItem.icon ? (
                                          <subItem.icon className="size-4" />
                                        ) : subItem.avatarUrl !== undefined ? (
                                          <Avatar className="size-5 border border-border/60 bg-background">
                                            <AvatarImage
                                              src={avatarSrc}
                                              alt={`Avatar de ${subItem.title}`}
                                            />
                                            <AvatarFallback className="text-xs font-medium uppercase">
                                              {initial}
                                            </AvatarFallback>
                                          </Avatar>
                                        ) : null}
                                        <span>{subItem.title}</span>
                                        {subItem.isShared ? (
                                          <RiUserSharedLine className="size-3.5 text-muted-foreground" />
                                        ) : null}
                                      </Link>
                                    </SidebarMenuSubButton>
                                  </SidebarMenuSubItem>
                                );
                              })}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </>
                      ) : null}
                    </SidebarMenuItem>
                  </Collapsible>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </>
  );
}

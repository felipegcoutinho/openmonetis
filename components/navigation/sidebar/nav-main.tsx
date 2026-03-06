"use client";

import {
	type RemixiconComponentType,
	RiArrowRightSLine,
	RiUserSharedLine,
} from "@remixicon/react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
		badge?: number;
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

	const normalizedPathname =
		pathname.endsWith("/") && pathname !== "/"
			? pathname.slice(0, -1)
			: pathname;

	const isLinkActive = (url: string) => {
		const normalizedUrl =
			url.endsWith("/") && url !== "/" ? url.slice(0, -1) : url;

		// Verifica se é exatamente igual ou se o pathname começa com a URL
		return (
			normalizedPathname === normalizedUrl ||
			normalizedPathname.startsWith(`${normalizedUrl}/`)
		);
	};

	const buildHrefWithPeriod = (url: string) => {
		if (!periodParam) {
			return url;
		}

		const [rawPathname, existingSearch = ""] = url.split("?");
		const normalizedRawPathname =
			rawPathname.endsWith("/") && rawPathname !== "/"
				? rawPathname.slice(0, -1)
				: rawPathname;

		if (!PERIOD_AWARE_PATHS.has(normalizedRawPathname)) {
			return url;
		}

		const params = new URLSearchParams(existingSearch);
		params.set(MONTH_PERIOD_PARAM, periodParam);

		const queryString = params.toString();
		return queryString
			? `${normalizedRawPathname}?${queryString}`
			: normalizedRawPathname;
	};

	const activeLinkClasses =
		"data-[active=true]:bg-sidebar-accent data-[active=true]:text-dark! hover:text-primary!";

	return (
		<>
			{sections.map((section, index) => (
				<SidebarGroup key={section.title}>
					<SidebarGroupLabel className="text-xs text-muted-foreground/60">
						{section.title}
					</SidebarGroupLabel>
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
														<SidebarMenuAction className="data-[state=open]:rotate-90 px-2 trasition-transform duration-200">
															<RiArrowRightSLine className="text-primary" />
															<span className="sr-only">Toggle</span>
														</SidebarMenuAction>
													</CollapsibleTrigger>
													<CollapsibleContent>
														<SidebarMenuSub>
															{item.items?.map((subItem) => {
																const subItemIsActive = isLinkActive(
																	subItem.url,
																);
																const avatarSrc = getAvatarSrc(
																	subItem.avatarUrl,
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
																				{subItem.badge ? (
																					<Badge
																						variant="destructive"
																						className="ml-auto h-5 min-w-5 px-1.5 text-xs"
																					>
																						{subItem.badge}
																					</Badge>
																				) : null}
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

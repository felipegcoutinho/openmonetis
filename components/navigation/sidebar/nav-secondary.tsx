"use client";

import type { RemixiconComponentType } from "@remixicon/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";

export function NavSecondary({
	items,
	...props
}: {
	items: {
		title: string;
		url: string;
		icon: RemixiconComponentType;
	}[];
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
	const pathname = usePathname();

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
				normalizedPathname.startsWith(`${normalizedUrl}/`)
			);
		},
		[pathname],
	);

	return (
		<SidebarGroup {...props}>
			<SidebarGroupContent>
				<SidebarMenu>
					{items.map((item) => {
						const itemIsActive = isLinkActive(item.url);
						return (
							<SidebarMenuItem key={item.title}>
								<SidebarMenuButton
									asChild
									isActive={itemIsActive}
									className={
										itemIsActive
											? "data-[active=true]:bg-sidebar-accent data-[active=true]:text-dark! hover:text-primary!"
											: ""
									}
								>
									<Link prefetch href={item.url}>
										<item.icon className={"h-4 w-4"} />
										<span>{item.title}</span>
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
						);
					})}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	);
}

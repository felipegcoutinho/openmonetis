"use client";

import type { RemixiconComponentType } from "@remixicon/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type * as React from "react";
import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/shared/components/ui/sidebar";

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

	return (
		<SidebarGroup {...props}>
			<SidebarGroupContent>
				<SidebarMenu>
					{items.map((item) => {
						const normalizedPathname =
							pathname.endsWith("/") && pathname !== "/"
								? pathname.slice(0, -1)
								: pathname;
						const normalizedUrl =
							item.url.endsWith("/") && item.url !== "/"
								? item.url.slice(0, -1)
								: item.url;
						const itemIsActive =
							normalizedPathname === normalizedUrl ||
							normalizedPathname.startsWith(`${normalizedUrl}/`);
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

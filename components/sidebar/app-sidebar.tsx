"use client";
import * as React from "react";
import { Logo } from "@/components/logo";
import { NavMain } from "@/components/sidebar/nav-main";
import { NavSecondary } from "@/components/sidebar/nav-secondary";
import { NavUser } from "@/components/sidebar/nav-user";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar";
import { createSidebarNavData, type PagadorLike } from "./nav-link";

type AppUser = {
	id: string;
	name: string;
	email: string;
	image: string | null;
};

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
	user: AppUser;
	pagadorAvatarUrl: string | null;
	pagadores: PagadorLike[];
	preLancamentosCount?: number;
}

export function AppSidebar({
	user,
	pagadorAvatarUrl,
	pagadores,
	preLancamentosCount = 0,
	...props
}: AppSidebarProps) {
	if (!user) {
		throw new Error("AppSidebar requires a user but received undefined.");
	}

	const navigation = React.useMemo(
		() => createSidebarNavData({ pagadores, preLancamentosCount }),
		[pagadores, preLancamentosCount],
	);

	return (
		<Sidebar collapsible="icon" {...props}>
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton
							asChild
							className="data-[slot=sidebar-menu-button]:px-1.5! hover:bg-transparent active:bg-transparent pt-8 py-6 justify-center hover:scale-120 scale-110 transition-all duration-200"
						>
							<a href="/dashboard">
								<LogoContent />
							</a>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				<NavMain sections={navigation.navMain} />
				<NavSecondary items={navigation.navSecondary} className="mt-auto" />
			</SidebarContent>
			<SidebarFooter>
				<NavUser user={user} pagadorAvatarUrl={pagadorAvatarUrl} />
			</SidebarFooter>
		</Sidebar>
	);
}

function LogoContent() {
	const { state } = useSidebar();
	const isCollapsed = state === "collapsed";

	return (
		<Logo variant={isCollapsed ? "small" : "full"} showVersion={!isCollapsed} />
	);
}

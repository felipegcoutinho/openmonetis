"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/ui";
import { NavLink } from "./nav-link";
import { linkActive, linkBase, linkIdle } from "./nav-styles";

type NavPillProps = {
	href: string;
	preservePeriod?: boolean;
	children: React.ReactNode;
};

export function NavPill({ href, preservePeriod, children }: NavPillProps) {
	const pathname = usePathname();

	const isActive =
		href === "/dashboard"
			? pathname === href
			: pathname === href || pathname.startsWith(`${href}/`);

	return (
		<NavLink
			href={href}
			preservePeriod={preservePeriod}
			className={cn(linkBase, isActive ? linkActive : linkIdle)}
		>
			{children}
		</NavLink>
	);
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/ui";
import { linkActive, linkBase, linkIdle } from "./nav-styles";

type SimpleNavLinkProps = {
	href: string;
	children: React.ReactNode;
};

export function SimpleNavLink({ href, children }: SimpleNavLinkProps) {
	const pathname = usePathname();
	const isActive =
		href === "/dashboard"
			? pathname === href
			: pathname === href || pathname.startsWith(`${href}/`);

	return (
		<Link
			href={href}
			className={cn(linkBase, isActive ? linkActive : linkIdle)}
		>
			{children}
		</Link>
	);
}

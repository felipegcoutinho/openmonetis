"use client";

import { usePathname } from "next/navigation";
import { buttonVariants } from "@/shared/components/ui/button";
import { cn } from "@/shared/utils/ui";
import { NavLink } from "./nav-link";

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
			className={cn(
				buttonVariants({ variant: "navbar", size: "sm" }),
				"capitalize",
				isActive && "bg-black/15 text-black dark:bg-white/15 dark:text-white",
			)}
		>
			{children}
		</NavLink>
	);
}

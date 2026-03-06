"use client";

import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/ui";
import { NavLink } from "./nav-link";

type MobileLinkProps = {
	href: string;
	icon: React.ReactNode;
	children: React.ReactNode;
	onClick?: () => void;
	badge?: number;
	preservePeriod?: boolean;
};

export function MobileLink({
	href,
	icon,
	children,
	onClick,
	badge,
	preservePeriod,
}: MobileLinkProps) {
	const pathname = usePathname();

	const isActive =
		href === "/dashboard"
			? pathname === href
			: pathname === href || pathname.startsWith(`${href}/`);

	return (
		<NavLink
			href={href}
			preservePeriod={preservePeriod}
			onClick={onClick}
			className={cn(
				"flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
				"text-muted-foreground hover:text-foreground hover:bg-accent",
				isActive && "bg-primary/10 text-primary font-medium",
			)}
		>
			<span className="text-muted-foreground shrink-0">{icon}</span>
			<span className="flex-1">{children}</span>
			{badge && badge > 0 ? (
				<Badge variant="secondary" className="text-xs px-1.5 py-0">
					{badge}
				</Badge>
			) : null}
		</NavLink>
	);
}

export function MobileSectionLabel({ label }: { label: string }) {
	return (
		<p className="mt-3 mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
			{label}
		</p>
	);
}

"use client";

import { usePathname } from "next/navigation";
import { Badge } from "@/shared/components/ui/badge";
import { cn } from "@/shared/utils/ui";
import { NavLink } from "./nav-link";

type MobileLinkProps = {
	href: string;
	icon: React.ReactNode;
	children: React.ReactNode;
	onClick?: () => void;
	badge?: number;
	preservePeriod?: boolean;
	description?: string;
};

export function MobileLink({
	href,
	icon,
	children,
	onClick,
	badge,
	preservePeriod,
	description,
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
			<span
				className={cn(
					"shrink-0",
					isActive ? "text-primary" : "text-muted-foreground",
				)}
			>
				{icon}
			</span>
			<span className="flex-1 flex flex-col gap-0.5">
				<span>{children}</span>
				{description && (
					<span className="text-[11px] text-muted-foreground leading-snug">
						{description}
					</span>
				)}
			</span>
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

"use client";

import { usePathname } from "next/navigation";
import { Badge } from "@/shared/components/ui/badge";
import { cn } from "@/shared/utils/ui";
import type { NavItem } from "./nav-items";
import { NavLink } from "./nav-link";

type NavDropdownProps = {
	items: NavItem[];
};

export function NavDropdown({ items }: NavDropdownProps) {
	const pathname = usePathname();

	return (
		<ul className="grid w-72 gap-0.5 p-2">
			{items.map((item) => {
				const isActive =
					pathname === item.href || pathname.startsWith(`${item.href}/`);

				return (
					<li key={item.href}>
						<NavLink
							href={item.href}
							preservePeriod={item.preservePeriod}
							className={cn(
								"flex items-center gap-3 rounded-sm px-2 py-2 text-sm transition-colors",
								isActive
									? "bg-accent text-foreground"
									: "text-foreground hover:bg-accent",
							)}
						>
							<span
								className={cn(
									"shrink-0",
									isActive
										? (item.iconClass ?? "text-foreground")
										: (item.iconClass ?? "text-muted-foreground"),
								)}
							>
								{item.icon}
							</span>
							<span className="flex flex-col min-w-0">
								<span className="font-semibold">{item.label}</span>
								{item.description && (
									<span className="text-xs text-muted-foreground truncate lowercase">
										{item.description}
									</span>
								)}
							</span>
							{item.badge && item.badge > 0 ? (
								<Badge
									variant="secondary"
									className="text-xs px-1.5 py-0 h-4 min-w-4 ml-auto shrink-0"
								>
									{item.badge}
								</Badge>
							) : null}
						</NavLink>
					</li>
				);
			})}
		</ul>
	);
}

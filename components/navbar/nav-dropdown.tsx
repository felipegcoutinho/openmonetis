"use client";

import { Badge } from "@/components/ui/badge";
import type { NavItem } from "./nav-items";
import { NavLink } from "./nav-link";

type NavDropdownProps = {
	items: NavItem[];
};

export function NavDropdown({ items }: NavDropdownProps) {
	return (
		<ul className="grid w-48 gap-0.5 p-2">
			{items.map((item) => (
				<li key={item.href}>
					<NavLink
						href={item.href}
						preservePeriod={item.preservePeriod}
						className="flex items-center gap-2.5 rounded-sm px-2 py-2 text-sm text-foreground hover:bg-accent transition-colors"
					>
						<span className="text-muted-foreground shrink-0">{item.icon}</span>
						<span className="flex-1">{item.label}</span>
						{item.badge && item.badge > 0 ? (
							<Badge
								variant="secondary"
								className="text-[10px] px-1.5 py-0 h-4 min-w-4 ml-auto"
							>
								{item.badge}
							</Badge>
						) : null}
					</NavLink>
				</li>
			))}
		</ul>
	);
}

"use client";

import { RiDashboardLine, RiMenuLine } from "@remixicon/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	NavigationMenu,
	NavigationMenuContent,
	NavigationMenuItem,
	NavigationMenuList,
	NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { MobileLink, MobileSectionLabel } from "./mobile-link";
import { NavDropdown } from "./nav-dropdown";
import { NAV_SECTIONS } from "./nav-items";
import { NavPill } from "./nav-pill";
import { triggerClass } from "./nav-styles";
import { MobileTools, NavToolsDropdown } from "./nav-tools";

export function NavMenu() {
	const [sheetOpen, setSheetOpen] = useState(false);
	const close = () => setSheetOpen(false);

	return (
		<>
			{/* Desktop */}
			<nav className="hidden md:flex items-center justify-center flex-1">
				<NavigationMenu viewport={false}>
					<NavigationMenuList className="gap-0">
						<NavigationMenuItem>
							<NavPill href="/dashboard" preservePeriod>
								Dashboard
							</NavPill>
						</NavigationMenuItem>

						{NAV_SECTIONS.map((section) => (
							<NavigationMenuItem key={section.label}>
								<NavigationMenuTrigger className={triggerClass}>
									{section.label}
								</NavigationMenuTrigger>
								<NavigationMenuContent>
									<NavDropdown items={section.items} />
								</NavigationMenuContent>
							</NavigationMenuItem>
						))}

						<NavigationMenuItem>
							<NavigationMenuTrigger className={triggerClass}>
								Ferramentas
							</NavigationMenuTrigger>
							<NavigationMenuContent>
								<NavToolsDropdown />
							</NavigationMenuContent>
						</NavigationMenuItem>
					</NavigationMenuList>
				</NavigationMenu>
			</nav>

			{/* Mobile - order-[-1] places hamburger before logo visually */}
			<Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
				<SheetTrigger asChild>
					<Button
						variant="ghost"
						size="icon"
						className="-order-1 md:hidden text-foreground hover:bg-foreground/10 hover:text-foreground"
					>
						<RiMenuLine className="size-5" />
						<span className="sr-only">Abrir menu</span>
					</Button>
				</SheetTrigger>
				<SheetContent side="left" className="w-72 p-0">
					<SheetHeader className="p-4 border-b">
						<SheetTitle>Menu</SheetTitle>
					</SheetHeader>
					<nav className="p-3 overflow-y-auto">
						<MobileLink
							href="/dashboard"
							icon={<RiDashboardLine className="size-4" />}
							onClick={close}
							preservePeriod
						>
							dashboard
						</MobileLink>

						{NAV_SECTIONS.map((section) => {
							const mobileItems = section.items.filter(
								(item) => !item.hideOnMobile,
							);
							if (mobileItems.length === 0) return null;
							return (
								<div key={section.label}>
									<MobileSectionLabel label={section.label} />
									{mobileItems.map((item) => (
										<MobileLink
											key={item.href}
											href={item.href}
											icon={item.icon}
											onClick={close}
											badge={item.badge}
											preservePeriod={item.preservePeriod}
										>
											{item.label}
										</MobileLink>
									))}
								</div>
							);
						})}

						<MobileSectionLabel label="Ferramentas" />
						<MobileTools onClose={close} />
					</nav>
				</SheetContent>
			</Sheet>
		</>
	);
}

"use client";

import { RiDashboardLine, RiMenuLine } from "@remixicon/react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { CalculatorDialogContent } from "@/shared/components/calculator/calculator-dialog";
import { Button } from "@/shared/components/ui/button";
import { Dialog } from "@/shared/components/ui/dialog";
import {
	NavigationMenu,
	NavigationMenuContent,
	NavigationMenuItem,
	NavigationMenuList,
	NavigationMenuTrigger,
} from "@/shared/components/ui/navigation-menu";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/shared/components/ui/sheet";
import { MobileLink, MobileSectionLabel } from "./mobile-link";
import { NavDropdown } from "./nav-dropdown";
import { NAV_SECTIONS } from "./nav-items";
import { NavPill } from "./nav-pill";
import { triggerActiveClass, triggerClass } from "./nav-styles";
import { MobileTools, NavToolsDropdown } from "./nav-tools";

export function NavMenu() {
	const pathname = usePathname();
	const [sheetOpen, setSheetOpen] = useState(false);
	const [calculatorOpen, setCalculatorOpen] = useState(false);
	const close = () => setSheetOpen(false);
	const openCalculator = () => setCalculatorOpen(true);

	return (
		<>
			{/* Desktop */}
			<nav className="hidden md:flex items-center justify-center flex-1 ">
				<NavigationMenu viewport={false}>
					<NavigationMenuList className="gap-0">
						<NavigationMenuItem>
							<NavPill href="/dashboard" preservePeriod>
								Dashboard
							</NavPill>
						</NavigationMenuItem>

						{NAV_SECTIONS.map((section) => {
							const isSectionActive = section.items.some(
								(item) =>
									pathname === item.href ||
									pathname.startsWith(`${item.href}/`),
							);
							return (
								<NavigationMenuItem key={section.label}>
									<NavigationMenuTrigger
										className={`${triggerClass} ${isSectionActive ? triggerActiveClass : ""}`}
									>
										{section.label}
									</NavigationMenuTrigger>
									<NavigationMenuContent>
										<NavDropdown items={section.items} />
									</NavigationMenuContent>
								</NavigationMenuItem>
							);
						})}

						<NavigationMenuItem>
							<NavigationMenuTrigger className={triggerClass}>
								Ferramentas
							</NavigationMenuTrigger>
							<NavigationMenuContent>
								<NavToolsDropdown onOpenCalculator={openCalculator} />
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
						className="-order-1 border border-black/10 text-black/75 shadow-none md:hidden hover:border-black/20 hover:bg-black/10 hover:text-black focus-visible:ring-black/20"
					>
						<RiMenuLine className="size-5" />
						<span className="sr-only">Abrir menu</span>
					</Button>
				</SheetTrigger>
				<SheetContent side="left" className="w-72 p-0 shadow-none">
					<SheetHeader className="border-b border-border/60 p-4">
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
											description={item.description}
										>
											{item.label}
										</MobileLink>
									))}
								</div>
							);
						})}

						<MobileSectionLabel label="Ferramentas" />
						<MobileTools onClose={close} onOpenCalculator={openCalculator} />
					</nav>
				</SheetContent>
			</Sheet>

			<Dialog open={calculatorOpen} onOpenChange={setCalculatorOpen}>
				<CalculatorDialogContent open={calculatorOpen} />
			</Dialog>
		</>
	);
}

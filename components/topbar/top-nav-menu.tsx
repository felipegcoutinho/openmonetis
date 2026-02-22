"use client";

import {
	RiArrowLeftRightLine,
	RiBankCard2Line,
	RiBankLine,
	RiCalendarEventLine,
	RiDashboardLine,
	RiFileChartLine,
	RiFundsLine,
	RiGroupLine,
	RiInboxLine,
	RiMenuLine,
	RiPriceTag3Line,
	RiSparklingLine,
	RiTodoLine,
} from "@remixicon/react";
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
import type { DropdownLinkItem } from "./dropdown-link-list";
import { DropdownLinkList } from "./dropdown-link-list";
import { MobileNavLink, MobileSectionLabel } from "./mobile-nav-link";
import { triggerClass } from "./nav-styles";
import { SimpleNavLink } from "./simple-nav-link";

type TopNavMenuProps = {
	preLancamentosCount?: number;
};

export function TopNavMenu({ preLancamentosCount = 0 }: TopNavMenuProps) {
	const [sheetOpen, setSheetOpen] = useState(false);
	const close = () => setSheetOpen(false);

	const lancamentosItems: DropdownLinkItem[] = [
		{
			href: "/lancamentos",
			label: "Lançamentos",
			icon: <RiArrowLeftRightLine className="size-4" />,
		},
		{
			href: "/pre-lancamentos",
			label: "Pré-Lançamentos",
			icon: <RiInboxLine className="size-4" />,
			badge: preLancamentosCount,
		},
		{
			href: "/calendario",
			label: "Calendário",
			icon: <RiCalendarEventLine className="size-4" />,
		},
	];

	const financasItems: DropdownLinkItem[] = [
		{
			href: "/cartoes",
			label: "Cartões",
			icon: <RiBankCard2Line className="size-4" />,
		},
		{
			href: "/contas",
			label: "Contas",
			icon: <RiBankLine className="size-4" />,
		},
		{
			href: "/orcamentos",
			label: "Orçamentos",
			icon: <RiFundsLine className="size-4" />,
		},
	];

	const organizacaoItems: DropdownLinkItem[] = [
		{
			href: "/pagadores",
			label: "Pagadores",
			icon: <RiGroupLine className="size-4" />,
		},
		{
			href: "/categorias",
			label: "Categorias",
			icon: <RiPriceTag3Line className="size-4" />,
		},
		{
			href: "/anotacoes",
			label: "Anotações",
			icon: <RiTodoLine className="size-4" />,
		},
	];

	const analiseItems: DropdownLinkItem[] = [
		{
			href: "/insights",
			label: "Insights",
			icon: <RiSparklingLine className="size-4" />,
		},
		{
			href: "/relatorios/tendencias",
			label: "Tendências",
			icon: <RiFileChartLine className="size-4" />,
		},
		{
			href: "/relatorios/uso-cartoes",
			label: "Uso de Cartões",
			icon: <RiBankCard2Line className="size-4" />,
		},
	];

	return (
		<>
			{/* Desktop nav */}
			<nav className="hidden md:flex items-center flex-1">
				<NavigationMenu viewport={false}>
					<NavigationMenuList className="gap-0">
						<NavigationMenuItem>
							<SimpleNavLink href="/dashboard">Dashboard</SimpleNavLink>
						</NavigationMenuItem>

						<NavigationMenuItem>
							<NavigationMenuTrigger className={triggerClass}>
								Lançamentos
							</NavigationMenuTrigger>
							<NavigationMenuContent>
								<DropdownLinkList items={lancamentosItems} />
							</NavigationMenuContent>
						</NavigationMenuItem>

						<NavigationMenuItem>
							<NavigationMenuTrigger className={triggerClass}>
								Finanças
							</NavigationMenuTrigger>
							<NavigationMenuContent>
								<DropdownLinkList items={financasItems} />
							</NavigationMenuContent>
						</NavigationMenuItem>

						<NavigationMenuItem>
							<NavigationMenuTrigger className={triggerClass}>
								Organização
							</NavigationMenuTrigger>
							<NavigationMenuContent>
								<DropdownLinkList items={organizacaoItems} />
							</NavigationMenuContent>
						</NavigationMenuItem>

						<NavigationMenuItem>
							<NavigationMenuTrigger className={triggerClass}>
								Análise
							</NavigationMenuTrigger>
							<NavigationMenuContent>
								<DropdownLinkList items={analiseItems} />
							</NavigationMenuContent>
						</NavigationMenuItem>
					</NavigationMenuList>
				</NavigationMenu>
			</nav>

			{/* Mobile hamburger */}
			<Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
				<SheetTrigger asChild>
					<Button
						variant="ghost"
						size="icon"
						className="md:hidden text-foreground hover:bg-foreground/10 hover:text-foreground"
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
						<MobileNavLink
							href="/dashboard"
							icon={<RiDashboardLine className="size-4" />}
							onClick={close}
						>
							Dashboard
						</MobileNavLink>

						<MobileSectionLabel label="Lançamentos" />
						<MobileNavLink
							href="/lancamentos"
							icon={<RiArrowLeftRightLine className="size-4" />}
							onClick={close}
						>
							Lançamentos
						</MobileNavLink>
						<MobileNavLink
							href="/pre-lancamentos"
							icon={<RiInboxLine className="size-4" />}
							onClick={close}
							badge={preLancamentosCount}
						>
							Pré-Lançamentos
						</MobileNavLink>
						<MobileNavLink
							href="/calendario"
							icon={<RiCalendarEventLine className="size-4" />}
							onClick={close}
						>
							Calendário
						</MobileNavLink>

						<MobileSectionLabel label="Finanças" />
						<MobileNavLink
							href="/cartoes"
							icon={<RiBankCard2Line className="size-4" />}
							onClick={close}
						>
							Cartões
						</MobileNavLink>
						<MobileNavLink
							href="/contas"
							icon={<RiBankLine className="size-4" />}
							onClick={close}
						>
							Contas
						</MobileNavLink>
						<MobileNavLink
							href="/orcamentos"
							icon={<RiFundsLine className="size-4" />}
							onClick={close}
						>
							Orçamentos
						</MobileNavLink>

						<MobileSectionLabel label="Organização" />
						<MobileNavLink
							href="/pagadores"
							icon={<RiGroupLine className="size-4" />}
							onClick={close}
						>
							Pagadores
						</MobileNavLink>
						<MobileNavLink
							href="/categorias"
							icon={<RiPriceTag3Line className="size-4" />}
							onClick={close}
						>
							Categorias
						</MobileNavLink>
						<MobileNavLink
							href="/anotacoes"
							icon={<RiTodoLine className="size-4" />}
							onClick={close}
						>
							Anotações
						</MobileNavLink>

						<MobileSectionLabel label="Análise" />
						<MobileNavLink
							href="/insights"
							icon={<RiSparklingLine className="size-4" />}
							onClick={close}
						>
							Insights
						</MobileNavLink>
						<MobileNavLink
							href="/relatorios/tendencias"
							icon={<RiFileChartLine className="size-4" />}
							onClick={close}
						>
							Tendências
						</MobileNavLink>
						<MobileNavLink
							href="/relatorios/uso-cartoes"
							icon={<RiBankCard2Line className="size-4" />}
							onClick={close}
						>
							Uso de Cartões
						</MobileNavLink>
					</nav>
				</SheetContent>
			</Sheet>
		</>
	);
}

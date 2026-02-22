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
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
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
import { cn } from "@/lib/utils/ui";

type TopNavMenuProps = {
	preLancamentosCount?: number;
};

const linkBase =
	"inline-flex h-9 items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-colors";
const linkIdle = "text-foreground hover:text-foreground hover:underline";
const linkActive = "text-primary";

// NavigationMenuTrigger override: remove backgrounds, keep underline style
const triggerClass = [
	"text-foreground!",
	"bg-transparent!",
	"hover:bg-transparent!",
	"hover:text-foreground!",
	"hover:underline!",
	"focus:bg-transparent!",
	"focus:text-foreground!",
	"data-[state=open]:bg-transparent!",
	"data-[state=open]:text-foreground!",
	"data-[state=open]:underline!",
	"px-3!",
].join(" ");

function SimpleNavLink({
	href,
	children,
}: {
	href: string;
	children: React.ReactNode;
}) {
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

type DropdownLinkItem = {
	href: string;
	label: string;
	icon: React.ReactNode;
	badge?: number;
};

function DropdownLinkList({ items }: { items: DropdownLinkItem[] }) {
	return (
		<ul className="grid w-48 gap-0.5 p-2">
			{items.map((item) => (
				<li key={item.href}>
					<Link
						href={item.href}
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
					</Link>
				</li>
			))}
		</ul>
	);
}

function MobileNavLink({
	href,
	icon,
	children,
	onClick,
	badge,
}: {
	href: string;
	icon: React.ReactNode;
	children: React.ReactNode;
	onClick?: () => void;
	badge?: number;
}) {
	const pathname = usePathname();
	const isActive =
		href === "/dashboard"
			? pathname === href
			: pathname === href || pathname.startsWith(`${href}/`);

	return (
		<Link
			href={href}
			onClick={onClick}
			className={cn(
				"flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
				"text-card-foreground hover:bg-accent",
				isActive && "bg-accent font-medium",
			)}
		>
			<span className="text-muted-foreground shrink-0">{icon}</span>
			<span className="flex-1">{children}</span>
			{badge && badge > 0 ? (
				<Badge variant="secondary" className="text-xs px-1.5 py-0">
					{badge}
				</Badge>
			) : null}
		</Link>
	);
}

function MobileSectionLabel({ label }: { label: string }) {
	return (
		<p className="mt-3 mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
			{label}
		</p>
	);
}

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
	];

	const organizacaoItems: DropdownLinkItem[] = [
		{
			href: "/orcamentos",
			label: "Orçamentos",
			icon: <RiFundsLine className="size-4" />,
		},
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
							<SimpleNavLink href="/calendario">Calendário</SimpleNavLink>
						</NavigationMenuItem>

						<NavigationMenuItem>
							<SimpleNavLink href="/cartoes">Cartões</SimpleNavLink>
						</NavigationMenuItem>

						<NavigationMenuItem>
							<SimpleNavLink href="/contas">Contas</SimpleNavLink>
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

						<MobileSectionLabel label="Financeiro" />
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

						<MobileSectionLabel label="Organização" />
						<MobileNavLink
							href="/orcamentos"
							icon={<RiFundsLine className="size-4" />}
							onClick={close}
						>
							Orçamentos
						</MobileNavLink>
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

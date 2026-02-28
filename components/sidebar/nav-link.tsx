import {
	type RemixiconComponentType,
	RiArrowLeftRightLine,
	RiAtLine,
	RiBankCard2Line,
	RiBankLine,
	RiCalendarEventLine,
	RiDashboardLine,
	RiFileChartLine,
	RiFundsLine,
	RiGroupLine,
	RiPriceTag3Line,
	RiSettings2Line,
	RiSparklingLine,
	RiTodoLine,
} from "@remixicon/react";

export type SidebarSubItem = {
	title: string;
	url: string;
	avatarUrl?: string | null;
	isShared?: boolean;
	key?: string;
	icon?: RemixiconComponentType;
	badge?: number;
};

export type SidebarItem = {
	title: string;
	url: string;
	icon: RemixiconComponentType;
	isActive?: boolean;
	items?: SidebarSubItem[];
};

export type SidebarSection = {
	title: string;
	items: SidebarItem[];
};

export type SidebarNavData = {
	navMain: SidebarSection[];
	navSecondary: {
		title: string;
		url: string;
		icon: RemixiconComponentType;
	}[];
};

export interface PagadorLike {
	id: string;
	name: string | null;
	avatarUrl: string | null;
	canEdit?: boolean;
}

export interface SidebarNavOptions {
	pagadores: PagadorLike[];
	preLancamentosCount?: number;
}

export function createSidebarNavData(
	options: SidebarNavOptions,
): SidebarNavData {
	const { pagadores, preLancamentosCount = 0 } = options;
	const pagadorItems = pagadores
		.map((pagador) => ({
			title: pagador.name?.trim().length
				? pagador.name.trim()
				: "Pagador sem nome",
			url: `/pagadores/${pagador.id}`,
			key: pagador.canEdit ? pagador.id : `${pagador.id}-shared`,
			isShared: !pagador.canEdit,
			avatarUrl: pagador.avatarUrl,
		}))
		.sort((a, b) =>
			a.title.localeCompare(b.title, "pt-BR", { sensitivity: "base" }),
		);

	const pagadorItemsWithHistory: SidebarSubItem[] = pagadorItems;

	return {
		navMain: [
			{
				title: "Gestão Financeira",
				items: [
					{
						title: "Dashboard",
						url: "/dashboard",
						icon: RiDashboardLine,
					},
					{
						title: "Lançamentos",
						url: "/lancamentos",
						icon: RiArrowLeftRightLine,
						items: [
							{
								title: "Pré-Lançamentos",
								url: "/pre-lancamentos",
								key: "pre-lancamentos",
								icon: RiAtLine,
								badge:
									preLancamentosCount > 0 ? preLancamentosCount : undefined,
							},
						],
					},
					{
						title: "Calendário",
						url: "/calendario",
						icon: RiCalendarEventLine,
					},
					{
						title: "Cartões",
						url: "/cartoes",
						icon: RiBankCard2Line,
					},
					{
						title: "Contas",
						url: "/contas",
						icon: RiBankLine,
					},
					{
						title: "Orçamentos",
						url: "/orcamentos",
						icon: RiFundsLine,
					},
				],
			},
			{
				title: "Organização",
				items: [
					{
						title: "Pagadores",
						url: "/pagadores",
						icon: RiGroupLine,
						items: pagadorItemsWithHistory,
					},
					{
						title: "Categorias",
						url: "/categorias",
						icon: RiPriceTag3Line,
					},
					{
						title: "Anotações",
						url: "/anotacoes",
						icon: RiTodoLine,
					},
				],
			},
			{
				title: "Análise",
				items: [
					{
						title: "Insights",
						url: "/insights",
						icon: RiSparklingLine,
					},
					{
						title: "Tendências",
						url: "/relatorios/tendencias",
						icon: RiFileChartLine,
					},
					{
						title: "Uso de Cartões",
						url: "/relatorios/uso-cartoes",
						icon: RiBankCard2Line,
					},
				],
			},
		],
		navSecondary: [
			{
				title: "Ajustes",
				url: "/ajustes",
				icon: RiSettings2Line,
			},
		],
	};
}

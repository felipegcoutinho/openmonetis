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
	RiSecurePaymentLine,
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
			url: `/payers/${pagador.id}`,
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
						url: "/transactions",
						icon: RiArrowLeftRightLine,
						items: [
							{
								title: "Pré-Lançamentos",
								url: "/inbox",
								key: "pre-lancamentos",
								icon: RiAtLine,
								badge:
									preLancamentosCount > 0 ? preLancamentosCount : undefined,
							},
						],
					},
					{
						title: "Calendário",
						url: "/calendar",
						icon: RiCalendarEventLine,
					},
					{
						title: "Cartões",
						url: "/cards",
						icon: RiBankCard2Line,
					},
					{
						title: "Contas",
						url: "/accounts",
						icon: RiBankLine,
					},
					{
						title: "Orçamentos",
						url: "/budgets",
						icon: RiFundsLine,
					},
				],
			},
			{
				title: "Organização",
				items: [
					{
						title: "Pagadores",
						url: "/payers",
						icon: RiGroupLine,
						items: pagadorItemsWithHistory,
					},
					{
						title: "Categorias",
						url: "/categories",
						icon: RiPriceTag3Line,
					},
					{
						title: "Anotações",
						url: "/notes",
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
						url: "/reports/category-trends",
						icon: RiFileChartLine,
					},
					{
						title: "Uso de Cartões",
						url: "/reports/card-usage",
						icon: RiBankCard2Line,
					},
					{
						title: "Análise de Parcelas",
						url: "/reports/installment-analysis",
						icon: RiSecurePaymentLine,
					},
				],
			},
		],
		navSecondary: [
			{
				title: "Ajustes",
				url: "/settings",
				icon: RiSettings2Line,
			},
		],
	};
}

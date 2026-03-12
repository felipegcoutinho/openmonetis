import {
	RiArrowLeftRightLine,
	RiAtLine,
	RiBankCard2Line,
	RiBankLine,
	RiBarChart2Line,
	RiCalendarEventLine,
	RiFileChartLine,
	RiGroupLine,
	RiPriceTag3Line,
	RiSecurePaymentLine,
	RiSparklingLine,
	RiStore2Line,
	RiTodoLine,
} from "@remixicon/react";

export type NavItem = {
	href: string;
	label: string;
	icon: React.ReactNode;
	badge?: number;
	preservePeriod?: boolean;
	hideOnMobile?: boolean;
};

export type NavSection = {
	label: string;
	items: NavItem[];
};

export const NAV_SECTIONS: NavSection[] = [
	{
		label: "Lançamentos",
		items: [
			{
				href: "/transactions",
				label: "lançamentos",
				icon: <RiArrowLeftRightLine className="size-4" />,
				preservePeriod: true,
			},
			{
				href: "/inbox",
				label: "pré-lançamentos",
				icon: <RiAtLine className="size-4" />,
			},
			{
				href: "/calendar",
				label: "calendário",
				icon: <RiCalendarEventLine className="size-4" />,
				hideOnMobile: true,
			},
		],
	},
	{
		label: "Finanças",
		items: [
			{
				href: "/cards",
				label: "cartões",
				icon: <RiBankCard2Line className="size-4" />,
			},
			{
				href: "/accounts",
				label: "contas",
				icon: <RiBankLine className="size-4" />,
			},
			{
				href: "/budgets",
				label: "orçamentos",
				icon: <RiBarChart2Line className="size-4" />,
				preservePeriod: true,
			},
		],
	},
	{
		label: "Organização",
		items: [
			{
				href: "/payers",
				label: "pagadores",
				icon: <RiGroupLine className="size-4" />,
			},
			{
				href: "/categories",
				label: "categorias",
				icon: <RiPriceTag3Line className="size-4" />,
			},
			{
				href: "/notes",
				label: "anotações",
				icon: <RiTodoLine className="size-4" />,
			},
		],
	},
	{
		label: "Relatórios",
		items: [
			{
				href: "/insights",
				label: "insights",
				icon: <RiSparklingLine className="size-4" />,
				preservePeriod: true,
			},
			{
				href: "/reports/category-trends",
				label: "tendências",
				icon: <RiFileChartLine className="size-4" />,
			},
			{
				href: "/reports/card-usage",
				label: "uso de cartões",
				icon: <RiBankCard2Line className="size-4" />,
				preservePeriod: true,
			},
			{
				href: "/reports/installment-analysis",
				label: "análise de parcelas",
				icon: <RiSecurePaymentLine className="size-4" />,
			},
			{
				href: "/reports/establishments",
				label: "estabelecimentos",
				icon: <RiStore2Line className="size-4" />,
			},
		],
	},
];

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
	RiSparklingLine,
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
				href: "/lancamentos",
				label: "lançamentos",
				icon: <RiArrowLeftRightLine className="size-4" />,
				preservePeriod: true,
			},
			{
				href: "/pre-lancamentos",
				label: "pré-lançamentos",
				icon: <RiAtLine className="size-4" />,
			},
			{
				href: "/calendario",
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
				href: "/cartoes",
				label: "cartões",
				icon: <RiBankCard2Line className="size-4" />,
			},
			{
				href: "/contas",
				label: "contas",
				icon: <RiBankLine className="size-4" />,
			},
			{
				href: "/orcamentos",
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
				href: "/pagadores",
				label: "pagadores",
				icon: <RiGroupLine className="size-4" />,
			},
			{
				href: "/categorias",
				label: "categorias",
				icon: <RiPriceTag3Line className="size-4" />,
			},
			{
				href: "/anotacoes",
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
				href: "/relatorios/tendencias",
				label: "tendências",
				icon: <RiFileChartLine className="size-4" />,
			},
			{
				href: "/relatorios/uso-cartoes",
				label: "uso de cartões",
				icon: <RiBankCard2Line className="size-4" />,
				preservePeriod: true,
			},
		],
	},
];

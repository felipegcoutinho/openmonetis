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
	description?: string;
	icon: React.ReactNode;
	iconClass?: string;
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
				description: "Registre e gerencie suas transações",
				icon: <RiArrowLeftRightLine className="size-4" />,
				iconClass: "text-primary",
				preservePeriod: true,
			},
			{
				href: "/inbox",
				label: "pré-lançamentos",
				description: "Notificações capturadas pelo Companion",
				icon: <RiAtLine className="size-4" />,
				iconClass: "text-primary",
			},
			{
				href: "/calendar",
				label: "calendário",
				description: "Visualize lançamentos por dia",
				icon: <RiCalendarEventLine className="size-4" />,
				iconClass: "text-primary",
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
				description: "Faturas e limites dos seus cartões",
				icon: <RiBankCard2Line className="size-4" />,
				iconClass: "text-primary",
			},
			{
				href: "/accounts",
				label: "contas",
				description: "Saldos e extratos bancários",
				icon: <RiBankLine className="size-4" />,
				iconClass: "text-primary",
			},
			{
				href: "/budgets",
				label: "orçamentos",
				description: "Defina limites de gastos por categoria",
				icon: <RiBarChart2Line className="size-4" />,
				iconClass: "text-primary",
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
				description: "Gerencie quem divide as despesas",
				icon: <RiGroupLine className="size-4" />,
				iconClass: "text-primary",
			},
			{
				href: "/categories",
				label: "categorias",
				description: "Agrupe seus lançamentos",
				icon: <RiPriceTag3Line className="size-4" />,
				iconClass: "text-primary",
			},
			{
				href: "/notes",
				label: "anotações",
				description: "Guarde lembretes e observações",
				icon: <RiTodoLine className="size-4" />,
				iconClass: "text-primary",
			},
		],
	},
	{
		label: "Relatórios",
		items: [
			{
				href: "/insights",
				label: "insights",
				description: "Análises inteligentes dos seus dados",
				icon: <RiSparklingLine className="size-4" />,
				iconClass: "text-primary",
				preservePeriod: true,
			},
			{
				href: "/reports/category-trends",
				label: "tendências",
				description: "Evolução de gastos por categoria",
				icon: <RiFileChartLine className="size-4" />,
				iconClass: "text-primary",
			},
			{
				href: "/reports/card-usage",
				label: "uso de cartões",
				description: "Resumo de gastos por cartão",
				icon: <RiBankCard2Line className="size-4" />,
				iconClass: "text-primary",
				preservePeriod: true,
			},
			{
				href: "/reports/installment-analysis",
				label: "análise de parcelas",
				description: "Acompanhe parcelas em aberto",
				icon: <RiSecurePaymentLine className="size-4" />,
				iconClass: "text-primary",
			},
			{
				href: "/reports/establishments",
				label: "estabelecimentos",
				description: "Top gastos por estabelecimento",
				icon: <RiStore2Line className="size-4" />,
				iconClass: "text-primary",
			},
		],
	},
];

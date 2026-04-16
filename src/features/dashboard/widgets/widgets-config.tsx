import {
	RiArrowRightLine,
	RiArrowUpDoubleLine,
	RiAtLine,
	RiAttachmentLine,
	RiBarChartBoxLine,
	RiBarcodeLine,
	RiBillLine,
	RiExchangeLine,
	RiGroupLine,
	RiLineChartLine,
	RiNumbersLine,
	RiPieChartLine,
	RiRefreshLine,
	RiStore3Line,
	RiTodoLine,
	RiWallet3Line,
} from "@remixicon/react";
import Link from "next/link";
import type { ReactNode } from "react";
import { AttachmentsWidget } from "@/features/dashboard/components/attachments-widget";
import { BillWidget } from "@/features/dashboard/components/bill-widget";
import { CategoryTrendsWidget } from "@/features/dashboard/components/category-trends-widget";
import { ExpensesByCategoryWidgetWithChart } from "@/features/dashboard/components/expenses-by-category-widget-with-chart";
import { GoalsProgressWidget } from "@/features/dashboard/components/goals-progress-widget";
import { InboxWidget } from "@/features/dashboard/components/inbox-widget";
import { IncomeByCategoryWidgetWithChart } from "@/features/dashboard/components/income-by-category-widget-with-chart";
import { IncomeExpenseBalanceWidget } from "@/features/dashboard/components/income-expense-balance-widget";
import { InstallmentExpensesWidget } from "@/features/dashboard/components/installment-expenses-widget";
import { InvoicesWidget } from "@/features/dashboard/components/invoices-widget";
import { MyAccountsWidget } from "@/features/dashboard/components/my-accounts-widget";
import { NotesWidget } from "@/features/dashboard/components/notes-widget";
import { PayersWidget } from "@/features/dashboard/components/payers-widget";
import { PaymentOverviewWidget } from "@/features/dashboard/components/payment-overview-widget";
import { PaymentStatusWidget } from "@/features/dashboard/components/payment-status-widget";
import { PurchasesByCategoryWidget } from "@/features/dashboard/components/purchases-by-category-widget";
import { RecurringExpensesWidget } from "@/features/dashboard/components/recurring-expenses-widget";
import { SpendingOverviewWidget } from "@/features/dashboard/components/spending-overview-widget";
import type { WidgetPreferences } from "@/features/dashboard/widgets/actions";
import type { SelectOption } from "@/features/transactions/components/types";
import type { DashboardData } from "../fetch-dashboard-data";

export type DashboardWidgetQuickActionOptions = {
	payerOptions: SelectOption[];
	splitPayerOptions: SelectOption[];
	defaultPayerId: string | null;
	accountOptions: SelectOption[];
	cardOptions: SelectOption[];
	categoryOptions: SelectOption[];
	estabelecimentos: string[];
};

export type WidgetConfig = {
	id: string;
	title: string;
	subtitle: string;
	icon: ReactNode;
	component: (props: {
		data: DashboardData;
		period: string;
		adminPayerSlug: string | null;
		widgetPreferences: WidgetPreferences;
		quickActionOptions: DashboardWidgetQuickActionOptions;
		onMyAccountsShowExcludedChange?: (value: boolean) => void;
	}) => ReactNode;
	action?: ReactNode;
};

export const widgetsConfig: WidgetConfig[] = [
	{
		id: "my-accounts",
		title: "Minhas Contas",
		subtitle: "Saldo consolidado disponível",
		icon: <RiBarChartBoxLine className="size-4" />,
		component: ({
			data,
			period,
			widgetPreferences,
			onMyAccountsShowExcludedChange,
		}) => (
			<MyAccountsWidget
				accounts={data.accountsSnapshot.accounts}
				showExcludedAccounts={widgetPreferences.myAccountsShowExcluded ?? true}
				onShowExcludedAccountsChange={onMyAccountsShowExcludedChange}
				totalBalance={data.accountsSnapshot.totalBalance}
				period={period}
			/>
		),
	},
	{
		id: "invoices",
		title: "Faturas",
		subtitle: "Resumo das faturas do período",
		icon: <RiBillLine className="size-4" />,
		component: ({ data }) => (
			<InvoicesWidget invoices={data.invoicesSnapshot.invoices} />
		),
	},
	{
		id: "boletos",
		title: "Boletos",
		subtitle: "Controle de boletos do período",
		icon: <RiBarcodeLine className="size-4" />,
		component: ({ data }) => <BillWidget bills={data.billsSnapshot.bills} />,
	},
	{
		id: "payment-status",
		title: "Status de Pagamento",
		subtitle: "Valores confirmados e pendentes",
		icon: <RiWallet3Line className="size-4" />,
		component: ({ data }) => (
			<PaymentStatusWidget data={data.paymentStatusData} />
		),
	},
	{
		id: "inbox",
		title: "Pré-lançamentos",
		subtitle: "Notificações pendentes de revisão",
		icon: <RiAtLine className="size-4" />,
		component: ({ data, quickActionOptions }) => (
			<InboxWidget
				snapshot={data.inboxSnapshot}
				quickActionOptions={quickActionOptions}
			/>
		),
		action: (
			<Link
				href="/inbox"
				className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
			>
				Revisar
				<RiArrowRightLine className="size-4" />
			</Link>
		),
	},
	{
		id: "income-expense-balance",
		title: "Receita, Despesa e Balanço",
		subtitle: "Últimos 6 meses",
		icon: <RiLineChartLine className="size-4" />,
		component: ({ data }) => (
			<IncomeExpenseBalanceWidget data={data.incomeExpenseBalanceData} />
		),
	},
	{
		id: "goals-progress",
		title: "Progresso de Orçamentos",
		subtitle: "Orçamentos por categoria no período",
		icon: <RiExchangeLine className="size-4" />,
		component: ({ data }) => (
			<GoalsProgressWidget data={data.goalsProgressData} />
		),
		action: (
			<Link
				href="/budgets"
				className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
			>
				Ver todos
				<RiArrowRightLine className="size-4" />
			</Link>
		),
	},
	{
		id: "category-trends",
		title: "Tendências de Categorias",
		subtitle: "Top 10 maiores variações vs. mês anterior",
		icon: <RiLineChartLine className="size-4" />,
		component: ({ data }) => (
			<CategoryTrendsWidget
				categories={data.expensesByCategoryData.categories}
			/>
		),
	},
	{
		id: "spending-overview",
		title: "Panorama de Gastos",
		subtitle: "Principais despesas e frequência por local",
		icon: <RiArrowUpDoubleLine className="size-4" />,
		component: ({ data }) => (
			<SpendingOverviewWidget
				topExpensesAll={data.topExpensesAll}
				topExpensesCardOnly={data.topExpensesCardOnly}
				topEstablishmentsData={data.topEstablishmentsData}
			/>
		),
	},
	{
		id: "payment-overview",
		title: "Comportamento de Pagamento",
		subtitle: "Despesas por condição e forma de pagamento",
		icon: <RiWallet3Line className="size-4" />,
		component: ({ data, period, adminPayerSlug }) => (
			<PaymentOverviewWidget
				paymentConditionsData={data.paymentConditionsData}
				paymentMethodsData={data.paymentMethodsData}
				period={period}
				adminPayerSlug={adminPayerSlug}
			/>
		),
	},
	{
		id: "expenses-by-category",
		title: "Categorias por Despesas",
		subtitle: "Distribuição de despesas por categoria",
		icon: <RiPieChartLine className="size-4" />,
		component: ({ data, period }) => (
			<ExpensesByCategoryWidgetWithChart
				data={data.expensesByCategoryData}
				period={period}
			/>
		),
	},
	{
		id: "income-by-category",
		title: "Categorias por Receitas",
		subtitle: "Distribuição de receitas por categoria",
		icon: <RiPieChartLine className="size-4" />,
		component: ({ data, period }) => (
			<IncomeByCategoryWidgetWithChart
				data={data.incomeByCategoryData}
				period={period}
			/>
		),
	},
	{
		id: "purchases-by-category",
		title: "Lançamentos por Categorias",
		subtitle: "Distribuição de lançamentos por categoria",
		icon: <RiStore3Line className="size-4" />,
		component: ({ data }) => (
			<PurchasesByCategoryWidget data={data.purchasesByCategoryData} />
		),
	},
	{
		id: "recurring-expenses",
		title: "Lançamentos Recorrentes",
		subtitle: "Despesas recorrentes do período",
		icon: <RiRefreshLine className="size-4" />,
		component: ({ data }) => (
			<RecurringExpensesWidget data={data.recurringExpensesData} />
		),
	},
	{
		id: "installment-expenses",
		title: "Lançamentos Parcelados",
		subtitle: "Acompanhe as parcelas abertas",
		icon: <RiNumbersLine className="size-4" />,
		component: ({ data }) => (
			<InstallmentExpensesWidget data={data.installmentExpensesData} />
		),
	},
	{
		id: "pagadores",
		title: "Pagadores",
		subtitle: "Despesas por pagador no período",
		icon: <RiGroupLine className="size-4" />,
		component: ({ data }) => (
			<PayersWidget payers={data.pagadoresSnapshot.payers} />
		),
		action: (
			<Link
				href="/payers"
				className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
			>
				Ver todos
				<RiArrowRightLine className="size-4" />
			</Link>
		),
	},
	{
		id: "notes",
		title: "Anotações",
		subtitle: "Últimas anotações ativas",
		icon: <RiTodoLine className="size-4" />,
		component: ({ data }) => <NotesWidget notes={data.notesData} />,
		action: (
			<Link
				href="/notes"
				className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
			>
				Ver todas
				<RiArrowRightLine className="size-4" />
			</Link>
		),
	},
	{
		id: "attachments",
		title: "Anexos",
		subtitle: "Comprovantes do período",
		icon: <RiAttachmentLine className="size-4" />,
		component: ({ data }) => (
			<AttachmentsWidget snapshot={data.attachmentsSnapshot} />
		),
		action: (
			<Link
				href="/attachments"
				className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
			>
				Ver todos
				<RiArrowRightLine className="size-4" />
			</Link>
		),
	},
];

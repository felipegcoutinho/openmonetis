import { BoletosWidget } from "@/components/dashboard/boletos-widget";
import { ExpensesByCategoryWidget } from "@/components/dashboard/expenses-by-category-widget";
import { ExpensesByCategoryWidgetWithChart } from "@/components/dashboard/expenses-by-category-widget-with-chart";
import { IncomeByCategoryWidget } from "@/components/dashboard/income-by-category-widget";
import { IncomeByCategoryWidgetWithChart } from "@/components/dashboard/income-by-category-widget-with-chart";
import { IncomeExpenseBalanceWidget } from "@/components/dashboard/income-expense-balance-widget";
import { InstallmentExpensesWidget } from "@/components/dashboard/installment-expenses-widget";
import { InvoicesWidget } from "@/components/dashboard/invoices-widget";
import { MyAccountsWidget } from "@/components/dashboard/my-accounts-widget";
import { PaymentConditionsWidget } from "@/components/dashboard/payment-conditions-widget";
import { PaymentMethodsWidget } from "@/components/dashboard/payment-methods-widget";
import { PaymentStatusWidget } from "@/components/dashboard/payment-status-widget";
import { PurchasesByCategoryWidget } from "@/components/dashboard/purchases-by-category-widget";
import { RecentTransactionsWidget } from "@/components/dashboard/recent-transactions-widget";
import { RecurringExpensesWidget } from "@/components/dashboard/recurring-expenses-widget";
import { TopEstablishmentsWidget } from "@/components/dashboard/top-establishments-widget";
import { TopExpensesWidget } from "@/components/dashboard/top-expenses-widget";
import {
  RiArrowUpDoubleLine,
  RiBarChartBoxLine,
  RiBarcodeLine,
  RiBillLine,
  RiExchangeLine,
  RiLineChartLine,
  RiMoneyDollarCircleLine,
  RiNumbersLine,
  RiPieChartLine,
  RiRefreshLine,
  RiSecurePaymentLine,
  RiSlideshowLine,
  RiStore2Line,
  RiStore3Line,
  RiWallet3Line,
} from "@remixicon/react";
import Link from "next/link";
import type { ReactNode } from "react";
import type { DashboardData } from "./fetch-dashboard-data";

export type WidgetConfig = {
  id: string;
  title: string;
  subtitle: string;
  icon: ReactNode;
  component: (props: { data: DashboardData; period: string }) => ReactNode;
  action?: ReactNode;
};

export const widgetsConfig: WidgetConfig[] = [
  {
    id: "my-accounts",
    title: "Minhas Contas",
    subtitle: "Saldo consolidado disponível",
    icon: <RiBarChartBoxLine className="size-4" />,
    component: ({ data, period }) => (
      <MyAccountsWidget
        accounts={data.accountsSnapshot.accounts}
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
    component: ({ data }) => (
      <BoletosWidget boletos={data.boletosSnapshot.boletos} />
    ),
  },
  {
    id: "payment-status",
    title: "Status de Pagamento",
    subtitle: "Valores Confirmados E Pendentes",
    icon: <RiWallet3Line className="size-4" />,
    component: ({ data }) => (
      <PaymentStatusWidget data={data.paymentStatusData} />
    ),
  },
  {
    id: "income-expense-balance",
    title: "Receita, Despesa e Balanço",
    subtitle: "Últimos 6 Meses",
    icon: <RiLineChartLine className="size-4" />,
    component: ({ data }) => (
      <IncomeExpenseBalanceWidget data={data.incomeExpenseBalanceData} />
    ),
  },
  {
    id: "recent-transactions",
    title: "Lançamentos Recentes",
    subtitle: "Últimas 5 despesas registradas",
    icon: <RiExchangeLine className="size-4" />,
    component: ({ data }) => (
      <RecentTransactionsWidget data={data.recentTransactionsData} />
    ),
  },
  {
    id: "payment-conditions",
    title: "Condições de Pagamentos",
    subtitle: "Análise das condições",
    icon: <RiSlideshowLine className="size-4" />,
    component: ({ data }) => (
      <PaymentConditionsWidget data={data.paymentConditionsData} />
    ),
  },
  {
    id: "payment-methods",
    title: "Formas de Pagamento",
    subtitle: "Distribuição das despesas",
    icon: <RiMoneyDollarCircleLine className="size-4" />,
    component: ({ data }) => (
      <PaymentMethodsWidget data={data.paymentMethodsData} />
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
    action: (
      <Link
        href="/dashboard/analise-parcelas"
        className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
      >
        <RiSecurePaymentLine className="inline mr-1 size-4" />
        Análise
      </Link>
    ),
  },
  {
    id: "top-expenses",
    title: "Maiores Gastos do Mês",
    subtitle: "Top 10 Despesas",
    icon: <RiArrowUpDoubleLine className="size-4" />,
    component: ({ data }) => (
      <TopExpensesWidget
        allExpenses={data.topExpensesAll}
        cardOnlyExpenses={data.topExpensesCardOnly}
      />
    ),
  },
  {
    id: "top-establishments",
    title: "Top Estabelecimentos",
    subtitle: "Frequência de gastos no período",
    icon: <RiStore2Line className="size-4" />,
    component: ({ data }) => (
      <TopEstablishmentsWidget data={data.topEstablishmentsData} />
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
];

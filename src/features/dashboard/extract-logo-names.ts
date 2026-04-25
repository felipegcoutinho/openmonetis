import type { DashboardData } from "./fetch-dashboard-data";

/**
 * Coleta todos os nomes de estabelecimentos exibidos nos widgets do
 * dashboard que renderizam `<EstablishmentLogo />`. Usado para
 * pré-resolver os mapeamentos Logo.dev no servidor.
 */
export function extractDashboardLogoNames(data: DashboardData): string[] {
	const names: string[] = [];

	for (const bill of data.billsSnapshot.bills) names.push(bill.name);
	for (const expense of data.recurringExpensesData.expenses)
		names.push(expense.name);
	for (const expense of data.installmentExpensesData.expenses)
		names.push(expense.name);
	for (const establishment of data.topEstablishmentsData.establishments)
		names.push(establishment.name);
	for (const expense of data.topExpensesAll.expenses) names.push(expense.name);
	for (const expense of data.topExpensesCardOnly.expenses)
		names.push(expense.name);
	for (const transactions of Object.values(
		data.purchasesByCategoryData.transactionsByCategory,
	)) {
		for (const transaction of transactions) names.push(transaction.name);
	}

	return names;
}

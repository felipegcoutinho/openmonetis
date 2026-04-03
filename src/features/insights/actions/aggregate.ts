import { getDay } from "date-fns";
import { and, eq, inArray, isNull, ne, or, sql } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import {
	budgets,
	cards,
	categories,
	financialAccounts,
	transactions,
} from "@/db/schema";
import { ACCOUNT_AUTO_INVOICE_NOTE_PREFIX } from "@/shared/lib/accounts/constants";
import { excludeTransactionsFromExcludedAccounts } from "@/shared/lib/accounts/query-filters";
import { db } from "@/shared/lib/db";
import { getAdminPayerId } from "@/shared/lib/payers/get-admin-id";
import { safeToNumber } from "@/shared/utils/number";
import { getPreviousPeriod } from "@/shared/utils/period";

const TRANSFERENCIA = "Transferência";

async function aggregateMonthDataInternal(userId: string, period: string) {
	const previousPeriod = getPreviousPeriod(period);
	const twoMonthsAgo = getPreviousPeriod(previousPeriod);
	const threeMonthsAgo = getPreviousPeriod(twoMonthsAgo);
	const adminPayerId = await getAdminPayerId(userId);
	const autoInvoiceExclusion =
		or(
			isNull(transactions.note),
			sql`${transactions.note} NOT LIKE ${`${ACCOUNT_AUTO_INVOICE_NOTE_PREFIX}%`}`,
		) ?? sql`true`;
	const adminPayerCondition = adminPayerId
		? eq(transactions.payerId, adminPayerId)
		: sql`false`;

	const buildAdminTransactionConditions = ({
		period: singlePeriod,
		periods,
		transactionType,
		excludeTransfers = true,
		excludeAutoInvoice = true,
		excludeExcludedAccounts = true,
	}: {
		period?: string;
		periods?: string[];
		transactionType?: string;
		excludeTransfers?: boolean;
		excludeAutoInvoice?: boolean;
		excludeExcludedAccounts?: boolean;
	}) => {
		const conditions = [eq(transactions.userId, userId), adminPayerCondition];

		if (singlePeriod) {
			conditions.push(eq(transactions.period, singlePeriod));
		}
		if (periods && periods.length > 0) {
			conditions.push(inArray(transactions.period, periods));
		}
		if (transactionType) {
			conditions.push(eq(transactions.transactionType, transactionType));
		}
		if (excludeTransfers) {
			conditions.push(ne(transactions.transactionType, TRANSFERENCIA));
		}
		if (excludeAutoInvoice) {
			conditions.push(autoInvoiceExclusion);
		}
		if (excludeExcludedAccounts) {
			conditions.push(excludeTransactionsFromExcludedAccounts());
		}

		return conditions;
	};

	const [
		currentPeriodRows,
		previousPeriodRows,
		twoMonthsAgoRows,
		threeMonthsAgoRows,
		expensesByCategory,
		budgetsData,
		cardsData,
		accountsData,
		avgTicketData,
		dayOfWeekSpending,
		paymentMethodsData,
		last3MonthsTransactions,
	] = await Promise.all([
		db
			.select({
				transactionType: transactions.transactionType,
				totalAmount: sql<number>`coalesce(sum(${transactions.amount}), 0)`,
			})
			.from(transactions)
			.leftJoin(
				financialAccounts,
				eq(transactions.accountId, financialAccounts.id),
			)
			.where(and(...buildAdminTransactionConditions({ period })))
			.groupBy(transactions.transactionType),
		db
			.select({
				transactionType: transactions.transactionType,
				totalAmount: sql<number>`coalesce(sum(${transactions.amount}), 0)`,
			})
			.from(transactions)
			.leftJoin(
				financialAccounts,
				eq(transactions.accountId, financialAccounts.id),
			)
			.where(
				and(...buildAdminTransactionConditions({ period: previousPeriod })),
			)
			.groupBy(transactions.transactionType),
		db
			.select({
				transactionType: transactions.transactionType,
				totalAmount: sql<number>`coalesce(sum(${transactions.amount}), 0)`,
			})
			.from(transactions)
			.leftJoin(
				financialAccounts,
				eq(transactions.accountId, financialAccounts.id),
			)
			.where(and(...buildAdminTransactionConditions({ period: twoMonthsAgo })))
			.groupBy(transactions.transactionType),
		db
			.select({
				transactionType: transactions.transactionType,
				totalAmount: sql<number>`coalesce(sum(${transactions.amount}), 0)`,
			})
			.from(transactions)
			.leftJoin(
				financialAccounts,
				eq(transactions.accountId, financialAccounts.id),
			)
			.where(
				and(...buildAdminTransactionConditions({ period: threeMonthsAgo })),
			)
			.groupBy(transactions.transactionType),
		db
			.select({
				categoryName: categories.name,
				total: sql<number>`coalesce(sum(${transactions.amount}), 0)`,
			})
			.from(transactions)
			.innerJoin(categories, eq(transactions.categoryId, categories.id))
			.leftJoin(
				financialAccounts,
				eq(transactions.accountId, financialAccounts.id),
			)
			.where(
				and(
					...buildAdminTransactionConditions({
						period,
						transactionType: "Despesa",
					}),
					eq(categories.type, "despesa"),
				),
			)
			.groupBy(categories.name)
			.orderBy(sql`sum(${transactions.amount}) ASC`)
			.limit(5),
		db
			.select({
				categoryName: categories.name,
				budgetAmount: budgets.amount,
				spent: sql<number>`coalesce(sum(case when ${excludeTransactionsFromExcludedAccounts()} then ${transactions.amount} else 0 end), 0)`,
			})
			.from(budgets)
			.innerJoin(categories, eq(budgets.categoryId, categories.id))
			.leftJoin(
				transactions,
				and(
					eq(transactions.categoryId, categories.id),
					eq(transactions.period, period),
					eq(transactions.userId, userId),
					eq(transactions.transactionType, "Despesa"),
					adminPayerCondition,
					autoInvoiceExclusion,
				),
			)
			.leftJoin(
				financialAccounts,
				eq(transactions.accountId, financialAccounts.id),
			)
			.where(and(eq(budgets.userId, userId), eq(budgets.period, period)))
			.groupBy(categories.name, budgets.amount),
		db
			.select({
				totalLimit: sql<number>`coalesce(sum(${cards.limit}), 0)`,
				cardCount: sql<number>`count(*)`,
			})
			.from(cards)
			.where(and(eq(cards.userId, userId), eq(cards.status, "ativo"))),
		db
			.select({
				totalBalance: sql<number>`coalesce(sum(${financialAccounts.initialBalance}), 0)`,
				accountCount: sql<number>`count(*)`,
			})
			.from(financialAccounts)
			.where(
				and(
					eq(financialAccounts.userId, userId),
					eq(financialAccounts.status, "ativa"),
					eq(financialAccounts.excludeFromBalance, false),
				),
			),
		db
			.select({
				avgAmount: sql<number>`coalesce(avg(abs(${transactions.amount})), 0)`,
				transactionCount: sql<number>`count(*)`,
			})
			.from(transactions)
			.leftJoin(
				financialAccounts,
				eq(transactions.accountId, financialAccounts.id),
			)
			.where(and(...buildAdminTransactionConditions({ period }))),
		db
			.select({
				purchaseDate: transactions.purchaseDate,
				amount: transactions.amount,
			})
			.from(transactions)
			.leftJoin(
				financialAccounts,
				eq(transactions.accountId, financialAccounts.id),
			)
			.where(
				and(
					...buildAdminTransactionConditions({
						period,
						transactionType: "Despesa",
					}),
				),
			),
		db
			.select({
				paymentMethod: transactions.paymentMethod,
				total: sql<number>`coalesce(sum(abs(${transactions.amount})), 0)`,
			})
			.from(transactions)
			.leftJoin(
				financialAccounts,
				eq(transactions.accountId, financialAccounts.id),
			)
			.where(
				and(
					...buildAdminTransactionConditions({
						period,
						transactionType: "Despesa",
					}),
				),
			)
			.groupBy(transactions.paymentMethod),
		db
			.select({
				name: transactions.name,
				amount: transactions.amount,
				period: transactions.period,
				condition: transactions.condition,
				installmentCount: transactions.installmentCount,
				currentInstallment: transactions.currentInstallment,
				categoryName: categories.name,
			})
			.from(transactions)
			.leftJoin(categories, eq(transactions.categoryId, categories.id))
			.leftJoin(
				financialAccounts,
				eq(transactions.accountId, financialAccounts.id),
			)
			.where(
				and(
					...buildAdminTransactionConditions({
						periods: [period, previousPeriod, twoMonthsAgo],
						transactionType: "Despesa",
					}),
				),
			)
			.orderBy(transactions.name),
	]);

	const sumByType = (
		rows: Array<{ transactionType: string | null; totalAmount: unknown }>,
	) => {
		let income = 0;
		let expense = 0;

		for (const row of rows) {
			const amount = Math.abs(safeToNumber(row.totalAmount));
			if (row.transactionType === "Receita") income += amount;
			else if (row.transactionType === "Despesa") expense += amount;
		}

		return { income, expense };
	};

	const { income: currentIncome, expense: currentExpense } =
		sumByType(currentPeriodRows);
	const { income: previousIncome, expense: previousExpense } =
		sumByType(previousPeriodRows);
	const { income: twoMonthsAgoIncome, expense: twoMonthsAgoExpense } =
		sumByType(twoMonthsAgoRows);
	const { income: threeMonthsAgoIncome, expense: threeMonthsAgoExpense } =
		sumByType(threeMonthsAgoRows);

	const dayTotals = new Map<number, number>();
	for (const row of dayOfWeekSpending) {
		if (!row.purchaseDate) continue;
		const dayOfWeek = getDay(new Date(row.purchaseDate));
		const current = dayTotals.get(dayOfWeek) ?? 0;
		dayTotals.set(dayOfWeek, current + Math.abs(safeToNumber(row.amount)));
	}

	const transactionsByName = new Map<
		string,
		Array<{ period: string; amount: number }>
	>();

	for (const tx of last3MonthsTransactions) {
		const key = tx.name.toLowerCase().trim();
		if (!transactionsByName.has(key)) {
			transactionsByName.set(key, []);
		}
		const transactionsList = transactionsByName.get(key);
		if (transactionsList) {
			transactionsList.push({
				period: tx.period,
				amount: Math.abs(safeToNumber(tx.amount)),
			});
		}
	}

	const recurringExpenses: Array<{
		name: string;
		avgAmount: number;
		frequency: number;
	}> = [];
	let totalRecurring = 0;

	for (const [name, occurrences] of transactionsByName.entries()) {
		if (occurrences.length >= 2) {
			const amounts = occurrences.map((o) => o.amount);
			const avgAmount =
				amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;
			const maxDiff = Math.max(...amounts) - Math.min(...amounts);

			if (maxDiff <= avgAmount * 0.2) {
				recurringExpenses.push({
					name,
					avgAmount,
					frequency: occurrences.length,
				});

				const currentMonthOccurrence = occurrences.find(
					(o) => o.period === period,
				);
				if (currentMonthOccurrence) {
					totalRecurring += currentMonthOccurrence.amount;
				}
			}
		}
	}

	const installmentTransactions = last3MonthsTransactions.filter(
		(tx) =>
			tx.condition === "Parcelado" &&
			tx.installmentCount &&
			tx.installmentCount > 1,
	);

	const installmentData = installmentTransactions
		.filter((tx) => tx.period === period)
		.map((tx) => ({
			name: tx.name,
			currentInstallment: tx.currentInstallment ?? 1,
			totalInstallments: tx.installmentCount ?? 1,
			amount: Math.abs(safeToNumber(tx.amount)),
			category: tx.categoryName ?? "Outros",
		}));

	const totalInstallmentAmount = installmentData.reduce(
		(sum, tx) => sum + tx.amount,
		0,
	);
	const futureCommitment = installmentData.reduce((sum, tx) => {
		const remaining = tx.totalInstallments - tx.currentInstallment;
		return sum + tx.amount * remaining;
	}, 0);

	return {
		month: period,
		totalIncome: currentIncome,
		totalExpense: currentExpense,
		balance: currentIncome - currentExpense,
		threeMonthTrend: {
			periods: [threeMonthsAgo, twoMonthsAgo, previousPeriod, period],
			incomes: [
				threeMonthsAgoIncome,
				twoMonthsAgoIncome,
				previousIncome,
				currentIncome,
			],
			expenses: [
				threeMonthsAgoExpense,
				twoMonthsAgoExpense,
				previousExpense,
				currentExpense,
			],
			avgIncome:
				(threeMonthsAgoIncome +
					twoMonthsAgoIncome +
					previousIncome +
					currentIncome) /
				4,
			avgExpense:
				(threeMonthsAgoExpense +
					twoMonthsAgoExpense +
					previousExpense +
					currentExpense) /
				4,
			trend:
				currentExpense > previousExpense &&
				previousExpense > twoMonthsAgoExpense
					? "crescente"
					: currentExpense < previousExpense &&
							previousExpense < twoMonthsAgoExpense
						? "decrescente"
						: "estável",
		},
		previousMonthIncome: previousIncome,
		previousMonthExpense: previousExpense,
		monthOverMonthIncomeChange:
			Math.abs(previousIncome) > 0.01
				? ((currentIncome - previousIncome) / Math.abs(previousIncome)) * 100
				: 0,
		monthOverMonthExpenseChange:
			Math.abs(previousExpense) > 0.01
				? ((currentExpense - previousExpense) / Math.abs(previousExpense)) * 100
				: 0,
		savingsRate:
			currentIncome > 0.01
				? ((currentIncome - currentExpense) / currentIncome) * 100
				: 0,
		topExpenseCategories: expensesByCategory.map(
			(cat: { categoryName: string; total: unknown }) => ({
				category: cat.categoryName,
				amount: Math.abs(safeToNumber(cat.total)),
				percentageOfTotal:
					currentExpense > 0
						? (Math.abs(safeToNumber(cat.total)) / currentExpense) * 100
						: 0,
			}),
		),
		budgets: budgetsData.map(
			(b: { categoryName: string; budgetAmount: unknown; spent: unknown }) => ({
				category: b.categoryName,
				budgetAmount: safeToNumber(b.budgetAmount),
				spent: Math.abs(safeToNumber(b.spent)),
				usagePercentage:
					safeToNumber(b.budgetAmount) > 0
						? (Math.abs(safeToNumber(b.spent)) / safeToNumber(b.budgetAmount)) *
							100
						: 0,
			}),
		),
		creditCards: {
			totalLimit: safeToNumber(cardsData[0]?.totalLimit ?? 0),
			cardCount: safeToNumber(cardsData[0]?.cardCount ?? 0),
		},
		accounts: {
			totalBalance: safeToNumber(accountsData[0]?.totalBalance ?? 0),
			accountCount: safeToNumber(accountsData[0]?.accountCount ?? 0),
		},
		avgTicket: safeToNumber(avgTicketData[0]?.avgAmount ?? 0),
		transactionCount: safeToNumber(avgTicketData[0]?.transactionCount ?? 0),
		dayOfWeekSpending: Array.from(dayTotals.entries()).map(([day, total]) => ({
			dayOfWeek:
				["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"][day] ?? "N/A",
			total,
		})),
		paymentMethodsBreakdown: paymentMethodsData.map(
			(pm: { paymentMethod: string | null; total: unknown }) => ({
				method: pm.paymentMethod,
				total: safeToNumber(pm.total),
				percentage:
					currentExpense > 0
						? (safeToNumber(pm.total) / currentExpense) * 100
						: 0,
			}),
		),
		recurringExpenses: {
			count: recurringExpenses.length,
			total: totalRecurring,
			percentageOfTotal:
				currentExpense > 0 ? (totalRecurring / currentExpense) * 100 : 0,
			topRecurring: recurringExpenses
				.sort((a, b) => b.avgAmount - a.avgAmount)
				.slice(0, 5)
				.map((r) => ({
					name: r.name,
					avgAmount: r.avgAmount,
					frequency: r.frequency,
				})),
			predictability:
				currentExpense > 0 ? (totalRecurring / currentExpense) * 100 : 0,
		},
		installments: {
			currentMonthInstallments: installmentData.length,
			totalInstallmentAmount,
			percentageOfExpenses:
				currentExpense > 0
					? (totalInstallmentAmount / currentExpense) * 100
					: 0,
			futureCommitment,
			topInstallments: installmentData
				.sort((a, b) => b.amount - a.amount)
				.slice(0, 5)
				.map((i) => ({
					name: i.name,
					current: i.currentInstallment,
					total: i.totalInstallments,
					amount: i.amount,
					category: i.category,
					remaining: i.totalInstallments - i.currentInstallment,
				})),
		},
	};
}

export async function aggregateMonthData(userId: string, period: string) {
	"use cache";
	cacheTag(`dashboard-${userId}`);
	cacheLife({ revalidate: 3 });
	return aggregateMonthDataInternal(userId, period);
}

import { and, desc, eq, isNull, ne, or, sql } from "drizzle-orm";
import { categories, financialAccounts, transactions } from "@/db/schema";
import { mapTransactionsData } from "@/features/transactions/page-helpers";
import {
	ACCOUNT_AUTO_INVOICE_NOTE_PREFIX,
	INITIAL_BALANCE_NOTE,
} from "@/shared/lib/accounts/constants";
import type { CategoryType } from "@/shared/lib/categories/constants";
import { db } from "@/shared/lib/db";
import { getAdminPayerId } from "@/shared/lib/payers/get-admin-id";
import { calculatePercentageChange } from "@/shared/utils/math";
import { safeToNumber as toNumber } from "@/shared/utils/number";
import { getPreviousPeriod } from "@/shared/utils/period";

type MappedLancamentos = ReturnType<typeof mapTransactionsData>;

export type CategoryDetailData = {
	category: {
		id: string;
		name: string;
		icon: string | null;
		type: CategoryType;
	};
	period: string;
	previousPeriod: string;
	currentTotal: number;
	previousTotal: number;
	percentageChange: number | null;
	transactions: MappedLancamentos;
};

export async function fetchCategoryDetails(
	userId: string,
	categoryId: string,
	period: string,
): Promise<CategoryDetailData | null> {
	const category = await db.query.categories.findFirst({
		where: and(eq(categories.userId, userId), eq(categories.id, categoryId)),
	});

	if (!category) {
		return null;
	}

	const previousPeriod = getPreviousPeriod(period);
	const transactionType = category.type === "receita" ? "Receita" : "Despesa";
	const adminPayerId = await getAdminPayerId(userId);

	const sanitizedNote = or(
		isNull(transactions.note),
		sql`${transactions.note} NOT LIKE ${`${ACCOUNT_AUTO_INVOICE_NOTE_PREFIX}%`}`,
	);

	const currentRows = adminPayerId
		? await db.query.transactions.findMany({
				where: and(
					eq(transactions.userId, userId),
					eq(transactions.categoryId, categoryId),
					eq(transactions.transactionType, transactionType),
					eq(transactions.period, period),
					eq(transactions.payerId, adminPayerId),
					sanitizedNote,
				),
				with: {
					payer: true,
					financialAccount: true,
					card: true,
					category: true,
				},
				orderBy: [
					desc(transactions.purchaseDate),
					desc(transactions.createdAt),
				],
			})
		: [];

	const filteredRows = currentRows.filter((row) => {
		if (
			row.note === INITIAL_BALANCE_NOTE &&
			row.financialAccount?.excludeInitialBalanceFromIncome
		) {
			return false;
		}

		return true;
	});

	const transactionList = mapTransactionsData(filteredRows);

	const currentTotal = transactionList.reduce(
		(total, transaction) => total + Math.abs(toNumber(transaction.amount)),
		0,
	);

	const [previousTotalRow] = adminPayerId
		? await db
				.select({
					total: sql<number>`coalesce(sum(${transactions.amount}), 0)`,
				})
				.from(transactions)
				.leftJoin(
					financialAccounts,
					eq(transactions.accountId, financialAccounts.id),
				)
				.where(
					and(
						eq(transactions.userId, userId),
						eq(transactions.categoryId, categoryId),
						eq(transactions.transactionType, transactionType),
						eq(transactions.payerId, adminPayerId),
						sanitizedNote,
						eq(transactions.period, previousPeriod),
						or(
							ne(transactions.note, INITIAL_BALANCE_NOTE),
							isNull(financialAccounts.excludeInitialBalanceFromIncome),
							eq(financialAccounts.excludeInitialBalanceFromIncome, false),
						),
					),
				)
		: [{ total: 0 }];

	const previousTotal = Math.abs(toNumber(previousTotalRow?.total ?? 0));
	const percentageChange = calculatePercentageChange(
		currentTotal,
		previousTotal,
	);

	return {
		category: {
			id: category.id,
			name: category.name,
			icon: category.icon,
			type: category.type as CategoryType,
		},
		period,
		previousPeriod,
		currentTotal,
		previousTotal,
		percentageChange,
		transactions: transactionList,
	};
}

import { and, eq, inArray, isNull, ne, or, sql } from "drizzle-orm";
import { contas, lancamentos } from "@/db/schema";
import {
	ACCOUNT_AUTO_INVOICE_NOTE_PREFIX,
	INITIAL_BALANCE_NOTE,
} from "@/lib/accounts/constants";
import { toNumber } from "@/lib/dashboard/common";
import { db } from "@/lib/db";
import { getAdminPagadorId } from "@/lib/pagadores/get-admin-id";

export type MonthData = {
	month: string;
	monthLabel: string;
	income: number;
	expense: number;
	balance: number;
};

export type IncomeExpenseBalanceData = {
	months: MonthData[];
};

const MONTH_LABELS: Record<string, string> = {
	"01": "jan",
	"02": "fev",
	"03": "mar",
	"04": "abr",
	"05": "mai",
	"06": "jun",
	"07": "jul",
	"08": "ago",
	"09": "set",
	"10": "out",
	"11": "nov",
	"12": "dez",
};

const generateLast6Months = (currentPeriod: string): string[] => {
	const [yearStr, monthStr] = currentPeriod.split("-");
	let year = Number.parseInt(yearStr ?? "", 10);
	let month = Number.parseInt(monthStr ?? "", 10);

	if (Number.isNaN(year) || Number.isNaN(month)) {
		const now = new Date();
		year = now.getFullYear();
		month = now.getMonth() + 1;
	}

	const periods: string[] = [];

	for (let i = 5; i >= 0; i--) {
		let targetMonth = month - i;
		let targetYear = year;

		while (targetMonth <= 0) {
			targetMonth += 12;
			targetYear -= 1;
		}

		periods.push(`${targetYear}-${String(targetMonth).padStart(2, "0")}`);
	}

	return periods;
};

export async function fetchIncomeExpenseBalance(
	userId: string,
	currentPeriod: string,
): Promise<IncomeExpenseBalanceData> {
	const adminPagadorId = await getAdminPagadorId(userId);
	if (!adminPagadorId) {
		return { months: [] };
	}

	const periods = generateLast6Months(currentPeriod);

	// Single query: GROUP BY period + transactionType instead of 12 separate queries
	const rows = await db
		.select({
			period: lancamentos.period,
			transactionType: lancamentos.transactionType,
			total: sql<number>`coalesce(sum(${lancamentos.amount}), 0)`,
		})
		.from(lancamentos)
		.leftJoin(contas, eq(lancamentos.contaId, contas.id))
		.where(
			and(
				eq(lancamentos.userId, userId),
				eq(lancamentos.pagadorId, adminPagadorId),
				inArray(lancamentos.period, periods),
				inArray(lancamentos.transactionType, ["Receita", "Despesa"]),
				sql`(${lancamentos.note} IS NULL OR ${lancamentos.note} NOT LIKE ${`${ACCOUNT_AUTO_INVOICE_NOTE_PREFIX}%`})`,
				// Excluir saldos iniciais se a conta tiver o flag ativo
				or(
					ne(lancamentos.note, INITIAL_BALANCE_NOTE),
					isNull(contas.excludeInitialBalanceFromIncome),
					eq(contas.excludeInitialBalanceFromIncome, false),
				),
			),
		)
		.groupBy(lancamentos.period, lancamentos.transactionType);

	// Build lookup from query results
	const dataMap = new Map<string, { income: number; expense: number }>();
	for (const row of rows) {
		if (!row.period) continue;
		const entry = dataMap.get(row.period) ?? { income: 0, expense: 0 };
		const total = Math.abs(toNumber(row.total));
		if (row.transactionType === "Receita") {
			entry.income = total;
		} else if (row.transactionType === "Despesa") {
			entry.expense = total;
		}
		dataMap.set(row.period, entry);
	}

	// Build result array preserving period order
	const months = periods.map((period) => {
		const entry = dataMap.get(period) ?? { income: 0, expense: 0 };
		const [, monthPart] = period.split("-");
		const monthLabel = MONTH_LABELS[monthPart ?? "01"] ?? monthPart;

		return {
			month: period,
			monthLabel: monthLabel ?? "",
			income: entry.income,
			expense: entry.expense,
			balance: entry.income - entry.expense,
		};
	});

	return { months };
}

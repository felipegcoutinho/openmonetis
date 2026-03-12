import { and, desc, eq, inArray, isNull, or, sql } from "drizzle-orm";
import { lancamentos, pagadores } from "@/db/schema";
import { ACCOUNT_AUTO_INVOICE_NOTE_PREFIX } from "@/shared/lib/accounts/constants";
import { db } from "@/shared/lib/db";
import { PAGADOR_ROLE_ADMIN } from "@/shared/lib/payers/constants";
import { calculatePercentageChange } from "@/shared/utils/math";
import { safeToNumber as toNumber } from "@/shared/utils/number";
import { getPreviousPeriod } from "@/shared/utils/period";

export type DashboardPagador = {
	id: string;
	name: string;
	email: string | null;
	avatarUrl: string | null;
	totalExpenses: number;
	previousExpenses: number;
	percentageChange: number | null;
	isAdmin: boolean;
};

export type DashboardPagadoresSnapshot = {
	pagadores: DashboardPagador[];
	totalExpenses: number;
};

export async function fetchDashboardPagadores(
	userId: string,
	period: string,
): Promise<DashboardPagadoresSnapshot> {
	const previousPeriod = getPreviousPeriod(period);

	const rows = await db
		.select({
			id: pagadores.id,
			name: pagadores.name,
			email: pagadores.email,
			avatarUrl: pagadores.avatarUrl,
			role: pagadores.role,
			period: lancamentos.period,
			totalExpenses: sql<number>`COALESCE(SUM(ABS(${lancamentos.amount})), 0)`,
		})
		.from(lancamentos)
		.innerJoin(pagadores, eq(lancamentos.pagadorId, pagadores.id))
		.where(
			and(
				eq(lancamentos.userId, userId),
				inArray(lancamentos.period, [period, previousPeriod]),
				eq(lancamentos.transactionType, "Despesa"),
				or(
					isNull(lancamentos.note),
					sql`${lancamentos.note} NOT LIKE ${`${ACCOUNT_AUTO_INVOICE_NOTE_PREFIX}%`}`,
				),
			),
		)
		.groupBy(
			pagadores.id,
			pagadores.name,
			pagadores.email,
			pagadores.avatarUrl,
			pagadores.role,
			lancamentos.period,
		)
		.orderBy(desc(sql`SUM(ABS(${lancamentos.amount}))`));

	const groupedPagadores = new Map<
		string,
		{
			id: string;
			name: string;
			email: string | null;
			avatarUrl: string | null;
			isAdmin: boolean;
			currentExpenses: number;
			previousExpenses: number;
		}
	>();

	for (const row of rows) {
		const entry = groupedPagadores.get(row.id) ?? {
			id: row.id,
			name: row.name,
			email: row.email,
			avatarUrl: row.avatarUrl,
			isAdmin: row.role === PAGADOR_ROLE_ADMIN,
			currentExpenses: 0,
			previousExpenses: 0,
		};

		const amount = toNumber(row.totalExpenses);
		if (row.period === period) {
			entry.currentExpenses = amount;
		} else {
			entry.previousExpenses = amount;
		}

		groupedPagadores.set(row.id, entry);
	}

	const pagadoresList = Array.from(groupedPagadores.values())
		.filter((p) => p.currentExpenses > 0)
		.map((pagador) => ({
			id: pagador.id,
			name: pagador.name,
			email: pagador.email,
			avatarUrl: pagador.avatarUrl,
			totalExpenses: pagador.currentExpenses,
			previousExpenses: pagador.previousExpenses,
			percentageChange: calculatePercentageChange(
				pagador.currentExpenses,
				pagador.previousExpenses,
			),
			isAdmin: pagador.isAdmin,
		}))
		.sort((a, b) => b.totalExpenses - a.totalExpenses);

	const totalExpenses = pagadoresList.reduce(
		(sum, p) => sum + p.totalExpenses,
		0,
	);

	return {
		pagadores: pagadoresList,
		totalExpenses,
	};
}

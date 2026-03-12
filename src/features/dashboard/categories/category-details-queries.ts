import { and, desc, eq, isNull, ne, or, sql } from "drizzle-orm";
import { categorias, contas, lancamentos, pagadores } from "@/db/schema";
import { mapLancamentosData } from "@/features/transactions/page-helpers";
import {
	ACCOUNT_AUTO_INVOICE_NOTE_PREFIX,
	INITIAL_BALANCE_NOTE,
} from "@/shared/lib/accounts/constants";
import type { CategoryType } from "@/shared/lib/categories/constants";
import { db } from "@/shared/lib/db";
import { PAGADOR_ROLE_ADMIN } from "@/shared/lib/payers/constants";
import { calculatePercentageChange } from "@/shared/utils/math";
import { safeToNumber as toNumber } from "@/shared/utils/number";
import { getPreviousPeriod } from "@/shared/utils/period";

type MappedLancamentos = ReturnType<typeof mapLancamentosData>;

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
	const category = await db.query.categorias.findFirst({
		where: and(eq(categorias.userId, userId), eq(categorias.id, categoryId)),
	});

	if (!category) {
		return null;
	}

	const previousPeriod = getPreviousPeriod(period);
	const transactionType = category.type === "receita" ? "Receita" : "Despesa";

	const sanitizedNote = or(
		isNull(lancamentos.note),
		sql`${lancamentos.note} NOT LIKE ${`${ACCOUNT_AUTO_INVOICE_NOTE_PREFIX}%`}`,
	);

	const currentRows = await db.query.lancamentos.findMany({
		where: and(
			eq(lancamentos.userId, userId),
			eq(lancamentos.categoriaId, categoryId),
			eq(lancamentos.transactionType, transactionType),
			eq(lancamentos.period, period),
			sanitizedNote,
		),
		with: {
			pagador: true,
			conta: true,
			cartao: true,
			categoria: true,
		},
		orderBy: [desc(lancamentos.purchaseDate), desc(lancamentos.createdAt)],
	});

	const filteredRows = currentRows.filter((row) => {
		// Filtrar apenas pagadores admin
		if (row.pagador?.role !== PAGADOR_ROLE_ADMIN) return false;

		// Excluir saldos iniciais se a conta tiver o flag ativo
		if (
			row.note === INITIAL_BALANCE_NOTE &&
			row.conta?.excludeInitialBalanceFromIncome
		) {
			return false;
		}

		return true;
	});

	const transactions = mapLancamentosData(filteredRows);

	const currentTotal = transactions.reduce(
		(total, transaction) => total + Math.abs(toNumber(transaction.amount)),
		0,
	);

	const [previousTotalRow] = await db
		.select({
			total: sql<number>`coalesce(sum(${lancamentos.amount}), 0)`,
		})
		.from(lancamentos)
		.innerJoin(pagadores, eq(lancamentos.pagadorId, pagadores.id))
		.leftJoin(contas, eq(lancamentos.contaId, contas.id))
		.where(
			and(
				eq(lancamentos.userId, userId),
				eq(lancamentos.categoriaId, categoryId),
				eq(lancamentos.transactionType, transactionType),
				eq(pagadores.role, PAGADOR_ROLE_ADMIN),
				sanitizedNote,
				eq(lancamentos.period, previousPeriod),
				// Excluir saldos iniciais se a conta tiver o flag ativo
				or(
					ne(lancamentos.note, INITIAL_BALANCE_NOTE),
					isNull(contas.excludeInitialBalanceFromIncome),
					eq(contas.excludeInitialBalanceFromIncome, false),
				),
			),
		);

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
		transactions,
	};
}

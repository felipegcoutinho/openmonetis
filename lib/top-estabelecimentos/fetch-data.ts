import {
	and,
	count,
	desc,
	eq,
	gte,
	ilike,
	isNull,
	lte,
	ne,
	not,
	or,
	sql,
	sum,
} from "drizzle-orm";
import { categorias, contas, lancamentos, pagadores } from "@/db/schema";
import {
	ACCOUNT_AUTO_INVOICE_NOTE_PREFIX,
	INITIAL_BALANCE_NOTE,
} from "@/lib/accounts/constants";
import { db } from "@/lib/db";
import { PAGADOR_ROLE_ADMIN } from "@/lib/pagadores/constants";
import { safeToNumber } from "@/lib/utils/number";
import { getPreviousPeriod } from "@/lib/utils/period";

const DESPESA = "Despesa";
const TRANSFERENCIA = "Transferência";

export type EstablishmentData = {
	name: string;
	count: number;
	totalAmount: number;
	avgAmount: number;
	categories: { name: string; count: number }[];
};

export type TopCategoryData = {
	id: string;
	name: string;
	icon: string | null;
	totalAmount: number;
	transactionCount: number;
};

export type TopEstabelecimentosData = {
	establishments: EstablishmentData[];
	topCategories: TopCategoryData[];
	summary: {
		totalEstablishments: number;
		totalTransactions: number;
		totalSpent: number;
		avgPerTransaction: number;
		mostFrequent: string | null;
		highestSpending: string | null;
	};
	periodLabel: string;
};

export type PeriodFilter = "3" | "6" | "12";

function buildPeriodRange(currentPeriod: string, months: number): string[] {
	const periods: string[] = [];
	let p = currentPeriod;
	for (let i = 0; i < months; i++) {
		periods.unshift(p);
		p = getPreviousPeriod(p);
	}
	return periods;
}

export async function fetchTopEstabelecimentosData(
	userId: string,
	currentPeriod: string,
	periodFilter: PeriodFilter = "6",
): Promise<TopEstabelecimentosData> {
	const months = parseInt(periodFilter, 10);
	const periods = buildPeriodRange(currentPeriod, months);
	const startPeriod = periods[0];

	// Fetch establishments with transaction count and total amount
	const establishmentsData = await db
		.select({
			name: lancamentos.name,
			count: count().as("count"),
			totalAmount: sum(lancamentos.amount).as("total"),
		})
		.from(lancamentos)
		.innerJoin(pagadores, eq(lancamentos.pagadorId, pagadores.id))
		.leftJoin(contas, eq(lancamentos.contaId, contas.id))
		.where(
			and(
				eq(lancamentos.userId, userId),
				gte(lancamentos.period, startPeriod),
				lte(lancamentos.period, currentPeriod),
				eq(pagadores.role, PAGADOR_ROLE_ADMIN),
				eq(lancamentos.transactionType, DESPESA),
				ne(lancamentos.transactionType, TRANSFERENCIA),
				or(
					isNull(lancamentos.note),
					not(ilike(lancamentos.note, `${ACCOUNT_AUTO_INVOICE_NOTE_PREFIX}%`)),
				),
				or(
					ne(lancamentos.note, INITIAL_BALANCE_NOTE),
					isNull(contas.excludeInitialBalanceFromIncome),
					eq(contas.excludeInitialBalanceFromIncome, false),
				),
			),
		)
		.groupBy(lancamentos.name)
		.orderBy(desc(sql`count`))
		.limit(50);

	// Fetch categories for each establishment
	const _establishmentNames = establishmentsData.map(
		(e: (typeof establishmentsData)[0]) => e.name,
	);

	const categoriesByEstablishment = await db
		.select({
			establishmentName: lancamentos.name,
			categoriaId: lancamentos.categoriaId,
			count: count().as("count"),
		})
		.from(lancamentos)
		.innerJoin(pagadores, eq(lancamentos.pagadorId, pagadores.id))
		.where(
			and(
				eq(lancamentos.userId, userId),
				gte(lancamentos.period, startPeriod),
				lte(lancamentos.period, currentPeriod),
				eq(pagadores.role, PAGADOR_ROLE_ADMIN),
				eq(lancamentos.transactionType, DESPESA),
			),
		)
		.groupBy(lancamentos.name, lancamentos.categoriaId);

	// Fetch all category names
	const allCategories = await db
		.select({
			id: categorias.id,
			name: categorias.name,
			icon: categorias.icon,
		})
		.from(categorias)
		.where(eq(categorias.userId, userId));

	type CategoryInfo = { id: string; name: string; icon: string | null };
	const categoryMap = new Map<string, CategoryInfo>(
		allCategories.map((c): [string, CategoryInfo] => [c.id, c as CategoryInfo]),
	);

	// Build establishment data with categories
	type EstablishmentRow = (typeof establishmentsData)[0];
	type CategoryByEstRow = (typeof categoriesByEstablishment)[0];

	const establishments: EstablishmentData[] = establishmentsData.map(
		(est: EstablishmentRow) => {
			const cnt = Number(est.count) || 0;
			const total = Math.abs(safeToNumber(est.totalAmount));

			const estCategories = categoriesByEstablishment
				.filter(
					(c: CategoryByEstRow) =>
						c.establishmentName === est.name && c.categoriaId,
				)
				.map((c: CategoryByEstRow) => ({
					name:
						categoryMap.get(c.categoriaId as string)?.name || "Sem categoria",
					count: Number(c.count) || 0,
				}))
				.sort(
					(
						a: { name: string; count: number },
						b: { name: string; count: number },
					) => b.count - a.count,
				)
				.slice(0, 3);

			return {
				name: est.name,
				count: cnt,
				totalAmount: total,
				avgAmount: cnt > 0 ? total / cnt : 0,
				categories: estCategories,
			};
		},
	);

	// Fetch top categories by spending
	const topCategoriesData = await db
		.select({
			categoriaId: lancamentos.categoriaId,
			totalAmount: sum(lancamentos.amount).as("total"),
			count: count().as("count"),
		})
		.from(lancamentos)
		.innerJoin(pagadores, eq(lancamentos.pagadorId, pagadores.id))
		.leftJoin(contas, eq(lancamentos.contaId, contas.id))
		.where(
			and(
				eq(lancamentos.userId, userId),
				gte(lancamentos.period, startPeriod),
				lte(lancamentos.period, currentPeriod),
				eq(pagadores.role, PAGADOR_ROLE_ADMIN),
				eq(lancamentos.transactionType, DESPESA),
				or(
					isNull(lancamentos.note),
					not(ilike(lancamentos.note, `${ACCOUNT_AUTO_INVOICE_NOTE_PREFIX}%`)),
				),
				or(
					ne(lancamentos.note, INITIAL_BALANCE_NOTE),
					isNull(contas.excludeInitialBalanceFromIncome),
					eq(contas.excludeInitialBalanceFromIncome, false),
				),
			),
		)
		.groupBy(lancamentos.categoriaId)
		.orderBy(sql`total ASC`)
		.limit(10);

	type TopCategoryRow = (typeof topCategoriesData)[0];

	const topCategories: TopCategoryData[] = topCategoriesData
		.filter((c: TopCategoryRow) => c.categoriaId)
		.map((cat: TopCategoryRow) => {
			const catInfo = categoryMap.get(cat.categoriaId as string);
			return {
				id: cat.categoriaId as string,
				name: catInfo?.name || "Sem categoria",
				icon: catInfo?.icon || null,
				totalAmount: Math.abs(safeToNumber(cat.totalAmount)),
				transactionCount: Number(cat.count) || 0,
			};
		});

	// Calculate summary
	const totalTransactions = establishments.reduce((acc, e) => acc + e.count, 0);
	const totalSpent = establishments.reduce((acc, e) => acc + e.totalAmount, 0);

	const mostFrequent =
		establishments.length > 0 ? establishments[0].name : null;

	const sortedBySpending = [...establishments].sort(
		(a, b) => b.totalAmount - a.totalAmount,
	);
	const highestSpending =
		sortedBySpending.length > 0 ? sortedBySpending[0].name : null;

	const periodLabel =
		months === 3
			? "Últimos 3 meses"
			: months === 6
				? "Últimos 6 meses"
				: "Últimos 12 meses";

	return {
		establishments,
		topCategories,
		summary: {
			totalEstablishments: establishments.length,
			totalTransactions,
			totalSpent,
			avgPerTransaction:
				totalTransactions > 0 ? totalSpent / totalTransactions : 0,
			mostFrequent,
			highestSpending,
		},
		periodLabel,
	};
}

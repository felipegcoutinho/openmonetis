import { and, desc, eq, lt, type SQL, sql } from "drizzle-orm";
import { contas, lancamentos, pagadores } from "@/db/schema";
import { INITIAL_BALANCE_NOTE } from "@/lib/contas/constants";
import { db } from "@/lib/db";
import { PAGADOR_ROLE_ADMIN } from "@/lib/pagadores/constants";

export type AccountSummaryData = {
	openingBalance: number;
	currentBalance: number;
	totalIncomes: number;
	totalExpenses: number;
};

export async function fetchAccountData(userId: string, contaId: string) {
	const account = await db.query.contas.findFirst({
		columns: {
			id: true,
			name: true,
			accountType: true,
			status: true,
			initialBalance: true,
			logo: true,
			note: true,
		},
		where: and(eq(contas.id, contaId), eq(contas.userId, userId)),
	});

	return account;
}

export async function fetchAccountSummary(
	userId: string,
	contaId: string,
	selectedPeriod: string,
): Promise<AccountSummaryData> {
	const [periodSummary] = await db
		.select({
			netAmount: sql<number>`
        coalesce(
          sum(
            case
              when ${lancamentos.note} = ${INITIAL_BALANCE_NOTE} then 0
              else ${lancamentos.amount}
            end
          ),
          0
        )
      `,
			incomes: sql<number>`
        coalesce(
          sum(
            case
              when ${lancamentos.note} = ${INITIAL_BALANCE_NOTE} then 0
              when ${lancamentos.transactionType} = 'Receita' then ${lancamentos.amount}
              else 0
            end
          ),
          0
        )
      `,
			expenses: sql<number>`
        coalesce(
          sum(
            case
              when ${lancamentos.note} = ${INITIAL_BALANCE_NOTE} then 0
              when ${lancamentos.transactionType} = 'Despesa' then ${lancamentos.amount}
              else 0
            end
          ),
          0
        )
      `,
		})
		.from(lancamentos)
		.innerJoin(pagadores, eq(lancamentos.pagadorId, pagadores.id))
		.where(
			and(
				eq(lancamentos.userId, userId),
				eq(lancamentos.contaId, contaId),
				eq(lancamentos.period, selectedPeriod),
				eq(lancamentos.isSettled, true),
				eq(pagadores.role, PAGADOR_ROLE_ADMIN),
			),
		);

	const [previousRow] = await db
		.select({
			previousMovements: sql<number>`
        coalesce(
          sum(
            case
              when ${lancamentos.note} = ${INITIAL_BALANCE_NOTE} then 0
              else ${lancamentos.amount}
            end
          ),
          0
        )
      `,
		})
		.from(lancamentos)
		.innerJoin(pagadores, eq(lancamentos.pagadorId, pagadores.id))
		.where(
			and(
				eq(lancamentos.userId, userId),
				eq(lancamentos.contaId, contaId),
				lt(lancamentos.period, selectedPeriod),
				eq(lancamentos.isSettled, true),
				eq(pagadores.role, PAGADOR_ROLE_ADMIN),
			),
		);

	const account = await fetchAccountData(userId, contaId);
	if (!account) {
		throw new Error("Account not found");
	}

	const initialBalance = Number(account.initialBalance ?? 0);
	const previousMovements = Number(previousRow?.previousMovements ?? 0);
	const openingBalance = initialBalance + previousMovements;
	const netAmount = Number(periodSummary?.netAmount ?? 0);
	const totalIncomes = Number(periodSummary?.incomes ?? 0);
	const totalExpenses = Math.abs(Number(periodSummary?.expenses ?? 0));
	const currentBalance = openingBalance + netAmount;

	return {
		openingBalance,
		currentBalance,
		totalIncomes,
		totalExpenses,
	};
}

export async function fetchAccountLancamentos(
	filters: SQL[],
	settledOnly = true,
) {
	const allFilters = settledOnly
		? [...filters, eq(lancamentos.isSettled, true)]
		: filters;

	return db.query.lancamentos.findMany({
		where: and(...allFilters),
		with: {
			pagador: true,
			conta: true,
			cartao: true,
			categoria: true,
		},
		orderBy: desc(lancamentos.purchaseDate),
	});
}

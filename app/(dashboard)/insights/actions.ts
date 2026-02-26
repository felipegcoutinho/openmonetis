"use server";

import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateObject } from "ai";
import { getDay } from "date-fns";
import { and, eq, isNull, ne, or, sql } from "drizzle-orm";
import {
	cartoes,
	categorias,
	contas,
	insightsSalvos,
	lancamentos,
	orcamentos,
	pagadores,
} from "@/db/schema";
import { ACCOUNT_AUTO_INVOICE_NOTE_PREFIX } from "@/lib/accounts/constants";
import { getUser } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { PAGADOR_ROLE_ADMIN } from "@/lib/pagadores/constants";
import {
	type InsightsResponse,
	InsightsResponseSchema,
} from "@/lib/schemas/insights";
import { getPreviousPeriod } from "@/lib/utils/period";
import { AVAILABLE_MODELS, INSIGHTS_SYSTEM_PROMPT } from "./data";

const TRANSFERENCIA = "Transferência";

type ActionResult<T> =
	| { success: true; data: T }
	| { success: false; error: string };

/**
 * Função auxiliar para converter valores numéricos
 */
const toNumber = (value: unknown): number => {
	if (typeof value === "number") return value;
	if (typeof value === "string") {
		const parsed = Number(value);
		return Number.isNaN(parsed) ? 0 : parsed;
	}
	return 0;
};

/**
 * Agrega dados financeiros do mês para análise
 */
async function aggregateMonthData(userId: string, period: string) {
	const previousPeriod = getPreviousPeriod(period);
	const twoMonthsAgo = getPreviousPeriod(previousPeriod);
	const threeMonthsAgo = getPreviousPeriod(twoMonthsAgo);

	// Buscar métricas de receitas e despesas dos últimos 3 meses
	const [
		currentPeriodRows,
		previousPeriodRows,
		twoMonthsAgoRows,
		threeMonthsAgoRows,
	] = await Promise.all([
		db
			.select({
				transactionType: lancamentos.transactionType,
				totalAmount: sql<number>`coalesce(sum(${lancamentos.amount}), 0)`,
			})
			.from(lancamentos)
			.innerJoin(pagadores, eq(lancamentos.pagadorId, pagadores.id))
			.where(
				and(
					eq(lancamentos.userId, userId),
					eq(lancamentos.period, period),
					eq(pagadores.role, PAGADOR_ROLE_ADMIN),
					ne(lancamentos.transactionType, TRANSFERENCIA),
					or(
						isNull(lancamentos.note),
						sql`${
							lancamentos.note
						} NOT LIKE ${`${ACCOUNT_AUTO_INVOICE_NOTE_PREFIX}%`}`,
					),
				),
			)
			.groupBy(lancamentos.transactionType),
		db
			.select({
				transactionType: lancamentos.transactionType,
				totalAmount: sql<number>`coalesce(sum(${lancamentos.amount}), 0)`,
			})
			.from(lancamentos)
			.innerJoin(pagadores, eq(lancamentos.pagadorId, pagadores.id))
			.where(
				and(
					eq(lancamentos.userId, userId),
					eq(lancamentos.period, previousPeriod),
					eq(pagadores.role, PAGADOR_ROLE_ADMIN),
					ne(lancamentos.transactionType, TRANSFERENCIA),
					or(
						isNull(lancamentos.note),
						sql`${
							lancamentos.note
						} NOT LIKE ${`${ACCOUNT_AUTO_INVOICE_NOTE_PREFIX}%`}`,
					),
				),
			)
			.groupBy(lancamentos.transactionType),
		db
			.select({
				transactionType: lancamentos.transactionType,
				totalAmount: sql<number>`coalesce(sum(${lancamentos.amount}), 0)`,
			})
			.from(lancamentos)
			.innerJoin(pagadores, eq(lancamentos.pagadorId, pagadores.id))
			.where(
				and(
					eq(lancamentos.userId, userId),
					eq(lancamentos.period, twoMonthsAgo),
					eq(pagadores.role, PAGADOR_ROLE_ADMIN),
					ne(lancamentos.transactionType, TRANSFERENCIA),
					or(
						isNull(lancamentos.note),
						sql`${
							lancamentos.note
						} NOT LIKE ${`${ACCOUNT_AUTO_INVOICE_NOTE_PREFIX}%`}`,
					),
				),
			)
			.groupBy(lancamentos.transactionType),
		db
			.select({
				transactionType: lancamentos.transactionType,
				totalAmount: sql<number>`coalesce(sum(${lancamentos.amount}), 0)`,
			})
			.from(lancamentos)
			.innerJoin(pagadores, eq(lancamentos.pagadorId, pagadores.id))
			.where(
				and(
					eq(lancamentos.userId, userId),
					eq(lancamentos.period, threeMonthsAgo),
					eq(pagadores.role, PAGADOR_ROLE_ADMIN),
					ne(lancamentos.transactionType, TRANSFERENCIA),
					or(
						isNull(lancamentos.note),
						sql`${
							lancamentos.note
						} NOT LIKE ${`${ACCOUNT_AUTO_INVOICE_NOTE_PREFIX}%`}`,
					),
				),
			)
			.groupBy(lancamentos.transactionType),
	]);

	// Calcular totais dos últimos 3 meses
	let currentIncome = 0;
	let currentExpense = 0;
	let previousIncome = 0;
	let previousExpense = 0;
	let twoMonthsAgoIncome = 0;
	let twoMonthsAgoExpense = 0;
	let threeMonthsAgoIncome = 0;
	let threeMonthsAgoExpense = 0;

	for (const row of currentPeriodRows) {
		const amount = Math.abs(toNumber(row.totalAmount));
		if (row.transactionType === "Receita") currentIncome += amount;
		else if (row.transactionType === "Despesa") currentExpense += amount;
	}

	for (const row of previousPeriodRows) {
		const amount = Math.abs(toNumber(row.totalAmount));
		if (row.transactionType === "Receita") previousIncome += amount;
		else if (row.transactionType === "Despesa") previousExpense += amount;
	}

	for (const row of twoMonthsAgoRows) {
		const amount = Math.abs(toNumber(row.totalAmount));
		if (row.transactionType === "Receita") twoMonthsAgoIncome += amount;
		else if (row.transactionType === "Despesa") twoMonthsAgoExpense += amount;
	}

	for (const row of threeMonthsAgoRows) {
		const amount = Math.abs(toNumber(row.totalAmount));
		if (row.transactionType === "Receita") threeMonthsAgoIncome += amount;
		else if (row.transactionType === "Despesa") threeMonthsAgoExpense += amount;
	}

	// Buscar despesas por categoria (top 5)
	const expensesByCategory = await db
		.select({
			categoryName: categorias.name,
			total: sql<number>`coalesce(sum(${lancamentos.amount}), 0)`,
		})
		.from(lancamentos)
		.innerJoin(pagadores, eq(lancamentos.pagadorId, pagadores.id))
		.innerJoin(categorias, eq(lancamentos.categoriaId, categorias.id))
		.where(
			and(
				eq(lancamentos.userId, userId),
				eq(lancamentos.period, period),
				eq(lancamentos.transactionType, "Despesa"),
				eq(pagadores.role, PAGADOR_ROLE_ADMIN),
				eq(categorias.type, "despesa"),
				or(
					isNull(lancamentos.note),
					sql`${
						lancamentos.note
					} NOT LIKE ${`${ACCOUNT_AUTO_INVOICE_NOTE_PREFIX}%`}`,
				),
			),
		)
		.groupBy(categorias.name)
		.orderBy(sql`sum(${lancamentos.amount}) ASC`)
		.limit(5);

	// Buscar orçamentos e uso
	const budgetsData = await db
		.select({
			categoryName: categorias.name,
			budgetAmount: orcamentos.amount,
			spent: sql<number>`coalesce(sum(${lancamentos.amount}), 0)`,
		})
		.from(orcamentos)
		.innerJoin(categorias, eq(orcamentos.categoriaId, categorias.id))
		.leftJoin(
			lancamentos,
			and(
				eq(lancamentos.categoriaId, categorias.id),
				eq(lancamentos.period, period),
				eq(lancamentos.userId, userId),
				eq(lancamentos.transactionType, "Despesa"),
			),
		)
		.where(and(eq(orcamentos.userId, userId), eq(orcamentos.period, period)))
		.groupBy(categorias.name, orcamentos.amount);

	// Buscar métricas de cartões
	const cardsData = await db
		.select({
			totalLimit: sql<number>`coalesce(sum(${cartoes.limit}), 0)`,
			cardCount: sql<number>`count(*)`,
		})
		.from(cartoes)
		.where(and(eq(cartoes.userId, userId), eq(cartoes.status, "ativo")));

	// Buscar saldo total das contas
	const accountsData = await db
		.select({
			totalBalance: sql<number>`coalesce(sum(${contas.initialBalance}), 0)`,
			accountCount: sql<number>`count(*)`,
		})
		.from(contas)
		.where(
			and(
				eq(contas.userId, userId),
				eq(contas.status, "ativa"),
				eq(contas.excludeFromBalance, false),
			),
		);

	// Calcular ticket médio das transações
	const avgTicketData = await db
		.select({
			avgAmount: sql<number>`coalesce(avg(abs(${lancamentos.amount})), 0)`,
			transactionCount: sql<number>`count(*)`,
		})
		.from(lancamentos)
		.innerJoin(pagadores, eq(lancamentos.pagadorId, pagadores.id))
		.where(
			and(
				eq(lancamentos.userId, userId),
				eq(lancamentos.period, period),
				eq(pagadores.role, PAGADOR_ROLE_ADMIN),
				ne(lancamentos.transactionType, TRANSFERENCIA),
			),
		);

	// Buscar gastos por dia da semana
	const dayOfWeekSpending = await db
		.select({
			purchaseDate: lancamentos.purchaseDate,
			amount: lancamentos.amount,
		})
		.from(lancamentos)
		.innerJoin(pagadores, eq(lancamentos.pagadorId, pagadores.id))
		.where(
			and(
				eq(lancamentos.userId, userId),
				eq(lancamentos.period, period),
				eq(lancamentos.transactionType, "Despesa"),
				eq(pagadores.role, PAGADOR_ROLE_ADMIN),
			),
		);

	// Agregar por dia da semana
	const dayTotals = new Map<number, number>();
	for (const row of dayOfWeekSpending) {
		if (!row.purchaseDate) continue;
		const dayOfWeek = getDay(new Date(row.purchaseDate));
		const current = dayTotals.get(dayOfWeek) ?? 0;
		dayTotals.set(dayOfWeek, current + Math.abs(toNumber(row.amount)));
	}

	// Buscar métodos de pagamento (agregado)
	const paymentMethodsData = await db
		.select({
			paymentMethod: lancamentos.paymentMethod,
			total: sql<number>`coalesce(sum(abs(${lancamentos.amount})), 0)`,
		})
		.from(lancamentos)
		.innerJoin(pagadores, eq(lancamentos.pagadorId, pagadores.id))
		.where(
			and(
				eq(lancamentos.userId, userId),
				eq(lancamentos.period, period),
				eq(lancamentos.transactionType, "Despesa"),
				eq(pagadores.role, PAGADOR_ROLE_ADMIN),
			),
		)
		.groupBy(lancamentos.paymentMethod);

	// Buscar transações dos últimos 3 meses para análise de recorrência
	const last3MonthsTransactions = await db
		.select({
			name: lancamentos.name,
			amount: lancamentos.amount,
			period: lancamentos.period,
			condition: lancamentos.condition,
			installmentCount: lancamentos.installmentCount,
			currentInstallment: lancamentos.currentInstallment,
			categoryName: categorias.name,
		})
		.from(lancamentos)
		.innerJoin(pagadores, eq(lancamentos.pagadorId, pagadores.id))
		.leftJoin(categorias, eq(lancamentos.categoriaId, categorias.id))
		.where(
			and(
				eq(lancamentos.userId, userId),
				sql`${lancamentos.period} IN (${period}, ${previousPeriod}, ${twoMonthsAgo})`,
				eq(lancamentos.transactionType, "Despesa"),
				eq(pagadores.role, PAGADOR_ROLE_ADMIN),
				ne(lancamentos.transactionType, TRANSFERENCIA),
			),
		)
		.orderBy(lancamentos.name);

	// Análise de recorrência
	const transactionsByName = new Map<
		string,
		Array<{ period: string; amount: number }>
	>();

	for (const tx of last3MonthsTransactions) {
		const key = tx.name.toLowerCase().trim();
		if (!transactionsByName.has(key)) {
			transactionsByName.set(key, []);
		}
		const transactions = transactionsByName.get(key);
		if (transactions) {
			transactions.push({
				period: tx.period,
				amount: Math.abs(toNumber(tx.amount)),
			});
		}
	}

	// Identificar gastos recorrentes (aparece em 2+ meses com valor similar)
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

			// Considerar recorrente se variação <= 20% da média
			if (maxDiff <= avgAmount * 0.2) {
				recurringExpenses.push({
					name,
					avgAmount,
					frequency: occurrences.length,
				});

				// Somar apenas os do mês atual
				const currentMonthOccurrence = occurrences.find(
					(o) => o.period === period,
				);
				if (currentMonthOccurrence) {
					totalRecurring += currentMonthOccurrence.amount;
				}
			}
		}
	}

	// Análise de gastos parcelados
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
			amount: Math.abs(toNumber(tx.amount)),
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

	// Montar dados agregados e anonimizados
	const aggregatedData = {
		month: period,
		totalIncome: currentIncome,
		totalExpense: currentExpense,
		balance: currentIncome - currentExpense,

		// Tendência de 3 meses
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
				amount: Math.abs(toNumber(cat.total)),
				percentageOfTotal:
					currentExpense > 0
						? (Math.abs(toNumber(cat.total)) / currentExpense) * 100
						: 0,
			}),
		),
		budgets: budgetsData.map(
			(b: { categoryName: string; budgetAmount: unknown; spent: unknown }) => ({
				category: b.categoryName,
				budgetAmount: toNumber(b.budgetAmount),
				spent: Math.abs(toNumber(b.spent)),
				usagePercentage:
					toNumber(b.budgetAmount) > 0
						? (Math.abs(toNumber(b.spent)) / toNumber(b.budgetAmount)) * 100
						: 0,
			}),
		),
		creditCards: {
			totalLimit: toNumber(cardsData[0]?.totalLimit ?? 0),
			cardCount: toNumber(cardsData[0]?.cardCount ?? 0),
		},
		accounts: {
			totalBalance: toNumber(accountsData[0]?.totalBalance ?? 0),
			accountCount: toNumber(accountsData[0]?.accountCount ?? 0),
		},
		avgTicket: toNumber(avgTicketData[0]?.avgAmount ?? 0),
		transactionCount: toNumber(avgTicketData[0]?.transactionCount ?? 0),
		dayOfWeekSpending: Array.from(dayTotals.entries()).map(([day, total]) => ({
			dayOfWeek:
				["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"][day] ?? "N/A",
			total,
		})),
		paymentMethodsBreakdown: paymentMethodsData.map(
			(pm: { paymentMethod: string | null; total: unknown }) => ({
				method: pm.paymentMethod,
				total: toNumber(pm.total),
				percentage:
					currentExpense > 0 ? (toNumber(pm.total) / currentExpense) * 100 : 0,
			}),
		),

		// Análise de recorrência
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

		// Análise de parcelamentos
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

	return aggregatedData;
}

/**
 * Gera insights usando IA
 */
export async function generateInsightsAction(
	period: string,
	modelId: string,
): Promise<ActionResult<InsightsResponse>> {
	try {
		const user = await getUser();

		// Validar modelo - verificar se existe na lista ou se é um modelo customizado
		const selectedModel = AVAILABLE_MODELS.find((m) => m.id === modelId);

		// Se não encontrou na lista e não tem "/" (formato OpenRouter), é inválido
		const isOpenRouterFormat = /^[a-zA-Z0-9_-]+\/[a-zA-Z0-9._-]+$/.test(
			modelId,
		);
		if (!selectedModel && !isOpenRouterFormat) {
			return {
				success: false,
				error: "Modelo inválido.",
			};
		}

		// Agregar dados
		const aggregatedData = await aggregateMonthData(user.id, period);

		// Selecionar provider
		let model: ReturnType<typeof google>;

		// Se o modelo tem "/" é OpenRouter (formato: provider/model)
		if (isOpenRouterFormat && !selectedModel) {
			const apiKey = process.env.OPENROUTER_API_KEY;
			if (!apiKey) {
				return {
					success: false,
					error:
						"OPENROUTER_API_KEY não configurada. Adicione a chave no arquivo .env",
				};
			}

			const openrouter = createOpenRouter({
				apiKey,
			});
			model = openrouter.chat(modelId);
		} else if (selectedModel?.provider === "openai") {
			model = openai(modelId);
		} else if (selectedModel?.provider === "anthropic") {
			model = anthropic(modelId);
		} else if (selectedModel?.provider === "google") {
			model = google(modelId);
		} else {
			return {
				success: false,
				error: "Provider de modelo não suportado.",
			};
		}

		// Chamar AI SDK
		const result = await generateObject({
			model,
			schema: InsightsResponseSchema,
			system: INSIGHTS_SYSTEM_PROMPT,
			prompt: `Analise os seguintes dados financeiros agregados do período ${period}.

Dados agregados:
${JSON.stringify(aggregatedData, null, 2)}

DADOS IMPORTANTES PARA SUA ANÁLISE:

**Tendência de 3 meses:**
- Os dados incluem tendência dos últimos 3 meses (threeMonthTrend)
- Use isso para identificar padrões crescentes, decrescentes ou estáveis
- Compare o mês atual com a média dos 3 meses

**Análise de Recorrência:**
- Gastos recorrentes representam ${aggregatedData.recurringExpenses.percentageOfTotal.toFixed(1)}% das despesas
- ${aggregatedData.recurringExpenses.count} gastos identificados como recorrentes
- Use isso para avaliar previsibilidade e oportunidades de otimização

**Gastos Parcelados:**
- ${aggregatedData.installments.currentMonthInstallments} parcelas ativas no mês
- Comprometimento futuro de R$ ${aggregatedData.installments.futureCommitment.toFixed(2)}
- Use isso para alertas sobre comprometimento de renda futura

Organize suas observações nas 4 categorias especificadas no prompt do sistema:
1. Comportamentos Observados (behaviors): 3-6 itens
2. Gatilhos de Consumo (triggers): 3-6 itens
3. Recomendações Práticas (recommendations): 3-6 itens
4. Melhorias Sugeridas (improvements): 3-6 itens

Cada item deve ser conciso, direto e acionável. Use os novos dados para dar contexto temporal e identificar padrões mais profundos.

Responda APENAS com um JSON válido seguindo exatamente o schema especificado.`,
		});

		// Validar resposta
		const validatedData = InsightsResponseSchema.parse(result.object);

		return {
			success: true,
			data: validatedData,
		};
	} catch (error) {
		console.error("Error generating insights:", error);
		return {
			success: false,
			error: "Erro ao gerar insights. Tente novamente.",
		};
	}
}

/**
 * Salva insights gerados no banco de dados
 */
export async function saveInsightsAction(
	period: string,
	modelId: string,
	data: InsightsResponse,
): Promise<ActionResult<{ id: string; createdAt: Date }>> {
	try {
		const user = await getUser();

		// Verificar se já existe um insight salvo para este período
		const existing = await db
			.select()
			.from(insightsSalvos)
			.where(
				and(
					eq(insightsSalvos.userId, user.id),
					eq(insightsSalvos.period, period),
				),
			)
			.limit(1);

		if (existing.length > 0) {
			// Atualizar existente
			const updated = await db
				.update(insightsSalvos)
				.set({
					modelId,
					data: JSON.stringify(data),
					updatedAt: new Date(),
				})
				.where(
					and(
						eq(insightsSalvos.userId, user.id),
						eq(insightsSalvos.period, period),
					),
				)
				.returning({
					id: insightsSalvos.id,
					createdAt: insightsSalvos.createdAt,
				});

			const updatedRecord = updated[0];
			if (!updatedRecord) {
				return {
					success: false,
					error: "Falha ao atualizar a análise. Tente novamente.",
				};
			}

			return {
				success: true,
				data: {
					id: updatedRecord.id,
					createdAt: updatedRecord.createdAt,
				},
			};
		}

		// Criar novo
		const result = await db
			.insert(insightsSalvos)
			.values({
				userId: user.id,
				period,
				modelId,
				data: JSON.stringify(data),
			})
			.returning({
				id: insightsSalvos.id,
				createdAt: insightsSalvos.createdAt,
			});

		const insertedRecord = result[0];
		if (!insertedRecord) {
			return {
				success: false,
				error: "Falha ao salvar a análise. Tente novamente.",
			};
		}

		return {
			success: true,
			data: {
				id: insertedRecord.id,
				createdAt: insertedRecord.createdAt,
			},
		};
	} catch (error) {
		console.error("Error saving insights:", error);
		return {
			success: false,
			error: "Erro ao salvar análise. Tente novamente.",
		};
	}
}

/**
 * Carrega insights salvos do banco de dados
 */
export async function loadSavedInsightsAction(period: string): Promise<
	ActionResult<{
		insights: InsightsResponse;
		modelId: string;
		createdAt: Date;
	} | null>
> {
	try {
		const user = await getUser();

		const result = await db
			.select()
			.from(insightsSalvos)
			.where(
				and(
					eq(insightsSalvos.userId, user.id),
					eq(insightsSalvos.period, period),
				),
			)
			.limit(1);

		if (result.length === 0) {
			return {
				success: true,
				data: null,
			};
		}

		const saved = result[0];
		if (!saved) {
			return {
				success: true,
				data: null,
			};
		}

		const insights = InsightsResponseSchema.parse(JSON.parse(saved.data));

		return {
			success: true,
			data: {
				insights,
				modelId: saved.modelId,
				createdAt: saved.createdAt,
			},
		};
	} catch (error) {
		console.error("Error loading saved insights:", error);
		return {
			success: false,
			error: "Erro ao carregar análise salva. Tente novamente.",
		};
	}
}

/**
 * Remove insights salvos do banco de dados
 */
export async function deleteSavedInsightsAction(
	period: string,
): Promise<ActionResult<void>> {
	try {
		const user = await getUser();

		await db
			.delete(insightsSalvos)
			.where(
				and(
					eq(insightsSalvos.userId, user.id),
					eq(insightsSalvos.period, period),
				),
			);

		return {
			success: true,
			data: undefined,
		};
	} catch (error) {
		console.error("Error deleting saved insights:", error);
		return {
			success: false,
			error: "Erro ao remover análise. Tente novamente.",
		};
	}
}

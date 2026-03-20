#!/usr/bin/env tsx

import { randomUUID } from "node:crypto";
import { config } from "dotenv";
import { and, eq, ne, sql } from "drizzle-orm";
import {
	budgets,
	cards,
	categories,
	financialAccounts,
	inboxItems,
	invoices,
	notes,
	payers,
	transactions,
	user,
} from "@/db/schema";
import { loadAvatarOptions } from "@/features/payers/lib/avatar-options";
import type { TransactionInsert } from "@/features/transactions/actions/core";
import type {
	PAYMENT_METHODS,
	TRANSACTION_CONDITIONS,
	TRANSACTION_TYPES,
} from "@/features/transactions/constants";
import {
	buildInvoicePaymentNote,
	INITIAL_BALANCE_CATEGORY_NAME,
	INITIAL_BALANCE_CONDITION,
	INITIAL_BALANCE_NOTE,
	INITIAL_BALANCE_PAYMENT_METHOD,
	INITIAL_BALANCE_TRANSACTION_TYPE,
} from "@/shared/lib/accounts/constants";
import {
	DEFAULT_CARD_BRANDS,
	DEFAULT_CARD_STATUS,
} from "@/shared/lib/cards/constants";
import { DEFAULT_CATEGORIES } from "@/shared/lib/categories/defaults";
import { db } from "@/shared/lib/db";
import { INVOICE_PAYMENT_STATUS } from "@/shared/lib/invoices";
import { loadLogoOptions } from "@/shared/lib/logo/options";
import {
	DEFAULT_PAYER_AVATAR,
	PAYER_ROLE_ADMIN,
	PAYER_ROLE_THIRD_PARTY,
	PAYER_STATUS_OPTIONS,
} from "@/shared/lib/payers/constants";
import { normalizeNameFromEmail } from "@/shared/lib/payers/utils";
import {
	addMonthsToDate,
	buildDateOnlyStringFromPeriodDay,
	compareDateOnly,
	getBusinessTodayInfo,
	parseLocalDateString,
} from "@/shared/utils/date";
import {
	addMonthsToPeriod,
	comparePeriods,
	derivePeriodFromDate,
	getNextPeriod,
	parsePeriod,
} from "@/shared/utils/period";

config();

const DEFAULT_MONTHS = 6;
const MIN_MONTHS = 3;
const MAX_MONTHS = 24;

const ACCOUNT_TYPES = {
	CHECKING: "Conta Corrente",
	DIGITAL_WALLET: "Carteira Digital",
} as const;

const ACCOUNT_STATUS = {
	ACTIVE: "Ativa",
} as const;

const CARD_STATUS = DEFAULT_CARD_STATUS[0];
const CARD_BRANDS = {
	MASTERCARD: DEFAULT_CARD_BRANDS[1] ?? "Mastercard",
	VISA: DEFAULT_CARD_BRANDS[0] ?? "Visa",
} as const;

const PAYER_STATUS = PAYER_STATUS_OPTIONS[0];

type CliOptions = {
	userId: string;
	startPeriod: string;
	months: number;
};

type SeedTransactionInput = {
	name: string;
	amount: number;
	purchaseDate: string;
	transactionType: (typeof TRANSACTION_TYPES)[number];
	condition: (typeof TRANSACTION_CONDITIONS)[number];
	paymentMethod: (typeof PAYMENT_METHODS)[number];
	accountId?: string | null;
	cardId?: string | null;
	categoryId?: string | null;
	payerId?: string | null;
	secondaryPayerId?: string | null;
	isSplit?: boolean;
	primarySplitAmount?: number;
	secondarySplitAmount?: number;
	installmentCount?: number;
	recurrenceCount?: number;
	dueDate?: string | null;
	note?: string | null;
	settlementBehavior?: "auto" | "open" | "settled";
	cardMeta?: {
		closingDay: string;
		dueDay: string;
	};
};

type Share = {
	payerId: string | null;
	amountCents: number;
};

type SeedSummary = {
	payers: number;
	accounts: number;
	cards: number;
	notes: number;
	budgets: number;
	transactions: number;
	invoices: number;
	invoicePayments: number;
	inboxItems: number;
};

function printUsage() {
	console.log(`
Uso:
  pnpm seed:empty-account -- --userId=<id> --startPeriod=YYYY-MM [--months=${DEFAULT_MONTHS}]

Exemplos:
  pnpm seed:empty-account -- --userId=user_123 --startPeriod=2026-01
  pnpm seed:empty-account -- --userId=user_123 --startPeriod=2025-10 --months=8
`);
}

function parseArgs(argv: string[]): CliOptions {
	let userId = "";
	let startPeriod = "";
	let months = DEFAULT_MONTHS;

	for (const arg of argv) {
		if (arg === "--help" || arg === "-h") {
			printUsage();
			process.exit(0);
		}

		if (arg.startsWith("--userId=") || arg.startsWith("--user-id=")) {
			userId = arg.split("=")[1] ?? "";
			continue;
		}

		if (arg.startsWith("--startPeriod=") || arg.startsWith("--start-period=")) {
			startPeriod = arg.split("=")[1] ?? "";
			continue;
		}

		if (arg.startsWith("--months=")) {
			const rawValue = arg.split("=")[1] ?? "";
			months = Number.parseInt(rawValue, 10);
		}
	}

	if (!userId.trim()) {
		throw new Error("Informe o `--userId` do usuário que receberá os dados.");
	}

	if (!startPeriod.trim()) {
		throw new Error("Informe o `--startPeriod` no formato `YYYY-MM`.");
	}

	parsePeriod(startPeriod);

	if (Number.isNaN(months) || months < MIN_MONTHS || months > MAX_MONTHS) {
		throw new Error(
			`O parâmetro \`--months\` deve ficar entre ${MIN_MONTHS} e ${MAX_MONTHS}.`,
		);
	}

	return {
		userId: userId.trim(),
		startPeriod: startPeriod.trim(),
		months,
	};
}

function centsToDecimalString(value: number) {
	const decimal = value / 100;
	const formatted = decimal.toFixed(2);
	return Object.is(decimal, -0) ? "0.00" : formatted;
}

function splitAmount(totalCents: number, parts: number) {
	if (parts <= 0) {
		return [];
	}

	const base = Math.trunc(totalCents / parts);
	const remainder = totalCents % parts;

	return Array.from(
		{ length: parts },
		(_, index) => base + (index < remainder ? 1 : 0),
	);
}

function buildShares(input: SeedTransactionInput): Share[] {
	const totalCents = Math.round(Math.abs(input.amount) * 100);

	if (!input.isSplit) {
		return [{ payerId: input.payerId ?? null, amountCents: totalCents }];
	}

	if (!input.payerId || !input.secondaryPayerId) {
		throw new Error(`Divisão inválida para o lançamento "${input.name}".`);
	}

	if (
		input.primarySplitAmount !== undefined &&
		input.secondarySplitAmount !== undefined
	) {
		return [
			{
				payerId: input.payerId,
				amountCents: Math.round(input.primarySplitAmount * 100),
			},
			{
				payerId: input.secondaryPayerId,
				amountCents: Math.round(input.secondarySplitAmount * 100),
			},
		];
	}

	const [primaryAmount, secondaryAmount] = splitAmount(totalCents, 2);

	return [
		{ payerId: input.payerId, amountCents: primaryAmount ?? 0 },
		{
			payerId: input.secondaryPayerId,
			amountCents: secondaryAmount ?? 0,
		},
	];
}

function deriveCreditCardPeriod(
	purchaseDate: string,
	closingDay: string | null | undefined,
	dueDay?: string | null | undefined,
) {
	const basePeriod = derivePeriodFromDate(purchaseDate);
	if (!closingDay) return basePeriod;

	const closingDayNum = Number.parseInt(closingDay, 10);
	if (Number.isNaN(closingDayNum)) return basePeriod;

	const dayPart = purchaseDate.split("-")[2];
	const purchaseDayNum = Number.parseInt(dayPart ?? "1", 10);

	let period = basePeriod;

	if (purchaseDayNum >= closingDayNum) {
		period = getNextPeriod(period);
	}

	const dueDayNum = Number.parseInt(dueDay ?? "", 10);
	if (!Number.isNaN(dueDayNum) && dueDayNum < closingDayNum) {
		period = getNextPeriod(period);
	}

	return period;
}

function pickOption(options: string[], candidates: string[], fallback: string) {
	const normalizedOptions = new Set(options);

	for (const candidate of candidates) {
		if (normalizedOptions.has(candidate)) {
			return candidate;
		}
	}

	return options[0] ?? fallback;
}

function dateForPeriodDay(period: string, day: number) {
	const value = buildDateOnlyStringFromPeriodDay(period, day);
	if (!value) {
		throw new Error(`Não foi possível montar a data ${period}/${day}.`);
	}

	return value;
}

function resolveSeedSettlement(
	input: SeedTransactionInput,
	referenceDate: Date,
	todayDate: Date,
) {
	if (input.paymentMethod === "Cartão de crédito") {
		return null;
	}

	if (input.settlementBehavior === "settled") {
		return true;
	}

	if (input.settlementBehavior === "open") {
		return false;
	}

	return compareDateOnly(referenceDate, todayDate) <= 0;
}

function createTransactionRecords(
	input: SeedTransactionInput,
	userId: string,
	todayDate: Date,
): TransactionInsert[] {
	const purchaseDate = parseLocalDateString(input.purchaseDate);
	if (Number.isNaN(purchaseDate.getTime())) {
		throw new Error(`Data inválida no lançamento "${input.name}".`);
	}

	const dueDate = input.dueDate ? parseLocalDateString(input.dueDate) : null;
	const shares = buildShares(input);
	const amountSign: 1 | -1 = input.transactionType === "Despesa" ? -1 : 1;
	const isSeries =
		input.condition === "Parcelado" || input.condition === "Recorrente";
	const seriesId = isSeries ? randomUUID() : null;
	const initialPeriod =
		input.cardId && input.cardMeta
			? deriveCreditCardPeriod(
					input.purchaseDate,
					input.cardMeta.closingDay,
					input.cardMeta.dueDay,
				)
			: derivePeriodFromDate(input.purchaseDate);

	const basePayload = {
		name: input.name,
		transactionType: input.transactionType,
		condition: input.condition,
		paymentMethod: input.paymentMethod,
		note: input.note ?? null,
		accountId: input.accountId ?? null,
		cardId: input.cardId ?? null,
		categoryId: input.categoryId ?? null,
		isDivided: input.isSplit ?? false,
		userId,
		seriesId,
	};

	const records: TransactionInsert[] = [];

	if (input.condition === "Parcelado") {
		const installmentTotal = input.installmentCount ?? 0;
		const amountsByShare = shares.map((share) =>
			splitAmount(share.amountCents, installmentTotal),
		);

		for (
			let installmentIndex = 0;
			installmentIndex < installmentTotal;
			installmentIndex += 1
		) {
			const period = addMonthsToPeriod(initialPeriod, installmentIndex);
			const installmentDueDate = dueDate
				? addMonthsToDate(dueDate, installmentIndex)
				: null;
			const settlementReferenceDate =
				installmentDueDate ?? addMonthsToDate(purchaseDate, installmentIndex);

			shares.forEach((share, shareIndex) => {
				const amountCents = amountsByShare[shareIndex]?.[installmentIndex] ?? 0;
				const isSettled = resolveSeedSettlement(
					input,
					settlementReferenceDate,
					todayDate,
				);

				records.push({
					...basePayload,
					amount: centsToDecimalString(amountCents * amountSign),
					payerId: share.payerId,
					purchaseDate,
					period,
					isSettled,
					installmentCount: installmentTotal,
					currentInstallment: installmentIndex + 1,
					recurrenceCount: null,
					dueDate: installmentDueDate,
					boletoPaymentDate:
						input.paymentMethod === "Boleto" && isSettled
							? (installmentDueDate ?? settlementReferenceDate)
							: null,
				});
			});
		}

		return records;
	}

	if (input.condition === "Recorrente") {
		const recurrenceTotal = input.recurrenceCount ?? 0;

		for (let index = 0; index < recurrenceTotal; index += 1) {
			const period = addMonthsToPeriod(initialPeriod, index);
			const recurrencePurchaseDate = addMonthsToDate(purchaseDate, index);
			const recurrenceDueDate = dueDate
				? addMonthsToDate(dueDate, index)
				: null;
			const settlementReferenceDate =
				recurrenceDueDate ?? recurrencePurchaseDate;

			shares.forEach((share) => {
				const isSettled = resolveSeedSettlement(
					input,
					settlementReferenceDate,
					todayDate,
				);

				records.push({
					...basePayload,
					amount: centsToDecimalString(share.amountCents * amountSign),
					payerId: share.payerId,
					purchaseDate: recurrencePurchaseDate,
					period,
					isSettled,
					installmentCount: null,
					currentInstallment: null,
					recurrenceCount: recurrenceTotal,
					dueDate: recurrenceDueDate,
					boletoPaymentDate:
						input.paymentMethod === "Boleto" && isSettled
							? (recurrenceDueDate ?? recurrencePurchaseDate)
							: null,
				});
			});
		}

		return records;
	}

	shares.forEach((share) => {
		const settlementReferenceDate = dueDate ?? purchaseDate;
		const isSettled = resolveSeedSettlement(
			input,
			settlementReferenceDate,
			todayDate,
		);

		records.push({
			...basePayload,
			amount: centsToDecimalString(share.amountCents * amountSign),
			payerId: share.payerId,
			purchaseDate,
			period: initialPeriod,
			isSettled,
			installmentCount: null,
			currentInstallment: null,
			recurrenceCount: null,
			dueDate,
			boletoPaymentDate:
				input.paymentMethod === "Boleto" && isSettled
					? (dueDate ?? purchaseDate)
					: null,
		});
	});

	return records;
}

async function ensureCategories(userId: string) {
	const existing = await db.query.categories.findMany({
		columns: { id: true, name: true },
		where: eq(categories.userId, userId),
	});

	const existingNames = new Set(existing.map((item) => item.name));
	const missingDefaults = DEFAULT_CATEGORIES.filter(
		(category) => !existingNames.has(category.name),
	);

	if (missingDefaults.length > 0) {
		await db.insert(categories).values(
			missingDefaults.map((category) => ({
				name: category.name,
				type: category.type,
				icon: category.icon,
				userId,
			})),
		);
	}

	const refreshed = await db.query.categories.findMany({
		columns: { id: true, name: true },
		where: eq(categories.userId, userId),
	});

	return new Map(refreshed.map((category) => [category.name, category.id]));
}

async function ensureAdminPayer(targetUser: typeof user.$inferSelect) {
	const existingAdmin = await db.query.payers.findFirst({
		columns: { id: true, name: true },
		where: and(
			eq(payers.userId, targetUser.id),
			eq(payers.role, PAYER_ROLE_ADMIN),
		),
	});

	if (existingAdmin) {
		return existingAdmin;
	}

	const name =
		targetUser.name?.trim() ||
		normalizeNameFromEmail(targetUser.email) ||
		"Admin";

	const [created] = await db
		.insert(payers)
		.values({
			name,
			email: targetUser.email ?? null,
			avatarUrl: targetUser.image ?? DEFAULT_PAYER_AVATAR,
			status: PAYER_STATUS,
			note: null,
			role: PAYER_ROLE_ADMIN,
			isAutoSend: false,
			userId: targetUser.id,
		})
		.returning({ id: payers.id, name: payers.name });

	if (!created) {
		throw new Error("Não foi possível criar o pagador admin do usuário.");
	}

	return created;
}

async function countByUserId(
	table:
		| typeof financialAccounts
		| typeof cards
		| typeof budgets
		| typeof notes
		| typeof invoices
		| typeof transactions
		| typeof inboxItems,
	userColumn:
		| typeof financialAccounts.userId
		| typeof cards.userId
		| typeof budgets.userId
		| typeof notes.userId
		| typeof invoices.userId
		| typeof transactions.userId
		| typeof inboxItems.userId,
	userId: string,
) {
	const [result] = await db
		.select({ count: sql<number>`count(*)` })
		.from(table)
		.where(eq(userColumn, userId));

	return Number(result?.count ?? 0);
}

async function assertFinancialSpaceIsEmpty(userId: string) {
	const [
		accountCount,
		cardCount,
		budgetCount,
		noteCount,
		invoiceCount,
		transactionCount,
		inboxCount,
		extraPayerCount,
	] = await Promise.all([
		countByUserId(financialAccounts, financialAccounts.userId, userId),
		countByUserId(cards, cards.userId, userId),
		countByUserId(budgets, budgets.userId, userId),
		countByUserId(notes, notes.userId, userId),
		countByUserId(invoices, invoices.userId, userId),
		countByUserId(transactions, transactions.userId, userId),
		countByUserId(inboxItems, inboxItems.userId, userId),
		db
			.select({ count: sql<number>`count(*)` })
			.from(payers)
			.where(and(eq(payers.userId, userId), ne(payers.role, PAYER_ROLE_ADMIN)))
			.then((rows) => Number(rows[0]?.count ?? 0)),
	]);

	const blockers = [
		accountCount > 0 ? `${accountCount} conta(s)` : null,
		cardCount > 0 ? `${cardCount} cartao(oes)` : null,
		transactionCount > 0 ? `${transactionCount} lancamento(s)` : null,
		invoiceCount > 0 ? `${invoiceCount} fatura(s)` : null,
		budgetCount > 0 ? `${budgetCount} orcamento(s)` : null,
		noteCount > 0 ? `${noteCount} anotacao(oes)` : null,
		extraPayerCount > 0 ? `${extraPayerCount} pagador(es) extra(s)` : null,
		inboxCount > 0 ? `${inboxCount} pre-lancamento(s)` : null,
	].filter(Boolean);

	if (blockers.length > 0) {
		throw new Error(
			`O usuário ${userId} não está com a conta zerada. Itens encontrados: ${blockers.join(", ")}.`,
		);
	}
}

async function seedInvoicesForCards(params: {
	userId: string;
	adminPayerId: string;
	cardsByKey: Record<
		string,
		{
			id: string;
			name: string;
			accountId: string;
			dueDay: string;
			closingDay: string;
		}
	>;
	paymentCategoryId: string | undefined;
	insertedTransactionRecords: TransactionInsert[];
}) {
	const { userId, adminPayerId, cardsByKey, paymentCategoryId } = params;
	const todayInfo = getBusinessTodayInfo();
	const cardEntries = Object.entries(cardsByKey);

	let createdInvoices = 0;
	let createdInvoicePayments = 0;

	await db.transaction(async (tx) => {
		for (const [cardKey, card] of cardEntries) {
			const cardPeriods = Array.from(
				new Set(
					params.insertedTransactionRecords
						.filter((record) => record.cardId === card.id)
						.map((record) => record.period ?? "")
						.filter(Boolean),
				),
			).sort(comparePeriods);

			const historicalPeriods = cardPeriods.filter(
				(period) => comparePeriods(period, todayInfo.period) <= 0,
			);

			if (historicalPeriods.length === 0) {
				continue;
			}

			const latestHistoricalPeriod =
				historicalPeriods[historicalPeriods.length - 1];

			for (const period of historicalPeriods) {
				const shouldLeavePending =
					cardKey === "ultravioleta" && period === latestHistoricalPeriod;
				const status = shouldLeavePending
					? INVOICE_PAYMENT_STATUS.PENDING
					: INVOICE_PAYMENT_STATUS.PAID;

				const existingInvoice = await tx.query.invoices.findFirst({
					columns: { id: true },
					where: and(
						eq(invoices.userId, userId),
						eq(invoices.cardId, card.id),
						eq(invoices.period, period),
					),
				});

				if (existingInvoice) {
					await tx
						.update(invoices)
						.set({
							paymentStatus: status,
						})
						.where(eq(invoices.id, existingInvoice.id));
				} else {
					await tx.insert(invoices).values({
						cardId: card.id,
						userId,
						period,
						paymentStatus: status,
					});
				}

				await tx
					.update(transactions)
					.set({
						isSettled: status === INVOICE_PAYMENT_STATUS.PAID,
					})
					.where(
						and(
							eq(transactions.userId, userId),
							eq(transactions.cardId, card.id),
							eq(transactions.period, period),
						),
					);

				createdInvoices += 1;

				if (status !== INVOICE_PAYMENT_STATUS.PAID) {
					continue;
				}

				const [adminShareRow] = await tx
					.select({
						total: sql<number>`coalesce(sum(${transactions.amount}), 0)`,
					})
					.from(transactions)
					.where(
						and(
							eq(transactions.userId, userId),
							eq(transactions.cardId, card.id),
							eq(transactions.period, period),
							eq(transactions.payerId, adminPayerId),
						),
					);

				const adminShare = Number(adminShareRow?.total ?? 0);
				const adminPayableAmount = Math.abs(Math.min(adminShare, 0));

				if (adminPayableAmount <= 0) {
					continue;
				}

				const paymentDate = dateForPeriodDay(period, Number(card.dueDay));
				const paymentNote = buildInvoicePaymentNote(card.id, period);

				await tx.insert(transactions).values({
					condition: "À vista",
					name: `Pagamento fatura - ${card.name}`,
					paymentMethod: "Pix",
					note: paymentNote,
					amount: `-${adminPayableAmount.toFixed(2)}`,
					purchaseDate: parseLocalDateString(paymentDate),
					transactionType: "Despesa",
					period,
					isSettled: true,
					userId,
					accountId: card.accountId,
					categoryId: paymentCategoryId ?? null,
					payerId: adminPayerId,
				});

				createdInvoicePayments += 1;
			}
		}
	});

	return {
		createdInvoices,
		createdInvoicePayments,
	};
}

async function main() {
	if (!process.env.DATABASE_URL) {
		throw new Error("DATABASE_URL não está configurada no ambiente.");
	}

	const options = parseArgs(process.argv.slice(2));
	const logoOptions = await loadLogoOptions();
	const avatarOptions = await loadAvatarOptions();
	const businessToday = getBusinessTodayInfo();
	const summary: SeedSummary = {
		payers: 0,
		accounts: 0,
		cards: 0,
		notes: 0,
		budgets: 0,
		transactions: 0,
		invoices: 0,
		invoicePayments: 0,
		inboxItems: 0,
	};

	const targetUser = await db.query.user.findFirst({
		where: eq(user.id, options.userId),
	});

	if (!targetUser) {
		throw new Error(`Usuário ${options.userId} não foi encontrado.`);
	}

	await ensureCategories(targetUser.id);
	const adminPayer = await ensureAdminPayer(targetUser);
	await assertFinancialSpaceIsEmpty(targetUser.id);

	const categoriesByName = await ensureCategories(targetUser.id);

	const getCategoryId = (name: string) => {
		const categoryId = categoriesByName.get(name);
		if (!categoryId) {
			throw new Error(`Categoria obrigatória não encontrada: ${name}.`);
		}
		return categoryId;
	};

	const periods = Array.from({ length: options.months }, (_, index) =>
		addMonthsToPeriod(options.startPeriod, index),
	);

	const firstPeriod = periods[0];
	const secondPeriod = periods[1] ?? periods[0];
	const thirdPeriod = periods[2] ?? periods[periods.length - 1] ?? periods[0];
	const middlePeriod = periods[Math.floor(periods.length / 2)] ?? periods[0];
	const lastPeriod = periods[periods.length - 1] ?? periods[0];
	const firstDayOfSeed = dateForPeriodDay(firstPeriod, 1);

	const preferredAvatar = (candidates: string[]) =>
		pickOption(avatarOptions, candidates, DEFAULT_PAYER_AVATAR);
	const preferredLogo = (candidates: string[], fallback: string) =>
		pickOption(logoOptions, candidates, fallback);

	const createdPayers: Record<string, string> = {
		admin: adminPayer.id,
	};
	const createdAccounts: Record<string, string> = {};
	const createdCards: Record<
		string,
		{
			id: string;
			name: string;
			accountId: string;
			closingDay: string;
			dueDay: string;
		}
	> = {};

	await db.transaction(async (tx) => {
		const extraPayerDefinitions = [
			{
				key: "marina",
				name: "Marina Oliveira",
				email: "marina.oliveira@exemplo.com",
				avatarUrl: preferredAvatar(["4825038.png", "4825051.png"]),
				note: "Divide as despesas da casa e do mercado.",
				isAutoSend: true,
			},
			{
				key: "eduardo",
				name: "Eduardo Lima",
				email: "eduardo.lima@exemplo.com",
				avatarUrl: preferredAvatar(["4825108.png", "4825123.png"]),
				note: "Costuma rachar viagens e presentes em familia.",
				isAutoSend: false,
			},
		] as const;

		for (const definition of extraPayerDefinitions) {
			const [created] = await tx
				.insert(payers)
				.values({
					name: definition.name,
					email: definition.email,
					avatarUrl: definition.avatarUrl,
					status: PAYER_STATUS,
					note: definition.note,
					role: PAYER_ROLE_THIRD_PARTY,
					isAutoSend: definition.isAutoSend,
					userId: targetUser.id,
				})
				.returning({ id: payers.id });

			if (!created) {
				throw new Error(`Falha ao criar o pagador ${definition.name}.`);
			}

			createdPayers[definition.key] = created.id;
			summary.payers += 1;
		}

		const accountDefinitions = [
			{
				key: "nubank",
				name: "Nubank",
				accountType: ACCOUNT_TYPES.DIGITAL_WALLET,
				status: ACCOUNT_STATUS.ACTIVE,
				logo: preferredLogo(["nubank.png"], "nubank.png"),
				note: "Conta principal para salario, mercado e despesas do dia a dia.",
				initialBalance: "4200.00",
			},
			{
				key: "itau",
				name: "Itaú Personnalité",
				accountType: ACCOUNT_TYPES.CHECKING,
				status: ACCOUNT_STATUS.ACTIVE,
				logo: preferredLogo(["itaupersonnalite.png", "itau.png"], "itau.png"),
				note: "Conta de apoio para boletos, investimentos e pagamentos maiores.",
				initialBalance: "1850.00",
			},
			{
				key: "mercado-pago",
				name: "Mercado Pago",
				accountType: ACCOUNT_TYPES.DIGITAL_WALLET,
				status: ACCOUNT_STATUS.ACTIVE,
				logo: preferredLogo(["mercadopago.png"], "mercadopago.png"),
				note: "Carteira usada para corridas, pequenos gastos e pix instantaneo.",
				initialBalance: "350.00",
			},
		] as const;

		for (const definition of accountDefinitions) {
			const [created] = await tx
				.insert(financialAccounts)
				.values({
					name: definition.name,
					accountType: definition.accountType,
					status: definition.status,
					note: definition.note,
					logo: definition.logo,
					initialBalance: definition.initialBalance,
					excludeFromBalance: false,
					excludeInitialBalanceFromIncome: true,
					userId: targetUser.id,
				})
				.returning({ id: financialAccounts.id });

			if (!created) {
				throw new Error(`Falha ao criar a conta ${definition.name}.`);
			}

			createdAccounts[definition.key] = created.id;
			summary.accounts += 1;

			await tx.insert(transactions).values({
				condition: INITIAL_BALANCE_CONDITION,
				name: `Saldo inicial - ${definition.name}`,
				paymentMethod: INITIAL_BALANCE_PAYMENT_METHOD,
				note: INITIAL_BALANCE_NOTE,
				amount: definition.initialBalance,
				purchaseDate: parseLocalDateString(firstDayOfSeed),
				transactionType: INITIAL_BALANCE_TRANSACTION_TYPE,
				period: firstPeriod,
				isSettled: true,
				userId: targetUser.id,
				accountId: created.id,
				categoryId: getCategoryId(INITIAL_BALANCE_CATEGORY_NAME),
				payerId: adminPayer.id,
			});

			summary.transactions += 1;
		}

		const cardDefinitions = [
			{
				key: "ultravioleta",
				name: "Nubank Ultravioleta",
				brand: CARD_BRANDS.MASTERCARD,
				status: CARD_STATUS,
				closingDay: "25",
				dueDay: "03",
				note: "Cartao principal para assinaturas, delivery e compras parceladas.",
				limit: "12000.00",
				logo: preferredLogo(
					["nubank-ultravioleta.png", "nubank.png"],
					"nubank.png",
				),
				accountId: createdAccounts.nubank,
			},
			{
				key: "itaucard",
				name: "Pão de Açúcar Itaucard",
				brand: CARD_BRANDS.VISA,
				status: CARD_STATUS,
				closingDay: "15",
				dueDay: "22",
				note: "Cartao usado para mercado, compras maiores e viagens.",
				limit: "8500.00",
				logo: preferredLogo(["pao-acucar.png", "itau.png"], "itau.png"),
				accountId: createdAccounts.itau,
			},
		] as const;

		for (const definition of cardDefinitions) {
			const [created] = await tx
				.insert(cards)
				.values({
					name: definition.name,
					brand: definition.brand,
					status: definition.status,
					closingDay: definition.closingDay,
					dueDay: definition.dueDay,
					note: definition.note,
					limit: definition.limit,
					logo: definition.logo,
					accountId: definition.accountId,
					userId: targetUser.id,
				})
				.returning({ id: cards.id });

			if (!created) {
				throw new Error(`Falha ao criar o cartao ${definition.name}.`);
			}

			createdCards[definition.key] = {
				id: created.id,
				name: definition.name,
				accountId: definition.accountId,
				closingDay: definition.closingDay,
				dueDay: definition.dueDay,
			};
			summary.cards += 1;
		}

		const noteDefinitions = [
			{
				title: "Planejar viagem de julho",
				type: "nota" as const,
				description:
					"Separar hospedagem, passagens e gastos previstos da viagem para Salvador. Meta: manter tudo abaixo de R$ 4.500.",
				tasks: null,
				archived: false,
			},
			{
				title: "Pendencias do apartamento",
				type: "tarefa" as const,
				description: null,
				tasks: JSON.stringify([
					{
						id: randomUUID(),
						text: "Revisar reajuste do aluguel",
						completed: true,
					},
					{
						id: randomUUID(),
						text: "Separar comprovantes do condominio",
						completed: false,
					},
					{
						id: randomUUID(),
						text: "Confirmar vistoria do ar-condicionado",
						completed: false,
					},
				]),
				archived: false,
			},
			{
				title: "Renegociar seguro do carro",
				type: "nota" as const,
				description:
					"Pesquisar entre Porto, Azul e Youse antes do vencimento. Prioridade: franquia menor e assistencia 24h.",
				tasks: null,
				archived: false,
			},
		] as const;

		await tx.insert(notes).values(
			noteDefinitions.map((noteItem) => ({
				title: noteItem.title,
				type: noteItem.type,
				description: noteItem.description,
				tasks: noteItem.tasks,
				archived: noteItem.archived,
				userId: targetUser.id,
			})),
		);
		summary.notes += noteDefinitions.length;

		const budgetDefinitions = [
			{ categoryName: "Mercado", baseAmount: 1500 },
			{ categoryName: "Restaurantes", baseAmount: 480 },
			{ categoryName: "Transporte", baseAmount: 620 },
			{ categoryName: "Moradia", baseAmount: 3200 },
			{ categoryName: "Lazer", baseAmount: 420 },
			{ categoryName: "Assinaturas", baseAmount: 240 },
		] as const;

		const budgetRows = periods.flatMap((period, index) =>
			budgetDefinitions.map((budgetItem) => ({
				amount: (budgetItem.baseAmount + index * 15).toFixed(2),
				period,
				userId: targetUser.id,
				categoryId: getCategoryId(budgetItem.categoryName),
			})),
		);

		await tx.insert(budgets).values(budgetRows);
		summary.budgets += budgetRows.length;
	});

	const seedTransactionRecords: TransactionInsert[] = [];

	const createRecords = (input: SeedTransactionInput) => {
		seedTransactionRecords.push(
			...createTransactionRecords(input, targetUser.id, businessToday.date),
		);
	};

	createRecords({
		name: "Salário - OpenMonetis Labs",
		amount: 7800,
		purchaseDate: dateForPeriodDay(firstPeriod, 5),
		transactionType: "Receita",
		condition: "Recorrente",
		paymentMethod: "Transferência bancária",
		accountId: createdAccounts.nubank,
		categoryId: getCategoryId("Salário"),
		payerId: adminPayer.id,
		recurrenceCount: options.months,
		note: "Salario mensal recebido via TED.",
	});

	createRecords({
		name: "Aluguel - Edifício Aurora",
		amount: 2800,
		purchaseDate: dateForPeriodDay(firstPeriod, 5),
		transactionType: "Despesa",
		condition: "Recorrente",
		paymentMethod: "Pix",
		accountId: createdAccounts.nubank,
		categoryId: getCategoryId("Moradia"),
		payerId: adminPayer.id,
		secondaryPayerId: createdPayers.marina,
		isSplit: true,
		primarySplitAmount: 1400,
		secondarySplitAmount: 1400,
		recurrenceCount: options.months,
		dueDate: dateForPeriodDay(firstPeriod, 8),
		note: "Despesa fixa dividida com Marina.",
	});

	createRecords({
		name: "Vivo Fibra",
		amount: 129.9,
		purchaseDate: dateForPeriodDay(firstPeriod, 2),
		transactionType: "Despesa",
		condition: "Recorrente",
		paymentMethod: "Boleto",
		accountId: createdAccounts.itau,
		categoryId: getCategoryId("Internet"),
		payerId: adminPayer.id,
		recurrenceCount: options.months,
		dueDate: dateForPeriodDay(firstPeriod, 12),
		note: "Internet da casa.",
	});

	createRecords({
		name: "Conta de luz - Enel",
		amount: 186.4,
		purchaseDate: dateForPeriodDay(firstPeriod, 3),
		transactionType: "Despesa",
		condition: "Recorrente",
		paymentMethod: "Boleto",
		accountId: createdAccounts.itau,
		categoryId: getCategoryId("Energia e água"),
		payerId: adminPayer.id,
		recurrenceCount: options.months,
		dueDate: dateForPeriodDay(firstPeriod, 18),
		note: "Conta mensal de energia.",
	});

	createRecords({
		name: "Netflix",
		amount: 55.9,
		purchaseDate: dateForPeriodDay(firstPeriod, 9),
		transactionType: "Despesa",
		condition: "Recorrente",
		paymentMethod: "Cartão de crédito",
		cardId: createdCards.ultravioleta.id,
		categoryId: getCategoryId("Assinaturas"),
		payerId: adminPayer.id,
		recurrenceCount: options.months,
		cardMeta: createdCards.ultravioleta,
		note: "Assinatura recorrente.",
	});

	createRecords({
		name: "Smart Fit",
		amount: 129.9,
		purchaseDate: dateForPeriodDay(firstPeriod, 11),
		transactionType: "Despesa",
		condition: "Recorrente",
		paymentMethod: "Cartão de crédito",
		cardId: createdCards.ultravioleta.id,
		categoryId: getCategoryId("Saúde"),
		payerId: adminPayer.id,
		recurrenceCount: options.months,
		cardMeta: createdCards.ultravioleta,
		note: "Plano black mensal.",
	});

	createRecords({
		name: "Spotify",
		amount: 21.9,
		purchaseDate: dateForPeriodDay(firstPeriod, 8),
		transactionType: "Despesa",
		condition: "Recorrente",
		paymentMethod: "Cartão de crédito",
		cardId: createdCards.ultravioleta.id,
		categoryId: getCategoryId("Assinaturas"),
		payerId: adminPayer.id,
		recurrenceCount: options.months,
		cardMeta: createdCards.ultravioleta,
		note: "Assinatura premium individual.",
	});

	createRecords({
		name: "Plano de saúde - Amil",
		amount: 389,
		purchaseDate: dateForPeriodDay(firstPeriod, 4),
		transactionType: "Despesa",
		condition: "Recorrente",
		paymentMethod: "Boleto",
		accountId: createdAccounts.itau,
		categoryId: getCategoryId("Saúde"),
		payerId: adminPayer.id,
		recurrenceCount: options.months,
		dueDate: dateForPeriodDay(firstPeriod, 10),
		note: "Plano coletivo com coparticipação.",
	});

	createRecords({
		name: "Seguro auto - Porto Seguro",
		amount: 278.5,
		purchaseDate: dateForPeriodDay(firstPeriod, 6),
		transactionType: "Despesa",
		condition: "Recorrente",
		paymentMethod: "Boleto",
		accountId: createdAccounts.itau,
		categoryId: getCategoryId("Transporte"),
		payerId: adminPayer.id,
		recurrenceCount: options.months,
		dueDate: dateForPeriodDay(firstPeriod, 15),
		note: "Parcela mensal do seguro do carro.",
	});

	createRecords({
		name: "Condomínio - Edifício Aurora",
		amount: 680,
		purchaseDate: dateForPeriodDay(firstPeriod, 1),
		transactionType: "Despesa",
		condition: "Recorrente",
		paymentMethod: "Pix",
		accountId: createdAccounts.nubank,
		categoryId: getCategoryId("Moradia"),
		payerId: adminPayer.id,
		recurrenceCount: options.months,
		dueDate: dateForPeriodDay(firstPeriod, 10),
		note: "Taxa condominial mensal.",
	});

	for (const [index, period] of periods.entries()) {
		const marketAmount = 420 + index * 37.5;
		const uberAmount = 32 + index * 4.75;
		const fuelAmount = 170 + index * 18.2;
		const ifoodAmount = 62 + index * 7.3;
		const investmentYield = 68 + index * 4.4;

		createRecords({
			name: "Assaí Atacadista",
			amount: marketAmount,
			purchaseDate: dateForPeriodDay(period, 6),
			transactionType: "Despesa",
			condition: "À vista",
			paymentMethod: "Pix",
			accountId: createdAccounts.nubank,
			categoryId: getCategoryId("Mercado"),
			payerId: adminPayer.id,
			secondaryPayerId: createdPayers.marina,
			isSplit: true,
			primarySplitAmount: marketAmount / 2,
			secondarySplitAmount: marketAmount / 2,
			note: "Compra grande do mes dividida com Marina.",
		});

		createRecords({
			name: "Uber",
			amount: uberAmount,
			purchaseDate: dateForPeriodDay(period, 14),
			transactionType: "Despesa",
			condition: "À vista",
			paymentMethod: "Pix",
			accountId: createdAccounts["mercado-pago"],
			categoryId: getCategoryId("Transporte"),
			payerId: adminPayer.id,
			note: "Corridas do dia a dia.",
		});

		createRecords({
			name: "Posto Shell",
			amount: fuelAmount,
			purchaseDate: dateForPeriodDay(period, 18),
			transactionType: "Despesa",
			condition: "À vista",
			paymentMethod: "Cartão de débito",
			accountId: createdAccounts.itau,
			categoryId: getCategoryId("Transporte"),
			payerId: adminPayer.id,
			note: "Abastecimento mensal.",
		});

		createRecords({
			name: "iFood",
			amount: ifoodAmount,
			purchaseDate: dateForPeriodDay(period, 20),
			transactionType: "Despesa",
			condition: "À vista",
			paymentMethod: "Cartão de crédito",
			cardId: createdCards.ultravioleta.id,
			categoryId: getCategoryId("Delivery"),
			payerId: adminPayer.id,
			cardMeta: createdCards.ultravioleta,
			note: "Pedidos de jantar.",
		});

		createRecords({
			name: "Rendimento CDB Itaú",
			amount: investmentYield,
			purchaseDate: dateForPeriodDay(period, 27),
			transactionType: "Receita",
			condition: "À vista",
			paymentMethod: "Transferência bancária",
			accountId: createdAccounts.itau,
			categoryId: getCategoryId("Investimentos"),
			payerId: adminPayer.id,
			note: "Rendimento liquido do CDB.",
		});

		if (index % 2 === 0) {
			createRecords({
				name: "Amazon Brasil",
				amount: 148 + index * 12.8,
				purchaseDate: dateForPeriodDay(period, 22),
				transactionType: "Despesa",
				condition: "À vista",
				paymentMethod: "Cartão de crédito",
				cardId: createdCards.itaucard.id,
				categoryId: getCategoryId("Compras"),
				payerId: adminPayer.id,
				cardMeta: createdCards.itaucard,
				note: "Itens de casa e pequenos eletrônicos.",
			});
		}

		if (index % 2 === 1) {
			createRecords({
				name: "Freela - Clínica Aurora",
				amount: 1450 + index * 120,
				purchaseDate: dateForPeriodDay(period, 24),
				transactionType: "Receita",
				condition: "À vista",
				paymentMethod: "Pix",
				accountId: createdAccounts.nubank,
				categoryId: getCategoryId("Freelance"),
				payerId: adminPayer.id,
				note: "Projeto extra de landing page.",
			});
		}

		if (index % 3 === 0) {
			createRecords({
				name: "Coco Bambu",
				amount: 212 + index * 9.5,
				purchaseDate: dateForPeriodDay(period, 25),
				transactionType: "Despesa",
				condition: "À vista",
				paymentMethod: "Cartão de crédito",
				cardId: createdCards.itaucard.id,
				categoryId: getCategoryId("Restaurantes"),
				payerId: adminPayer.id,
				cardMeta: createdCards.itaucard,
				note: "Jantar de fim de semana.",
			});
		}

		if (index % 2 === 0) {
			createRecords({
				name: "Drogasil",
				amount: 46 + index * 6.25,
				purchaseDate: dateForPeriodDay(period, 12),
				transactionType: "Despesa",
				condition: "À vista",
				paymentMethod: "Cartão de débito",
				accountId: createdAccounts.nubank,
				categoryId: getCategoryId("Saúde"),
				payerId: adminPayer.id,
				note: "Remédios e itens de farmácia.",
			});
		}

		if (index % 2 === 1) {
			createRecords({
				name: "Ultrafarma",
				amount: 52 + index * 5.5,
				purchaseDate: dateForPeriodDay(period, 16),
				transactionType: "Despesa",
				condition: "À vista",
				paymentMethod: "Cartão de débito",
				accountId: createdAccounts.nubank,
				categoryId: getCategoryId("Saúde"),
				payerId: adminPayer.id,
				note: "Medicamentos e suplementos.",
			});
		}

		createRecords({
			name: "Pão de Açúcar",
			amount: 280 + index * 22.4,
			purchaseDate: dateForPeriodDay(period, 10),
			transactionType: "Despesa",
			condition: "À vista",
			paymentMethod: "Cartão de crédito",
			cardId: createdCards.itaucard.id,
			categoryId: getCategoryId("Mercado"),
			payerId: adminPayer.id,
			cardMeta: createdCards.itaucard,
			note: "Compra semanal de hortifruti e frios.",
		});

		createRecords({
			name: "McDonald's",
			amount: 42 + index * 3.8,
			purchaseDate: dateForPeriodDay(period, 16),
			transactionType: "Despesa",
			condition: "À vista",
			paymentMethod: "Pré-Pago | VR/VA",
			accountId: createdAccounts["mercado-pago"],
			categoryId: getCategoryId("Alimentação"),
			payerId: adminPayer.id,
			note: "Almoço rápido no intervalo.",
		});

		if (index % 2 === 0) {
			createRecords({
				name: "Cinemark",
				amount: 130 + index * 8.5,
				purchaseDate: dateForPeriodDay(period, 21),
				transactionType: "Despesa",
				condition: "À vista",
				paymentMethod: "Cartão de crédito",
				cardId: createdCards.itaucard.id,
				categoryId: getCategoryId("Lazer"),
				payerId: adminPayer.id,
				cardMeta: createdCards.itaucard,
				note: "Ingresso + pipoca pra dois.",
			});
		}
	}

	createRecords({
		name: "Notebook Dell Inspiron",
		amount: 7199.2,
		purchaseDate: dateForPeriodDay(firstPeriod, 28),
		transactionType: "Despesa",
		condition: "Parcelado",
		paymentMethod: "Cartão de crédito",
		cardId: createdCards.itaucard.id,
		categoryId: getCategoryId("Compras"),
		payerId: adminPayer.id,
		installmentCount: 8,
		cardMeta: createdCards.itaucard,
		note: "Troca do notebook do home office.",
	});

	createRecords({
		name: "Ar-condicionado Springer Midea",
		amount: 2899.8,
		purchaseDate: dateForPeriodDay(secondPeriod, 26),
		transactionType: "Despesa",
		condition: "Parcelado",
		paymentMethod: "Cartão de crédito",
		cardId: createdCards.ultravioleta.id,
		categoryId: getCategoryId("Moradia"),
		payerId: adminPayer.id,
		installmentCount: 6,
		cardMeta: createdCards.ultravioleta,
		note: "Compra feita para o quarto do casal.",
	});

	createRecords({
		name: "Passagem LATAM - Salvador",
		amount: 2140.5,
		purchaseDate: dateForPeriodDay(thirdPeriod, 16),
		transactionType: "Despesa",
		condition: "Parcelado",
		paymentMethod: "Cartão de crédito",
		cardId: createdCards.ultravioleta.id,
		categoryId: getCategoryId("Viagem"),
		payerId: adminPayer.id,
		secondaryPayerId: createdPayers.eduardo,
		isSplit: true,
		primarySplitAmount: 1498.35,
		secondarySplitAmount: 642.15,
		installmentCount: 5,
		cardMeta: createdCards.ultravioleta,
		note: "Viagem dividida com Eduardo.",
	});

	createRecords({
		name: "Reembolso plano de saúde",
		amount: 185.4,
		purchaseDate: dateForPeriodDay(middlePeriod, 26),
		transactionType: "Receita",
		condition: "À vista",
		paymentMethod: "Pix",
		accountId: createdAccounts.nubank,
		categoryId: getCategoryId("Reembolso"),
		payerId: adminPayer.id,
		note: "Reembolso de consulta realizada no mes anterior.",
	});

	createRecords({
		name: "Consulta dentista - Dra. Ana",
		amount: 240,
		purchaseDate: dateForPeriodDay(middlePeriod, 9),
		transactionType: "Despesa",
		condition: "À vista",
		paymentMethod: "Boleto",
		accountId: createdAccounts.itau,
		categoryId: getCategoryId("Saúde"),
		payerId: adminPayer.id,
		dueDate: dateForPeriodDay(middlePeriod, 17),
		note: "Procedimento odontológico.",
	});

	createRecords({
		name: "IPVA 2026 - parcela única",
		amount: 684.32,
		purchaseDate: dateForPeriodDay(lastPeriod, 10),
		transactionType: "Despesa",
		condition: "À vista",
		paymentMethod: "Boleto",
		accountId: createdAccounts.itau,
		categoryId: getCategoryId("Transporte"),
		payerId: adminPayer.id,
		dueDate: dateForPeriodDay(lastPeriod, 25),
		note: "Mantido em aberto para testar lembretes e listagem de boletos.",
		settlementBehavior: "open",
	});

	createRecords({
		name: "iPhone 16 Pro",
		amount: 9299.1,
		purchaseDate: dateForPeriodDay(secondPeriod, 14),
		transactionType: "Despesa",
		condition: "Parcelado",
		paymentMethod: "Cartão de crédito",
		cardId: createdCards.itaucard.id,
		categoryId: getCategoryId("Compras"),
		payerId: adminPayer.id,
		installmentCount: 12,
		cardMeta: createdCards.itaucard,
		note: "Troca do celular, 12x sem juros.",
	});

	createRecords({
		name: "Alura - assinatura anual",
		amount: 1499.9,
		purchaseDate: dateForPeriodDay(firstPeriod, 20),
		transactionType: "Despesa",
		condition: "À vista",
		paymentMethod: "Cartão de crédito",
		cardId: createdCards.ultravioleta.id,
		categoryId: getCategoryId("Educação"),
		payerId: adminPayer.id,
		cardMeta: createdCards.ultravioleta,
		note: "Plano anual para desenvolvimento web e mobile.",
	});

	createRecords({
		name: "Presente - aniversário Eduardo",
		amount: 189,
		purchaseDate: dateForPeriodDay(thirdPeriod, 11),
		transactionType: "Despesa",
		condition: "À vista",
		paymentMethod: "Pix",
		accountId: createdAccounts.nubank,
		categoryId: getCategoryId("Presentes"),
		payerId: adminPayer.id,
		note: "Presente de aniversário para o Eduardo.",
	});

	createRecords({
		name: "Zara - jaqueta e calça",
		amount: 599.8,
		purchaseDate: dateForPeriodDay(middlePeriod, 17),
		transactionType: "Despesa",
		condition: "À vista",
		paymentMethod: "Cartão de crédito",
		cardId: createdCards.ultravioleta.id,
		categoryId: getCategoryId("Vestuário"),
		payerId: adminPayer.id,
		cardMeta: createdCards.ultravioleta,
		note: "Roupas de inverno.",
	});

	createRecords({
		name: "Show Criolo - Audio Club",
		amount: 320,
		purchaseDate: dateForPeriodDay(middlePeriod, 8),
		transactionType: "Despesa",
		condition: "Parcelado",
		paymentMethod: "Cartão de crédito",
		cardId: createdCards.ultravioleta.id,
		categoryId: getCategoryId("Lazer"),
		payerId: adminPayer.id,
		secondaryPayerId: createdPayers.marina,
		isSplit: true,
		primarySplitAmount: 160,
		secondarySplitAmount: 160,
		installmentCount: 2,
		cardMeta: createdCards.ultravioleta,
		note: "Ingressos divididos com a Marina.",
	});

	await db.insert(transactions).values(seedTransactionRecords);
	summary.transactions += seedTransactionRecords.length;

	const { createdInvoices, createdInvoicePayments } =
		await seedInvoicesForCards({
			userId: targetUser.id,
			adminPayerId: adminPayer.id,
			cardsByKey: createdCards,
			paymentCategoryId: categoriesByName.get("Pagamentos"),
			insertedTransactionRecords: seedTransactionRecords,
		});

	summary.invoices += createdInvoices;
	summary.invoicePayments += createdInvoicePayments;
	summary.transactions += createdInvoicePayments;

	const inboxItemsData = [
		{
			userId: targetUser.id,
			sourceApp: "com.nu.production",
			sourceAppName: "Nubank",
			originalTitle: "Compra aprovada",
			originalText:
				"Compra de R$ 73,90 aprovada no cartão Ultravioleta em RAPPI*RAPPI BR",
			notificationTimestamp: parseLocalDateString(
				dateForPeriodDay(lastPeriod, 3),
			),
			parsedName: "Rappi",
			parsedAmount: "73.90",
			status: "pending" as const,
			transactionId: null,
			processedAt: null,
			discardedAt: null,
		},
		{
			userId: targetUser.id,
			sourceApp: "com.nu.production",
			sourceAppName: "Nubank",
			originalTitle: "Pix enviado",
			originalText: "Você enviou R$ 210,00 via Pix para Marina Oliveira.",
			notificationTimestamp: parseLocalDateString(
				dateForPeriodDay(lastPeriod, 5),
			),
			parsedName: "Marina Oliveira",
			parsedAmount: "210.00",
			status: "pending" as const,
			transactionId: null,
			processedAt: null,
			discardedAt: null,
		},
		{
			userId: targetUser.id,
			sourceApp: "br.com.itau.personnalite",
			sourceAppName: "Itaú Personnalité",
			originalTitle: "Débito em conta",
			originalText: "Débito de R$45,80 realizado. PADARIA NOSSA SENHORA",
			notificationTimestamp: parseLocalDateString(
				dateForPeriodDay(lastPeriod, 7),
			),
			parsedName: "Padaria Nossa Senhora",
			parsedAmount: "45.80",
			status: "pending" as const,
			transactionId: null,
			processedAt: null,
			discardedAt: null,
		},
		{
			userId: targetUser.id,
			sourceApp: "br.com.itau.personnalite",
			sourceAppName: "Itaú Personnalité",
			originalTitle: "Compra aprovada",
			originalText:
				"Compra de R$387,40 aprovada no cartão PÃO DE AÇÚCAR. Limite disponível: R$8.112,60",
			notificationTimestamp: parseLocalDateString(
				dateForPeriodDay(lastPeriod, 10),
			),
			parsedName: "Pão de Açúcar",
			parsedAmount: "387.40",
			status: "pending" as const,
			transactionId: null,
			processedAt: null,
			discardedAt: null,
		},
		{
			userId: targetUser.id,
			sourceApp: "com.mercadopago.wallet",
			sourceAppName: "Mercado Pago",
			originalTitle: null,
			originalText: "Pagamento de R$38,50 aprovado em 99APP*CORRIDA",
			notificationTimestamp: parseLocalDateString(
				dateForPeriodDay(lastPeriod, 13),
			),
			parsedName: "99App",
			parsedAmount: "38.50",
			status: "pending" as const,
			transactionId: null,
			processedAt: null,
			discardedAt: null,
		},
		{
			userId: targetUser.id,
			sourceApp: "com.nu.production",
			sourceAppName: "Nubank",
			originalTitle: "Compra aprovada",
			originalText:
				"Compra de R$ 124,90 aprovada no cartão Ultravioleta em SHOPEE*SHOPEE BR",
			notificationTimestamp: parseLocalDateString(
				dateForPeriodDay(lastPeriod, 18),
			),
			parsedName: "Shopee",
			parsedAmount: "124.90",
			status: "pending" as const,
			transactionId: null,
			processedAt: null,
			discardedAt: null,
		},
		{
			userId: targetUser.id,
			sourceApp: "com.nu.production",
			sourceAppName: "Nubank",
			originalTitle: "Compra aprovada",
			originalText:
				"Compra de R$ 199,90 aprovada no cartão Ultravioleta em AMERICANAS S.A",
			notificationTimestamp: parseLocalDateString(
				dateForPeriodDay(lastPeriod, 21),
			),
			parsedName: "Americanas",
			parsedAmount: "199.90",
			status: "pending" as const,
			transactionId: null,
			processedAt: null,
			discardedAt: null,
		},
		{
			userId: targetUser.id,
			sourceApp: "com.mercadopago.wallet",
			sourceAppName: "Mercado Pago",
			originalTitle: null,
			originalText: "Você pagou R$12,50 via Pix para POSTO IPIRANGA",
			notificationTimestamp: parseLocalDateString(
				dateForPeriodDay(lastPeriod, 22),
			),
			parsedName: "Posto Ipiranga",
			parsedAmount: "12.50",
			status: "pending" as const,
			transactionId: null,
			processedAt: null,
			discardedAt: null,
		},
	];

	await db.insert(inboxItems).values(inboxItemsData);
	summary.inboxItems += inboxItemsData.length;

	const finalPeriods = Array.from(
		new Set(
			seedTransactionRecords
				.map((record) => record.period ?? "")
				.filter(Boolean),
		),
	).sort(comparePeriods);

	const seededFrom = finalPeriods[0] ?? options.startPeriod;
	const seededTo = finalPeriods[finalPeriods.length - 1] ?? options.startPeriod;

	console.log("Seed concluído com sucesso.");
	console.log(
		JSON.stringify(
			{
				userId: targetUser.id,
				userName: targetUser.name,
				startPeriod: options.startPeriod,
				months: options.months,
				seededFrom,
				seededTo,
				todayPeriod: businessToday.period,
				summary,
			},
			null,
			2,
		),
	);
}

void main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(
			error instanceof Error
				? error.message
				: "Erro inesperado ao popular conta.",
		);
		process.exit(1);
	});

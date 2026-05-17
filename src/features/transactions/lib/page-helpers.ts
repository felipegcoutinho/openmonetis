import type { SQL } from "drizzle-orm";
import {
	and,
	eq,
	gte,
	ilike,
	inArray,
	isNotNull,
	lte,
	or,
	sql,
} from "drizzle-orm";
import {
	cards,
	type categories,
	financialAccounts,
	type payers,
	transactionAttachments,
	transactions,
} from "@/db/schema";
import type { SelectOption } from "@/features/transactions/components/types";
import {
	AMOUNT_MAX_PARAM,
	AMOUNT_MIN_PARAM,
	PAYMENT_METHODS,
	SETTLED_FILTER_VALUES,
	TRANSACTION_CONDITIONS,
	TRANSACTION_TYPES,
} from "@/features/transactions/lib/constants";
import { ACCOUNT_AUTO_INVOICE_NOTE_PREFIX } from "@/shared/lib/accounts/constants";
import {
	PAYER_ROLE_ADMIN,
	PAYER_ROLE_THIRD_PARTY,
} from "@/shared/lib/payers/constants";
import { toDateOnlyString } from "@/shared/utils/date";
import { slugify } from "@/shared/utils/string";

type PayerRow = typeof payers.$inferSelect;
type AccountRow = typeof financialAccounts.$inferSelect;
type CardRow = typeof cards.$inferSelect;
type CategoryRow = typeof categories.$inferSelect;

export type ResolvedSearchParams =
	| Record<string, string | string[] | undefined>
	| undefined;

const TRANSACTIONS_DEFAULT_PAGE_SIZE = 30;
const TRANSACTIONS_PAGE_SIZE_OPTIONS = [5, 10, 20, 30, 40, 50, 100];

export type TransactionSearchFilters = {
	transactionFilter: string | null;
	conditionFilters: string[];
	paymentFilters: string[];
	payerFilters: string[];
	categoryFilters: string[];
	accountCardFilters: string[];
	searchFilter: string | null;
	settledFilter: string | null;
	attachmentFilter: string | null;
	dividedFilter: string | null;
	amountMinFilter: number | null;
	amountMaxFilter: number | null;
};

type BaseSluggedOption = {
	id: string;
	label: string;
	slug: string;
};

type PayerSluggedOption = BaseSluggedOption & {
	role: string | null;
	avatarUrl: string | null;
};

type CategorySluggedOption = BaseSluggedOption & {
	type: string | null;
	icon: string | null;
};

type AccountSluggedOption = BaseSluggedOption & {
	kind: "conta";
	logo: string | null;
	accountType: string | null;
};

type CardSluggedOption = BaseSluggedOption & {
	kind: "cartao";
	logo: string | null;
	closingDay: string | null;
	dueDay: string | null;
};

export type SluggedFilters = {
	payerFiltersRaw: PayerSluggedOption[];
	categoryFiltersRaw: CategorySluggedOption[];
	accountFiltersRaw: AccountSluggedOption[];
	cardFiltersRaw: CardSluggedOption[];
};

export type SlugMaps = {
	payer: Map<string, string>;
	category: Map<string, string>;
	financialAccount: Map<string, string>;
	card: Map<string, string>;
};

type FilterOption = {
	slug: string;
	label: string;
};

type AccountCardFilterOption = FilterOption & {
	kind: "conta" | "cartao";
};

type TransactionOptionSets = {
	payerOptions: SelectOption[];
	splitPayerOptions: SelectOption[];
	defaultPayerId: string | null;
	accountOptions: SelectOption[];
	cardOptions: SelectOption[];
	categoryOptions: SelectOption[];
	payerFilterOptions: FilterOption[];
	categoryFilterOptions: FilterOption[];
	accountCardFilterOptions: AccountCardFilterOption[];
};

export const getSingleParam = (
	params: ResolvedSearchParams,
	key: string,
): string | null => {
	const value = params?.[key];
	if (!value) {
		return null;
	}
	return Array.isArray(value) ? (value[0] ?? null) : value;
};

export const getMultiParam = (
	params: ResolvedSearchParams,
	key: string,
): string[] => {
	const value = params?.[key];
	if (!value) {
		return [];
	}
	const list = Array.isArray(value) ? value : [value];
	return list.filter((item): item is string => Boolean(item));
};

export const parsePositiveAmount = (value: string | null): number | null => {
	if (!value) return null;
	const normalized = Number.parseFloat(value.replace(",", "."));
	if (!Number.isFinite(normalized) || normalized < 0) return null;
	return Math.round(normalized * 100) / 100;
};

export const extractTransactionSearchFilters = (
	params: ResolvedSearchParams,
): TransactionSearchFilters => ({
	transactionFilter: getSingleParam(params, "type"),
	conditionFilters: getMultiParam(params, "condition"),
	paymentFilters: getMultiParam(params, "payment"),
	payerFilters: getMultiParam(params, "payer"),
	categoryFilters: getMultiParam(params, "category"),
	accountCardFilters: getMultiParam(params, "accountCard"),
	searchFilter: getSingleParam(params, "q"),
	settledFilter: getSingleParam(params, "settled"),
	attachmentFilter: getSingleParam(params, "hasAttachment"),
	dividedFilter: getSingleParam(params, "isDivided"),
	amountMinFilter: parsePositiveAmount(
		getSingleParam(params, AMOUNT_MIN_PARAM),
	),
	amountMaxFilter: parsePositiveAmount(
		getSingleParam(params, AMOUNT_MAX_PARAM),
	),
});

export const resolveTransactionPagination = (
	params: ResolvedSearchParams,
): {
	page: number;
	pageSize: number;
} => {
	const pageParam = Number.parseInt(getSingleParam(params, "page") ?? "", 10);
	const pageSizeParam = Number.parseInt(
		getSingleParam(params, "pageSize") ?? "",
		10,
	);

	const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
	const pageSize = TRANSACTIONS_PAGE_SIZE_OPTIONS.includes(pageSizeParam)
		? pageSizeParam
		: TRANSACTIONS_DEFAULT_PAGE_SIZE;

	return { page, pageSize };
};

const normalizeLabel = (value: string | null | undefined) =>
	value?.trim().length ? value.trim() : "Sem descrição";

const typeSlugToValue = Object.fromEntries(
	TRANSACTION_TYPES.map((t) => [slugify(t), t]),
) as Record<string, (typeof TRANSACTION_TYPES)[number]>;

const conditionSlugToValue = Object.fromEntries(
	TRANSACTION_CONDITIONS.map((c) => [slugify(c), c]),
) as Record<string, (typeof TRANSACTION_CONDITIONS)[number]>;

const paymentSlugToValue = Object.fromEntries(
	PAYMENT_METHODS.map((m) => [slugify(m), m]),
) as Record<string, (typeof PAYMENT_METHODS)[number]>;

const createSlugGenerator = () => {
	const seen = new Map<string, number>();
	return (label: string) => {
		const base = slugify(label);
		const count = seen.get(base) ?? 0;
		seen.set(base, count + 1);
		if (count === 0) {
			return base;
		}
		return `${base}-${count + 1}`;
	};
};

const toOption = (
	value: string,
	label: string | null | undefined,
	role?: string | null,
	group?: string | null,
	slug?: string | null,
	avatarUrl?: string | null,
	logo?: string | null,
	icon?: string | null,
	accountType?: string | null,
	closingDay?: string | null,
	dueDay?: string | null,
): SelectOption => ({
	value,
	label: normalizeLabel(label),
	role: role ?? null,
	group: group ?? null,
	slug: slug ?? null,
	avatarUrl: avatarUrl ?? null,
	logo: logo ?? null,
	icon: icon ?? null,
	accountType: accountType ?? null,
	closingDay: closingDay ?? null,
	dueDay: dueDay ?? null,
});

export const buildSluggedFilters = ({
	payerRows,
	categoryRows,
	accountRows,
	cardRows,
}: {
	payerRows: PayerRow[];
	categoryRows: CategoryRow[];
	accountRows: AccountRow[];
	cardRows: CardRow[];
}): SluggedFilters => {
	const payerSlugger = createSlugGenerator();
	const categorySlugger = createSlugGenerator();
	const accountCardSlugger = createSlugGenerator();

	const payerFiltersRaw = payerRows.map((payer) => {
		const label = normalizeLabel(payer.name);
		return {
			id: payer.id,
			label,
			slug: payerSlugger(label),
			role: payer.role ?? null,
			avatarUrl: payer.avatarUrl ?? null,
		};
	});

	const categoryFiltersRaw = categoryRows.map((category) => {
		const label = normalizeLabel(category.name);
		return {
			id: category.id,
			label,
			slug: categorySlugger(label),
			type: category.type ?? null,
			icon: category.icon ?? null,
		};
	});

	const accountFiltersRaw = accountRows.map((account) => {
		const label = normalizeLabel(account.name);
		return {
			id: account.id,
			label,
			slug: accountCardSlugger(label),
			kind: "conta" as const,
			logo: account.logo ?? null,
			accountType: account.accountType ?? null,
		};
	});

	const cardFiltersRaw = cardRows.map((card) => {
		const label = normalizeLabel(card.name);
		return {
			id: card.id,
			label,
			slug: accountCardSlugger(label),
			kind: "cartao" as const,
			logo: card.logo ?? null,
			closingDay: card.closingDay ?? null,
			dueDay: card.dueDay ?? null,
		};
	});

	return {
		payerFiltersRaw,
		categoryFiltersRaw,
		accountFiltersRaw,
		cardFiltersRaw,
	};
};

export const buildSlugMaps = ({
	payerFiltersRaw,
	categoryFiltersRaw,
	accountFiltersRaw,
	cardFiltersRaw,
}: SluggedFilters): SlugMaps => ({
	payer: new Map(payerFiltersRaw.map(({ slug, id }) => [slug, id])),
	category: new Map(categoryFiltersRaw.map(({ slug, id }) => [slug, id])),
	financialAccount: new Map(
		accountFiltersRaw.map(({ slug, id }) => [slug, id]),
	),
	card: new Map(cardFiltersRaw.map(({ slug, id }) => [slug, id])),
});

const isValidTransaction = (
	value: string | null,
): value is (typeof TRANSACTION_TYPES)[number] =>
	!!value && (TRANSACTION_TYPES as readonly string[]).includes(value ?? "");

const isValidCondition = (
	value: string | null,
): value is (typeof TRANSACTION_CONDITIONS)[number] =>
	!!value &&
	(TRANSACTION_CONDITIONS as readonly string[]).includes(value ?? "");

const isValidPaymentMethod = (
	value: string | null,
): value is (typeof PAYMENT_METHODS)[number] =>
	!!value && (PAYMENT_METHODS as readonly string[]).includes(value ?? "");

const buildSearchPattern = (value: string | null) =>
	value ? `%${value.trim().replace(/\s+/g, "%")}%` : null;

export const buildTransactionWhere = ({
	userId,
	period,
	filters,
	slugMaps,
	cardId,
	accountId,
	payerId,
}: {
	userId: string;
	period: string;
	filters: TransactionSearchFilters;
	slugMaps: SlugMaps;
	cardId?: string;
	accountId?: string;
	payerId?: string;
}): SQL[] => {
	const where: SQL[] = [
		eq(transactions.userId, userId),
		eq(transactions.period, period),
	];

	if (payerId) {
		where.push(eq(transactions.payerId, payerId));
	}

	if (cardId) {
		where.push(eq(transactions.cardId, cardId));
	}

	if (accountId) {
		where.push(eq(transactions.accountId, accountId));
	}

	const typeValue = typeSlugToValue[filters.transactionFilter ?? ""] ?? null;
	if (isValidTransaction(typeValue)) {
		where.push(eq(transactions.transactionType, typeValue));
	}

	const conditionValues = filters.conditionFilters
		.map((slug) => conditionSlugToValue[slug] ?? null)
		.filter(isValidCondition);
	if (conditionValues.length > 0) {
		where.push(inArray(transactions.condition, conditionValues));
	}

	const paymentValues = filters.paymentFilters
		.map((slug) => paymentSlugToValue[slug] ?? null)
		.filter(isValidPaymentMethod);
	if (paymentValues.length > 0) {
		where.push(inArray(transactions.paymentMethod, paymentValues));
	}

	if (!payerId && filters.payerFilters.length > 0) {
		const ids = filters.payerFilters
			.map((slug) => slugMaps.payer.get(slug))
			.filter((id): id is string => Boolean(id));
		if (ids.length > 0) {
			where.push(inArray(transactions.payerId, ids));
		}
	}

	if (filters.categoryFilters.length > 0) {
		const ids = filters.categoryFilters
			.map((slug) => slugMaps.category.get(slug))
			.filter((id): id is string => Boolean(id));
		if (ids.length > 0) {
			where.push(inArray(transactions.categoryId, ids));
		}
	}

	if (filters.accountCardFilters.length > 0) {
		const accountIds: string[] = [];
		const cardIds: string[] = [];
		for (const slug of filters.accountCardFilters) {
			const accountId = slugMaps.financialAccount.get(slug);
			if (accountId) {
				accountIds.push(accountId);
				continue;
			}
			const cardId = slugMaps.card.get(slug);
			if (cardId) {
				cardIds.push(cardId);
			}
		}
		if (accountIds.length > 0 && cardIds.length > 0) {
			where.push(
				or(
					inArray(transactions.accountId, accountIds),
					inArray(transactions.cardId, cardIds),
				) as SQL,
			);
		} else if (accountIds.length > 0) {
			where.push(inArray(transactions.accountId, accountIds));
		} else if (cardIds.length > 0) {
			where.push(inArray(transactions.cardId, cardIds));
		}
	}

	if (filters.settledFilter === SETTLED_FILTER_VALUES.PAID) {
		where.push(eq(transactions.isSettled, true));
	} else if (filters.settledFilter === SETTLED_FILTER_VALUES.UNPAID) {
		where.push(eq(transactions.isSettled, false));
	}

	if (filters.attachmentFilter === "true") {
		where.push(
			sql`EXISTS (SELECT 1 FROM ${transactionAttachments} WHERE ${transactionAttachments.transactionId} = ${transactions.id})`,
		);
	}

	if (filters.dividedFilter === "true") {
		where.push(eq(transactions.isDivided, true));
	}

	if (filters.amountMinFilter !== null) {
		where.push(
			gte(sql`abs(${transactions.amount})`, filters.amountMinFilter.toFixed(2)),
		);
	}

	if (filters.amountMaxFilter !== null) {
		where.push(
			lte(sql`abs(${transactions.amount})`, filters.amountMaxFilter.toFixed(2)),
		);
	}

	const searchPattern = buildSearchPattern(filters.searchFilter);
	if (searchPattern) {
		where.push(
			or(
				ilike(transactions.name, searchPattern),
				ilike(transactions.note, searchPattern),
				ilike(transactions.paymentMethod, searchPattern),
				ilike(transactions.condition, searchPattern),
				and(
					isNotNull(financialAccounts.name),
					ilike(financialAccounts.name, searchPattern),
				),
				and(isNotNull(cards.name), ilike(cards.name, searchPattern)),
			) as SQL,
		);
	}

	return where;
};

type TransactionRowWithRelations = Partial<typeof transactions.$inferSelect> & {
	payer?: PayerRow | null;
	financialAccount?: AccountRow | null;
	card?: CardRow | null;
	category?: CategoryRow | null;
	hasAttachments?: boolean;
};

export const mapTransactionsData = (rows: TransactionRowWithRelations[]) =>
	rows.map((item) => ({
		id: item.id ?? "",
		userId: item.userId ?? "",
		name: item.name ?? "",
		purchaseDate: toDateOnlyString(item.purchaseDate) ?? "",
		period: item.period ?? "",
		transactionType: item.transactionType ?? "",
		amount: Number(item.amount ?? 0),
		condition: item.condition ?? "",
		paymentMethod: item.paymentMethod ?? "",
		payerId: item.payerId ?? null,
		pagadorName: item.payer?.name ?? null,
		pagadorAvatar: item.payer?.avatarUrl ?? null,
		pagadorRole: item.payer?.role ?? null,
		accountId: item.accountId ?? null,
		contaName: item.financialAccount?.name ?? null,
		contaLogo: item.financialAccount?.logo ?? null,
		cardId: item.cardId ?? null,
		cartaoName: item.card?.name ?? null,
		cartaoLogo: item.card?.logo ?? null,
		categoryId: item.categoryId ?? null,
		categoriaName: item.category?.name ?? null,
		categoriaType: item.category?.type ?? null,
		categoriaIcon: item.category?.icon ?? null,
		installmentCount: item.installmentCount ?? null,
		recurrenceCount: item.recurrenceCount ?? null,
		currentInstallment: item.currentInstallment ?? null,
		dueDate: item.dueDate ? item.dueDate.toISOString().slice(0, 10) : null,
		boletoPaymentDate: item.boletoPaymentDate
			? item.boletoPaymentDate.toISOString().slice(0, 10)
			: null,
		note: item.note ?? null,
		isSettled: item.isSettled ?? null,
		isDivided: item.isDivided ?? false,
		isAnticipated: item.isAnticipated ?? false,
		anticipationId: item.anticipationId ?? null,
		seriesId: item.seriesId ?? null,
		splitGroupId: item.splitGroupId ?? null,
		hasAttachments: item.hasAttachments ?? false,
		readonly:
			Boolean(item.note?.startsWith(ACCOUNT_AUTO_INVOICE_NOTE_PREFIX)) ||
			item.category?.name === "Saldo inicial",
	}));

const sortByLabel = <T extends { label: string }>(items: T[]) =>
	items.sort((a, b) =>
		a.label.localeCompare(b.label, "pt-BR", { sensitivity: "base" }),
	);

export const buildOptionSets = ({
	payerFiltersRaw,
	categoryFiltersRaw,
	accountFiltersRaw,
	cardFiltersRaw,
	payerRows,
	limitCartaoId,
	limitContaId,
}: SluggedFilters & {
	payerRows: PayerRow[];
	limitCartaoId?: string;
	limitContaId?: string;
}): TransactionOptionSets => {
	const payerOptions = sortByLabel(
		payerFiltersRaw.map(({ id, label, role, slug, avatarUrl }) =>
			toOption(id, label, role, undefined, slug, avatarUrl),
		),
	);

	const payerFilterOptions = sortByLabel(
		payerFiltersRaw.map(({ slug, label, avatarUrl }) => ({
			slug,
			label,
			avatarUrl,
		})),
	);

	const defaultPayerId =
		payerRows.find((payer) => payer.role === PAYER_ROLE_ADMIN)?.id ?? null;

	const splitPayerOptions = payerOptions.filter(
		(option) => option.role === PAYER_ROLE_THIRD_PARTY,
	);

	const contaOptionsSource = limitContaId
		? accountFiltersRaw.filter((conta) => conta.id === limitContaId)
		: accountFiltersRaw;

	const accountOptions = sortByLabel(
		contaOptionsSource.map(({ id, label, slug, logo, accountType }) =>
			toOption(
				id,
				label,
				undefined,
				undefined,
				slug,
				undefined,
				logo,
				undefined,
				accountType,
			),
		),
	);

	const cartaoOptionsSource = limitCartaoId
		? cardFiltersRaw.filter((cartao) => cartao.id === limitCartaoId)
		: cardFiltersRaw;

	const cardOptions = sortByLabel(
		cartaoOptionsSource.map(({ id, label, slug, logo, closingDay, dueDay }) =>
			toOption(
				id,
				label,
				undefined,
				undefined,
				slug,
				undefined,
				logo,
				undefined,
				undefined,
				closingDay,
				dueDay,
			),
		),
	);

	const categoryOptions = sortByLabel(
		categoryFiltersRaw.map(({ id, label, type, slug, icon }) =>
			toOption(id, label, undefined, type, slug, undefined, undefined, icon),
		),
	);

	const categoryFilterOptions = sortByLabel(
		categoryFiltersRaw.map(({ slug, label, icon }) => ({ slug, label, icon })),
	);

	const accountCardFilterOptions = sortByLabel(
		[...accountFiltersRaw, ...cardFiltersRaw]
			.filter(
				(option) =>
					(limitCartaoId && option.kind === "cartao"
						? option.id === limitCartaoId
						: true) &&
					(limitContaId && option.kind === "conta"
						? option.id === limitContaId
						: true),
			)
			.map(({ slug, label, kind, logo }) => ({ slug, label, kind, logo })),
	);

	return {
		payerOptions,
		splitPayerOptions,
		defaultPayerId,
		accountOptions,
		cardOptions,
		categoryOptions,
		payerFilterOptions,
		categoryFilterOptions,
		accountCardFilterOptions,
	};
};

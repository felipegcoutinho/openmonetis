import type { payers } from "@/db/schema";
import type {
	AccountCardFilterOption,
	SelectOption,
	TransactionFilterOption,
	TransactionItem,
} from "@/features/transactions/components/types";
import type { buildOptionSets } from "@/features/transactions/page-helpers";

type OptionSet = ReturnType<typeof buildOptionSets>;

const normalizeOptionLabel = (
	value: string | null | undefined,
	fallback: string,
) => (value?.trim().length ? value.trim() : fallback);

export function buildReadOnlyOptionSets(
	items: TransactionItem[],
	payer: typeof payers.$inferSelect,
): OptionSet {
	const pagadorLabel = normalizeOptionLabel(payer.name, "Payer");
	const payerOptions: SelectOption[] = [
		{
			value: payer.id,
			label: pagadorLabel,
			slug: payer.id,
		},
	];

	const contaOptionsMap = new Map<string, SelectOption>();
	const cartaoOptionsMap = new Map<string, SelectOption>();
	const categoriaOptionsMap = new Map<string, SelectOption>();

	items.forEach((item) => {
		if (item.accountId && !contaOptionsMap.has(item.accountId)) {
			contaOptionsMap.set(item.accountId, {
				value: item.accountId,
				label: normalizeOptionLabel(item.contaName, "Conta sem nome"),
				slug: item.accountId,
			});
		}
		if (item.cardId && !cartaoOptionsMap.has(item.cardId)) {
			cartaoOptionsMap.set(item.cardId, {
				value: item.cardId,
				label: normalizeOptionLabel(item.cartaoName, "Cartão sem nome"),
				slug: item.cardId,
			});
		}
		if (item.categoryId && !categoriaOptionsMap.has(item.categoryId)) {
			categoriaOptionsMap.set(item.categoryId, {
				value: item.categoryId,
				label: normalizeOptionLabel(item.categoriaName, "Category"),
				slug: item.categoryId,
			});
		}
	});

	const accountOptions = Array.from(contaOptionsMap.values());
	const cardOptions = Array.from(cartaoOptionsMap.values());
	const categoryOptions = Array.from(categoriaOptionsMap.values());

	const payerFilterOptions: TransactionFilterOption[] = [
		{ slug: payer.id, label: pagadorLabel },
	];

	const categoryFilterOptions: TransactionFilterOption[] = categoryOptions.map(
		(option) => ({
			slug: option.value,
			label: option.label,
		}),
	);

	const accountCardFilterOptions: AccountCardFilterOption[] = [
		...accountOptions.map((option) => ({
			slug: option.value,
			label: option.label,
			kind: "conta" as const,
		})),
		...cardOptions.map((option) => ({
			slug: option.value,
			label: option.label,
			kind: "cartao" as const,
		})),
	];

	return {
		payerOptions,
		splitPayerOptions: [],
		defaultPayerId: payer.id,
		accountOptions,
		cardOptions,
		categoryOptions,
		payerFilterOptions,
		categoryFilterOptions,
		accountCardFilterOptions,
	};
}

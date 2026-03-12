import type { pagadores } from "@/db/schema";
import type {
	ContaCartaoFilterOption,
	LancamentoFilterOption,
	LancamentoItem,
	SelectOption,
} from "@/features/transactions/components/types";
import type { buildOptionSets } from "@/features/transactions/page-helpers";

type OptionSet = ReturnType<typeof buildOptionSets>;

const normalizeOptionLabel = (
	value: string | null | undefined,
	fallback: string,
) => (value?.trim().length ? value.trim() : fallback);

export function buildReadOnlyOptionSets(
	items: LancamentoItem[],
	pagador: typeof pagadores.$inferSelect,
): OptionSet {
	const pagadorLabel = normalizeOptionLabel(pagador.name, "Pagador");
	const pagadorOptions: SelectOption[] = [
		{
			value: pagador.id,
			label: pagadorLabel,
			slug: pagador.id,
		},
	];

	const contaOptionsMap = new Map<string, SelectOption>();
	const cartaoOptionsMap = new Map<string, SelectOption>();
	const categoriaOptionsMap = new Map<string, SelectOption>();

	items.forEach((item) => {
		if (item.contaId && !contaOptionsMap.has(item.contaId)) {
			contaOptionsMap.set(item.contaId, {
				value: item.contaId,
				label: normalizeOptionLabel(item.contaName, "Conta sem nome"),
				slug: item.contaId,
			});
		}
		if (item.cartaoId && !cartaoOptionsMap.has(item.cartaoId)) {
			cartaoOptionsMap.set(item.cartaoId, {
				value: item.cartaoId,
				label: normalizeOptionLabel(item.cartaoName, "Cartão sem nome"),
				slug: item.cartaoId,
			});
		}
		if (item.categoriaId && !categoriaOptionsMap.has(item.categoriaId)) {
			categoriaOptionsMap.set(item.categoriaId, {
				value: item.categoriaId,
				label: normalizeOptionLabel(item.categoriaName, "Categoria"),
				slug: item.categoriaId,
			});
		}
	});

	const contaOptions = Array.from(contaOptionsMap.values());
	const cartaoOptions = Array.from(cartaoOptionsMap.values());
	const categoriaOptions = Array.from(categoriaOptionsMap.values());

	const pagadorFilterOptions: LancamentoFilterOption[] = [
		{ slug: pagador.id, label: pagadorLabel },
	];

	const categoriaFilterOptions: LancamentoFilterOption[] = categoriaOptions.map(
		(option) => ({
			slug: option.value,
			label: option.label,
		}),
	);

	const contaCartaoFilterOptions: ContaCartaoFilterOption[] = [
		...contaOptions.map((option) => ({
			slug: option.value,
			label: option.label,
			kind: "conta" as const,
		})),
		...cartaoOptions.map((option) => ({
			slug: option.value,
			label: option.label,
			kind: "cartao" as const,
		})),
	];

	return {
		pagadorOptions,
		splitPagadorOptions: [],
		defaultPagadorId: pagador.id,
		contaOptions,
		cartaoOptions,
		categoriaOptions,
		pagadorFilterOptions,
		categoriaFilterOptions,
		contaCartaoFilterOptions,
	};
}

import { and, desc, eq } from "drizzle-orm";
import { cartoes, categorias, contas, preLancamentos } from "@/db/schema";
import type {
	InboxItem,
	SelectOption,
} from "@/features/inbox/components/types";
import {
	buildOptionSets,
	buildSluggedFilters,
} from "@/features/transactions/page-helpers";
import {
	fetchLancamentoFilterSources,
	fetchRecentEstablishments,
} from "@/features/transactions/queries";
import { db } from "@/shared/lib/db";

export async function fetchInboxItems(
	userId: string,
	status: "pending" | "processed" | "discarded" = "pending",
): Promise<InboxItem[]> {
	const items = await db
		.select()
		.from(preLancamentos)
		.where(
			and(eq(preLancamentos.userId, userId), eq(preLancamentos.status, status)),
		)
		.orderBy(desc(preLancamentos.createdAt));

	return items;
}

export async function fetchInboxItemById(
	userId: string,
	itemId: string,
): Promise<InboxItem | null> {
	const [item] = await db
		.select()
		.from(preLancamentos)
		.where(
			and(eq(preLancamentos.id, itemId), eq(preLancamentos.userId, userId)),
		)
		.limit(1);

	return item ?? null;
}

export async function fetchCategoriasForSelect(
	userId: string,
	type?: string,
): Promise<SelectOption[]> {
	const query = db
		.select({ id: categorias.id, name: categorias.name })
		.from(categorias)
		.where(
			type
				? and(eq(categorias.userId, userId), eq(categorias.type, type))
				: eq(categorias.userId, userId),
		)
		.orderBy(categorias.name);

	return query;
}

export async function fetchContasForSelect(
	userId: string,
): Promise<SelectOption[]> {
	const items = await db
		.select({ id: contas.id, name: contas.name })
		.from(contas)
		.where(and(eq(contas.userId, userId), eq(contas.status, "ativo")))
		.orderBy(contas.name);

	return items;
}

export async function fetchCartoesForSelect(
	userId: string,
): Promise<(SelectOption & { lastDigits?: string })[]> {
	const items = await db
		.select({ id: cartoes.id, name: cartoes.name })
		.from(cartoes)
		.where(and(eq(cartoes.userId, userId), eq(cartoes.status, "ativo")))
		.orderBy(cartoes.name);

	return items;
}

export async function fetchAppLogoMap(
	userId: string,
): Promise<Record<string, string>> {
	const [userCartoes, userContas] = await Promise.all([
		db
			.select({ name: cartoes.name, logo: cartoes.logo })
			.from(cartoes)
			.where(eq(cartoes.userId, userId)),
		db
			.select({ name: contas.name, logo: contas.logo })
			.from(contas)
			.where(eq(contas.userId, userId)),
	]);

	const logoMap: Record<string, string> = {};

	for (const item of [...userCartoes, ...userContas]) {
		if (item.logo) {
			logoMap[item.name.toLowerCase()] = item.logo;
		}
	}

	return logoMap;
}

export async function fetchPendingInboxCount(userId: string): Promise<number> {
	const items = await db
		.select({ id: preLancamentos.id })
		.from(preLancamentos)
		.where(
			and(
				eq(preLancamentos.userId, userId),
				eq(preLancamentos.status, "pending"),
			),
		);

	return items.length;
}

/**
 * Fetch all data needed for the LancamentoDialog in inbox context
 */
export async function fetchInboxDialogData(userId: string): Promise<{
	pagadorOptions: SelectOption[];
	splitPagadorOptions: SelectOption[];
	defaultPagadorId: string | null;
	contaOptions: SelectOption[];
	cartaoOptions: SelectOption[];
	categoriaOptions: SelectOption[];
	estabelecimentos: string[];
}> {
	const filterSources = await fetchLancamentoFilterSources(userId);
	const sluggedFilters = buildSluggedFilters(filterSources);

	const {
		pagadorOptions,
		splitPagadorOptions,
		defaultPagadorId,
		contaOptions,
		cartaoOptions,
		categoriaOptions,
	} = buildOptionSets({
		...sluggedFilters,
		pagadorRows: filterSources.pagadorRows,
	});

	const estabelecimentos = await fetchRecentEstablishments(userId);

	return {
		pagadorOptions,
		splitPagadorOptions,
		defaultPagadorId,
		contaOptions,
		cartaoOptions,
		categoriaOptions,
		estabelecimentos,
	};
}

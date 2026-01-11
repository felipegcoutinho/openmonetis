import type { SelectOption } from "@/components/lancamentos/types";
import {
  cartoes,
  categorias,
  contas,
  lancamentos,
  pagadores,
} from "@/db/schema";
import { ACCOUNT_AUTO_INVOICE_NOTE_PREFIX } from "@/lib/accounts/constants";
import { db } from "@/lib/db";
import {
  LANCAMENTO_CONDITIONS,
  LANCAMENTO_PAYMENT_METHODS,
  LANCAMENTO_TRANSACTION_TYPES,
} from "@/lib/lancamentos/constants";
import { PAGADOR_ROLE_ADMIN, PAGADOR_ROLE_TERCEIRO } from "@/lib/pagadores/constants";
import type { SQL } from "drizzle-orm";
import { and, eq, ilike, isNotNull, or } from "drizzle-orm";

type PagadorRow = typeof pagadores.$inferSelect;
type ContaRow = typeof contas.$inferSelect;
type CartaoRow = typeof cartoes.$inferSelect;
type CategoriaRow = typeof categorias.$inferSelect;

export type ResolvedSearchParams =
  | Record<string, string | string[] | undefined>
  | undefined;

export type LancamentoSearchFilters = {
  transactionFilter: string | null;
  conditionFilter: string | null;
  paymentFilter: string | null;
  pagadorFilter: string | null;
  categoriaFilter: string | null;
  contaCartaoFilter: string | null;
  searchFilter: string | null;
};

type BaseSluggedOption = {
  id: string;
  label: string;
  slug: string;
};

type PagadorSluggedOption = BaseSluggedOption & {
  role: string | null;
  avatarUrl: string | null;
};

type CategoriaSluggedOption = BaseSluggedOption & {
  type: string | null;
  icon: string | null;
};

type ContaSluggedOption = BaseSluggedOption & {
  kind: "conta";
  logo: string | null;
  accountType: string | null;
};

type CartaoSluggedOption = BaseSluggedOption & {
  kind: "cartao";
  logo: string | null;
};

export type SluggedFilters = {
  pagadorFiltersRaw: PagadorSluggedOption[];
  categoriaFiltersRaw: CategoriaSluggedOption[];
  contaFiltersRaw: ContaSluggedOption[];
  cartaoFiltersRaw: CartaoSluggedOption[];
};

export type SlugMaps = {
  pagador: Map<string, string>;
  categoria: Map<string, string>;
  conta: Map<string, string>;
  cartao: Map<string, string>;
};

export type FilterOption = {
  slug: string;
  label: string;
};

export type ContaCartaoFilterOption = FilterOption & {
  kind: "conta" | "cartao";
};

export type LancamentoOptionSets = {
  pagadorOptions: SelectOption[];
  splitPagadorOptions: SelectOption[];
  defaultPagadorId: string | null;
  contaOptions: SelectOption[];
  cartaoOptions: SelectOption[];
  categoriaOptions: SelectOption[];
  pagadorFilterOptions: FilterOption[];
  categoriaFilterOptions: FilterOption[];
  contaCartaoFilterOptions: ContaCartaoFilterOption[];
};

export const getSingleParam = (
  params: ResolvedSearchParams,
  key: string
): string | null => {
  const value = params?.[key];
  if (!value) {
    return null;
  }
  return Array.isArray(value) ? value[0] ?? null : value;
};

export const extractLancamentoSearchFilters = (
  params: ResolvedSearchParams
): LancamentoSearchFilters => ({
  transactionFilter: getSingleParam(params, "transacao"),
  conditionFilter: getSingleParam(params, "condicao"),
  paymentFilter: getSingleParam(params, "pagamento"),
  pagadorFilter: getSingleParam(params, "pagador"),
  categoriaFilter: getSingleParam(params, "categoria"),
  contaCartaoFilter: getSingleParam(params, "contaCartao"),
  searchFilter: getSingleParam(params, "q"),
});

const normalizeLabel = (value: string | null | undefined) =>
  value?.trim().length ? value.trim() : "Sem descrição";

const slugify = (value: string) => {
  const base = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "item";
};

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

export const toOption = (
  value: string,
  label: string | null | undefined,
  role?: string | null,
  group?: string | null,
  slug?: string | null,
  avatarUrl?: string | null,
  logo?: string | null,
  icon?: string | null,
  accountType?: string | null
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
});

export const fetchLancamentoFilterSources = async (userId: string) => {
  const [pagadorRows, contaRows, cartaoRows, categoriaRows] = await Promise.all(
    [
      db.query.pagadores.findMany({
        where: eq(pagadores.userId, userId),
      }),
      db.query.contas.findMany({
        where: (contas, { eq, and }) =>
          and(eq(contas.userId, userId), eq(contas.status, "Ativa")),
      }),
      db.query.cartoes.findMany({
        where: (cartoes, { eq, and }) =>
          and(eq(cartoes.userId, userId), eq(cartoes.status, "Ativo")),
      }),
      db.query.categorias.findMany({
        where: eq(categorias.userId, userId),
      }),
    ]
  );

  return { pagadorRows, contaRows, cartaoRows, categoriaRows };
};

export const buildSluggedFilters = ({
  pagadorRows,
  categoriaRows,
  contaRows,
  cartaoRows,
}: {
  pagadorRows: PagadorRow[];
  categoriaRows: CategoriaRow[];
  contaRows: ContaRow[];
  cartaoRows: CartaoRow[];
}): SluggedFilters => {
  const pagadorSlugger = createSlugGenerator();
  const categoriaSlugger = createSlugGenerator();
  const contaCartaoSlugger = createSlugGenerator();

  const pagadorFiltersRaw = pagadorRows.map((pagador) => {
    const label = normalizeLabel(pagador.name);
    return {
      id: pagador.id,
      label,
      slug: pagadorSlugger(label),
      role: pagador.role ?? null,
      avatarUrl: pagador.avatarUrl ?? null,
    };
  });

  const categoriaFiltersRaw = categoriaRows.map((categoria) => {
    const label = normalizeLabel(categoria.name);
    return {
      id: categoria.id,
      label,
      slug: categoriaSlugger(label),
      type: categoria.type ?? null,
      icon: categoria.icon ?? null,
    };
  });

  const contaFiltersRaw = contaRows.map((conta) => {
    const label = normalizeLabel(conta.name);
    return {
      id: conta.id,
      label,
      slug: contaCartaoSlugger(label),
      kind: "conta" as const,
      logo: conta.logo ?? null,
      accountType: conta.accountType ?? null,
    };
  });

  const cartaoFiltersRaw = cartaoRows.map((cartao) => {
    const label = normalizeLabel(cartao.name);
    return {
      id: cartao.id,
      label,
      slug: contaCartaoSlugger(label),
      kind: "cartao" as const,
      logo: cartao.logo ?? null,
    };
  });

  return {
    pagadorFiltersRaw,
    categoriaFiltersRaw,
    contaFiltersRaw,
    cartaoFiltersRaw,
  };
};

export const buildSlugMaps = ({
  pagadorFiltersRaw,
  categoriaFiltersRaw,
  contaFiltersRaw,
  cartaoFiltersRaw,
}: SluggedFilters): SlugMaps => ({
  pagador: new Map(pagadorFiltersRaw.map(({ slug, id }) => [slug, id])),
  categoria: new Map(categoriaFiltersRaw.map(({ slug, id }) => [slug, id])),
  conta: new Map(contaFiltersRaw.map(({ slug, id }) => [slug, id])),
  cartao: new Map(cartaoFiltersRaw.map(({ slug, id }) => [slug, id])),
});

const isValidTransaction = (
  value: string | null
): value is (typeof LANCAMENTO_TRANSACTION_TYPES)[number] =>
  !!value &&
  (LANCAMENTO_TRANSACTION_TYPES as readonly string[]).includes(value ?? "");

const isValidCondition = (
  value: string | null
): value is (typeof LANCAMENTO_CONDITIONS)[number] =>
  !!value && (LANCAMENTO_CONDITIONS as readonly string[]).includes(value ?? "");

const isValidPaymentMethod = (
  value: string | null
): value is (typeof LANCAMENTO_PAYMENT_METHODS)[number] =>
  !!value &&
  (LANCAMENTO_PAYMENT_METHODS as readonly string[]).includes(value ?? "");

const buildSearchPattern = (value: string | null) =>
  value ? `%${value.trim().replace(/\s+/g, "%")}%` : null;

export const buildLancamentoWhere = ({
  userId,
  period,
  filters,
  slugMaps,
  cardId,
  accountId,
  pagadorId,
}: {
  userId: string;
  period: string;
  filters: LancamentoSearchFilters;
  slugMaps: SlugMaps;
  cardId?: string;
  accountId?: string;
  pagadorId?: string;
}): SQL[] => {
  const where: SQL[] = [
    eq(lancamentos.userId, userId),
    eq(lancamentos.period, period),
  ];

  if (pagadorId) {
    where.push(eq(lancamentos.pagadorId, pagadorId));
  }

  if (cardId) {
    where.push(eq(lancamentos.cartaoId, cardId));
  }

  if (accountId) {
    where.push(eq(lancamentos.contaId, accountId));
  }

  if (isValidTransaction(filters.transactionFilter)) {
    where.push(eq(lancamentos.transactionType, filters.transactionFilter));
  }

  if (isValidCondition(filters.conditionFilter)) {
    where.push(eq(lancamentos.condition, filters.conditionFilter));
  }

  if (isValidPaymentMethod(filters.paymentFilter)) {
    where.push(eq(lancamentos.paymentMethod, filters.paymentFilter));
  }

  if (!pagadorId && filters.pagadorFilter) {
    const id = slugMaps.pagador.get(filters.pagadorFilter);
    if (id) {
      where.push(eq(lancamentos.pagadorId, id));
    }
  }

  if (filters.categoriaFilter) {
    const id = slugMaps.categoria.get(filters.categoriaFilter);
    if (id) {
      where.push(eq(lancamentos.categoriaId, id));
    }
  }

  if (filters.contaCartaoFilter) {
    const contaId = slugMaps.conta.get(filters.contaCartaoFilter);
    const relatedCartaoId = contaId
      ? null
      : slugMaps.cartao.get(filters.contaCartaoFilter);
    if (contaId) {
      where.push(eq(lancamentos.contaId, contaId));
    }
    if (!contaId && relatedCartaoId) {
      where.push(eq(lancamentos.cartaoId, relatedCartaoId));
    }
  }

  const searchPattern = buildSearchPattern(filters.searchFilter);
  if (searchPattern) {
    where.push(
      or(
        ilike(lancamentos.name, searchPattern),
        ilike(lancamentos.note, searchPattern),
        ilike(lancamentos.paymentMethod, searchPattern),
        ilike(lancamentos.condition, searchPattern),
        and(isNotNull(contas.name), ilike(contas.name, searchPattern)),
        and(isNotNull(cartoes.name), ilike(cartoes.name, searchPattern))
      )!
    );
  }

  return where;
};

type LancamentoRowWithRelations = typeof lancamentos.$inferSelect & {
  pagador?: PagadorRow | null;
  conta?: ContaRow | null;
  cartao?: CartaoRow | null;
  categoria?: CategoriaRow | null;
};

export const mapLancamentosData = (rows: LancamentoRowWithRelations[]) =>
  rows.map((item) => ({
    id: item.id,
    userId: item.userId,
    name: item.name,
    purchaseDate: item.purchaseDate?.toISOString() ?? new Date().toISOString(),
    period: item.period ?? "",
    transactionType: item.transactionType,
    amount: Number(item.amount ?? 0),
    condition: item.condition,
    paymentMethod: item.paymentMethod,
    pagadorId: item.pagadorId ?? null,
    pagadorName: item.pagador?.name ?? null,
    pagadorAvatar: item.pagador?.avatarUrl ?? null,
    pagadorRole: item.pagador?.role ?? null,
    contaId: item.contaId ?? null,
    contaName: item.conta?.name ?? null,
    contaLogo: item.conta?.logo ?? null,
    cartaoId: item.cartaoId ?? null,
    cartaoName: item.cartao?.name ?? null,
    cartaoLogo: item.cartao?.logo ?? null,
    categoriaId: item.categoriaId ?? null,
    categoriaName: item.categoria?.name ?? null,
    categoriaType: item.categoria?.type ?? null,
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
    readonly:
      Boolean(item.note?.startsWith(ACCOUNT_AUTO_INVOICE_NOTE_PREFIX)) ||
      item.categoria?.name === "Saldo inicial" ||
      item.categoria?.name === "Pagamentos",
  }));

const sortByLabel = <T extends { label: string }>(items: T[]) =>
  items.sort((a, b) =>
    a.label.localeCompare(b.label, "pt-BR", { sensitivity: "base" })
  );

export const buildOptionSets = ({
  pagadorFiltersRaw,
  categoriaFiltersRaw,
  contaFiltersRaw,
  cartaoFiltersRaw,
  pagadorRows,
  limitCartaoId,
  limitContaId,
}: SluggedFilters & {
  pagadorRows: PagadorRow[];
  limitCartaoId?: string;
  limitContaId?: string;
}): LancamentoOptionSets => {
  const pagadorOptions = sortByLabel(
    pagadorFiltersRaw.map(({ id, label, role, slug, avatarUrl }) =>
      toOption(id, label, role, undefined, slug, avatarUrl)
    )
  );

  const pagadorFilterOptions = sortByLabel(
    pagadorFiltersRaw.map(({ slug, label, avatarUrl }) => ({
      slug,
      label,
      avatarUrl,
    }))
  );

  const defaultPagadorId =
    pagadorRows.find((pagador) => pagador.role === PAGADOR_ROLE_ADMIN)?.id ??
    null;

  const splitPagadorOptions = pagadorOptions.filter(
    (option) => option.role === PAGADOR_ROLE_TERCEIRO
  );

  const contaOptionsSource = limitContaId
    ? contaFiltersRaw.filter((conta) => conta.id === limitContaId)
    : contaFiltersRaw;

  const contaOptions = sortByLabel(
    contaOptionsSource.map(({ id, label, slug, logo, accountType }) =>
      toOption(id, label, undefined, undefined, slug, undefined, logo, undefined, accountType)
    )
  );

  const cartaoOptionsSource = limitCartaoId
    ? cartaoFiltersRaw.filter((cartao) => cartao.id === limitCartaoId)
    : cartaoFiltersRaw;

  const cartaoOptions = sortByLabel(
    cartaoOptionsSource.map(({ id, label, slug, logo }) =>
      toOption(id, label, undefined, undefined, slug, undefined, logo)
    )
  );

  const categoriaOptions = sortByLabel(
    categoriaFiltersRaw.map(({ id, label, type, slug, icon }) =>
      toOption(id, label, undefined, type, slug, undefined, undefined, icon)
    )
  );

  const categoriaFilterOptions = sortByLabel(
    categoriaFiltersRaw.map(({ slug, label, icon }) => ({ slug, label, icon }))
  );

  const contaCartaoFilterOptions = sortByLabel(
    [...contaFiltersRaw, ...cartaoFiltersRaw]
      .filter(
        (option) =>
          (limitCartaoId && option.kind === "cartao"
            ? option.id === limitCartaoId
            : true) &&
          (limitContaId && option.kind === "conta"
            ? option.id === limitContaId
            : true)
      )
      .map(({ slug, label, kind, logo }) => ({ slug, label, kind, logo }))
  );

  return {
    pagadorOptions,
    splitPagadorOptions,
    defaultPagadorId,
    contaOptions,
    cartaoOptions,
    categoriaOptions,
    pagadorFilterOptions,
    categoriaFilterOptions,
    contaCartaoFilterOptions,
  };
};

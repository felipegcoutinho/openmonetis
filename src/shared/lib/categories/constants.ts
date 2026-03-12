export const CATEGORY_TYPES = ["receita", "despesa"] as const;

export type CategoryType = (typeof CATEGORY_TYPES)[number];

export const CATEGORY_TYPE_LABEL: Record<CategoryType, string> = {
	receita: "Receita",
	despesa: "Despesa",
};

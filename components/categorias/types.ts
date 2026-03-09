import type { CategoryType } from "@/lib/categorias/constants";

export type { CategoryType } from "@/lib/categorias/constants";
export {
	CATEGORY_TYPE_LABEL,
	CATEGORY_TYPES,
} from "@/lib/categorias/constants";

export type Category = {
	id: string;
	name: string;
	type: CategoryType;
	icon: string | null;
};

export type CategoryFormValues = {
	name: string;
	type: CategoryType;
	icon: string;
};

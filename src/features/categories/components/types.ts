import type { CategoryType } from "@/shared/lib/categories/constants";

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

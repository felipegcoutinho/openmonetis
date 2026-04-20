import type { DashboardCategoryBreakdownItem } from "@/features/dashboard/categories/category-breakdown-helpers";
import { CategoryBreakdownListItem } from "./category-breakdown-list-item";

type CategoryBreakdownListConfig = {
	shareLabel: string;
	percentageDigits: number;
	positiveTrend: "up" | "down";
	includeBudgetAmount: boolean;
};

type CategoryBreakdownListProps = {
	categories: DashboardCategoryBreakdownItem[];
	periodParam: string;
	config: CategoryBreakdownListConfig;
};

export function CategoryBreakdownList({
	categories,
	periodParam,
	config,
}: CategoryBreakdownListProps) {
	return (
		<div>
			{categories.map((category) => (
				<CategoryBreakdownListItem
					key={category.categoryId}
					category={category}
					periodParam={periodParam}
					config={config}
				/>
			))}
		</div>
	);
}

import type { DashboardCategoryBreakdownItem } from "@/features/dashboard/categories/category-breakdown-helpers";
import { CategoryBreakdownListItem } from "./category-breakdown-list-item";

type CategoryBreakdownListConfig = {
	shareLabel: string;
	percentageDigits: number;
	positiveTrend: "up" | "down";
	showBudget: boolean;
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
		<div className="flex flex-col">
			{categories.map((category, index) => (
				<CategoryBreakdownListItem
					key={category.categoryId}
					category={category}
					periodParam={periodParam}
					config={config}
					position={index + 1}
				/>
			))}
		</div>
	);
}

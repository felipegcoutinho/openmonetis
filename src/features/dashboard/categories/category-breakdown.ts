import { calculatePercentageChange } from "@/shared/utils/math";
import { safeToNumber as toNumber } from "@/shared/utils/number";

export type DashboardCategoryBreakdownItem = {
	categoryId: string;
	categoryName: string;
	categoryIcon: string | null;
	currentAmount: number;
	previousAmount: number;
	percentageChange: number | null;
	percentageOfTotal: number;
	budgetAmount: number | null;
	budgetUsedPercentage: number | null;
};

export type DashboardCategoryBreakdownData = {
	categories: DashboardCategoryBreakdownItem[];
	currentTotal: number;
	previousTotal: number;
};

type CategoryBreakdownRow = {
	categoryId: string;
	categoryName: string;
	categoryIcon: string | null;
	period: string | null;
	total: unknown;
};

type CategoryBudgetRow = {
	categoryId: string | null;
	amount: unknown;
};

export function buildCategoryBreakdownData({
	rows,
	budgetRows,
	period,
}: {
	rows: CategoryBreakdownRow[];
	budgetRows: CategoryBudgetRow[];
	period: string;
}): DashboardCategoryBreakdownData {
	const budgetMap = new Map<string, number>();
	for (const row of budgetRows) {
		if (row.categoryId) {
			budgetMap.set(row.categoryId, toNumber(row.amount));
		}
	}

	const categoryMap = new Map<
		string,
		{
			name: string;
			icon: string | null;
			current: number;
			previous: number;
		}
	>();

	for (const row of rows) {
		const entry = categoryMap.get(row.categoryId) ?? {
			name: row.categoryName,
			icon: row.categoryIcon,
			current: 0,
			previous: 0,
		};

		const amount = Math.abs(toNumber(row.total));
		if (row.period === period) {
			entry.current = amount;
		} else {
			entry.previous = amount;
		}

		categoryMap.set(row.categoryId, entry);
	}

	let currentTotal = 0;
	let previousTotal = 0;
	for (const entry of categoryMap.values()) {
		currentTotal += entry.current;
		previousTotal += entry.previous;
	}

	const categories: DashboardCategoryBreakdownItem[] = [];
	for (const [categoryId, entry] of categoryMap) {
		const percentageChange = calculatePercentageChange(
			entry.current,
			entry.previous,
		);
		const percentageOfTotal =
			currentTotal > 0 ? (entry.current / currentTotal) * 100 : 0;

		const budgetAmount = budgetMap.get(categoryId) ?? null;
		const budgetUsedPercentage =
			budgetAmount && budgetAmount > 0
				? (entry.current / budgetAmount) * 100
				: null;

		categories.push({
			categoryId,
			categoryName: entry.name,
			categoryIcon: entry.icon,
			currentAmount: entry.current,
			previousAmount: entry.previous,
			percentageChange,
			percentageOfTotal,
			budgetAmount,
			budgetUsedPercentage,
		});
	}

	const filtered = categories.filter((c) => c.currentAmount > 0);
	filtered.sort((a, b) => b.currentAmount - a.currentAmount);

	return {
		categories: filtered,
		currentTotal,
		previousTotal,
	};
}

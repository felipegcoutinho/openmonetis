import { RiFundsLine } from "@remixicon/react";
import { WidgetEmptyState } from "@/components/shared/widget-empty-state";
import type { GoalProgressItem } from "@/lib/dashboard/goals-progress";
import { GoalProgressItem as GoalProgressListItem } from "./goal-progress-item";

type GoalsProgressListProps = {
	items: GoalProgressItem[];
	onEdit: (item: GoalProgressItem) => void;
};

export function GoalsProgressList({ items, onEdit }: GoalsProgressListProps) {
	if (items.length === 0) {
		return (
			<WidgetEmptyState
				icon={<RiFundsLine className="size-6 text-muted-foreground" />}
				title="Nenhum orçamento para o período"
				description="Cadastre orçamentos para acompanhar o progresso das metas."
			/>
		);
	}

	return (
		<ul className="flex flex-col">
			{items.map((item, index) => (
				<GoalProgressListItem
					key={item.id}
					item={item}
					index={index}
					onEdit={onEdit}
				/>
			))}
		</ul>
	);
}

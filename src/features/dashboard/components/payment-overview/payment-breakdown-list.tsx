import type { ReactNode } from "react";
import { WidgetEmptyState } from "@/shared/components/widgets/widget-empty-state";
import {
	PaymentBreakdownListItem,
	type PaymentBreakdownListItemData,
} from "./payment-breakdown-list-item";

export type { PaymentBreakdownListItemData } from "./payment-breakdown-list-item";

type PaymentBreakdownListProps = {
	items: PaymentBreakdownListItemData[];
	emptyIcon: ReactNode;
	emptyTitle: string;
	emptyDescription: string;
};

export function PaymentBreakdownList({
	items,
	emptyIcon,
	emptyTitle,
	emptyDescription,
}: PaymentBreakdownListProps) {
	if (items.length === 0) {
		return (
			<WidgetEmptyState
				icon={emptyIcon}
				title={emptyTitle}
				description={emptyDescription}
			/>
		);
	}

	return (
		<div className="flex flex-col px-0">
			<ul className="flex flex-col gap-2">
				{items.map((item, index) => (
					<PaymentBreakdownListItem
						key={item.id}
						item={item}
						position={index + 1}
					/>
				))}
			</ul>
		</div>
	);
}

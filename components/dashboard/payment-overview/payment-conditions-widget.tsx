import { RiCheckLine, RiSlideshowLine } from "@remixicon/react";
import type { PaymentConditionsData } from "@/lib/dashboard/payments/payment-conditions";
import { getConditionIcon } from "@/lib/utils/icons";
import {
	PaymentBreakdownList,
	type PaymentBreakdownListItemData,
} from "./payment-breakdown-list";

type PaymentConditionsWidgetProps = {
	data: PaymentConditionsData;
};

const resolveConditionIcon = (condition: string) =>
	getConditionIcon(condition) ?? <RiCheckLine className="size-5" aria-hidden />;

export function PaymentConditionsWidget({
	data,
}: PaymentConditionsWidgetProps) {
	const items: PaymentBreakdownListItemData[] = data.conditions.map(
		(condition) => ({
			id: condition.condition,
			title: condition.condition,
			icon: resolveConditionIcon(condition.condition),
			amount: condition.amount,
			transactions: condition.transactions,
			percentage: condition.percentage,
		}),
	);

	return (
		<PaymentBreakdownList
			items={items}
			emptyIcon={<RiSlideshowLine className="size-6 text-muted-foreground" />}
			emptyTitle="Nenhuma despesa encontrada"
			emptyDescription="As distribuições por condição aparecerão conforme novos lançamentos."
		/>
	);
}
